'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────

type Applicant = {
  name: string;
  email: string;
  phone?: string;
  cvLink?: string;
  level?: string;
  skills?: string[];
  years_experience?: number;
  years_education?: number;
  experienceScore?: number;
  educationScore?: number;
  skillsScore?: number;
  levelScore?: number;
  score?: number;
  cvParsingStatus?: string;
  appliedAt?: string;
};

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
  requiredLevel?: string;
  levelDescription?: string;
  keywords?: string[];
  tags?: string[];
  isActive?: boolean;
  createdById?: string;
  companyId?: string;
  score?: number;
  applicants?: Applicant[];
  applicantsCount?: number;
  matchedApplicantsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type UserSummary = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

// ── Helpers ──────────────────────────────────────────────────

const initials = (name?: string) => {
  if (!name) return 'U';
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
};

const LEVEL_COLOR: Record<string, string> = {
  'Junior': 'bg-green-50 text-green-700 border-green-200',
  'Intermédiaire': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Senior/Expert': 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_COLOR: Record<string, string> = {
  success: 'text-green-600',
  pending: 'text-yellow-600',
  failed: 'text-red-500',
};

function ScoreBar({ label, value }: { label: string; value?: number }) {
  const v = value ?? 0;
  const color = v >= 70 ? 'bg-green-500' : v >= 40 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{v}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Tag({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-50 text-red-700 border border-red-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    green: 'bg-green-50 text-green-700 border border-green-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[color] ?? colors.slate}`}>
      {children}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function PostDetailPage() {
  const params = useParams() as { id?: string };
  const id = params?.id ?? '';
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [creator, setCreator] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token')
      : null;

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const res = await fetch(`${base}/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Erreur API ${res.status}: ${await res.text()}`);
        const data: Post = await res.json();
        setPost(data);

        // Fetch créateur
        if (data.createdById) {
          try {
            const uRes = await fetch(`${base}/users/${encodeURIComponent(data.createdById)}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (uRes.ok) {
              const u = await uRes.json();
              setCreator({ id: u._id ?? u.id, name: u.name ?? u.fullName ?? u.email, email: u.email, role: u.role });
            } else {
              setCreator({ id: data.createdById });
            }
          } catch {
            setCreator({ id: data.createdById });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, base]);

  const handleDeletePost = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette offre ?')) return;
    const token = getToken();
    if (!token) { alert('Vous devez être connecté.'); return; }
    setDeleting(true);
    try {
      const res = await fetch(`${base}/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur suppression ${res.status}: ${await res.text()}`);
      router.push('/Dashboard/RH/postslist');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteApplicant = async (email: string) => {
    if (!confirm(`Supprimer le candidat ${email} ?`)) return;
    const token = getToken();
    if (!token) { alert('Vous devez être connecté.'); return; }
    setDeletingEmail(email);
    try {
      const res = await fetch(`${base}/posts/${id}/applicants/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${await res.text()}`);
      const updated = await fetch(`${base}/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).then(r => r.json());
      setPost(updated);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression du candidat');
    } finally {
      setDeletingEmail(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
      Chargement...
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>
    </div>
  );
  if (!post) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
      Offre introuvable.
    </div>
  );

  const applicants = post.applicants ?? [];
  const sortedApplicants = [...applicants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1">
            ← Retour
          </button>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-slate-800">{post.title}</h1>
                  {post.requiredLevel && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLOR[post.requiredLevel] ?? 'bg-slate-100 text-slate-600'}`}>
                      {post.requiredLevel}
                    </span>
                  )}
                  {post.isActive
                    ? <span className="text-xs text-green-600 font-medium">● Actif</span>
                    : <span className="text-xs text-red-500 font-medium">● Inactif</span>}
                </div>

                <div className="text-xs text-slate-400 mb-3">
                  Créé le {post.createdAt ? new Date(post.createdAt).toLocaleDateString('fr-FR') : '—'}
                  {post.updatedAt && ` • Modifié le ${new Date(post.updatedAt).toLocaleDateString('fr-FR')}`}
                </div>

                {/* Créateur */}
                {creator && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                      {initials(creator.name ?? creator.email)}
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-medium">{creator.name ?? `User ${creator.id}`}</span>
                      {creator.role && <span className="text-slate-400"> · {creator.role}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Score moyen */}
              <div className="text-center shrink-0">
                <div className="text-3xl font-bold text-indigo-600">{post.score ?? 0}</div>
                <div className="text-xs text-slate-400">score moyen</div>
                <div className="text-xs text-slate-500 mt-1">{post.applicantsCount ?? applicants.length} candidat(s)</div>
                {(post.matchedApplicantsCount ?? 0) > 0 && (
                  <div className="text-xs text-green-600 font-medium">{post.matchedApplicantsCount} ≥ 70%</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => router.push(`/Dashboard/RH/postslist/${id}/editpost`)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Modifier
              </button>
              <button
                onClick={handleDeletePost}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">📋 Description</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{post.description}</p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {post.tags.map((t, i) => <Tag key={i} color="green">{t}</Tag>)}
            </div>
          )}
        </div>

        {/* ── Critères ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">🎯 Critères de matching</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

            {/* Niveau */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Niveau</div>
              <div className="flex items-center gap-2">
                {post.requiredLevel && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${LEVEL_COLOR[post.requiredLevel] ?? ''}`}>
                    {post.requiredLevel}
                  </span>
                )}
              </div>
              {post.levelDescription && <p className="text-xs text-slate-500">{post.levelDescription}</p>}
            </div>

            {/* Expérience */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Expérience</div>
              <div className="text-slate-700">
                {post.minYearsExperience ?? 0}
                {post.maxYearsExperience ? `–${post.maxYearsExperience}` : '+'} ans
              </div>
              {post.experienceDescription && <p className="text-xs text-slate-500">{post.experienceDescription}</p>}
            </div>

            {/* Formation */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Formation</div>
              <div className="text-slate-700">{post.minYearsEducation ?? 0}+ ans</div>
              {post.educationDescription && <p className="text-xs text-slate-500">{post.educationDescription}</p>}
            </div>

            {/* Pondération */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pondération du score</div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <div>Skills: <span className="font-medium text-slate-700">40%</span></div>
                <div>Expérience: <span className="font-medium text-slate-700">25%</span></div>
                <div>Niveau: <span className="font-medium text-slate-700">20%</span></div>
                <div>Formation: <span className="font-medium text-slate-700">15%</span></div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {(post.requiredSkills?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Compétences obligatoires</div>
              <div className="flex flex-wrap gap-1">
                {post.requiredSkills!.map((s, i) => <Tag key={i} color="red">{s}</Tag>)}
              </div>
            </div>
          )}
          {(post.preferredSkills?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Compétences appréciées</div>
              <div className="flex flex-wrap gap-1">
                {post.preferredSkills!.map((s, i) => <Tag key={i} color="blue">{s}</Tag>)}
              </div>
              {post.skillsDescription && <p className="text-xs text-slate-500">{post.skillsDescription}</p>}
            </div>
          )}
          {(post.keywords?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mots-clés</div>
              <div className="flex flex-wrap gap-1">
                {post.keywords!.map((k, i) => <Tag key={i} color="purple">{k}</Tag>)}
              </div>
            </div>
          )}
        </div>

        {/* ── Candidats ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">
              👥 Candidats ({applicants.length})
            </h2>
            {(post.matchedApplicantsCount ?? 0) > 0 && (
              <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                {post.matchedApplicantsCount} candidat(s) ≥ 70
              </span>
            )}
          </div>

          {applicants.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-6">Aucun candidat pour le moment.</div>
          )}

          <ul className="space-y-3">
            {sortedApplicants.map(a => {
              const isExpanded = expandedApplicant === a.email;
              const score = a.score ?? 0;
              const scoreColor = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-500';

              return (
                <li key={a.email} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Row principal */}
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                      {initials(a.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{a.name}</span>
                        {a.level && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${LEVEL_COLOR[a.level] ?? 'bg-slate-100 text-slate-600'}`}>
                            {a.level}
                          </span>
                        )}
                        {a.cvParsingStatus && (
                          <span className={`text-xs ${STATUS_COLOR[a.cvParsingStatus] ?? 'text-slate-400'}`}>
                            ● {a.cvParsingStatus}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {a.email}
                        {a.phone && ` · ${a.phone}`}
                        {a.years_experience !== undefined && ` · ${a.years_experience} ans exp.`}
                      </div>
                      {/* Skills */}
                      {(a.skills?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.skills!.slice(0, 4).map((s, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                          {a.skills!.length > 4 && (
                            <span className="text-xs text-slate-400">+{a.skills!.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Score total */}
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-bold ${scoreColor}`}>{score}</div>
                      <div className="text-xs text-slate-400">/ 100</div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedApplicant(isExpanded ? null : a.email)}
                        className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 transition"
                      >
                        {isExpanded ? 'Réduire' : 'Détails'}
                      </button>
                      {a.cvLink && (
                        <a
                          href={a.cvLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-2 py-1 border border-indigo-300 text-indigo-600 rounded hover:bg-indigo-50 text-center transition"
                        >
                          CV
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteApplicant(a.email)}
                        disabled={deletingEmail === a.email}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded disabled:opacity-50 hover:bg-red-700 transition"
                      >
                        {deletingEmail === a.email ? '...' : 'Retirer'}
                      </button>
                    </div>
                  </div>

                  {/* Détails scores expandables */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2">
                      <div className="text-xs font-medium text-slate-500 mb-2">Détail des scores</div>
                      <ScoreBar label="Compétences (40%)" value={a.skillsScore} />
                      <ScoreBar label="Expérience (25%)" value={a.experienceScore} />
                      <ScoreBar label="Niveau (20%)" value={a.levelScore} />
                      <ScoreBar label="Formation (15%)" value={a.educationScore} />
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
                        <span className="text-slate-500">Score total pondéré</span>
                        <span className={`font-bold text-sm ${scoreColor}`}>{score} / 100</span>
                      </div>
                      {a.appliedAt && (
                        <div className="text-xs text-slate-400">
                          Postulé le {new Date(a.appliedAt).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

      </div>
    </div>
  );
}