"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Pencil,
} from "lucide-react";

/* ================= TYPES ================= */

interface Company {
  id: number;
  name: string;
}

interface UserType {
  id: number;
  fullname: string;
  email: string;
  role: string;
  company?: Company | null;
  isActive: boolean;
}

/* ================= PAGE ================= */

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_NEST_API_URL}/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Accès refusé ou utilisateur introuvable");
        }

        const data = await res.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500">
        Chargement des détails...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-xl mt-10 rounded-xl bg-red-50 p-6 text-center">
        <XCircle className="mx-auto mb-2 text-red-600" />
        <p className="text-red-700">
          {error || "Utilisateur introuvable"}
        </p>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Détails de l’utilisateur
            </h1>
            <p className="text-sm text-slate-500">
              Informations complètes du compte
            </p>
          </div>
        </div>

        {/* Bouton Modifier */}
        <button
          onClick={() => router.push(`/super-admin/users/${user.id}/edit`)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
        >
          <Pencil size={16} />
          Modifier
        </button>
      </div>

      {/* ===== Card principale ===== */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {/* Header utilisateur */}
        <div className="flex items-center gap-4 p-6 border-b bg-slate-50/50">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
            {user.fullname.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {user.fullname}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Rôle */}
          <div className="flex items-start gap-3">
            <Shield className="text-slate-400 mt-0.5" size={18} />
            <div>
              <p className="text-xs text-slate-500">Rôle</p>
              <p className="font-medium text-slate-800">{user.role}</p>
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-start gap-3">
            {user.isActive ? (
              <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
            ) : (
              <XCircle className="text-rose-600 mt-0.5" size={18} />
            )}
            <div>
              <p className="text-xs text-slate-500">Statut</p>
              <p
                className={`font-medium ${
                  user.isActive
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {user.isActive ? "Actif" : "Inactif"}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="text-slate-400 mt-0.5" size={18} />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium text-slate-800">
                {user.email}
              </p>
            </div>
          </div>

          {/* Société */}
          <div className="flex items-start gap-3">
            <Building2 className="text-slate-400 mt-0.5" size={18} />
            <div>
              <p className="text-xs text-slate-500">Société</p>
              <p className="font-medium text-slate-800">
                {user.company?.name || "Indépendant"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
