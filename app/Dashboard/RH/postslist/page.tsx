'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ── Types complets selon le schema backend ──────────────────

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

  // Expérience
  experienceDescription?: string;
  minYearsExperience?: number;
  maxYearsExperience?: number;

  // Formation
  educationDescription?: string;
  minYearsEducation?: number;

  // Compétences
  requiredSkills?: string[];
  preferredSkills?: string[];
  skillsDescription?: string;

  // Niveau
  requiredLevel?: string;
  levelDescription?: string;

  // Tags & Keywords
  keywords?: string[];
  tags?: string[];

  // Métadonnées
  isActive?: boolean;
  createdById?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;

  // Statistiques candidats
  applicants?: Applicant[];
  applicantsCount?: number;
  matchedApplicantsCount?: number;
  score?: number; // score moyen des candidats
};

const LEVEL_COLOR: Record<string, string> = {
  'Junior': 'bg-green-50 text-green-700 border-green-200',
  'Intermédiaire': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Senior/Expert': 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'applicants'>('date');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('access_token') || localStorage.getItem('token')
          : null;
        const res = await fetch(`${base}/posts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur API ${res.status}: ${text}`);
        }
        const data: Post[] = await res.json();
        setPosts(data);
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [base]);

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette offre ? Cette action est irréversible.')) return;

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token')
      : null;
    if (!token) { alert('Vous devez être connecté.'); return; }

    const prev = posts;
    setDeletingId(id);
    setPosts(p => p.filter(x => x._id !== id));

    try {
      const res = await fetch(`${base}/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setPosts(prev);
        const text = await res.text();
        throw new Error(`Erreur suppression ${res.status}: ${text}`);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = posts.filter(p => {
      // filtre texte
      if (q) {
        const inTitle = p.title?.toLowerCase().includes(q);
        const inDesc = p.description?.toLowerCase().includes(q);
        const inKeywords = (p.keywords || []).some(k => k.toLowerCase().includes(q));
        const inSkills = (p.requiredSkills || []).some(s => s.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inKeywords && !inSkills) return false;
      }
      // filtre niveau
      if (filterLevel !== 'all' && p.requiredLevel !== filterLevel) return false;
      return true;
    });

    if (sortBy === 'score') list = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else if (sortBy === 'applicants') list = [...list].sort((a, b) => (b.applicantsCount ?? 0) - (a.applicantsCount ?? 0));
    else list = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return list;
  }, [posts, query, sortBy, filterLevel]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* ── Header ── */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">Offres d'emploi</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Chargement...' : `${total} offre${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => router.push('/Dashboard/RH/postslist/createpost')}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          + Créer une offre
        </button>
      </header>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          placeholder="Rechercher titre, description, compétence..."
          className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={filterLevel}
          onChange={e => { setFilterLevel(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Tous les niveaux</option>
          <option value="Junior">Junior</option>
          <option value="Intermédiaire">Intermédiaire</option>
          <option value="Senior/Expert">Senior/Expert</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="date">Trier par date</option>
          <option value="score">Trier par score</option>
          <option value="applicants">Trier par candidats</option>
        </select>
      </div>

      {/* ── États ── */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          Chargement des offres...
        </div>
      )}
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* ── Liste ── */}
      <div className="space-y-4">
        {!loading && pageItems.length === 0 && (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 text-center">
            Aucune offre trouvée.
          </div>
        )}

        {pageItems.map(post => (
          <article key={post._id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start gap-4">

              {/* ── Infos principales ── */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-base font-semibold text-slate-800">{post.title}</h2>
                  {post.requiredLevel && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLOR[post.requiredLevel] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {post.requiredLevel}
                    </span>
                  )}
                  {post.isActive
                    ? <span className="text-xs text-green-600 font-medium">● Actif</span>
                    : <span className="text-xs text-red-500 font-medium">● Inactif</span>}
                </div>

                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {post.description}
                </p>

                {/* Expérience & formation */}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  {(post.minYearsExperience !== undefined || post.maxYearsExperience !== undefined) && (
                    <span>
                      💼 Exp : {post.minYearsExperience ?? 0}
                      {post.maxYearsExperience ? `–${post.maxYearsExperience}` : '+'} ans
                    </span>
                  )}
                  {post.minYearsEducation !== undefined && post.minYearsEducation > 0 && (
                    <span>🎓 Formation : {post.minYearsEducation}+ ans</span>
                  )}
                </div>

                {/* Skills requis */}
                {(post.requiredSkills?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.requiredSkills!.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full">
                        {s}
                      </span>
                    ))}
                    {(post.preferredSkills?.length ?? 0) > 0 && post.preferredSkills!.map((s, i) => (
                      <span key={`p-${i}`} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Keywords */}
                {(post.keywords?.length ?? 0) > 0 && (
                  <div className="mt-1 text-xs text-slate-400">
                    🏷️ {post.keywords!.join(', ')}
                  </div>
                )}

                <div className="mt-1 text-xs text-slate-400">
                  Créé : {post.createdAt ? new Date(post.createdAt).toLocaleDateString('fr-FR') : '—'}
                </div>
              </div>

              {/* ── Stats ── */}
              <div className="flex flex-col items-end gap-2 shrink-0 text-right">
                <div className="text-2xl font-bold text-indigo-600">{post.score ?? 0}</div>
                <div className="text-xs text-slate-400">score moyen</div>
                <div className="text-xs text-slate-600">
                  <div>{post.applicantsCount ?? post.applicants?.length ?? 0} candidat(s)</div>
                  {(post.matchedApplicantsCount ?? 0) > 0 && (
                    <div className="text-green-600 font-medium">{post.matchedApplicantsCount} ≥ 70%</div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <footer className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {post.tags && post.tags.length > 0 && (
                  <span>{post.tags.join(' · ')}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/Dashboard/RH/postslist/${post._id}/details`)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                >
                  Détails
                </button>
                <button
                  onClick={() => router.push(`/Dashboard/RH/postslist/${post._id}/applicants`)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                >
                  Candidats ({post.applicantsCount ?? post.applicants?.length ?? 0})
                </button>
                <button
                  onClick={() => router.push(`/Dashboard/RH/postslist/${post._id}/editpost`)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  disabled={deletingId === post._id}
                  className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg disabled:opacity-50 hover:bg-red-700 transition"
                >
                  {deletingId === post._id ? '...' : 'Supprimer'}
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>

      {/* ── Pagination ── */}
      {!loading && total > perPage && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="text-slate-500">
            {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} sur {total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              ← Préc
            </button>
            <span className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600">
              {page} / {pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Suiv →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}