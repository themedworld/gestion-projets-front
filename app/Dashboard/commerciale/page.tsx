"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertCircle, Play, Square, Loader2, CheckCircle, XCircle, RefreshCw,
  Building2, Globe, Users, Mail, ShieldCheck, ExternalLink, ChevronRight,
  Activity, Hash, Copy, Check, Phone, ChevronDown, ChevronUp,
} from "lucide-react";

interface OSINTFormData {
  company_name: string;
  company_handle: string;
  country_name: string;
  country_iso: string;
}

interface EmailResult {
  email: string;
  domain?: string;
  mx_valid?: boolean;
  mx_ok?: boolean;
  found_online?: boolean;
  score: number;
}

interface Employee {
  name: string;
  role?: string;
  score: number;
  linkedin_url?: string;
  profile_url?: string;
  emails: EmailResult[];
}

interface CompanyResult {
  company?: {
    name: string;
    handle?: string;
    domain?: string;
    social_links?: { linkedin?: string; facebook?: string; instagram?: string; twitter?: string };
    emails?: string[];
    phones?: string[];
  };
  company_name?: string;
  domain?: string;
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  employees?: Employee[];
  employee?: Employee;
}

interface ProgressData {
  session_id: string;
  progress: number;
  status: "idle" | "running" | "stopping" | "stopped" | "completed" | "error";
  logs: string[];
  result: {
    results_markdown?: string;
    results_json?: string;
    partial?: boolean;
    success?: boolean;
    message?: string;
  };
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(value <= 1 ? value * 100 : value);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

function EmailBadge({ score }: { score: number }) {
  const color = score >= 80
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : score >= 60 ? "bg-amber-50 text-amber-700 ring-amber-200"
    : "bg-red-50 text-red-700 ring-red-200";
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ${color}`}>
      {score}
    </span>
  );
}

function StatusPill({ status }: { status: ProgressData["status"] }) {
  const map: Record<ProgressData["status"], { label: string; cls: string; dot: string }> = {
    idle:      { label: "Inactif",    cls: "bg-gray-100 text-gray-500",    dot: "bg-gray-400" },
    running:   { label: "En cours",   cls: "bg-blue-50 text-blue-600",     dot: "bg-blue-500 animate-pulse" },
    stopping:  { label: "Arrêt...",   cls: "bg-orange-50 text-orange-500", dot: "bg-orange-400 animate-pulse" },
    completed: { label: "Terminé",    cls: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
    stopped:   { label: "Arrêté",     cls: "bg-orange-50 text-orange-600", dot: "bg-orange-400" },
    error:     { label: "Erreur",     cls: "bg-red-50 text-red-600",       dot: "bg-red-500" },
  };
  const { label, cls, dot } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function LinkedInIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TwitterIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function SocialChip({ href, label, icon }: { href?: string | null; label: string; icon: React.ReactNode }) {
  const empty = !href || href === "N/A" || href.trim() === "";
  if (empty) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-100">
        <span className="text-gray-300">{icon}</span>
        <span className="text-xs text-gray-300">{label}</span>
        <span className="text-[10px] text-gray-200 ml-auto">—</span>
      </div>
    );
  }
  return (
    <a
      href={href!}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-150 group"
    >
      <span className="text-gray-500 group-hover:text-blue-600 transition-colors">{icon}</span>
      <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">{label}</span>
      <ExternalLink size={9} className="text-gray-300 group-hover:text-blue-400 ml-auto" />
    </a>
  );
}

function EmailList({ emails }: { emails: EmailResult[] }) {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 3;
  const displayed = showAll ? emails : emails.slice(0, PREVIEW);
  const hidden = emails.length - PREVIEW;
  return (
    <div>
      <div className="space-y-1">
        {displayed.map((e, i) => {
          const mx     = e.mx_valid ?? e.mx_ok ?? false;
          const online = e.found_online ?? false;
          return (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs font-mono text-gray-700 truncate">{e.email}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {mx && (
                  <span className="hidden sm:inline text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ring-1 ring-emerald-200">MX ✓</span>
                )}
                {online && (
                  <span className="hidden sm:inline text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ring-1 ring-blue-200">Web ✓</span>
                )}
                <EmailBadge score={e.score} />
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={e.email} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {emails.length > PREVIEW && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-gray-200 hover:border-blue-200 transition-all"
        >
          {showAll
            ? <><ChevronUp size={12} />Réduire</>
            : <><ChevronDown size={12} />Voir {hidden} email{hidden > 1 ? "s" : ""} supplémentaire{hidden > 1 ? "s" : ""}</>
          }
        </button>
      )}
    </div>
  );
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(true);
  const linkedinUrl = employee.linkedin_url || employee.profile_url;
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
            {getInitials(employee.name)}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">{employee.name}</p>
            <p className="text-xs text-gray-500">{employee.role || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 w-28">
            <ScoreBar value={employee.score} />
          </div>
          {linkedinUrl ? (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:text-blue-700 transition-colors"
              title="Voir profil LinkedIn"
            >
              <LinkedInIcon size={14} />
            </a>
          ) : (
            <span className="text-gray-200"><LinkedInIcon size={14} /></span>
          )}
          <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pt-1 pb-3">
          <div className="flex items-center justify-between py-2 mb-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Emails détectés</span>
            <span className="text-[11px] text-gray-400">{employee.emails.length} adresse{employee.emails.length > 1 ? "s" : ""}</span>
          </div>
          <EmailList emails={employee.emails} />
        </div>
      )}
    </div>
  );
}

function normalizeData(raw: CompanyResult) {
  if (raw.company) {
    const c = raw.company;
    const employees: Employee[] = raw.employee ? [raw.employee] : (raw.employees ?? []);
    return {
      name          : c.name ?? "",
      domain        : c.domain ?? "",
      linkedin      : c.social_links?.linkedin ?? "",
      facebook      : c.social_links?.facebook ?? "",
      instagram     : c.social_links?.instagram ?? "",
      twitter       : c.social_links?.twitter ?? "",
      phones        : c.phones ?? [],
      company_emails: c.emails ?? [],
      employees,
    };
  }
  return {
    name          : raw.company_name ?? "",
    domain        : raw.domain ?? "",
    linkedin      : raw.linkedin_url ?? "",
    facebook      : raw.facebook_url ?? "",
    instagram     : raw.instagram_url ?? "",
    twitter       : raw.twitter_url ?? "",
    phones        : [],
    company_emails: [],
    employees     : raw.employees ?? [],
  };
}

function ResultsPanel({ result, isPartial }: { result: ProgressData["result"]; isPartial?: boolean }) {
  const [tab, setTab] = useState<"structured" | "markdown" | "json">("structured");

  const parsed: CompanyResult | null = (() => {
    if (!result?.results_json) return null;
    try { return JSON.parse(result.results_json); } catch { return null; }
  })();

  if (!result?.results_markdown && !result?.results_json) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Activity size={20} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-400">Aucun résultat disponible</p>
        <p className="text-xs text-gray-300 mt-1">Lancez une recherche pour voir les résultats</p>
      </div>
    );
  }

  const data        = parsed ? normalizeData(parsed) : null;
  const totalEmails = data?.employees.reduce((a, e) => a + e.emails.length, 0) ?? 0;
  const avgScore    = data?.employees.length
    ? Math.round(
        data.employees.reduce((a, e) => {
          const s = e.emails.length
            ? e.emails.reduce((x, em) => x + em.score, 0) / e.emails.length
            : 0;
          return a + s;
        }, 0) / data.employees.length
      )
    : 0;

  return (
    <div>
      {isPartial && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={14} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-orange-700">
            <p className="font-semibold">Résultats partiels</p>
            <p className="text-orange-600 mt-0.5">La recherche a été arrêtée. Les données affichées sont partielles.</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
        {(["structured", "markdown", "json"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "structured" ? "Vue structurée" : t === "markdown" ? "Markdown" : "JSON brut"}
          </button>
        ))}
      </div>

      {tab === "structured" && data && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-gray-100 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{data.name || "—"}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Globe size={10} />
                  {data.domain || "Domaine non renseigné"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <SocialChip href={data.linkedin}  label="LinkedIn"    icon={<LinkedInIcon  size={13} />} />
              <SocialChip href={data.facebook}  label="Facebook"    icon={<FacebookIcon  size={13} />} />
              <SocialChip href={data.instagram} label="Instagram"   icon={<InstagramIcon size={13} />} />
              <SocialChip href={data.twitter}   label="Twitter / X" icon={<TwitterIcon   size={13} />} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Phone size={10} />Téléphones
              </p>
              {data.phones.length > 0 ? (
                <div className="space-y-1.5">
                  {data.phones.map((p, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <span className="text-xs font-mono text-gray-700">{p}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton text={p} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 italic">Aucun numéro</p>
              )}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail size={10} />Emails société
              </p>
              {data.company_emails.length > 0 ? (
                <div className="space-y-1.5">
                  {data.company_emails.map((e, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <span className="text-xs font-mono text-gray-700 truncate">{e}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <CopyButton text={e} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 italic">Aucun email</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-800">{data.employees.length}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Employés</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-800">{totalEmails}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Emails</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{avgScore}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Score moy.</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users size={11} />Employés vérifiés
            </p>
            <div className="space-y-2">
              {data.employees.length > 0
                ? data.employees.map((emp, i) => <EmployeeCard key={i} employee={emp} />)
                : <p className="text-xs text-gray-300 italic px-1">Aucun employé trouvé</p>
              }
            </div>
          </div>
        </div>
      )}

      {tab === "markdown" && result?.results_markdown && (
        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
          {result.results_markdown}
        </div>
      )}

      {tab === "json" && result?.results_json && (
        <div className="relative">
          <div className="absolute top-3 right-3 z-10"><CopyButton text={result.results_json} /></div>
          <pre className="bg-gray-900 text-emerald-400 rounded-xl p-4 text-xs font-mono overflow-auto max-h-96 leading-relaxed">
            {JSON.stringify(JSON.parse(result.results_json), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function LogsPanel({ logs }: { logs: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Hash size={20} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-400">En attente des logs</p>
        <p className="text-xs text-gray-300 mt-1">Les logs apparaîtront ici une fois la recherche lancée</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 rounded-xl p-4 max-h-80 overflow-y-auto">
      {logs.map((log, i) => (
        <div key={i} className="flex items-start gap-2 py-0.5 font-mono text-xs">
          <span className="text-gray-600 select-none w-6 text-right flex-shrink-0">{i + 1}</span>
          <span className={
            log.includes("✅") || log.includes("OK") ? "text-emerald-400" :
            log.includes("❌") || log.includes("ERR") ? "text-red-400"    :
            log.includes("⚠️")                        ? "text-amber-400"  :
            log.includes("🛑")                        ? "text-orange-400" :
            "text-gray-400"
          }>{log}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ────────────────────────────────────────────────────────────

export default function OSINTDashboard() {
  const [sessionId, setSessionId]   = useState("");
  const [formData, setFormData]     = useState<OSINTFormData>({
    company_name  : "3LM Solutions",
    company_handle: "3lm-solutions",
    country_name  : "Tunisia",
    country_iso   : "TN",
  });
  const [progress, setProgress]     = useState<ProgressData | null>(null);
  const [isRunning, setIsRunning]   = useState(false);
  const [isStopping, setIsStopping] = useState(false);   // ← nouvel état
  const [activeTab, setActiveTab]   = useState<"logs" | "results">("logs");
  const [isClient, setIsClient]     = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");
  const [apiStatus, setApiStatus]   = useState<"unknown" | "ok" | "error">("unknown");

  const apiUrl             = process.env.NEXT_PUBLIC_API_Company_searsh_URL || "https://search-company-xc9u.onrender.com";
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setIsClient(true); checkHealth(); }, []);

  // ── Polling principal ─────────────────────────────────────
  useEffect(() => {
    // On poll si on est en train de tourner OU en cours d'arrêt
    if ((!isRunning && !isStopping) || !sessionId) return;

    const poll = async () => {
      try {
        const res  = await fetch(`${apiUrl}/progress/${sessionId}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data: ProgressData = await res.json();
        setProgress(data);

        // Statuts terminaux : on arrête le polling
        const terminal = ["completed", "stopped", "error"];
        if (terminal.includes(data.status)) {
          setIsRunning(false);
          setIsStopping(false);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          if (data.status === "completed" || data.status === "stopped") {
            setActiveTab("results");
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    poll();
    progressIntervalRef.current = setInterval(poll, 1000);
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, [isRunning, isStopping, sessionId, apiUrl]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${apiUrl}/health`);
      setApiStatus(res.ok ? "ok" : "error");
    } catch { setApiStatus("error"); }
  };

  // ── Lancer la recherche ───────────────────────────────────
  const startOSINT = async () => {
    try {
      setErrorMsg("");
      setIsStopping(false);
      const res = await fetch(`${apiUrl}/predict-osint`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const data = await res.json();
      setSessionId(data.session_id);
      setIsRunning(true);
      setProgress(null);
      setActiveTab("logs");
    } catch (err) {
      setErrorMsg(`Erreur de lancement : ${err}`);
    }
  };

  // ── Arrêter la recherche ──────────────────────────────────
  const stopOSINT = async () => {
    if (!sessionId || isStopping) return;
    try {
      setErrorMsg("");
      setIsStopping(true);   // ← afficher l'état "Arrêt en cours..."

      const res = await fetch(`${apiUrl}/stop/${sessionId}`, { method: "POST" });
      if (!res.ok) throw new Error(`Erreur lors de l'arrêt: ${res.status}`);

      // On ne touche pas à isRunning ici — le polling détectera le statut "stopped"
      // et mettra à jour isRunning + isStopping automatiquement.
      // Le polling continue avec isStopping=true jusqu'au statut terminal.
      setIsRunning(false);   // on n'est plus "en cours" au sens du lancement

    } catch (err) {
      setErrorMsg(`Erreur arrêt : ${err}`);
      setIsStopping(false);
    }
  };

  if (!isClient) return null;

  // Statut affiché dans la StatusPill
  const currentStatus: ProgressData["status"] =
    isStopping  ? "stopping"  :
    isRunning   ? "running"   :
    progress?.status ?? "idle";

  const isPartialResult = progress?.result?.partial === true;
  const isActive        = isRunning || isStopping;

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">OSINT Intelligence</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${apiStatus === "ok" ? "bg-emerald-400" : apiStatus === "error" ? "bg-red-400" : "bg-gray-300"}`} />
              API {apiStatus === "ok" ? "connectée" : apiStatus === "error" ? "hors ligne" : "..."}
            </div>
            <button onClick={checkHealth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recherche entreprise</h1>
          <p className="text-sm text-gray-500 mt-1">Collecte d'intelligence sur les sociétés, employés et contacts</p>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Une erreur est survenue</p>
              <p className="text-xs mt-0.5 text-red-500">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg("")} className="ml-auto text-red-400 hover:text-red-600">
              <XCircle size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* ── Panneau gauche ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-700">Paramètres de recherche</p>
              </div>
              <div className="px-5 py-4 space-y-4">
                {([
                  { field: "company_name",   label: "Nom de la société", placeholder: "ex: Acme Corp",  icon: <Building2 size={13} className="text-gray-400" /> },
                  { field: "company_handle", label: "Handle (slug)",     placeholder: "ex: acme-corp",  icon: <Hash      size={13} className="text-gray-400" /> },
                  { field: "country_name",   label: "Pays",              placeholder: "ex: France",     icon: <Globe     size={13} className="text-gray-400" /> },
                  { field: "country_iso",    label: "Code ISO",          placeholder: "ex: TN",         icon: null, maxLength: 2 },
                ] as const).map(({ field, label, placeholder, icon, maxLength }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                    <div className="relative">
                      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
                      <input
                        type="text"
                        value={formData[field]}
                        onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                        disabled={isActive}
                        maxLength={maxLength}
                        placeholder={placeholder}
                        className={`w-full text-sm border border-gray-200 rounded-xl py-2.5 pr-3 bg-gray-50 text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${icon ? "pl-8" : "pl-3"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 space-y-2">
                {/* Bouton Lancer */}
                <button
                  onClick={startOSINT}
                  disabled={isActive}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                >
                  {isRunning
                    ? <><Loader2 size={14} className="animate-spin" />Recherche en cours...</>
                    : <><Play size={14} />Lancer la recherche</>
                  }
                </button>

                {/* Bouton Arrêter — visible si running OU stopping */}
                {isActive && (
                  <button
                    onClick={stopOSINT}
                    disabled={isStopping}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed text-red-600 text-sm font-medium rounded-xl transition-colors"
                  >
                    {isStopping
                      ? <><Loader2 size={14} className="animate-spin" />Arrêt en cours...</>
                      : <><Square size={14} />Arrêter</>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Carte session */}
            {sessionId && (
              <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Session active</p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Statut</span>
                    <StatusPill status={currentStatus} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ID</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-gray-600">{sessionId.slice(0, 12)}…</span>
                      <CopyButton text={sessionId} />
                    </div>
                  </div>
                  {progress && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">Progression</span>
                        <span className="text-xs font-semibold text-gray-700">{Math.round(progress.progress)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isStopping ? "bg-orange-400" : "bg-blue-500"}`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Panneau droit ── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${activeTab === "logs" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Activity size={11} />Logs
                  {progress?.logs?.length ? (
                    <span className="ml-0.5 bg-blue-100 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{progress.logs.length}</span>
                  ) : null}
                </button>
                <button
                  onClick={() => setActiveTab("results")}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${activeTab === "results" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Users size={11} />Résultats
                  {(progress?.status === "completed" || progress?.status === "stopped") && (
                    <CheckCircle size={10} className="text-emerald-500" />
                  )}
                </button>
              </div>

              {/* Badge statut terminal */}
              {progress?.status === "completed" && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <CheckCircle size={11} />Terminé
                </span>
              )}
              {progress?.status === "stopped" && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                  <AlertCircle size={11} />Arrêté
                </span>
              )}
              {progress?.status === "error" && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                  <XCircle size={11} />Erreur
                </span>
              )}
              {isStopping && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full">
                  <Loader2 size={11} className="animate-spin" />Arrêt en cours...
                </span>
              )}
              {isRunning && !isStopping && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                  <Loader2 size={11} className="animate-spin" />{Math.round(progress?.progress ?? 0)}%
                </span>
              )}
            </div>

            <div className="p-5">
              {activeTab === "logs"    && <LogsPanel    logs={progress?.logs ?? []} />}
              {activeTab === "results" && <ResultsPanel result={progress?.result ?? {}} isPartial={isPartialResult} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}