"use client";

import { useState } from "react";

type PredictRequest = {
  entreprise: string;
  roles_csv: string;
  pays_nom: string;
  pays_iso: string;
  google_api_key: string;
  save_json: boolean;
};

type EmailItem = {
  value: string;
  score?: number;
  sources?: string[];
};

type CompanyData = {
  links?: string[];
  emails?: EmailItem[];
  phones?: { value: string; score?: number }[];
  phones_details?: any[];
  addresses?: any[];
  emails_sources?: Record<string, string[]>;
  raw_address_phrases?: Record<string, string[]>;
  [k: string]: any;
};

type Employee = {
  name?: string;
  profile?: string;
  score?: number;
  emails?: EmailItem[];
  phones?: any[];
  social?: { value: string; score?: number }[];
  [k: string]: any;
};

type ResultItem = {
  status?: string;
  message?: string;
  timestamp?: number;
  company?: string;
  company_data?: CompanyData;
  employee?: Employee;
  result_summary?: any;
  [k: string]: any;
};

export default function PredictPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<PredictRequest>({
    entreprise: "3LM Solutions",
    roles_csv: "Manager,HR",
    pays_nom: "Tunisia",
    pays_iso: "TN",
    google_api_key: "",
    save_json: false,
  });

  const FAST_API = process.env.NEXT_PUBLIC_FAST_API_URL || "http://127.0.0.1:8000";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  async function sendRequest() {
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedIndex(null);

    try {
      const res = await fetch(`${FAST_API}/predict_full`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed.detail || parsed.error || JSON.stringify(parsed);
        } catch {}
        throw new Error(`Erreur ${res.status} — ${msg}`);
      }

      const data = JSON.parse(text);
      if (Array.isArray(data)) setResult(data);
      else if (data?.result && Array.isArray(data.result)) setResult(data.result);
      else if (data?.result?.result && Array.isArray(data.result.result)) setResult(data.result.result);
      else setResult([data]);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const formatTimestamp = (ts?: number) => {
    if (!ts) return "-";
    try {
      return new Date(ts * 1000).toLocaleString();
    } catch {
      return String(ts);
    }
  };

  // Map score [0..1] or [0..100] to color classes
  function scoreToColor(score?: number) {
    if (score === undefined || score === null) return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    // normalize to 0..1
    let s = score;
    if (s > 1) s = s / 100;
    s = Math.max(0, Math.min(1, s));
    // green -> yellow -> red
    if (s >= 0.66) return "bg-green-600 text-white";
    if (s >= 0.33) return "bg-yellow-500 text-black";
    return "bg-red-500 text-white";
  }

  // collect all emails from result with context
  function collectEmails(items: ResultItem[] | null) {
    if (!items) return [] as { email: string; score?: number; sourceType: string; context: string }[];
    const out: { email: string; score?: number; sourceType: string; context: string }[] = [];
    items.forEach((it, idx) => {
      const companyEmails = it.company_data?.emails || [];
      companyEmails.forEach((e: EmailItem) =>
        out.push({ email: e.value, score: e.score, sourceType: "company", context: it.company || `item ${idx + 1}` })
      );
      const employeeEmails = it.employee?.emails || [];
      employeeEmails.forEach((e: EmailItem) =>
        out.push({ email: e.value, score: e.score, sourceType: "employee", context: it.employee?.name || `item ${idx + 1}` })
      );
    });
    // deduplicate by email keeping highest score
    const map = new Map<string, { email: string; score?: number; sourceType: string; context: string }>();
    out.forEach((e) => {
      const existing = map.get(e.email);
      if (!existing) map.set(e.email, e);
      else {
        const exScore = existing.score ?? -1;
        const newScore = e.score ?? -1;
        if (newScore > exScore) map.set(e.email, e);
      }
    });
    return Array.from(map.values());
  }

  const emails = collectEmails(result);

  return (
    <main className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">Résultats OSINT — Emails et informations</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Affichage détaillé des emails colorés selon le score. Cliquez sur une ligne pour voir le contexte complet.
          </p>
        </header>

        {/* Formulaire */}
        <section className="mb-6 bg-white dark:bg-gray-800 p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            name="entreprise"
            value={formData.entreprise}
            onChange={handleChange}
            className="px-3 py-2 border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            placeholder="Entreprise"
          />
          <input
            name="roles_csv"
            value={formData.roles_csv}
            onChange={handleChange}
            className="px-3 py-2 border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            placeholder="Rôles CSV"
          />
          <input
            name="pays_nom"
            value={formData.pays_nom}
            onChange={handleChange}
            className="px-3 py-2 border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            placeholder="Pays"
          />
          <input
            name="pays_iso"
            value={formData.pays_iso}
            onChange={handleChange}
            className="px-3 py-2 border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            placeholder="ISO"
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="save_json" checked={formData.save_json} onChange={handleChange} className="w-4 h-4" />
            <span className="text-sm">save_json</span>
          </label>

          <div className="md:col-span-3 flex gap-3">
            <button
              onClick={sendRequest}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow disabled:opacity-60"
            >
              {loading ? "Chargement…" : "Lancer la recherche"}
            </button>

            <button
              onClick={() =>
                setFormData({
                  entreprise: "3LM Solutions",
                  roles_csv: "Manager,HR",
                  pays_nom: "Tunisia",
                  pays_iso: "TN",
                  google_api_key: "",
                  save_json: false,
                })
              }
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
            >
              Réinitialiser
            </button>

            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 self-center">
              API: <span className="font-mono">{FAST_API}/predict_full</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {/* Emails summary */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Emails trouvés</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">{emails.length} email(s)</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Contexte</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {emails.map((e, i) => (
                  <tr
                    key={e.email}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
                    onClick={() => {
                      // find first item that contains this email and expand it
                      const idx = result?.findIndex((it) =>
                        (it.company_data?.emails || []).some((em: EmailItem) => em.value === e.email) ||
                        (it.employee?.emails || []).some((em: EmailItem) => em.value === e.email)
                      );
                      setExpandedIndex(idx === undefined ? null : idx === -1 ? null : idx);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <td className="px-4 py-3 align-top text-sm">{i + 1}</td>
                    <td className="px-4 py-3 align-top text-sm break-all">{e.email}</td>
                    <td className="px-4 py-3 align-top text-sm">
                      <span className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs ${scoreToColor(e.score)}`}>
                        <span className="font-medium">{e.score !== undefined ? (e.score > 1 ? `${Math.round((e.score as number))}` : `${Math.round((e.score as number) * 100)}`) : "—"}</span>
                        <span className="text-[10px] opacity-80">score</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-sm">{e.sourceType} — {e.context}</td>
                    <td className="px-4 py-3 align-top text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            navigator.clipboard?.writeText(e.email);
                            alert("Email copié");
                          }}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                        >
                          Copier
                        </button>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            const mailto = `mailto:${e.email}`;
                            window.open(mailto, "_blank");
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                        >
                          Envoyer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {emails.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucun email trouvé — lance la recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Résultats détaillés en tableau */}
        <section className="mb-6 bg-white dark:bg-gray-800 rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-900/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Emails</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Phones</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading && (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4">—</td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    </tr>
                  ))}
                </>
              )}

              {!loading && (!result || result.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Aucun résultat — lance la recherche.
                  </td>
                </tr>
              )}

              {!loading && result && result.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 align-top text-sm">{idx + 1}</td>
                  <td className="px-4 py-3 align-top text-sm font-medium">{item.status || "-"}</td>
                  <td className="px-4 py-3 align-top text-sm">{item.company || "-"}</td>
                  <td className="px-4 py-3 align-top text-sm">
                    <div className="flex flex-wrap gap-2">
                      {(item.company_data?.emails || item.employee?.emails || []).map((em: EmailItem, i: number) => (
                        <span key={i} className={`px-2 py-1 rounded text-xs ${scoreToColor(em.score)}`}>
                          {em.value}
                        </span>
                      ))}
                      {((item.company_data?.emails || []).length === 0 && (item.employee?.emails || []).length === 0) && <span className="text-gray-500">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    <div className="text-sm">
                      {(item.company_data?.phones || []).map((p: any, i: number) => (
                        <div key={i}>{p.value}</div>
                      ))}
                      {((item.company_data?.phones || []).length === 0) && <span className="text-gray-500">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-gray-500 dark:text-gray-400">{formatTimestamp(item.timestamp)}</td>
                  <td className="px-4 py-3 align-top text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                      >
                        {expandedIndex === idx ? "Fermer" : "Détails"}
                      </button>
                      <button
                        onClick={() => {
                          const json = JSON.stringify(item, null, 2);
                          navigator.clipboard?.writeText(json);
                          alert("JSON copié");
                        }}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                      >
                        Copier JSON
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Panneau détaillé */}
        {result && expandedIndex !== null && result[expandedIndex] && (
          <section className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">Détails — item #{expandedIndex + 1}</h2>
              <button onClick={() => setExpandedIndex(null)} className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Fermer</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Company Data</h3>
                <div className="text-sm space-y-2">
                  <div>
                    <strong>Emails</strong>
                    <ul className="list-disc ml-5">
                      {(result[expandedIndex].company_data?.emails || []).map((e: EmailItem, i: number) => (
                        <li key={i} className="flex items-center justify-between gap-3">
                          <div className="break-all">{e.value}</div>
                          <div className={`px-2 py-0.5 rounded text-xs ${scoreToColor(e.score)}`}>{e.score !== undefined ? (e.score > 1 ? Math.round(e.score) : Math.round(e.score * 100)) : "—"}</div>
                        </li>
                      ))}
                      {(result[expandedIndex].company_data?.emails || []).length === 0 && <li>—</li>}
                    </ul>
                  </div>

                  <div>
                    <strong>Phones</strong>
                    <ul className="list-disc ml-5">
                      {(result[expandedIndex].company_data?.phones || []).map((p: any, i: number) => (
                        <li key={i}>{p.value} {p.score !== undefined && <span className="text-xs text-gray-500">({p.score})</span>}</li>
                      ))}
                      {(result[expandedIndex].company_data?.phones || []).length === 0 && <li>—</li>}
                    </ul>
                  </div>

                  <div>
                    <strong>Links</strong>
                    <ul className="list-disc ml-5 break-words">
                      {(result[expandedIndex].company_data?.links || []).map((l: string, i: number) => (
                        <li key={i}><a href={l} target="_blank" rel="noreferrer" className="text-blue-500 break-all">{l}</a></li>
                      ))}
                      {(result[expandedIndex].company_data?.links || []).length === 0 && <li>—</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Employee</h3>
                <div className="text-sm space-y-2">
                  <p><strong>Name:</strong> {result[expandedIndex].employee?.name || "-"}</p>
                  <p><strong>Profile:</strong> {result[expandedIndex].employee?.profile ? <a href={result[expandedIndex].employee.profile} target="_blank" rel="noreferrer" className="text-blue-500">{result[expandedIndex].employee.profile}</a> : "-"}</p>
                  <p><strong>Score:</strong> {result[expandedIndex].employee?.score ?? "-"}</p>

                  <div>
                    <strong>Emails</strong>
                    <ul className="list-disc ml-5">
                      {(result[expandedIndex].employee?.emails || []).map((e: EmailItem, i: number) => (
                        <li key={i} className="flex items-center justify-between gap-3">
                          <div className="break-all">{e.value}</div>
                          <div className={`px-2 py-0.5 rounded text-xs ${scoreToColor(e.score)}`}>{e.score !== undefined ? (e.score > 1 ? Math.round(e.score) : Math.round(e.score * 100)) : "—"}</div>
                        </li>
                      ))}
                      {(result[expandedIndex].employee?.emails || []).length === 0 && <li>—</li>}
                    </ul>
                  </div>

                  <div>
                    <strong>Social</strong>
                    <ul className="list-disc ml-5 break-words">
                      {(result[expandedIndex].employee?.social || []).map((s: any, i: number) => (
                        <li key={i}><a href={s.value} target="_blank" rel="noreferrer" className="text-blue-500 break-all">{s.value}</a></li>
                      ))}
                      {(result[expandedIndex].employee?.social || []).length === 0 && <li>—</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Raw JSON</h3>
              <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded max-h-72 overflow-auto text-sm">
                {JSON.stringify(result[expandedIndex], null, 2)}
              </pre>
            </div>
          </section>
        )}

        <footer className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>Couleurs basées sur le score : vert = fiable, jaune = moyen, rouge = faible. Clique sur une ligne pour ouvrir le détail.</p>
        </footer>
      </div>
    </main>
  );
}
