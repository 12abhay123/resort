import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import Modal from './Modal';

// Opens the device camera and decodes QR codes with jsQR.
// Calls onResult(text) once with the raw decoded string, then stops the camera.
export default function QrScanner({ open, onClose, onResult }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setError('');
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');

    function stop() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          stop();
          onResult(code.data);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          tick();
        }
      } catch (err) {
        setError('Could not access camera. Check browser/site camera permission.');
      }
    }

    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onResult]);

  return (
    <Modal open={open} onClose={onClose} title="Scan room QR">
      {error ? (
        <p className="text-sm text-coral">{error}</p>
      ) : (
        <video ref={videoRef} className="w-full rounded-xl bg-black aspect-square object-cover" muted playsInline />
      )}
      <p className="text-xs text-ink-700/50 mt-2">Point the camera at the room's QR code — it scans automatically.</p>
    </Modal>
  );
}