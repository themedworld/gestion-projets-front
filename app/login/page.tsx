"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ─── Role → first landing route ────────────────────────────────────────────
   Basé sur MENU_BY_ROLE du Sidebar :
   chaque rôle est redirigé vers son premier item de menu.
─────────────────────────────────────────────────────────────────────────── */
const ROLE_ROUTES: Record<string, string> = {
  super_admin:         "/Dashboard",
  admin_company:       "/Dashboard",
  manager:             "/Dashboard",
  project_manager:     "/Dashboard",
  call_center_manager: "/Dashboard",
  sales_manager:       "/Dashboard",
  marketing_manager:   "/Dashboard",
  quality_manager:     "/Dashboard",
  hr_manager:          "/Dashboard/RH/postslist",
  agent_telepro:       "/Dashboard",
  commercial:          "/Dashboard",
  marketing_agent:     "/Dashboard",
  qualite_agent:       "/Dashboard",
  tech_support:        "/Dashboard",
  member:              "/Dashboard",
};

const getDashboardPath = (role: string) =>
  ROLE_ROUTES[role?.toLowerCase()] ?? "/Dashboard";

/* ─── DataPilot SVG logo (inline, no img needed) ───── */
function Logo() {
  return (
    <svg
      width="64" height="64"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_0_20px_rgba(34,211,238,0.45)] animate-pulse"
    >
      <rect x="8"  y="58" width="13" height="28" rx="2.5" fill="#22d3ee" />
      <rect x="26" y="42" width="13" height="44" rx="2.5" fill="#34d399" />
      <rect x="44" y="28" width="13" height="58" rx="2.5" fill="#4ade80" />
      <rect x="62" y="14" width="13" height="72" rx="2.5" fill="#a3e635" />
      <path d="M10 72 Q40 28 80 10" stroke="url(#g)" strokeWidth="2.5"
            fill="none" strokeLinecap="round"/>
      <polygon points="80,3 89,16 74,15" fill="#bef264"/>
      <defs>
        <linearGradient id="g" x1="10" y1="72" x2="80" y2="10"
                        gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee"/>
          <stop offset="1" stopColor="#bef264"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Eye icons ─────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
       viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
       viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
             a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0
             1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Reusable input wrapper ────────────────────────── */
function Field({
  id, label, type, value, onChange, placeholder, icon, rightSlot,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ReactNode; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id}
             className="text-xs font-semibold tracking-widest uppercase
                        text-slate-400">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                         text-slate-500 pointer-events-none">
          {icon}
        </span>
        <input
          id={id} type={type} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          required autoComplete={id}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                     bg-slate-900/70 border border-slate-700/60
                     text-slate-100 placeholder-slate-600
                     focus:outline-none focus:ring-2 focus:ring-cyan-500/40
                     focus:border-cyan-500/60
                     transition-all duration-200"
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_NEST_API_URL}/auth/signin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      if (!res.ok) throw new Error("Identifiants invalides");
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => router.push(getDashboardPath(data.user?.role ?? "")), 900);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ── Full-screen background ── */
    <div className="min-h-screen flex items-center justify-center
                    bg-[#020b18] relative overflow-hidden px-4">

      {/* Radial glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2
                      w-[700px] h-[340px] rounded-full
                      bg-cyan-500/10 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 right-0
                      w-[400px] h-[300px] rounded-full
                      bg-emerald-500/10 blur-[80px] pointer-events-none" />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34,211,238,0.25) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md
                      bg-slate-900/60 backdrop-blur-2xl
                      border border-slate-700/50
                      rounded-2xl shadow-2xl shadow-black/60
                      px-8 py-10
                      animate-[fadeUp_.55s_cubic-bezier(.22,.68,0,1.2)_both]">

        {/* Top accent bar */}
        <div className="absolute top-0 left-8 right-8 h-px
                        bg-gradient-to-r from-transparent via-cyan-400/60
                        to-transparent rounded-full" />

        {/* ── Brand ── */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Logo />
          <div className="text-center">
            <h1 className="font-extrabold text-3xl tracking-tight leading-none">
              <span className="text-white">Data</span>
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400
                               to-lime-400 bg-clip-text text-transparent">
                Pilot
              </span>
            </h1>
            <p className="mt-1 text-[11px] tracking-[0.2em] uppercase
                          text-slate-500 font-medium">
              Intelligence · Analytics · Insights
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent
                        via-slate-600/60 to-transparent mb-7" />

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-2.5
                          bg-red-500/10 border border-red-500/25
                          text-red-400 text-sm rounded-xl px-4 py-2.5 mb-5">
            <svg width="16" height="16" fill="none" stroke="currentColor"
                 strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field
            id="email" label="Adresse e-mail"
            type="email" value={email} onChange={setEmail}
            placeholder="nom@entreprise.com"
            icon={
              <svg width="15" height="15" fill="none" stroke="currentColor"
                   strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            }
          />

          <Field
            id="password" label="Mot de passe"
            type={showPwd ? "text" : "password"}
            value={password} onChange={setPassword}
            placeholder="••••••••"
            icon={
              <svg width="15" height="15" fill="none" stroke="currentColor"
                   strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            }
            rightSlot={
              <button
                type="button" onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Masquer" : "Afficher"}
                className="text-slate-500 hover:text-cyan-400
                           transition-colors duration-150 cursor-pointer"
              >
                {showPwd ? <EyeOff /> : <EyeOpen />}
              </button>
            }
          />

          {/* Forgot password */}
          <div className="flex justify-end -mt-2">
            <a href="/forgot-password"
               className="text-xs text-slate-500 hover:text-cyan-400
                          transition-colors duration-150">
              Mot de passe oublié ?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className={`
              relative w-full py-3 rounded-xl text-sm font-bold
              tracking-wide overflow-hidden transition-all duration-200
              ${success
                ? "bg-gradient-to-r from-emerald-500 to-lime-500 text-white cursor-default"
                : "bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white"
              }
              hover:brightness-110 hover:-translate-y-0.5
              active:translate-y-0 active:brightness-100
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-lg shadow-cyan-900/30
            `}
          >
            {/* shimmer */}
            {!loading && !success && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent
                               via-white/15 to-transparent
                               -translate-x-full animate-[shimmer_2s_infinite]" />
            )}

            <span className="flex items-center justify-center gap-2">
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none"
                     viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {loading
                ? "Connexion en cours…"
                : success
                  ? "✓ Connecté — redirection…"
                  : "Se connecter"}
            </span>
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Besoin d'aide ?{" "}
          <a href="/support"
             className="text-slate-500 hover:text-cyan-400
                        transition-colors duration-150">
            Contacter le support
          </a>
        </p>
      </div>

      {/* Version watermark */}
      <span className="absolute bottom-4 right-5 text-[10px]
                       text-slate-700 tracking-widest select-none">
        DataPilot v2.0
      </span>
    </div>
  );
}