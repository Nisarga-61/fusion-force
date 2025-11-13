// public/biometric-worker.js
// Minimal vessel pipeline in Web Worker: CLAHE -> blur -> Sobel -> Sauvola -> open -> Zhang-Suen -> skeleton preview + 8x8 features
self.onmessage = (e) => {
  const { cmd, width, height } = e.data || {};
  if (cmd !== 'process') return;
  const buf = e.data.data; // Uint8ClampedArray buffer (RGBA)
  const src = new Uint8ClampedArray(buf);
  const size = width; // assume square 64x64
  try {
    const out = processFrame(src, size, size);
    // Transfer arrays back
    self.postMessage({ ok: true, features: out.features, preview: out.preview, size }, { transfer: [out.preview.buffer] });
  } catch (err) {
    self.postMessage({ ok: false, error: (err && err.message) || String(err) });
  }
};

function makeGaussianKernel(sigma){ const k=Math.max(1,Math.ceil(sigma*3)), size=k*2+1, ker=new Float32Array(size); const s2=sigma*sigma*2; let sum=0; for(let i=-k;i<=k;i++){ const v=Math.exp(-(i*i)/s2); ker[i+k]=v; sum+=v; } for(let i=0;i<size;i++) ker[i]/=sum; return ker; }
function convolve1D(src,w,h,ker,horiz){ const dst=new Float32Array(w*h), k=(ker.length-1)>>1; if(horiz){ for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ let acc=0; for(let i=-k;i<=k;i++){ const xx=Math.min(w-1,Math.max(0,x+i)); acc+=src[y*w+xx]*ker[i+k]; } dst[y*w+x]=acc; } } } else { for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ let acc=0; for(let i=-k;i<=k;i++){ const yy=Math.min(h-1,Math.max(0,y+i)); acc+=src[yy*w+x]*ker[i+k]; } dst[y*w+x]=acc; } } } return dst; }
function gaussianBlur(src,w,h,sigma){ const ker=makeGaussianKernel(sigma); const tmp=convolve1D(src,w,h,ker,true); return convolve1D(tmp,w,h,ker,false); }
function sobelMag(src,w,h){ const dst=new Float32Array(w*h); for(let y=1;y<h-1;y++){ for(let x=1;x<w-1;x++){ const i=y*w+x; const tl=src[(y-1)*w+(x-1)], tc=src[(y-1)*w+x], tr=src[(y-1)*w+(x+1)]; const ml=src[y*w+(x-1)], mr=src[y*w+(x+1)]; const bl=src[(y+1)*w+(x-1)], bc=src[(y+1)*w+x], br=src[(y+1)*w+(x+1)]; const gx=-tl-2*ml-bl+tr+2*mr+br; const gy=-tl-2*tc-tr+bl+2*bc+br; dst[i]=Math.hypot(gx,gy); } } return dst; }
function clahe(src,w,h,tiles=8,clip=2.0){ const n=w*h; let min=Infinity,max=-Infinity; for(let i=0;i<n;i++){ const v=src[i]; if(v<min)min=v; if(v>max)max=v; } const norm=new Uint8Array(n); const range=max-min||1; for(let i=0;i<n;i++) norm[i]=Math.max(0,Math.min(255,Math.round(((src[i]-min)/range)*255))); const tw=Math.floor(w/tiles)||1, th=Math.floor(h/tiles)||1; const out=new Float32Array(n); const clipLimit=clip*(tw*th)/256; for(let ty=0;ty<tiles;ty++){ for(let tx=0;tx<tiles;tx++){ const x0=tx*tw,y0=ty*th,x1=tx===tiles-1?w:x0+tw,y1=ty===tiles-1?h:y0+th; const hist=new Float32Array(256); for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) hist[norm[y*w+x]]++; let excess=0; for(let b=0;b<256;b++){ if(hist[b]>clipLimit){ excess+=hist[b]-clipLimit; hist[b]=clipLimit; } } const redist=excess/256; for(let b=0;b<256;b++) hist[b]+=redist; for(let b=1;b<256;b++) hist[b]+=hist[b-1]; const cdf0=hist[0], denom=(hist[255]-cdf0)||1; for(let y=y0;y<y1;y++){ for(let x=x0;x<x1;x++){ const v=norm[y*w+x]; const eq=(hist[v]-cdf0)/denom; out[y*w+x]=eq*255; } } } } return out; }
function sauvola(src,w,h,win=15,k=0.34,R=128){ const integ=new Float64Array((w+1)*(h+1)), integsq=new Float64Array((w+1)*(h+1)); const at=(arr,x,y)=>arr[y*(w+1)+x]; for(let y=1;y<=h;y++){ let rowsum=0,rowsumsq=0; for(let x=1;x<=w;x++){ const v=src[(y-1)*w+(x-1)]; rowsum+=v; rowsumsq+=v*v; integ[y*(w+1)+x]=at(integ,x-1,y)+rowsum; integsq[y*(w+1)+x]=at(integsq,x-1,y)+rowsumsq; } } const r=Math.floor(win/2); const out=new Uint8Array(w*h); for(let y=0;y<h;y++){ const y0=Math.max(0,y-r), y1=Math.min(h-1,y+r); for(let x=0;x<w;x++){ const x0=Math.max(0,x-r), x1=Math.min(w-1,x+r); const A=at(integ,x0,y0), B=at(integ,x1+1,y0), C=at(integ,x0,y1+1), D=at(integ,x1+1,y1+1); const As=at(integsq,x0,y0), Bs=at(integsq,x1+1,y0), Cs=at(integsq,x0,y1+1), Ds=at(integsq,x1+1,y1+1); const area=(x1-x0+1)*(y1-y0+1); const m=(D-B-C+A)/area; const s2=(Ds-Bs-Cs+As)/area - m*m; const s=Math.sqrt(Math.max(0,s2)); const t=m*(1 + k*((s/R)-1)); out[y*w+x]= (src[y*w+x] > t) ? 1 : 0; } } return out; }
function morph(bin,w,h,mode){ const out=new Uint8Array(w*h); for(let y=1;y<h-1;y++){ for(let x=1;x<w-1;x++){ let cnt=0; for(let yy=-1;yy<=1;yy++) for(let xx=-1;xx<=1;xx++) cnt+=bin[(y+yy)*w+(x+xx)]; if(mode==='dilate') out[y*w+x]=cnt>0?1:0; else out[y*w+x]=cnt===9?1:0; } } return out; }
function zhangSuen(bin,w,h){ const idx=(x,y)=>y*w+x, get=(x,y)=> (x>=0&&x<w&&y>=0&&y<h)?bin[idx(x,y)]:0; let changed=true; const out=new Uint8Array(bin); const N=(x,y)=>{ let c=0; for(let j=-1;j<=1;j++) for(let i=-1;i<=1;i++){ if(i||j) c+=get(x+i,y+j); } return c; }; const S=(x,y)=>{ const p=[get(x,y-1),get(x+1,y-1),get(x+1,y),get(x+1,y+1),get(x,y+1),get(x-1,y+1),get(x-1,y),get(x-1,y-1)]; let t=0; for(let i=0;i<8;i++){ if(p[i]===0 && p[(i+1)%8]===1) t++; } return t; }; while(changed){ changed=false; const rm=[]; for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) if(out[idx(x,y)]===1){ const n=N(x,y); if(n<2||n>6) continue; if(S(x,y)!==1) continue; if(get(x,y-1)*get(x+1,y)*get(x,y+1)===0 && get(x+1,y)*get(x,y+1)*get(x-1,y)===0) rm.push(idx(x,y)); } if(rm.length){ changed=true; for(const i of rm) out[i]=0; } const rm2=[]; for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) if(out[idx(x,y)]===1){ const n=N(x,y); if(n<2||n>6) continue; if(S(x,y)!==1) continue; if(get(x,y-1)*get(x+1,y)*get(x-1,y)===0 && get(x,y-1)*get(x,y+1)*get(x-1,y)===0) rm2.push(idx(x,y)); } if(rm2.length){ changed=true; for(const i of rm2) out[i]=0; } } return out; }

