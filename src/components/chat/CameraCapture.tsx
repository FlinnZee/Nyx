import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera } from "lucide-react";
import Modal from "../ui/Modal";

export default function CameraCapture({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera unavailable — check your device permissions."));
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  const capture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    onCapture(c.toDataURL("image/jpeg", 0.9));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Take a photo" width={480}>
      {error ? (
        <p className="py-6 text-center text-sm text-muted">{error}</p>
      ) : (
        <>
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
          </div>
          <div className="mt-5 flex justify-center">
            <motion.button
              type="button"
              onClick={capture}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              className="grid h-16 w-16 place-items-center rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, var(--color-cyan), var(--color-violet) 55%, var(--color-magenta))",
                boxShadow: "0 8px 26px -8px var(--color-violet)",
              }}
              aria-label="Capture photo"
            >
              <Camera size={24} />
            </motion.button>
          </div>
        </>
      )}
      <canvas ref={canvasRef} hidden />
    </Modal>
  );
}
