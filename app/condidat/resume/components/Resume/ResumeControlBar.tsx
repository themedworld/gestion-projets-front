"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSetDefaultScale } from "@/condidat/resume/components/Resume/hooks";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { UsePDFInstance } from "@react-pdf/renderer";
import dynamic from "next/dynamic";

const ResumeControlBar = ({
  scale,
  setScale,
  documentSize,
  document,
  fileName,
  postId,
  instance,
  update,
}: {
  scale: number;
  setScale: (scale: number) => void;
  documentSize: string;
  document: JSX.Element;
  fileName: string;
  postId: string;
  instance: UsePDFInstance;
  update: (document?: JSX.Element) => void;
}) => {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const { scaleOnResize, setScaleOnResize } = useSetDefaultScale({
    setScale,
    documentSize,
  });

  // Mettre à jour le PDF quand le document change
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      update(document);
    }, 300);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [document]);

  const handleExportAndApply = async () => {
    if (!postId) {
      alert("ID de poste manquant.");
      return;
    }

    try {
      setIsExporting(true);

      // Attendre que le blob soit prêt
      const blob = await new Promise<Blob>((resolve, reject) => {
        const start = Date.now();
        const check = setInterval(() => {
          if (instance.blob) {
            clearInterval(check);
            resolve(instance.blob);
          }
          if (Date.now() - start > 8000) {
            clearInterval(check);
            reject(new Error("Timeout : PDF non généré."));
          }
        }, 100);
      });

      // Convertir en base64 pour survie à la navigation
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        sessionStorage.setItem("resumeBase64", base64);
        sessionStorage.setItem("resumeFileName", fileName);
        setExportSuccess(true);
        setTimeout(() => {
          router.push(`/condidat/postuler/${postId}`);
        }, 600);
      };
      reader.readAsDataURL(blob);

    } catch (error: any) {
      console.error("Erreur :", error);
      alert(error.message || "Erreur lors de la génération du CV");
      setIsExporting(false);
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 flex h-[var(--resume-control-bar-height)] items-center justify-center px-[var(--resume-padding)] text-gray-600 lg:justify-between bg-white border-t">
      <div className="flex items-center gap-2">
        <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.01}
          value={scale}
          onChange={(e) => {
            setScaleOnResize(false);
            setScale(Number(e.target.value));
          }}
        />
        <div className="w-10">{`${Math.round(scale * 100)}%`}</div>
        <label className="hidden items-center gap-1 lg:flex">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={scaleOnResize}
            onChange={() => setScaleOnResize((prev) => !prev)}
          />
          <span className="select-none">Autoscale</span>
        </label>
      </div>

      <div className="flex items-center gap-3 ml-auto">

        {/* Bouton Télécharger */}
        
          className={`flex items-center gap-1 rounded-md border border-gray-300 px-3 py-0.5 transition-colors ${
            instance.url
              ? "hover:bg-gray-100 cursor-pointer"
              : "opacity-50 pointer-events-none"
          }`}
          href={instance.url ?? "#"}
          download={fileName}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span className="whitespace-nowrap text-sm">Télécharger</span>
        </a>

        {/* Bouton Postuler */}
        {postId && (
          <button
            onClick={handleExportAndApply}
            disabled={isExporting || exportSuccess || !instance.blob}
            className={`flex items-center gap-1 rounded-md px-3 py-0.5 font-medium transition-all whitespace-nowrap text-sm ${
              exportSuccess
                ? "bg-green-500 text-white border border-green-600 cursor-default"
                : isExporting
                ? "bg-blue-400 text-white border border-blue-500 cursor-wait"
                : !instance.blob
                ? "bg-gray-300 text-gray-500 border border-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>CV préparé ✓</span>
              </>
            ) : isExporting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Préparation...</span>
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>Postuler</span>
              </>
            )}
          </button>
        )}

        {/* Debug — retire en production */}
        <div className="text-xs text-red-400">
          blob: {instance.blob ? "✓" : "✗"} | 
          url: {instance.url ? "✓" : "✗"} | 
          err: {instance.error ?? "—"}
        </div>

      </div>
    </div>
  );
};

export const ResumeControlBarCSR = dynamic(
  () => Promise.resolve(ResumeControlBar),
  { ssr: false }
);

export const ResumeControlBarBorder = () => (
  <div className="absolute bottom-[var(--resume-control-bar-height)] w-full border-t-2 bg-gray-50" />
);