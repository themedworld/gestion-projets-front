"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSetDefaultScale } from "@/condidat/resume/components/Resume/hooks";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { usePDF } from "@react-pdf/renderer";
import dynamic from "next/dynamic";

const ResumeControlBar = ({
  scale,
  setScale,
  documentSize,
  document,
  fileName,
  postId,
}: {
  scale: number;
  setScale: (scale: number) => void;
  documentSize: string;
  document: JSX.Element;
  fileName: string;
  postId: string;
}) => {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { scaleOnResize, setScaleOnResize } = useSetDefaultScale({
    setScale,
    documentSize,
  });

  // usePDF prend le document initial — on l'update manuellement ensuite
  const [instance, update] = usePDF({ document });

  // Debounce les mises à jour pour éviter les re-renders en boucle
  useEffect(() => {
    setIsReady(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      update(document);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document]); // NE PAS mettre `update` dans les deps — ça crée une boucle infinie

  // Marquer comme prêt quand le blob est disponible
  useEffect(() => {
    if (instance.blob && !instance.loading) {
      setIsReady(true);
    }
  }, [instance.blob, instance.loading]);

  // ── Téléchargement direct ──────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!instance.blob) return;
    const url = URL.createObjectURL(instance.blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = fileName || "cv.pdf";
    a.click();
    // Libérer la mémoire après le clic
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [instance.blob, fileName]);

  // ── Postuler : stocker le blob et naviguer ─────────────────────────────────
  const handleExportAndApply = useCallback(async () => {
    if (!postId) {
      alert("ID de poste manquant. Accédez à cette page depuis une offre d'emploi.");
      return;
    }

    try {
      setIsExporting(true);

      // Si le blob n'est pas encore dispo, forcer update et attendre
      if (!instance.blob) {
        update(document);
        await new Promise<void>((resolve, reject) => {
          const start = Date.now();
          const interval = setInterval(() => {
            if (instance.blob) {
              clearInterval(interval);
              resolve();
            }
            if (Date.now() - start > 6_000) {
              clearInterval(interval);
              reject(new Error("Timeout — PDF non généré"));
            }
          }, 80);
        });
      }

      if (!instance.blob) throw new Error("Impossible de générer le PDF");

      // Stocker le blob URL dans localStorage pour la page de candidature
      const blobUrl = URL.createObjectURL(instance.blob);
      localStorage.setItem("resumeBlobUrl", blobUrl);
      localStorage.setItem("resumeFileName", fileName);

      setExportSuccess(true);

      setTimeout(() => {
        router.push(`/condidat/postuler/${postId}`);
      }, 600);

    } catch (err) {
      console.error("Erreur export :", err);
      alert(err instanceof Error ? err.message : "Erreur lors de la génération du CV");
      setIsExporting(false);
      setExportSuccess(false);
    }
  }, [instance.blob, postId, fileName, document, update, router]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const pdfNotReady = !isReady || instance.loading;

  return (
    <div className="sticky bottom-0 left-0 right-0 flex h-[var(--resume-control-bar-height)] items-center justify-between px-[var(--resume-padding)] text-gray-600 bg-white border-t gap-2">

      {/* Zoom controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
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
        <div className="w-10 text-sm tabular-nums">{`${Math.round(scale * 100)}%`}</div>
        <label className="hidden items-center gap-1 lg:flex text-sm select-none">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={scaleOnResize}
            onChange={() => setScaleOnResize((prev) => !prev)}
          />
          Autoscale
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Indicateur de chargement PDF */}
        {pdfNotReady && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
            Génération…
          </span>
        )}

        {/* Bouton Télécharger — utilise handleDownload au lieu de <a href={instance.url}> */}
        <button
          onClick={handleDownload}
         
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span className="whitespace-nowrap">Télécharger</span>
        </button>

        {/* Bouton Postuler */}
        {postId && (
          <button
            onClick={handleExportAndApply}
            
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all whitespace-nowrap border disabled:opacity-40 disabled:cursor-not-allowed ${
              exportSuccess
                ? "bg-green-500 text-white border-green-600"
                : "bg-teal-600 hover:bg-teal-700 text-white border-teal-700"
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckIcon className="h-4 w-4" />
                CV préparé
              </>
            ) : isExporting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Préparation…
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4" />
                Postuler
              </>
            )}
          </button>
        )}
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