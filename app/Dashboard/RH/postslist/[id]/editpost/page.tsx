// pages/posts/edit/[id].tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

type CreatePostDto = {
  title: string;
  description: string;
  keywords?: string[];
  isActive?: boolean;
};

type Post = {
  _id: string;
  title: string;
  description: string;
  keywords?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function EditPostPage() {
  const params = useParams() as { id?: string };
  const id = params?.id ?? '';
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState(''); // comma separated
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
        const res = await fetch(`${base}/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur API ${res.status}: ${text}`);
        }
        const data: Post = await res.json();
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');
        setKeywords((data.keywords || []).join(', '));
        setIsActive(data.isActive ?? true);
      } catch (err: any) {
        console.error('fetch post error', err);
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, base]);

  const validate = (): string | null => {
    if (!title.trim()) return 'Le titre est requis.';
    if (!description.trim()) return 'La description est requise.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    const dto: CreatePostDto = {
      title: title.trim(),
      description: description.trim(),
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      isActive,
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
    if (!token) {
      setError('Vous devez être connecté pour modifier une offre.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${base}/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const msg = payload?.message || `Erreur serveur ${res.status}`;
        throw new Error(msg);
      }
      const updated = await res.json();
      router.push(`/posts/${updated._id ?? updated.id ?? id}`);
    } catch (err: any) {
      console.error('update error', err);
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.push(`/posts/${id}`);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error && !saving) {
    // show form even if error occurred while loading? we show error and allow retry
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Modifier l'offre</h1>

      {error && <div className="mb-4 text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Titre</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Titre de l'offre"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2 min-h-[140px]"
            placeholder="Description complète du poste"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mots-clés (séparés par des virgules)</label>
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="nodejs, nestjs, mongodb"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            <span>Actif</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border rounded"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
