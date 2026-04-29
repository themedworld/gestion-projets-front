// pages/posts/create.tsx
"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";

type CreatePostDto = {
  title: string;
  description: string;
  keywords?: string[];
  isActive?: boolean;
};

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState(''); // comma separated
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  const validate = (): string | null => {
    if (!title.trim()) return 'Le titre est requis.';
    if (!description.trim()) return 'La description est requise.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const dto: CreatePostDto = {
      title: title.trim(),
      description: description.trim(),
      keywords: keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean),
      isActive,
    };

    const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null;
    if (!token) {
      setError('Vous devez être connecté pour créer une offre.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${base}/posts`, {
        method: 'POST',
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

      const created = await res.json();
      setSuccess('Offre créée avec succès.');
      // rediriger vers la page détail ou la liste
      router.push('/Dashboard/RH/postslist');
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Créer une offre d'emploi</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>}
        {success && <div className="text-sm text-green-700 bg-green-50 p-2 rounded">{success}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Titre</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: Développeur Node.js"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2 min-h-[140px]"
            placeholder="Détails du poste, responsabilités, compétences requises..."
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
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
          >
            {loading ? 'Création...' : 'Créer l’offre'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/Dashboard/RH/postslist')}
            className="px-4 py-2 border rounded"
          >
            Annuler
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        **Remarque**: le token JWT doit être présent dans `localStorage` sous `access_token` ou `token`.
      </p>
    </div>
  );
}
