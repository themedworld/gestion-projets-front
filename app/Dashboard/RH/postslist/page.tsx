// pages/posts/index.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type Applicant = {
  name: string;
  email: string;
  phone?: string;
  cvLink?: string;
  score?: number;
  appliedAt?: string;
};

type Post = {
  _id: string;
  title: string;
  description: string;
  keywords?: string[];
  isActive?: boolean;
  applicants?: Applicant[];
  createdById?: string;
  companyId?: string;
  score?: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
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
        console.error('fetch posts error', err);
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [base]);

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Voulez-vous vraiment supprimer cette offre ? Cette action est irréversible.');
    if (!confirmDelete) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
    if (!token) {
      alert('Vous devez être connecté pour supprimer une offre.');
      return;
    }

    // Optimistic UI update
    const prev = posts;
    setDeletingId(id);
    setPosts(p => p.filter(x => x._id !== id));

    try {
      const res = await fetch(`${base}/posts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        // rollback
        setPosts(prev);
        const text = await res.text();
        throw new Error(`Erreur suppression ${res.status}: ${text}`);
      }
      // optionally show a toast / message
    } catch (err: any) {
      console.error('delete error', err);
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: string) => {
    // redirige vers une page d'édition (à créer : pages/posts/edit/[id].tsx)
    router.push(`/Dashboard/RH/postslist/${id}/editpost`);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = posts.filter(p => {
      if (!q) return true;
      const inTitle = p.title?.toLowerCase().includes(q);
      const inDesc = p.description?.toLowerCase().includes(q);
      const inKeywords = (p.keywords || []).some(k => k.toLowerCase().includes(q));
      return inTitle || inDesc || inKeywords;
    });
    if (sortBy === 'score') {
      list = list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else {
      list = list.sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()));
    }
    return list;
  }, [posts, query, sortBy]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Offres d'emploi</h1>
          <p className="text-sm text-gray-600">Liste des posts récupérés depuis l'API.</p>
        </div>
        <div>
          <a
            href="/posts/create"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Créer une offre
          </a>
        </div>
      </header>

      <div className="flex gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Rechercher titre, description ou mot-clé..."
          className="flex-1 border rounded px-3 py-2"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border rounded px-3 py-2">
          <option value="score">Trier par score</option>
          <option value="date">Trier par date</option>
        </select>
      </div>

      {loading && <div className="p-4">Chargement...</div>}
      {error && <div className="p-4 text-red-600">Erreur: {error}</div>}

      <div className="grid gap-4">
        {!loading && pageItems.length === 0 && <div className="p-4 bg-yellow-50 border rounded">Aucun post trouvé.</div>}

        {pageItems.map(post => (
          <article key={post._id} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-lg font-medium">{post.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{post.description?.slice(0, 220)}{post.description && post.description.length > 220 ? '…' : ''}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <span className="mr-3">Mots-clés: {post.keywords?.join(', ') || '—'}</span>
                  <span>Créé: {post.createdAt ? new Date(post.createdAt).toLocaleString() : '—'}</span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-3">
                <div className="text-sm text-gray-500">Score</div>
                <div className="text-2xl font-bold text-indigo-600">{post.score ?? 0}</div>
                <div className="mt-3 text-xs text-gray-600 text-right">
                  <div>Applicants: {post.applicants?.length ?? 0}</div>
                  <div className="mt-1">{post.isActive ? <span className="text-green-600">Actif</span> : <span className="text-red-600">Inactif</span>}</div>
                </div>
              </div>
            </div>

            <footer className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div>Company: {post.companyId ?? '—'}</div>
              <div className="flex items-center gap-2">
                <a href={`/Dashboard/RH/postslist/${post._id}/details`} className="text-indigo-600 hover:underline px-2 py-1 border rounded">Détails</a>
                <button
                  onClick={() => handleEdit(post._id)}
                  className="px-2 py-1 border rounded hover:bg-gray-50"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  disabled={deletingId === post._id}
                  className="px-2 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                >
                  {deletingId === post._id ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">Affichage {Math.min((page-1)*perPage+1, total)}–{Math.min(page*perPage, total)} sur {total}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Préc
          </button>
          <div className="px-3 py-1 border rounded">Page {page} / {pages}</div>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Suiv
          </button>
        </div>
      </div>
    </div>
  );
}
