"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { validateTicket } from "@/app/actions/tickets";

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
    };
  }
}

export function TicketScanner() {
  const [state, action, pending] = useActionState(validateTicket, undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSupported] = useState(
    () => typeof window !== "undefined" && !!window.BarcodeDetector,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.BarcodeDetector) {
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanLoop();
      } catch {
        setCameraError(
          "Não foi possível acessar a câmera. Use o campo manual abaixo.",
        );
      }
    }

    async function scanLoop() {
      if (cancelled || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0 && qrInputRef.current && formRef.current) {
          qrInputRef.current.value = codes[0].rawValue;
          formRef.current.requestSubmit();
          return;
        }
      } catch {
        // ignora frames sem leitura válida
      }
      requestAnimationFrame(scanLoop);
    }

    start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {cameraSupported && !cameraError && (
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-black"
        />
      )}
      {(cameraError || !cameraSupported) && (
        <p className="text-sm text-slate-500">
          {cameraError ??
            "Este navegador não suporta leitura de QR Code pela câmera. Use o campo manual abaixo."}
        </p>
      )}

      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="qrCode"
            className="text-sm font-medium text-slate-700"
          >
            Código do ingresso (manual ou escaneado)
          </label>
          <input
            ref={qrInputRef}
            id="qrCode"
            name="qrCode"
            type="text"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
        >
          {pending ? "Validando..." : "Validar"}
        </button>
      </form>

      {state?.message && (
        <p
          className={`text-sm font-medium ${
            state.success ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
