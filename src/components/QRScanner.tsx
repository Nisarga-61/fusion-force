import React, { useEffect, useRef, useState } from "react";

// Placeholder QR scanner using device camera preview only (no decoding).
// For real scanning, integrate @zxing/browser or html5-qrcode later.
export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream as any;
          await videoRef.current.play();
        }
      } catch (e: any) {
        setError(e?.message || "Camera access denied");
      }
    })();
    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream | undefined)?.getTracks();
      tracks?.forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-2">
      <video ref={videoRef} className="h-48 w-full rounded-md bg-black object-cover" muted playsInline />
      <div className="flex gap-2">
        <input className="w-full rounded-md border px-3 py-2" placeholder="Paste QR data manually" onChange={(e) => onScan(e.target.value)} />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
