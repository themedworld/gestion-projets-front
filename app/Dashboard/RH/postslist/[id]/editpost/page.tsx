'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────

type RequiredLevel = 'Junior' | 'Intermédiaire' | 'Senior/Expert';

type Post = {
  _id: string;
  title: string;
  description: string;
  experienceDescription?: string;
  minYearsExperience?: number;
  maxYearsExperience?: number;
  educationDescription?: string;
  minYearsEducation?: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  skillsDescription?: string;
  requiredLevel?: RequiredLevel;
  levelDescription?: string;
  keywords?: string[];
  tags?: string[];
  isActive?: boolean;
};

type FormState = {
  title: string;
  description: string;
  experienceDescription: string;
  minYearsExperience: string;
  maxYearsExperience: string;
  educationDescription: string;
  minYearsEducation: string;
  requiredSkills: string;
  preferredSkills: string;
  skillsDescription: string;
  requiredLevel: RequiredLevel;
  levelDescription: string;
  keywords: string;
  tags: string;
  isActive: boolean;
};

// ── Helpers ──────────────────────────────────────────────────

const LEVELS: RequiredLevel[] = ['Junior', 'Intermédiaire', 'Senior/Expert'];
const parseList = (val: string): string[] =>
  val.split(',').map(s => s.trim()).filter(Boolean);
const joinList = (arr?: string[]): string => (arr || []).join(', ');

const input =
  'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-400';

