'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const CV_PARSER_URL = 'https://resume-parsing-jfns.onrender.com';
const SCORING_URL = process.env.NEXT_PUBLIC_SCORING_URL || 'https://concditascore.onrender.com';
const NEST_URL = process.env.NEXT_PUBLIC_NEST_API_URL || '';

// ============================================================
// TYPES
// ============================================================

interface ParsedSkills {
  technical: string[];
  languages: string[];
  soft: string[];
  tools: string[];
  all: string[];
}

interface ParsedCV {
  filename: string;
  language: string;
  experience: string;
  education: string;
  years_experience: number;
  years_education: number;
  level: string;
  skills: ParsedSkills;
}

interface ScoreBreakdown {
  score: number;
  semantic_similarity?: number;
  years_score?: number;
  cv_years?: number;
  required_years?: number;
  required_matched?: string[];
  required_total?: number;
  required_ratio?: number;
  preferred_matched?: string[];
  preferred_total?: number;
  preferred_ratio?: number;
  cv_skills?: string[];
  required_level?: string;
  candidate_level?: string;
}

interface ScoreResult {
  job_title: string;
  final_score: number;
  breakdown: {
    experience: ScoreBreakdown;
    education: ScoreBreakdown;
    skills: ScoreBreakdown;
    level: ScoreBreakdown;
    global_semantic: ScoreBreakdown;
  };
}

// Steps
type Step = 'form' | 'parsing' | 'confirm' | 'scoring' | 'done';

// ============================================================
// STEP INDICATOR
// ============================================================

