"use client";

"use client";
import React from "react";
import ScanProgress from "@/components/ScanProgress";

export default function Page() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null); // offscreen processing
  const previewRef = React.useRef<HTMLCanvasElement>(null); // visible processed preview
  const [features, setFeatures] = React.useState<number[]>([]);
  const [status, setStatus] = React.useState<string>("");
  const [cameraOn, setCameraOn] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [retriesLeft, setRetriesLeft] = React.useState<number | null>(null);
  const [lockout, setLockout] = React.useState<number | null>(null);

  const workerRef = React.useRef<Worker | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream as any;
        await videoRef.current.play();
        setCameraOn(true);
      }
      // init worker
      if (!workerRef.current) {
        workerRef.current = new Worker('/biometric-worker.js', { type: 'module' });
      }
    } catch (e: any) {
      setStatus(`Camera error: ${e?.message || e}`);
    }
  };

  const stopCamera = () => {
    const tracks = (videoRef.current?.srcObject as MediaStream | undefined)?.getTracks();
    tracks?.forEach((t) => t.stop());
    setCameraOn(false);
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
  };

  // Image processing helpers (gaussian blur, sobel, CLAHE, Sauvola threshold, morphology, skeleton)
  const makeGaussianKernel = (sigma: number) => {
    const k = Math.max(1, Math.ceil(sigma * 3));
    const size = k * 2 + 1;
    const ker = new Float32Array(size);
    const s2 = sigma * sigma * 2;
    let sum = 0;
    for (let i = -k; i <= k; i++) { const v = Math.exp(-(i*i)/s2); ker[i+k] = v; sum += v; }
    for (let i = 0; i < size; i++) ker[i] /= sum;
    return ker;
  };
  const convolve1D = (src: Float32Array, w: number, h: number, ker: Float32Array, horiz: boolean) => {
    const dst = new Float32Array(w*h);
    const k = (ker.length - 1) >> 1;
    if (horiz) {
      for (let y=0;y<h;y++){
        for (let x=0;x<w;x++){
          let acc=0;
          for (let i=-k;i<=k;i++){
            const xx = Math.min(w-1, Math.max(0, x+i));
            acc += src[y*w+xx]*ker[i+k];
          }
          dst[y*w+x]=acc;
        }
      }
    } else {
      for (let y=0;y<h;y++){
        for (let x=0;x<w;x++){
          let acc=0;
          for (let i=-k;i<=k;i++){
            const yy = Math.min(h-1, Math.max(0, y+i));
            acc += src[yy*w+x]*ker[i+k];
          }
          dst[y*w+x]=acc;
        }
      }
    }
    return dst;
  };
  const gaussianBlur = (src: Float32Array, w: number, h: number, sigma=1.0) => {
    const ker = makeGaussianKernel(sigma);
    const tmp = convolve1D(src, w, h, ker, true);
    return convolve1D(tmp, w, h, ker, false);
  };
  const sobelMag = (src: Float32Array, w: number, h: number) => {
    const dst = new Float32Array(w*h);
    for (let y=1;y<h-1;y++){
      for (let x=1;x<w-1;x++){
        const i=y*w+x;
        const tl=src[(y-1)*w+(x-1)], tc=src[(y-1)*w+x], tr=src[(y-1)*w+(x+1)];
        const ml=src[y*w+(x-1)], mc=src[i], mr=src[y*w+(x+1)];
        const bl=src[(y+1)*w+(x-1)], bc=src[(y+1)*w+x], br=src[(y+1)*w+(x+1)];
        const gx = -tl -2*ml -bl + tr + 2*mr + br;
        const gy = -tl -2*tc -tr + bl + 2*bc + br;
        dst[i] = Math.hypot(gx, gy);
      }
    }
    return dst;
  };
  const clamp01 = (v:number)=>Math.max(0,Math.min(1,v));
  const clahe = (src: Float32Array, w:number, h:number, tiles=8, clip=2.0) => {
    // Normalize to 0..255
    const n = w*h; const min = Math.min(...src as any), max = Math.max(...src as any);
    const norm = new Uint8Array(n);
    const range = max - min || 1;
    for (let i=0;i<n;i++) norm[i] = Math.max(0, Math.min(255, Math.round(((src[i]-min)/range)*255)));
    const tw = Math.floor(w/tiles) || 1; const th = Math.floor(h/tiles) || 1;
    const out = new Float32Array(n);
    const clipLimit = clip * (tw*th) / 256;
    for (let ty=0; ty<tiles; ty++){
      for (let tx=0; tx<tiles; tx++){
        const x0 = tx*tw, y0 = ty*th; const x1 = tx===tiles-1 ? w : x0+tw; const y1 = ty===tiles-1 ? h : y0+th;
        const hist = new Float32Array(256);
        for (let y=y0;y<y1;y++) for (let x=x0;x<x1;x++) hist[norm[y*w+x]]++;
        // clip
        let excess=0; for (let b=0;b<256;b++){ if (hist[b] > clipLimit){ excess += hist[b]-clipLimit; hist[b]=clipLimit; } }
        const redist = excess/256; for (let b=0;b<256;b++) hist[b]+=redist;
        // cdf
        for (let b=1;b<256;b++) hist[b]+=hist[b-1];
        const cdf0 = hist[0]; const denom = (hist[255]-cdf0)||1;
        for (let y=y0;y<y1;y++){
          for (let x=x0;x<x1;x++){
            const v = norm[y*w+x];
            const eq = (hist[v]-cdf0)/denom;
            out[y*w+x] = eq*255;
          }
        }
      }
    }
    return out;
  };
  const sauvola = (src: Float32Array, w:number, h:number, win=15, k=0.34, R=128) => {
    const n=w*h; const mean = new Float32Array(n), sqmean = new Float32Array(n);
    const integ = new Float64Array((w+1)*(h+1));
    const integsq = new Float64Array((w+1)*(h+1));
    const at=(arr:Float64Array,x:number,y:number)=>arr[y*(w+1)+x];
    // integral images
    for (let y=1;y<=h;y++){
      let rowsum=0, rowsumsq=0;
      for (let x=1;x<=w;x++){
        const v = src[(y-1)*w+(x-1)]; rowsum += v; rowsumsq += v*v;
        integ[y*(w+1)+x] = at(integ,x-1,y) + rowsum;
        integsq[y*(w+1)+x] = at(integsq,x-1,y) + rowsumsq;
      }
    }
    const r = Math.floor(win/2);
    const out = new Uint8Array(n);
    for (let y=0;y<h;y++){
      const y0=Math.max(0,y-r), y1=Math.min(h-1,y+r);
      for (let x=0;x<w;x++){
        const x0=Math.max(0,x-r), x1=Math.min(w-1,x+r);
        const A=at(integ,x0,y0), B=at(integ,x1+1,y0), C=at(integ,x0,y1+1), D=at(integ,x1+1,y1+1);
        const As=at(integsq,x0,y0), Bs=at(integsq,x1+1,y0), Cs=at(integsq,x0,y1+1), Ds=at(integsq,x1+1,y1+1);
        const area=(x1-x0+1)*(y1-y0+1);
        const m=(D - B - C + A)/area; const s2=(Ds - Bs - Cs + As)/area - m*m; const s=Math.sqrt(Math.max(0,s2));
        const t = m*(1 + k*((s/R)-1));
        out[y*w+x] = src[y*w+x] > t ? 1 : 0;
      }
    }
    return out;
  };
  const morph = (bin: Uint8Array, w: number, h: number, mode: "erode"|"dilate") => {
    const out = new Uint8Array(w*h);
    for (let y=1;y<h-1;y++){
      for (let x=1;x<w-1;x++){
        let cnt=0;
        for (let yy=-1;yy<=1;yy++) for (let xx=-1;xx<=1;xx++) cnt += bin[(y+yy)*w+(x+xx)];
        if (mode==="dilate") out[y*w+x] = cnt>0?1:0; else out[y*w+x] = cnt===9?1:0;
      }
    }
    return out;
  };
  const zhangSuen = (bin: Uint8Array, w:number, h:number) => {
    const idx=(x:number,y:number)=>y*w+x;
    const get=(x:number,y:number)=> (x>=0 && x<w && y>=0 && y<h) ? bin[idx(x,y)] : 0;
    let changed=true; const out = new Uint8Array(bin);
    const N=(x:number,y:number)=>{
      let c=0; for(let j=-1;j<=1;j++) for(let i=-1;i<=1;i++){ if(i||j) c+= get(x+i,y+j); } return c; };
    const S=(x:number,y:number)=>{
      // number of 0->1 transitions in ordered neighbors p2..p9
      const p=[get(x,y-1),get(x+1,y-1),get(x+1,y),get(x+1,y+1),get(x,y+1),get(x-1,y+1),get(x-1,y),get(x-1,y-1)];
      let t=0; for(let i=0;i<8;i++){ if(p[i]===0 && p[(i+1)%8]===1) t++; } return t;
    };
    while(changed){
      changed=false;
      // step 1
      const toRemove: number[] = [];
      for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) if(out[idx(x,y)]===1){
        const n=N(x,y); if(n<2||n>6) continue; if(S(x,y)!==1) continue;
        if(get(x,y-1)*get(x+1,y)*get(x,y+1)===0 && get(x+1,y)*get(x,y+1)*get(x-1,y)===0){ toRemove.push(idx(x,y)); }
      }
      if(toRemove.length){ changed=true; for(const i of toRemove) out[i]=0; }
      // step 2
      const toRemove2: number[] = [];
      for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) if(out[idx(x,y)]===1){
        const n=N(x,y); if(n<2||n>6) continue; if(S(x,y)!==1) continue;
        if(get(x,y-1)*get(x+1,y)*get(x-1,y)===0 && get(x,y-1)*get(x,y+1)*get(x-1,y)===0){ toRemove2.push(idx(x,y)); }
      }
      if(toRemove2.length){ changed=true; for(const i of toRemove2) out[i]=0; }
    }
    return out;
  };

  // Extract a 64-dim vessel density vector from current frame
  const extractFeaturesFallback = (): number[] | null => {
    const v = videoRef.current;
    const c = canvasRef.current;
    const p = previewRef.current;
    if (!v || !c) return null;
    const size = 64; // processing resolution
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size);
    // Gray
    const gray = new Float32Array(size*size);
    for (let i=0;i<size*size;i++){
      const r=img.data[i*4], g=img.data[i*4+1], b=img.data[i*4+2];
      gray[i]=0.299*r+0.587*g+0.114*b;
    }
    // Blur -> edges -> binarize
    // CLAHE -> blur -> Sobel magnitude
    const eq = clahe(gray, size, size, 8, 2.0);
    const blur = gaussianBlur(eq, size, size, 1.0);
    const mag = sobelMag(blur, size, size);
    // Sauvola local threshold
    const bin = sauvola(mag, size, size, 15, 0.34, 128);
    // Morphology (open) then skeletonize
    const er = morph(bin, size, size, "erode");
    const op = morph(er, size, size, "dilate");
    const skel = zhangSuen(op, size, size);

    // Preview
    if (p) {
      p.width = size; p.height = size;
      const pct = p.getContext("2d");
      if (pct){
        const out = pct.createImageData(size, size);
        for (let i=0;i<size*size;i++){
          const v = skel[i] ? 255 : 0;
          out.data[i*4]=v; out.data[i*4+1]=0; out.data[i*4+2]=v; out.data[i*4+3]=255;
        }
        pct.putImageData(out,0,0);
      }
    }

    // Pool vessel density per block from skeleton
    const block=8; const step=size/block; const vec:number[]=[];
    for (let by=0;by<block;by++){
      for (let bx=0;bx<block;bx++){
        let sum=0;
        for (let y=0;y<step;y++) for (let x=0;x<step;x++){
          const ix=(Math.floor(by*step)+y)*size+(Math.floor(bx*step)+x);
          sum += skel[ix];
        }
        vec.push(sum/(step*step));
      }
    }
    // Normalize feature vector
    const mean = vec.reduce((a,b)=>a+b,0)/vec.length;
    const centered = vec.map(v=>v-mean);
    const norm = Math.sqrt(centered.reduce((a,b)=>a+b*b,0))||1;
    return centered.map(v=>v/norm);
  };

  const scanFrames = async (ms = 1200) => {
    setProgress(0);
    const frames = 6; const delay = ms / frames;
    const acc: number[][] = [];
    for (let i=0;i<frames;i++){
      const { vec, preview } = await processWithWorker();
      if (preview && previewRef.current) {
        const pct = previewRef.current.getContext('2d');
        if (pct) pct.putImageData(preview, 0, 0);
      }
      if (vec && vec.length) acc.push(vec);
      setProgress(((i+1)/frames)*100);
      await new Promise(r=>setTimeout(r, delay));
    }
    if (!acc.length) throw new Error('No frames');
    const len = acc[0].length; const avg = new Array(len).fill(0);
    for (const vec of acc) for (let i=0;i<len;i++) avg[i]+=vec[i];
    for (let i=0;i<len;i++) avg[i]/=acc.length;
    setProgress(100);
    return avg;
  };

  const processWithWorker = async (): Promise<{ vec: number[]; preview?: ImageData }> => {
    const v = videoRef.current; const c = canvasRef.current; if (!v || !c) throw new Error('no video');
    const size = 64; c.width=size; c.height=size; const ctx = c.getContext('2d'); if (!ctx) throw new Error('no ctx');
    ctx.drawImage(v, 0, 0, size, size);
    const img = ctx.getImageData(0,0,size,size);
    if (workerRef.current) {
      const worker = workerRef.current;
      return new Promise((resolve, reject) => {
        const onMessage = (ev: MessageEvent) => {
          const { ok, features, preview, size: sz, error } = ev.data || {};
          worker.removeEventListener('message', onMessage);
          if (!ok) return reject(new Error(error||'worker failed'));
          let previewImage: ImageData | undefined;
          if (preview && preview.buffer) {
            const arr = new Uint8ClampedArray(preview);
            previewImage = new ImageData(arr, sz, sz);
          }
          resolve({ vec: features, preview: previewImage });
        };
        worker.addEventListener('message', onMessage);
        // transfer buffer to worker
        worker.postMessage({ cmd: 'process', width: size, height: size, data: img.data.buffer }, [img.data.buffer]);
      });
    }
    // fallback
    const vec = extractFeaturesFallback();
    return { vec: vec || [] };
  };

  const capture = async () => {
    setStatus("Scanning...");
    try {
      const vec = await scanFrames(1200);
      setFeatures(vec);
      setStatus("Scan complete");
    } catch (e: any) {
      setStatus(`Scan failed: ${e?.message || e}`);
    }
  };

  const enroll = async () => {
    try {
      setBusy(true);
      setStatus("Enrolling...");
      if (features.length === 0) await capture();
      const res = await fetch("/api/biometric/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ features }) });
      const data = await res.json();
      setStatus(res.ok ? "Enrolled" : `Failed: ${data.error || ""}`);
    } finally { setBusy(false); }
  };

  const verify = async () => {
    try {
      setBusy(true);
      setStatus("Verifying...");
      if (features.length === 0) await capture();
      const res = await fetch("/api/biometric/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ features }) });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus(`Match (${(data.score*100).toFixed(1)}%)`);
        setRetriesLeft(null); setLockout(null);
        window.location.href = "/dashboard";
      } else if (res.status === 429 && data.locked) {
        setLockout(data.retryAfter || 300);
        setRetriesLeft(0);
        setStatus(`Locked. Try again in ${data.retryAfter || 0}s`);
      } else {
        setRetriesLeft(typeof data.remaining === 'number' ? data.remaining : null);
        setStatus(`No match (${Math.round((data.score||0)*100)}%). ${typeof data.remaining === 'number' ? `${data.remaining} tries left` : ''}`);
      }
    } finally { setBusy(false); }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-semibold text-pink-400">VERIFY EVERYTHING REVEAL NOTHING</h1>
      <div className="rounded-xl border border-pink-700/40 bg-zinc-950 p-5 shadow-[0_0_30px_-10px_rgba(236,72,153,0.5)]">
        <div className="text-sm text-zinc-300">You must be logged in. Biometric is linked to your session.</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="relative overflow-hidden rounded-md ring-1 ring-pink-700/40">
              <video ref={videoRef} className="h-56 w-full bg-black object-cover" muted playsInline />
              {!cameraOn && <div className="absolute inset-0 grid place-items-center text-pink-300">Camera off</div>}
            </div>
            <div className="mt-2 flex gap-2">
              {!cameraOn ? (
                <button onClick={startCamera} className="rounded-md bg-pink-600 px-3 py-2 font-medium text-black hover:bg-pink-500">Start camera</button>
              ) : (
                <button onClick={stopCamera} className="rounded-md border border-pink-600 px-3 py-2 hover:bg-pink-950">Stop camera</button>
              )}
              <button onClick={capture} className="rounded-md border border-pink-600 px-3 py-2 hover:bg-pink-950">Scan frame</button>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <ScanProgress value={progress} />
              <div>
                <div className="text-sm text-zinc-400">Features captured: {features.length}</div>
                {retriesLeft !== null && <div className="text-xs text-pink-300">Tries left: {retriesLeft}</div>}
                {lockout !== null && <div className="text-xs text-pink-400">Locked. Retry in {lockout}s</div>}
              </div>
              <canvas ref={previewRef} className="ml-auto h-20 w-20 rounded border border-pink-700/40" />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={enroll} disabled={busy} className="rounded-md bg-pink-600 px-3 py-2 font-medium text-black disabled:opacity-60">Enroll</button>
              <button onClick={verify} disabled={busy} className="rounded-md border border-pink-600 px-3 py-2 disabled:opacity-60">Verify</button>
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="mt-3 text-sm text-pink-300" aria-live="polite">{status}</div>
      </div>
    </div>
  );
}
