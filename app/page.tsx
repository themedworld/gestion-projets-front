import Header from './component/header';
import Image from 'next/image';
import { ArrowRight, Play, TrendingUp, Zap, Shield } from 'lucide-react';
import { Link } from 'lucide-react';
export default function Home() {
  return (
    // h-screen force la page à faire exactement la taille de la fenêtre (sur desktop)
    <div className="relative min-h-screen lg:h-screen bg-slate-900 text-white overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* --- ARRIÈRE-PLAN --- */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
          alt="Abstract Data"
          fill
          className="object-cover opacity-40 scale-105"
          priority
        />
        {/* Dégradé radial pour focus sur le centre */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/600 to-slate-900/400"></div>
      </div>

      {/* --- HEADER (Position absolue pour gagner de l'espace) --- */}
  
      {/* 1. LE HEADER : Placez-le seul ici. 
          Il est déjà "fixed" et contient son propre Logo + Navigation */}
      <Header /> 



      {/* --- CONTENU PRINCIPAL (Centré verticalement) --- */}
      <main className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 lg:px-24 pt-20 lg:pt-0">
        
        <div className="grid lg:grid-cols-12 gap-12 items-center w-full max-w-7xl mx-auto">
          
          {/* COLONNE GAUCHE : Texte Impactant */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium tracking-wide">
              V2.0 MAINTENANT DISPONIBLE
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              La donnée complexe, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                enfin simplifiée.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
              DataPilot transforme vos flux bruts en décisions claires. 
              Connectez vos outils, visualisez l'essentiel, agissez plus vite.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
              href="/login"
             
            >
              <button className="group flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)]">
                Essayer gratuitement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              </Link>
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-medium">
                <Play className="w-4 h-4 fill-current" />
                Démo (1min)
              </button>
            </div>
            
            {/* Mini Footer intégré dans la gauche */}
            <p className="text-xs text-slate-500 pt-8 flex gap-6">
                <span>© 2024 DataPilot</span>
                <a href="#" className="hover:text-blue-400 transition-colors">Confidentialité</a>
                <a href="#" className="hover:text-blue-400 transition-colors">Support</a>
            </p>
          </div>

          {/* COLONNE DROITE : Visuel "Dashboard" Flottant */}
          <div className="lg:col-span-5 relative hidden lg:block">
            {/* Carte principale Glassmorphism */}
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-1 hover:rotate-0 transition-all duration-500">
                
                {/* En-tête fausse fenêtre */}
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <div className="text-xs text-slate-400">Dashboard Q4</div>
                </div>

                {/* Contenu condensé (Features) */}
      <div className="space-y-4">

  {/* KPI 1 */}
  <div className="flex items-center justify-between p-4 bg-slate-900/70 rounded-lg border border-slate-800">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-400">
        <TrendingUp size={18} />
      </div>
      <div>
        <div className="text-sm font-medium text-slate-200">
          Taux de performance
        </div>
        <div className="text-xs text-slate-500">
          Variation trimestrielle
        </div>
      </div>
    </div>
    <span className="text-lg font-semibold text-emerald-400">
      +24 %
    </span>
  </div>

  {/* KPI 2 */}
  <div className="flex items-center justify-between p-4 bg-slate-900/70 rounded-lg border border-slate-800">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-500/10 rounded-md text-blue-400">
        <Zap size={18} />
      </div>
      <div>
        <div className="text-sm font-medium text-slate-200">
          Temps de traitement
        </div>
        <div className="text-xs text-slate-500">
          Moyenne par requête
        </div>
      </div>
    </div>
    <span className="text-lg font-semibold">
      0,4 s
    </span>
  </div>

  {/* KPI 3 */}
  <div className="flex items-center justify-between p-4 bg-slate-900/70 rounded-lg border border-slate-800">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-500/10 rounded-md text-blue-400">
        <Shield size={18} />
      </div>
      <div>
        <div className="text-sm font-medium text-slate-200">
          Sécurité des données
        </div>
        <div className="text-xs text-slate-500">
          Conformité & chiffrement
        </div>
      </div>
    </div>
    <span className="text-sm font-medium text-slate-300">
      AES-256 / TLS 1.3
    </span>
  </div>

</div>

            
            {/* Élément décoratif arrière */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-20 -z-10"></div>
          </div>
</div>
        </div>
      </main>
    </div>
  );
}