const steps = ['Informations', 'Analyse CV', 'Confirmation', 'Score', 'Envoyé'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-10 px-2">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                i < current
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : i === current
                  ? 'bg-white border-indigo-500 text-indigo-600 shadow-md'
                  : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                i === current ? 'text-indigo-600' : i < current ? 'text-emerald-500' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                i < current ? 'bg-emerald-400' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// SCORE CARD
// ============================================================

function ScoreCard({ label, score, detail }: { label: string; score: number; detail?: string }) {
  const color =
    score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-rose-500';
  const bg =
    score >= 75 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className={`text-xl font-bold ${color}`}>{score.toFixed(0)}%</span>
      </div>
      {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
      <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// SKILL BADGE
// ============================================================

function SkillBadge({ label, matched }: { label: string; matched?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
        matched
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-gray-100 border-gray-200 text-gray-600'
      }`}
    >
      {matched && <span>✓</span>}
      {label}
    </span>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ApplyPage() {
  const params = useParams();
  const postId = params?.id as string;
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const stepIndex = ['form', 'parsing', 'confirm', 'scoring', 'done'].indexOf(step);

  // Form
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [file, setFile] = useState<File | null>(null);
  const [resumeBlob, setResumeBlob] = useState<Blob | null>(null);

  // Parsed CV
  const [parsedCV, setParsedCV] = useState<ParsedCV | null>(null);
  const [editedCV, setEditedCV] = useState<ParsedCV | null>(null);

  // Score
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [cvLink, setCvLink] = useState<string | null>(null);

  // UI
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Check blob in localStorage
  useEffect(() => {
    const checkBlob = async () => {
      try {
        const blobUrl = localStorage.getItem('resumeBlobUrl');
        if (blobUrl) {
          const res = await fetch(blobUrl);
          if (res.ok) setResumeBlob(await res.blob());
        }
      } catch {}
    };
    checkBlob();
  }, []);

  // ── Helpers ──────────────────────────────────────────────

  const validateFile = (f: File | Blob): string | null => {
    if (!['application/pdf', 'application/octet-stream'].includes(f.type) && !(f instanceof Blob))
      return 'Seuls les fichiers PDF sont acceptés';
    if (f.size > MAX_FILE_SIZE) return 'Fichier trop volumineux (max 15 Mo)';
    return null;
  };

  const toBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data URI prefix
        const b64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // ── STEP 1 → Parse CV ─────────────────────────────────────

  const handleParseCV = async () => {
    setError(null);

    if (!formData.name || !formData.email) {
      setError('Veuillez remplir nom et email');
      return;
    }

    const cvFile = resumeBlob || file;
    if (!cvFile) {
      setError('Veuillez joindre un CV en PDF');
      return;
    }

    const fileErr = validateFile(cvFile);
    if (fileErr) { setError(fileErr); return; }

    setStep('parsing');
    setLoadingMsg('Analyse de votre CV en cours…');

    try {
      const b64 = await toBase64(cvFile);

      const res = await fetch(`${CV_PARSER_URL}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: b64, filename: (file as File)?.name || 'cv.pdf' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Erreur lors de l\'analyse du CV');
      }

      const raw = await res.json();

      // Normalize skills: old parser returns string[], new returns {technical, languages, soft, tools, all}
      const normalizeSkills = (s: any): ParsedSkills => {
        if (!s) return { technical: [], languages: [], soft: [], tools: [], all: [] };
        if (Array.isArray(s)) return { technical: s, languages: [], soft: [], tools: [], all: s };
        return {
          technical: Array.isArray(s.technical) ? s.technical : [],
          languages: Array.isArray(s.languages) ? s.languages : [],
          soft: Array.isArray(s.soft) ? s.soft : [],
          tools: Array.isArray(s.tools) ? s.tools : [],
          all: Array.isArray(s.all) ? s.all : [
            ...(Array.isArray(s.technical) ? s.technical : []),
            ...(Array.isArray(s.tools) ? s.tools : []),
          ],
        };
      };

      const data: ParsedCV = { ...raw, skills: normalizeSkills(raw.skills) };
      setParsedCV(data);
      setEditedCV(JSON.parse(JSON.stringify(data)));
      setStep('confirm');
    } catch (e: any) {
      setError(e.message);
      setStep('form');
    }
  };

  // ── STEP 2 → Score + Upload + Apply ───────────────────────

  const handleConfirmAndScore = async () => {
    if (!editedCV) return;
    setError(null);
    setStep('scoring');

    const cvFile = resumeBlob || file;

    try {
      // ── 1. Récupérer les infos du post ──────────────────
      setLoadingMsg('Récupération des détails du poste…');
      const postRes = await fetch(`${NEST_URL}/posts/${postId}`);
      if (!postRes.ok) throw new Error('Impossible de récupérer le poste');
      const post = await postRes.json();

      // ── 2. Upload CV sur Cloudinary ─────────────────────
      setLoadingMsg('Upload du CV…');
      const uploadData = new FormData();
      uploadData.append('file', cvFile!, 'resume.pdf');
      uploadData.append('postId', postId);
      uploadData.append('name', formData.name);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || 'Erreur upload CV');
      const uploadedCvLink: string = uploadJson.secure_url;
      setCvLink(uploadedCvLink);

      // ── 3. Calculer les scores ───────────────────────────
      setLoadingMsg('Calcul du score de compatibilité…');
      const scorePayload = {
        job_title: post.title,
        job_description: post.description,
        job_experience_description: post.experienceDescription || '',
        job_education_description: post.educationDescription || '',
        job_skills_description: post.skillsDescription || '',
        job_required_skills: post.requiredSkills || [],
        job_preferred_skills: post.preferredSkills || [],
        job_keywords: post.keywords || [],
        job_required_level: post.requiredLevel || 'Junior',
        job_min_years_experience: post.minYearsExperience || 0,
        job_min_years_education: post.minYearsEducation || 0,
        cv: {
          experience_text: editedCV.experience,
          education_text: editedCV.education,
          years_experience: editedCV.years_experience,
          years_education: editedCV.years_education,
          skills: editedCV.skills.all,
          technical_skills: editedCV.skills.technical,
          level: editedCV.level,
        },
      };

      const scoreRes = await fetch(`${SCORING_URL}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scorePayload),
      });
      const scoreJson: ScoreResult = await scoreRes.json();
      if (!scoreRes.ok) throw new Error((scoreJson as any).detail || 'Erreur scoring');
      setScoreResult(scoreJson);

      // ── 4. Enregistrer sur NestJS ────────────────────────
      setLoadingMsg('Enregistrement de la candidature…');

      // Clamp : force toutes les valeurs entre 0 et 100
      const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 100) / 100));

      const b = scoreJson.breakdown ?? null;
      const expScore    = clamp(b?.experience?.score   ?? scoreJson.final_score ?? 0);
      const eduScore    = clamp(b?.education?.score    ?? scoreJson.final_score ?? 0);
      const skillsScore = clamp(b?.skills?.score       ?? scoreJson.final_score ?? 0);
      const levelScore  = clamp(b?.level?.score        ?? 100);
      const finalScore  = clamp(scoreJson.final_score  ?? (scoreJson as any).final_score_percent ?? 0);

      // phone : extraire la string si jamais c'est un objet { phone: '...' }
      const rawPhone = formData.phone;
      const phoneStr = typeof rawPhone === 'string'
        ? rawPhone
        : (rawPhone as any)?.phone ?? undefined;

      const applyBody = {
        name:             formData.name,
        email:            formData.email,
        phone:            phoneStr || undefined,
        cvLink:           uploadedCvLink,
        experience_text:  editedCV.experience,
        education_text:   editedCV.education,
        years_experience: editedCV.years_experience,
        years_education:  editedCV.years_education,
        skills:           editedCV.skills.all,
        level:            editedCV.level,
        experienceScore:  expScore,
        educationScore:   eduScore,
        skillsScore:      skillsScore,
        levelScore:       levelScore,
        score:            finalScore,
        cvParsingStatus:  'success',
      };

      console.log('[Apply] Sending to NestJS:', applyBody);

      const applyRes = await fetch(`${NEST_URL}/posts/${postId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyBody),
      });

      const applyJson = await applyRes.json();
      console.log('[Apply] NestJS response:', applyRes.status, applyJson);
      if (!applyRes.ok) {
        const msg = Array.isArray(applyJson.message)
          ? applyJson.message.join(', ')
          : applyJson.message || 'Erreur envoi candidature';
        throw new Error(msg);
      }

      localStorage.removeItem('resumeBlobUrl');
      localStorage.removeItem('resumeFileName');
      setStep('done');
    } catch (e: any) {
      setError(e.message);
      setStep('confirm');
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Postuler à l&apos;offre
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Processus guidé en 4 étapes</p>
        </div>

        {/* Step bar */}
        <StepBar current={stepIndex} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

          {/* Error banner */}
          {error && (
            <div className="mx-6 mt-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex gap-2 items-start">
              <span className="text-lg leading-none">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP: FORM ──────────────────────────────────── */}
          {step === 'form' && (
            <div className="p-8 space-y-5">
              <h2 className="text-lg font-bold text-slate-700">Vos informations</h2>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom complet *"
                  required
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email *"
                  required
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* CV Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-600">CV (PDF) *</label>
                  {!resumeBlob && (
                    <button
                      type="button"
                      onClick={() => router.push(`/condidat/postuler/${postId}/resume-builder`)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                      ✏️ Créer mon CV
                    </button>
                  )}
                </div>

                {resumeBlob ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
                    <span className="text-emerald-700 text-sm font-medium">✓ CV créé détecté</span>
                    <button
                      type="button"
                      onClick={() => { setResumeBlob(null); setFile(null); localStorage.removeItem('resumeBlobUrl'); }}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <label className="block w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 transition">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {file ? (
                      <span className="text-sm text-indigo-600 font-medium">📄 {file.name}</span>
                    ) : (
                      <>
                        <span className="block text-3xl mb-1">📎</span>
                        <span className="text-sm text-slate-500">Cliquer pour choisir un PDF</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              <button
                onClick={handleParseCV}
                disabled={!formData.name || !formData.email || (!file && !resumeBlob)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                Analyser mon CV →
              </button>
            </div>
          )}

          {/* ── STEP: PARSING ────────────────────────────────── */}
          {step === 'parsing' && (
            <div className="p-12 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-xl">📄</span>
              </div>
              <p className="text-slate-600 font-medium">{loadingMsg}</p>
              <p className="text-xs text-slate-400">Extraction du texte, compétences et expériences…</p>
            </div>
          )}

          {/* ── STEP: CONFIRM ─────────────────────────────────── */}
          {step === 'confirm' && editedCV && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-700">Vérifiez vos informations</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Voici ce que nous avons extrait de votre CV. Corrigez si nécessaire.
                </p>
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Expérience', value: `${editedCV.years_experience} ans` },
                  { label: 'Formation', value: `${editedCV.years_education} ans` },
                  { label: 'Niveau', value: editedCV.level },
                ].map((s) => (
                  <div key={s.label} className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
                    <p className="text-xs text-indigo-500 font-medium">{s.label}</p>
                    <p className="text-base font-bold text-indigo-700 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Années — éditable */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Années d&apos;expérience</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="mt-1 w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={editedCV.years_experience}
                    onChange={(e) => setEditedCV({ ...editedCV, years_experience: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Années de formation</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="mt-1 w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={editedCV.years_education}
                    onChange={(e) => setEditedCV({ ...editedCV, years_education: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Niveau — éditable */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Niveau</label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={editedCV.level}
                  onChange={(e) => setEditedCV({ ...editedCV, level: e.target.value })}
                >
                  <option>Junior</option>
                  <option>Intermédiaire</option>
                  <option>Senior/Expert</option>
                </select>
              </div>

              {/* Skills */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  Compétences détectées ({editedCV.skills.all.length})
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {editedCV.skills.all.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-full"
                    >
                      {s}
                      <button
                        onClick={() => setEditedCV({
                          ...editedCV,
                          skills: {
                            ...editedCV.skills,
                            all: editedCV.skills.all.filter((x) => x !== s),
                          },
                        })}
                        className="text-slate-400 hover:text-rose-500 ml-1 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Expérience texte */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Expérience (extrait)</label>
                <textarea
                  rows={4}
                  className="mt-1 w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  value={editedCV.experience}
                  onChange={(e) => setEditedCV({ ...editedCV, experience: e.target.value })}
                />
              </div>

              {/* Formation texte */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Formation (extrait)</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  value={editedCV.education}
                  onChange={(e) => setEditedCV({ ...editedCV, education: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 border border-slate-200 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleConfirmAndScore}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition"
                >
                  Confirmer & Envoyer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: SCORING ─────────────────────────────────── */}
          {step === 'scoring' && (
            <div className="p-12 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-xl">⚡</span>
              </div>
              <p className="text-slate-600 font-medium">{loadingMsg}</p>
            </div>
          )}

          {/* ── STEP: DONE ────────────────────────────────────── */}
          {step === 'done' && scoreResult && (
            <div className="p-8 space-y-6">
              {/* Score global */}
              <div className="text-center py-6 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-2xl border border-indigo-100">
                <p className="text-sm text-slate-500 mb-1">Score de compatibilité</p>
                <p
                  className={`text-6xl font-black ${
                    scoreResult.final_score >= 75
                      ? 'text-emerald-500'
                      : scoreResult.final_score >= 50
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }`}
                >
                  {scoreResult.final_score.toFixed(0)}%
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {scoreResult.final_score >= 75
                    ? '🎉 Excellent profil pour ce poste'
                    : scoreResult.final_score >= 50
                    ? '👍 Bon potentiel'
                    : '💪 Profil partiel'}
                </p>
              </div>

              {/* Breakdown */}
              <div>
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Détail des scores</h3>
                <div className="space-y-3">
                  <ScoreCard
                    label="Expérience (35%)"
                    score={scoreResult.breakdown.experience.score}
                    detail={`${scoreResult.breakdown.experience.cv_years} ans / ${scoreResult.breakdown.experience.required_years} ans requis`}
                  />
                  <ScoreCard
                    label="Formation (20%)"
                    score={scoreResult.breakdown.education.score}
                    detail={`${scoreResult.breakdown.education.cv_years} ans / ${scoreResult.breakdown.education.required_years} ans requis`}
                  />
                  <ScoreCard
                    label="Compétences (30%)"
                    score={scoreResult.breakdown.skills.score}
                    detail={`${scoreResult.breakdown.skills.required_matched?.length ?? 0}/${scoreResult.breakdown.skills.required_total ?? 0} skills requis`}
                  />
                  <ScoreCard
                    label="Niveau (15%)"
                    score={scoreResult.breakdown.level.score}
                    detail={`${scoreResult.breakdown.level.candidate_level} / requis : ${scoreResult.breakdown.level.required_level}`}
                  />
                </div>
              </div>

              {/* Skills matched */}
              {(scoreResult.breakdown.skills.required_matched?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Skills matchés</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {scoreResult.breakdown.skills.required_matched!.map((s) => (
                      <SkillBadge key={s} label={s} matched />
                    ))}
                  </div>
                </div>
              )}

              {/* CV Link */}
              {cvLink && (
                <a
                  href={cvLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm underline"
                >
                  📄 Voir le CV uploadé
                </a>
              )}

              {/* CTA */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-700 font-semibold">✅ Candidature envoyée avec succès !</p>
                <p className="text-xs text-emerald-600 mt-1">Vous recevrez une réponse par email</p>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full border border-slate-200 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                Retour à l&apos;accueil
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}