// ── Components ───────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">
        {label}
        {hint && <span className="ml-1 text-slate-400 font-normal">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function SkillPreview({ value, color }: { value: string; color: 'red' | 'blue' | 'purple' | 'green' }) {
  const items = parseList(value);
  if (!items.length) return null;
  const colors: Record<string, string> = {
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${colors[color]}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function EditPostPage() {
  const params = useParams() as { id?: string };
  const id = params?.id ?? '';
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    experienceDescription: '',
    minYearsExperience: '',
    maxYearsExperience: '',
    educationDescription: '',
    minYearsEducation: '',
    requiredSkills: '',
    preferredSkills: '',
    skillsDescription: '',
    requiredLevel: 'Junior',
    levelDescription: '',
    keywords: '',
    tags: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  const set = (field: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── Fetch post ──
  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('access_token') || localStorage.getItem('token')
          : null;
        const res = await fetch(`${base}/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur API ${res.status}: ${text}`);
        }
        const data: Post = await res.json();

        // Pré-remplir le formulaire
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          experienceDescription: data.experienceDescription ?? '',
          minYearsExperience: data.minYearsExperience?.toString() ?? '',
          maxYearsExperience: data.maxYearsExperience?.toString() ?? '',
          educationDescription: data.educationDescription ?? '',
          minYearsEducation: data.minYearsEducation?.toString() ?? '',
          requiredSkills: joinList(data.requiredSkills),
          preferredSkills: joinList(data.preferredSkills),
          skillsDescription: data.skillsDescription ?? '',
          requiredLevel: data.requiredLevel ?? 'Junior',
          levelDescription: data.levelDescription ?? '',
          keywords: joinList(data.keywords),
          tags: joinList(data.tags),
          isActive: data.isActive ?? true,
        });
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, base]);

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) return setError('Le titre est requis.');
    if (!form.description.trim()) return setError('La description est requise.');
    if (!form.requiredLevel) return setError('Le niveau requis est obligatoire.');

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token')
      : null;
    if (!token) return setError('Vous devez être connecté.');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      experienceDescription: form.experienceDescription.trim() || undefined,
      minYearsExperience: form.minYearsExperience ? Number(form.minYearsExperience) : undefined,
      maxYearsExperience: form.maxYearsExperience ? Number(form.maxYearsExperience) : undefined,
      educationDescription: form.educationDescription.trim() || undefined,
      minYearsEducation: form.minYearsEducation ? Number(form.minYearsEducation) : undefined,
      requiredSkills: parseList(form.requiredSkills),
      preferredSkills: parseList(form.preferredSkills),
      skillsDescription: form.skillsDescription.trim() || undefined,
      requiredLevel: form.requiredLevel,
      levelDescription: form.levelDescription.trim() || undefined,
      keywords: parseList(form.keywords),
      tags: parseList(form.tags),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      const res = await fetch(`${base}/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || `Erreur serveur ${res.status}`);
      }
      setSuccess(true);
      setTimeout(() => router.push('/Dashboard/RH/postslist'), 1200);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
        Chargement de l'offre...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Modifier l'offre</h1>
          <p className="text-slate-500 mt-1 text-sm">Mettez à jour les critères de l'offre d'emploi.</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
            ✅ Offre mise à jour avec succès ! Redirection en cours...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Infos générales ── */}
          <Section title="Informations générales" icon="📋">
            <Field label="Titre du poste *">
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="ex: Développeur Full Stack NestJS"
                className={input}
                required
              />
            </Field>

            <Field label="Description *">
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Description générale du poste..."
                rows={4}
                className={input}
                required
              />
            </Field>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => set('isActive', e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700">
                Offre active (visible publiquement)
              </label>
            </div>
          </Section>

          {/* ── Niveau requis ── */}
          <Section title="Niveau requis" icon="🎯">
            <Field label="Niveau *">
              <div className="flex gap-3 flex-wrap">
                {LEVELS.map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => set('requiredLevel', lvl)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      form.requiredLevel === lvl
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Description du niveau (optionnel)">
              <input
                value={form.levelDescription}
                onChange={e => set('levelDescription', e.target.value)}
                placeholder="ex: Professionnel expérimenté capable de gérer une équipe"
                className={input}
              />
            </Field>
          </Section>

          {/* ── Expérience ── */}
          <Section title="Expérience professionnelle" icon="💼">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Années min.">
                <input
                  type="number"
                  min={0}
                  value={form.minYearsExperience}
                  onChange={e => set('minYearsExperience', e.target.value)}
                  placeholder="0"
                  className={input}
                />
              </Field>
              <Field label="Années max. (optionnel)">
                <input
                  type="number"
                  min={0}
                  value={form.maxYearsExperience}
                  onChange={e => set('maxYearsExperience', e.target.value)}
                  placeholder="—"
                  className={input}
                />
              </Field>
            </div>

            <Field label="Description de l'expérience (optionnel)">
              <textarea
                value={form.experienceDescription}
                onChange={e => set('experienceDescription', e.target.value)}
                placeholder="ex: Expérience en développement backend avec Python et FastAPI"
                rows={2}
                className={input}
              />
            </Field>
          </Section>

          {/* ── Formation ── */}
          <Section title="Formation" icon="🎓">
            <Field label="Années de formation min.">
              <input
                type="number"
                min={0}
                value={form.minYearsEducation}
                onChange={e => set('minYearsEducation', e.target.value)}
                placeholder="0"
                className={input}
              />
            </Field>

            <Field label="Description de la formation (optionnel)">
              <textarea
                value={form.educationDescription}
                onChange={e => set('educationDescription', e.target.value)}
                placeholder="ex: Master Informatique ou équivalent"
                rows={2}
                className={input}
              />
            </Field>
          </Section>

          {/* ── Compétences ── */}
          <Section title="Compétences" icon="🛠️">
            <Field label="Compétences obligatoires" hint="Séparées par des virgules">
              <input
                value={form.requiredSkills}
                onChange={e => set('requiredSkills', e.target.value)}
                placeholder="ex: NestJS, MongoDB, Docker"
                className={input}
              />
              <SkillPreview value={form.requiredSkills} color="red" />
            </Field>

            <Field label="Compétences appréciées" hint="Séparées par des virgules">
              <input
                value={form.preferredSkills}
                onChange={e => set('preferredSkills', e.target.value)}
                placeholder="ex: Kubernetes, AWS, Redis"
                className={input}
              />
              <SkillPreview value={form.preferredSkills} color="blue" />
            </Field>

            <Field label="Description des compétences (optionnel)">
              <textarea
                value={form.skillsDescription}
                onChange={e => set('skillsDescription', e.target.value)}
                placeholder="ex: Maîtrise des frameworks backend modernes et des bases NoSQL"
                rows={2}
                className={input}
              />
            </Field>
          </Section>

          {/* ── Tags & Keywords ── */}
          <Section title="Tags & Mots-clés" icon="🏷️">
            <Field label="Mots-clés" hint="Séparés par des virgules">
              <input
                value={form.keywords}
                onChange={e => set('keywords', e.target.value)}
                placeholder="ex: backend, API, microservices"
                className={input}
              />
              <SkillPreview value={form.keywords} color="purple" />
            </Field>

            <Field label="Tags" hint="Séparés par des virgules">
              <input
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
                placeholder="ex: Remote, CDI, Urgent"
                className={input}
              />
              <SkillPreview value={form.tags} color="green" />
            </Field>
          </Section>

          {/* ── Submit ── */}
          <div className="flex gap-3 pt-2 pb-10">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition text-sm font-semibold"
            >
              {saving ? 'Enregistrement...' : '✓ Enregistrer les modifications'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}