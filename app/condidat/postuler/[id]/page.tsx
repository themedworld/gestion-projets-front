'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function ApplyPage() {
  const params = useParams();
  const postId = params?.id as string;
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [resumeBlob, setResumeBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isCheckingBlob, setIsCheckingBlob] = useState(true);

  // =========================
  // CHECK FOR BLOB IN LOCALSTORAGE ON MOUNT
  // =========================
  useEffect(() => {
    const checkForBlob = async () => {
      try {
        const blobUrl = localStorage.getItem('resumeBlobUrl');
        if (blobUrl) {
          // Fetch le blob depuis l'URL
          const response = await fetch(blobUrl);
          if (response.ok) {
            const blob = await response.blob();
            setResumeBlob(blob);
            // Optionnel : nettoyer le localStorage après récupération
            // localStorage.removeItem('resumeBlobUrl');
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du blob:', err);
      } finally {
        setIsCheckingBlob(false);
      }
    };

    checkForBlob();
  }, []);

  // =========================
  // VALIDATION
  // =========================
  const validateFile = (f: File | Blob): string | null => {
    const allowed = ['application/pdf'];
    if (!allowed.includes(f.type)) return 'Seuls les fichiers PDF sont acceptés';
    if (f.size > MAX_FILE_SIZE) return 'Fichier trop volumineux (max 15 Mo)';
    return null;
  };

  // =========================
  // EXTRACT PDF TEXT (client-side via pdfjs-dist)
  // =========================
  const extractPdfText = async (f: File | Blob): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');

    const workerUrl = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url,
    ).toString();
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

    const arrayBuffer = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }

    return text.trim();
  };

  // =========================
  // SUBMIT — ordre : extract → upload → score → apply
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setScore(null);
    setUploadedUrl(null);

    try {
      // ── Guards ──────────────────────────────────────────
      if (!formData.name || !formData.email) {
        throw new Error('Veuillez remplir les champs obligatoires (nom et email)');
      }

      // Utiliser le blob du CV créé OU le fichier uploadé
      const cvToProcess = resumeBlob || file;
      if (!cvToProcess) throw new Error('Veuillez joindre un CV en PDF');

      const fileError = validateFile(cvToProcess);
      if (fileError) throw new Error(fileError);

      // ── ÉTAPE 1 : Extraire le texte du CV ───────────────
      const cvText = await extractPdfText(cvToProcess);
      if (!cvText) throw new Error("Impossible d'extraire le texte du CV");

      // ── ÉTAPE 2 : Upload vers Cloudinary (via route API) ─
      const uploadData = new FormData();
      uploadData.append('file', cvToProcess, 'resume.pdf');
      uploadData.append('postId', postId);
      uploadData.append('name', formData.name);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || 'Erreur lors de l\'upload du CV');

      const cvLink: string = uploadJson.secure_url;
      setUploadedUrl(cvLink);

      // ── ÉTAPE 3 : Récupérer les infos du post ────────────
      const postRes = await fetch(
        `${process.env.NEXT_PUBLIC_NEST_API_URL}/posts/${postId}`,
      );
      const post = await postRes.json();
      if (!postRes.ok) throw new Error('Impossible de récupérer les détails du poste');

      // ── ÉTAPE 4 : Calculer le score via Render ───────────
      const scoreRes = await fetch('https://concditascore.onrender.com/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: post.title,
          job_text: post.description,
          job_keywords: post.keywords ?? [],
          cv_text: cvText,
        }),
      });

      const scoreJson = await scoreRes.json();
      if (!scoreRes.ok) throw new Error(scoreJson.detail || 'Erreur lors du calcul du score');

      const finalScore: number = scoreJson.final_score_percent;
      setScore(finalScore);

      // ── ÉTAPE 5 : Soumettre la candidature à NestJS ──────
      const applyRes = await fetch(
        `${process.env.NEXT_PUBLIC_NEST_API_URL}/posts/${postId}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            cvLink,
            score: finalScore,
          }),
        },
      );

      const applyJson = await applyRes.json();
      if (!applyRes.ok) {
        throw new Error(applyJson.message || 'Erreur lors de l\'envoi de la candidature');
      }

      alert('✅ Candidature envoyée avec succès !');
      
      // Nettoyer localStorage après succès
      localStorage.removeItem('resumeBlobUrl');
      localStorage.removeItem('resumeFileName');
      
      // Optionnel : rediriger vers une page de confirmation
      // router.push('/success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingBlob) {
    return (
      <div className="min-h-screen bg-gray-100 py-10 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-6">Postuler à l'offre</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nom complet *"
            required
            className="w-full border p-3 rounded"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email *"
            required
            className="w-full border p-3 rounded"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <input
            type="tel"
            placeholder="Téléphone"
            className="w-full border p-3 rounded"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-600">
                CV en PDF * (max 15 Mo)
              </label>
              {!resumeBlob && (
                <button
                  type="button"
                  onClick={() => {
                    // Stocker le postId avant de naviguer
                    sessionStorage.setItem('applyPostId', postId);
                    router.push(`/condidat/postuler/${postId}/resume-builder`);
                  }}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  ✏️ Créer mon CV
                </button>
              )}
            </div>

            {resumeBlob ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                <span className="text-green-700 font-medium">✓ CV créé détecté</span>
                <button
                  type="button"
                  onClick={() => {
                    setResumeBlob(null);
                    setFile(null);
                    localStorage.removeItem('resumeBlobUrl');
                  }}
                  className="text-sm text-green-600 hover:underline"
                >
                  Changer
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="w-full border p-3 rounded"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (!file && !resumeBlob)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded font-medium transition-colors"
          >
            {loading ? 'Traitement en cours...' : 'Envoyer la candidature'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full border py-3 rounded hover:bg-gray-50 transition-colors"
          >
            Retour
          </button>
        </form>

        {score !== null && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            Score de compatibilité CV : <b className="text-green-700">{score}%</b>
          </div>
        )}

        {uploadedUrl && (
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-blue-600 underline text-sm"
          >
            📄 Voir le CV uploadé
          </a>
        )}
      </div>
    </div>
  );
}