function processFrame(rgba, w, h){
  // RGBA -> gray Float32
  const gray=new Float32Array(w*h);
  for(let i=0;i<w*h;i++){ const r=rgba[i*4], g=rgba[i*4+1], b=rgba[i*4+2]; gray[i]=0.299*r+0.587*g+0.114*b; }
  const eq=clahe(gray,w,h,8,2.0);
  const blur=gaussianBlur(eq,w,h,1.0);
  const mag=sobelMag(blur,w,h);
  const bin=sauvola(mag,w,h,15,0.34,128);
  const er=morph(bin,w,h,'erode');
  const op=morph(er,w,h,'dilate');
  const skel=zhangSuen(op,w,h);
  // Preview RGBA
  const preview=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<w*h;i++){ const v=skel[i]?255:0; preview[i*4]=v; preview[i*4+1]=0; preview[i*4+2]=v; preview[i*4+3]=255; }
  // 8x8 block density features
  const block=8, step=w/block; const vec=new Float32Array(64); let k=0;
  for(let by=0;by<block;by++){
    for(let bx=0;bx<block;bx++){
      let sum=0; for(let y=0;y<step;y++) for(let x=0;x<step;x++){ const ix=(Math.floor(by*step)+y)*w+(Math.floor(bx*step)+x); sum+=skel[ix]; }
      vec[k++]=sum/(step*step);
    }
  }
  // Normalize
  let mean=0; for(let i=0;i<64;i++) mean+=vec[i]; mean/=64; let norm=0; for(let i=0;i<64;i++){ const c=vec[i]-mean; norm+=c*c; }
  norm=Math.sqrt(norm)||1; for(let i=0;i<64;i++){ vec[i]=(vec[i]-mean)/norm; }
  return { features: Array.from(vec), preview };
}
