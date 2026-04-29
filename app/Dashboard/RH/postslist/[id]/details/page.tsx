// pages/posts/[id].tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

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

type UserSummary = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  companyId?: string;
};

export default function PostDetailPage() {
  const params = useParams() as { id?: string };
  const id = params?.id ?? '';
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [creator, setCreator] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingApplicantEmail, setDeletingApplicantEmail] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
        // 1) fetch post
        const res = await fetch(`${base}/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur API ${res.status}: ${text}`);
        }
        const data: Post = await res.json();
        setPost(data);

        // 2) fetch creator info si createdById présent
        if (data.createdById) {
          try {
            // adapter l'endpoint selon votre API (ex: /users/:id ou /api/users/:id)
            const uRes = await fetch(`${base}/users/${encodeURIComponent(String(data.createdById))}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (uRes.ok) {
              const u = await uRes.json();
              setCreator({
                id: u._id ?? u.id ?? String(data.createdById),
                name: u.name ?? u.fullName ?? u.email,
                email: u.email,
                role: u.role,
                companyId: u.companyId ?? undefined,
              });
            } else {
              // si l'endpoint n'existe pas ou renvoie 404, on ignore silencieusement
              setCreator({ id: String(data.createdById) });
            }
          } catch (e) {
            // ignore fetch creator error
            setCreator({ id: String(data.createdById) });
          }
        } else {
          setCreator(null);
        }
      } catch (err: any) {
        console.error('fetch post error', err);
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, base]);

  const handleDeletePost = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette offre ?')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
    if (!token) {
      alert('Vous devez être connecté pour supprimer.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${base}/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur suppression ${res.status}: ${text}`);
      }
      router.push('/posts');
    } catch (err: any) {
      console.error('delete post error', err);
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/posts/edit/${id}`);
  };

  const handleDeleteApplicant = async (email: string) => {
    if (!confirm(`Supprimer le candidat ${email} ?`)) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
    if (!token) {
      alert('Vous devez être connecté pour supprimer un candidat.');
      return;
    }
    setDeletingApplicantEmail(email);
    try {
      const res = await fetch(`${base}/posts/${id}/applicants/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur suppression ${res.status}: ${text}`);
      }
      // refresh post
      const updated = await fetch(`${base}/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).then(r => r.json());
      setPost(updated);
    } catch (err: any) {
      console.error('delete applicant error', err);
      alert(err.message || 'Erreur lors de la suppression du candidat');
    } finally {
      setDeletingApplicantEmail(null);
    }
  };

  const initials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">Erreur: {error}</div>;
  if (!post) return <div className="p-6">Offre introuvable.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{post.title}</h1>
          <div className="text-sm text-gray-500 mt-1">
            Créé: {post.createdAt ? new Date(post.createdAt).toLocaleString() : '—'} • Score: {post.score ?? 0}
          </div>

          {/* Créateur */}
          {creator && (
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                {initials(creator.name ?? creator.email)}
              </div>
              <div>
                <div className="font-medium">{creator.name ?? `User ${creator.id}`}</div>
                <div className="text-xs text-gray-500">{creator.email ?? ''}{creator.role ? ` • ${creator.role}` : ''}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={handleEdit} className="px-3 py-1 border rounded">Modifier</button>
          <button
            onClick={handleDeletePost}
            disabled={deleting}
            className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </header>

      <section className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
        <p className="text-gray-800 whitespace-pre-wrap">{post.description}</p>

        <div className="mt-4 text-sm text-gray-600">
          <div>Mots-clés: {post.keywords?.join(', ') || '—'}</div>
          <div>Company: {post.companyId ?? '—'}</div>
          <div className="mt-1">Status: {post.isActive ? <span className="text-green-600">Actif</span> : <span className="text-red-600">Inactif</span>}</div>
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-medium mb-3">Personnes ayant postulé ({post.applicants?.length ?? 0})</h3>

        {(!post.applicants || post.applicants.length === 0) && (
          <div className="text-sm text-gray-600">Aucun candidat pour le moment.</div>
        )}

        <ul className="space-y-3">
          {post.applicants?.map((a) => (
            <li key={a.email} className="border rounded p-3 flex items-start justify-between gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
                  {initials(a.name)}
                </div>
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-600">{a.email}{a.phone ? ` • ${a.phone}` : ''}</div>
                  {a.cvLink && (
                    <div className="mt-1 text-xs">
                      <a href={a.cvLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Voir CV</a>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-gray-500">Score: {a.score ?? 0} • Postulé: {a.appliedAt ? new Date(a.appliedAt).toLocaleString() : '—'}</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <a href={`mailto:${a.email}`} className="text-sm text-indigo-600 hover:underline">Contacter</a>
                <button
                  onClick={() => handleDeleteApplicant(a.email)}
                  disabled={deletingApplicantEmail === a.email}
                  className="px-2 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50"
                >
                  {deletingApplicantEmail === a.email ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
