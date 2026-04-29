"use client";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"predict" | "company">("predict");

  // Predict state
  const [service, setService] = useState("");
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predictLoading, setPredictLoading] = useState(false);

  // Company state
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("");
  const [maxResults, setMaxResults] = useState(5);
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState("");

  const handlePredict = async () => {
    if (!service.trim()) return;
    setPredictLoading(true);
    setPredictResult(null);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_AI_Industry_Estimator_API_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      const data = await res.json();
      setPredictResult(data);
    } catch (error: any) {
      setPredictResult({ success: false, error: error.message });
    } finally {
      setPredictLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!domain.trim()) return;
    setCompanyLoading(true);
    setCompanies([]);
    setCompanyError("");
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_AI_Indistry_Company_API_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, country, max_results: Number(maxResults) }),
      });
      const data = await res.json();
      setCompanies(data.results || []);
    } catch (error: any) {
      setCompanyError(error.message);
    } finally {
      setCompanyLoading(false);
    }
  };

  const confidence = predictResult?.confidence
    ? Math.round(predictResult.confidence * 100)
    : null;
  const confidenceColor =
    confidence !== null
      ? confidence >= 75
        ? "#1D9E75"
        : confidence >= 45
        ? "#BA7517"
        : "#E24B4A"
      : "#888";

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Industry Intelligence
            </h1>
            <span className="text-xs font-mono bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-400">
              AI Powered
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            AI-powered sector analysis &amp; company discovery
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {(["predict", "company"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 text-sm rounded-lg transition-all font-medium ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "predict" ? "Industry Prediction" : "Company Finder"}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* ── PREDICT PANEL ── */}
          {activeTab === "predict" && (
            <div>
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Service or product description
                </label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePredict()}
                  placeholder="e.g. cloud storage for medical records, fintech payments API…"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:bg-white transition text-gray-900 placeholder-gray-400"
                />
              </div>

              <button
                onClick={handlePredict}
                disabled={predictLoading || !service.trim()}
                className="w-full py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {predictLoading ? "Predicting…" : "Predict industry"}
              </button>

              {/* Predict Result */}
              {predictResult && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Prediction result
                  </p>

                  {predictResult.success === false ? (
                    <p className="text-sm text-red-500">{predictResult.error}</p>
                  ) : (
                    <>
                      {predictResult.industry && (
                        <p className="text-xl font-semibold text-gray-900 mb-3">
                          {predictResult.industry}
                        </p>
                      )}

                      {confidence !== null && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: confidenceColor }}
                            />
                            <span className="text-xs text-gray-400">
                              {confidence}% confidence
                            </span>
                          </div>
                          <div className="h-1 rounded bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded transition-all duration-500"
                              style={{
                                width: `${confidence}%`,
                                background: confidenceColor,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {predictResult.sub_sectors?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {predictResult.sub_sectors.map((s: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer">
                          Raw response
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto leading-relaxed font-mono">
                          {JSON.stringify(predictResult, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── COMPANY PANEL ── */}
          {activeTab === "company" && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  {
                    label: "Domain",
                    value: domain,
                    setter: setDomain,
                    placeholder: "bank, IT, health…",
                    type: "text",
                  },
                  {
                    label: "Country",
                    value: country,
                    setter: setCountry,
                    placeholder: "France, USA…",
                    type: "text",
                  },
                  {
                    label: "Max results",
                    value: maxResults,
                    setter: setMaxResults,
                    placeholder: "5",
                    type: "number",
                  },
                ].map(({ label, value, setter, placeholder, type }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      value={value}
                      onChange={(e) =>
                        setter(
                          type === "number"
                            ? (e.target.value as any)
                            : e.target.value
                        )
                      }
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:bg-white transition text-gray-900 placeholder-gray-400"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSearch}
                disabled={companyLoading || !domain.trim()}
                className="w-full py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {companyLoading ? "Searching…" : "Search companies"}
              </button>

              {/* Company Results */}
              {(companies.length > 0 || companyError) && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  {companyError ? (
                    <p className="text-sm text-red-500">{companyError}</p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                        {companies.length} companies found · {domain}
                        {country ? ` · ${country}` : ""}
                      </p>
                      <div>
                        {companies.map((company, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0"
                          >
                            <span className="text-xs font-mono text-gray-300 min-w-[20px]">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-medium text-gray-900 flex-1">
                              {company}
                            </span>
                            <span className="text-xs text-gray-300">↗</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}