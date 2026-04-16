"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UserPlus, ArrowLeft, Mail, User, Phone, 
  Lock, Shield, Building2, Loader2, CheckCircle2,
  Eye, EyeOff 
} from "lucide-react";

enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_COMPANY = 'admin_company',
  MANAGER = 'manager',
  PROJECT_MANAGER = 'project_manager',
  MEMBER = 'member',
}

export default function CreateUserPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    fullname: "",
    numtel: "",
    password: "",
    role: UserRole.MEMBER,
    companyId: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    
    // If Super Admin, fetch all companies
    if (user.role === "super_admin") {
      fetchCompanies();
    } else if (user.companyId) {
      // For non-super admins, auto-set their company
      setFormData(prev => ({ ...prev, companyId: user.companyId }));
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCompanies(data);
    } catch (err) {
      console.error("Erreur chargement sociétés", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      
      // Determine companyId based on user role
      const companyId = currentUser?.role === "super_admin" 
        ? (formData.companyId ? Number(formData.companyId) : undefined)
        : currentUser?.companyId;

      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          companyId: companyId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la création");
      }

      setSuccess(true);
      setTimeout(() => router.push("/Dashboard/users"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Style commun pour les inputs
  const inputStyle = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200";
  const labelStyle = "text-sm font-bold text-slate-600 flex items-center gap-2 mb-1";

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Bouton Retour */}
      <button 
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 font-medium"
      >
        <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
          <ArrowLeft size={18} />
        </div>
        Retour à la liste
      </button>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-10 text-white">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/40 backdrop-blur-sm">
              <UserPlus className="text-blue-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nouvel Utilisateur</h1>
              <p className="text-slate-400 mt-1 font-medium">Configurez les accès de votre futur collaborateur</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl text-sm flex items-center gap-3 font-medium animate-bounce">
              <CheckCircle2 size={20} />
              Utilisateur créé avec succès ! Redirection en cours...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Société (Visible seulement pour Super Admin) */}
            {currentUser?.role === "super_admin" && (
              <div className="space-y-1 animate-in fade-in slide-in-from-left-2 md:col-span-2">
                <label className={labelStyle}>
                  <Building2 size={15} className="text-blue-500" /> Société rattachée
                </label>
                <select
                  required
                  className={`${inputStyle} appearance-none cursor-pointer`}
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                >
                  <option value="">Sélectionner une entreprise</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Affichage de la société pour non-Super Admin */}
            {currentUser?.role !== "super_admin" && currentUser?.companyName && (
              <div className="space-y-1 md:col-span-2">
                <label className={labelStyle}>
                  <Building2 size={15} className="text-blue-500" /> Société rattachée
                </label>
                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-medium flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" />
                  {currentUser?.companyName}
                </div>
                <p className="text-xs text-slate-400">Automatiquement assignée à votre entreprise</p>
              </div>
            )}

            {/* Nom Complet */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <User size={15} className="text-blue-500" /> Nom complet
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Jean Dupont"
                className={inputStyle}
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <Mail size={15} className="text-blue-500" /> Email professionnel
              </label>
              <input
                required
                type="email"
                placeholder="jean@entreprise.com"
                className={inputStyle}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <Phone size={15} className="text-blue-500" /> Numéro de téléphone
              </label>
              <input
                required
                type="tel"
                placeholder="+216 -- --- ---"
                className={inputStyle}
                value={formData.numtel}
                onChange={(e) => setFormData({ ...formData, numtel: e.target.value })}
              />
            </div>

            {/* Mot de passe avec Toggle */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <Lock size={15} className="text-blue-500" /> Mot de passe
              </label>
              <div className="relative group">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`${inputStyle} pr-12`}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Rôle */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <Shield size={15} className="text-blue-500" /> Attribution du rôle
              </label>
              <div className="relative">
                <select
                  className={`${inputStyle} appearance-none cursor-pointer`}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  {currentUser?.role === "super_admin" && <option value={UserRole.SUPER_ADMIN}>Super Administrateur</option>}
                  <option value={UserRole.ADMIN_COMPANY}>Admin Société</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.PROJECT_MANAGER}>Chef de projet</option>
                  <option value={UserRole.MEMBER}>Membre standard</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Shield size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium italic">
              * Tous les champs sont obligatoires pour la création du compte.
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button
                disabled={loading}
                type="submit"
                className="flex-1 sm:flex-none px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200 focus:ring-4 focus:ring-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                {loading ? "Traitement..." : "Confirmer la création"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}