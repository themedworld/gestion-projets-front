'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────

type Post = {
  _id: string;
  title: string;
  description: string;
  requiredLevel?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  minYearsExperience?: number;
  maxYearsExperience?: number;
  minYearsEducation?: number;
  tags?: string[];
  keywords?: string[];
  isActive?: boolean;
  applicantsCount?: number;
  createdAt?: string;
};

// ── Helpers ──────────────────────────────────────────────────

const LEVEL_COLOR: Record<string, string> = {
  Junior: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermédiaire: 'bg-amber-50 text-amber-700 border-amber-200',
  'Senior/Expert': 'bg-violet-50 text-violet-700 border-violet-200',
};

const LEVEL_DOT: Record<string, string> = {
  Junior: 'bg-emerald-400',
  Intermédiaire: 'bg-amber-400',
  'Senior/Expert': 'bg-violet-400',
};

function SkillPill({
  children,
  variant = 'required',
}: {
  children: React.ReactNode;
  variant?: 'required' | 'preferred';
}) {
  return (
    <span
      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
        variant === 'required'
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-sky-50 text-sky-700 border-sky-200'
      }`}
    >
      {children}
    </span>
  );
}

// ── Card ─────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const level = post.requiredLevel;
  const expMin = post.minYearsExperience ?? 0;
  const expMax = post.maxYearsExperience;
  const expLabel = expMax ? `${expMin}–${expMax} ans` : `${expMin}+ ans`;
  const required = post.requiredSkills ?? [];
  const preferred = post.preferredSkills ?? [];
  const visibleRequired = required.slice(0, 4);
  const visiblePreferred = preferred.slice(0, 2);
  const extraRequired = required.length - 4;
  const extraPreferred = preferred.length - 2;

  return (
    <article className="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
      {/* Hover accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {level && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
                    LEVEL_COLOR[level] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[level] ?? 'bg-slate-400'}`}
                  />
                  {level}
                </span>
              )}
              {post.isActive ? (
                <span className="text-[11px] text-emerald-600 font-medium">● Actif</span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">● Clôturé</span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors duration-200">
              {post.title}
            </h2>
          </div>

          {/* Exp badge */}
          <div className="shrink-0 text-right">
            <div className="text-[11px] text-slate-400 mb-0.5">Expérience</div>
            <div className="text-sm font-semibold text-slate-700">{expLabel}</div>
            {post.minYearsEducation !== undefined && (
              <div className="text-[11px] text-slate-400 mt-1">
                Formation {post.minYearsEducation}+ ans
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3">
          {post.description}
        </p>

        {/* Skills */}
        {(required.length > 0 || preferred.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {visibleRequired.map((s, i) => (
              <SkillPill key={`r-${i}`} variant="required">
                {s}
              </SkillPill>
            ))}
            {extraRequired > 0 && (
              <span className="text-[11px] text-slate-400 self-center">+{extraRequired}</span>
            )}
            {visiblePreferred.map((s, i) => (
              <SkillPill key={`p-${i}`} variant="preferred">
                {s}
              </SkillPill>
            ))}
            {extraPreferred > 0 && (
              <span className="text-[11px] text-slate-400 self-center">+{extraPreferred}</span>
            )}
          </div>
        )}

        {/* Tags */}
        {(post.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags!.map((t, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Keywords */}
        {(post.keywords?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.keywords!.map((k, i) => (
              <span
                key={i}
                className="text-[11px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full"
              >
                {k}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
          <div className="flex items-center gap-3 text-[12px] text-slate-400">
            {post.applicantsCount !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {post.applicantsCount} candidat{post.applicantsCount !== 1 ? 's' : ''}
              </span>
            )}
            {post.createdAt && (
              <span>
                {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {post.isActive ? (
            <Link
              href={`/condidat/postuler/${post._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-indigo-200 hover:shadow-md"
            >
              Postuler
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          ) : (
            <span className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-medium rounded-xl cursor-not-allowed">
              Clôturé
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Skeleton ─────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-slate-100 rounded-full w-1/4" />
          <div className="h-4 bg-slate-100 rounded-full w-2/3" />
        </div>
        <div className="h-8 w-16 bg-slate-100 rounded-lg" />
      </div>
      <div className="h-3 bg-slate-100 rounded-full w-full mb-1.5" />
      <div className="h-3 bg-slate-100 rounded-full w-4/5 mb-4" />
      <div className="flex gap-1 mb-4">
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
        <div className="h-5 w-14 bg-slate-100 rounded-full" />
      </div>
      <div className="flex justify-between pt-3 border-t border-slate-100">
        <div className="h-3 w-24 bg-slate-100 rounded-full" />
        <div className="h-8 w-24 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function OffresPubliquesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'closed'>('active');

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${base}/posts`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : (data.data ?? []));
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les offres.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [base]);

  const levels = Array.from(
    new Set(posts.map(p => p.requiredLevel).filter(Boolean))
  ) as string[];

  const filtered = posts.filter(p => {
    if (filterActive === 'active' && !p.isActive) return false;
    if (filterActive === 'closed' && p.isActive) return false;
    if (filterLevel && p.requiredLevel !== filterLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.requiredSkills?.some(s => s.toLowerCase().includes(q)) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.keywords?.some(k => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = posts.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">

      {/* ── Hero ── */}
      <div className="relative bg-white border-b border-slate-200/80 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#e0e7ff_0%,_transparent_60%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            {activeCount} offre{activeCount !== 1 ? 's' : ''} en cours
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Trouvez votre prochaine{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              opportunité
            </span>
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Parcourez nos offres et candidatez directement en quelques minutes.
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Titre, compétence, tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>

          {/* Level filter */}
          {levels.length > 0 && (
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            >
              <option value="">Tous les niveaux</option>
              {levels.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          {/* Active filter */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'active', 'closed'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterActive(v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
                  filterActive === v
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'all' ? 'Tout' : v === 'active' ? 'Actives' : 'Clôturées'}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 ml-auto shrink-0">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-500 text-sm font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-sm border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-500 text-sm">Aucune offre ne correspond à vos critères.</p>
            <button
              onClick={() => { setSearch(''); setFilterLevel(''); setFilterActive('all'); }}
              className="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(post => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}