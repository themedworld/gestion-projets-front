"use client";

import { Users, Leaf, TrendingUp, Activity } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Agriculteurs",
      value: "128",
      icon: Users,
      color: "from-emerald-500 to-green-600",
    },
    {
      title: "Projets actifs",
      value: "24",
      icon: Leaf,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Production",
      value: "+18%",
      icon: TrendingUp,
      color: "from-purple-500 to-fuchsia-600",
    },
    {
      title: "Activité",
      value: "Stable",
      icon: Activity,
      color: "from-orange-500 to-amber-500",
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Titre */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Tableau de bord
        </h1>
        <p className="text-slate-500 text-sm">
          Vue générale de la plateforme
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activité récente */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">
            Activité récente
          </h3>

          <ul className="space-y-3 text-sm text-slate-600">
            <li>🌱 Nouvel agriculteur ajouté</li>
            <li>📊 Rapport mensuel généré</li>
            <li>🚜 Projet agricole mis à jour</li>
            <li>✅ Données validées</li>
          </ul>
        </div>

        {/* Résumé */}
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="font-semibold mb-2">
            Résumé du jour
          </h3>
          <p className="text-sm opacity-90">
            Toutes les opérations fonctionnent normalement.
            Aucun incident détecté.
          </p>
        </div>
      </div>
    </div>
  );
}
