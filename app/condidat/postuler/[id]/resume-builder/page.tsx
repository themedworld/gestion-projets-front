"use client";
import { Provider } from "react-redux";
import { store } from "@/condidat/resume/lib/redux/store";
import { ResumeForm } from "@/condidat/resume/components/ResumeForm";
import { Resume } from "@/condidat/resume/components/Resume";
import { ResumeDropzone } from "@/condidat/resume/components/importimg";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function Create() {
  const params = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const postId = params?.id as string;
  const router = useRouter();

  const handleImageUrlChange = (newImageUrl: string) => {
    setImageUrl(newImageUrl);
  };

  return (
    <Provider store={store}>
      {/* ── Decorative background ── */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-teal-50 via-cyan-50 to-white">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, #99f6e4 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Soft blobs */}
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-100/40 blur-2xl" />
      </div>

      {/* ── Top accent bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-400" />

      {/* ── Header ── */}
      <header className="fixed top-1 left-0 right-0 z-40 border-b border-teal-100/80 bg-white/80 backdrop-blur-xl shadow-sm shadow-teal-100/50">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-white text-teal-600 shadow-sm transition-all hover:border-teal-400 hover:bg-teal-50 hover:-translate-x-0.5"
              aria-label="Retour"
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-teal-500">
                ✦ Candidature
              </p>
              <h1 className="truncate bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-lg font-extrabold leading-tight text-transparent sm:text-xl">
                Créer votre CV
              </h1>
            </div>
          </div>

          {/* Right: live badge */}
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-teal-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-100" />
            En direct
          </div>
        </div>
      </header>

      {/* ── Main layout — EXACT same logic ── */}
      <main className="relative min-h-screen w-full overflow-hidden pt-[57px]">
        <div className="grid h-[calc(100vh-57px)] grid-cols-3 md:grid-cols-6">

          {/* ── LEFT: Form panel ── */}
          <div className="col-span-3 flex flex-col border-r border-teal-100/70 bg-white/70 backdrop-blur-md">
            {/* Panel header */}
            <div className="flex items-center gap-3 border-b border-teal-100/60 bg-white/60 px-4 py-3 sm:px-5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 shadow-sm">
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                  <path d="M15.5 2.5a2.121 2.121 0 013 3L12 12l-4 1 1-4 6.5-6.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Vos informations</p>
                <p className="text-[10px] text-teal-500">Profil professionnel</p>
              </div>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-teal-200">

              {/* Dropzone card */}
              <div className="mb-4 rounded-2xl border-2 border-dashed border-teal-200/70 bg-gradient-to-br from-teal-50 to-cyan-50/60 p-4 transition-colors hover:border-teal-400 hover:bg-teal-50">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Photo de profil</p>
                    <p className="text-[10px] text-teal-500">JPG, PNG — 200×200 px recommandé</p>
                  </div>
                </div>
                <ResumeDropzone onFileUrlChange={setImageUrl} />
              </div>

              {/* Info banner */}
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50/50 px-3 py-2.5">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500">
                  <svg width="9" height="9" fill="#fff" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-[11px] leading-relaxed text-teal-700">
                  Chaque modification est reflétée instantanément dans l'aperçu à droite.
                  Remplissez tous les champs pour maximiser vos chances.
                </p>
              </div>

              {/* Form fields */}
              <div className="border-t border-teal-100/60 pt-4">
                <ResumeForm imageUrl={imageUrl} />
              </div>
            </div>
          </div>

          {/* ── RIGHT: Preview panel ── */}
          <div className="relative col-span-3 flex flex-col bg-gradient-to-b from-teal-50/80 to-cyan-50/50 backdrop-blur-sm">
            {/* Thin left accent */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-300/60" />
              <div className="h-10 w-0.5 rounded-full bg-gradient-to-b from-teal-300/60 to-cyan-300/40" />
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-300/60" />
            </div>

            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-white/40 bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Aperçu du CV</p>
                  <p className="text-[10px] text-white/70">Mise à jour automatique</p>
                </div>
              </div>
              <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
                PDF · A4
              </span>
            </div>

            {/* Scrollable preview */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-teal-200">
              {/* Live label */}
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-md shadow-teal-200/50">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-100" />
                Aperçu en temps réel
              </div>

              <Resume imageUrl={imageUrl} postId={postId} />
            </div>

            {/* Corner mono label */}
            <p className="absolute bottom-4 right-4 font-mono text-[9px] uppercase tracking-widest text-teal-300/50 pointer-events-none select-none">
              CV · FORMAT A4
            </p>
          </div>

        </div>
      </main>
    </Provider>
  );
}