"use client";
import { Provider } from "react-redux";
import { store } from "@/condidat/resume/lib/redux/store";
import { ResumeForm } from "@/condidat/resume/components/ResumeForm";
import { Resume } from "@/condidat/resume/components/Resume";
import { ResumeDropzone } from "@/condidat/resume/components/importimg";
import { useState } from "react";
import { useRouter, useParams } from 'next/navigation';

export default function Create() {
    const params = useParams();
    const [imageUrl, setImageUrl] = useState("");
    const postId = params?.id as string;
    const router = useRouter();

    return (
        <Provider store={store}>
            <main className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-teal-50 overflow-hidden">
                {/* ── Decorative Elements ── */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
                    <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
                </div>

                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
                    <div className="max-w-full mx-auto px-4 md:px-6 py-4 md:py-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.back()}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                                >
                                    <svg className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                        Créer votre CV
                                    </h1>
                                    <p className="text-xs md:text-sm text-gray-500 font-medium">Construisez un CV professionnel</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-gray-600">Édition en cours</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Main Content ── */}
                <div className="relative max-w-full px-3 md:px-4 py-6 md:py-8 z-10 h-[calc(100vh-120px)]">
                    {/* Grid Layout - Équilibré 1:1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 h-full">
                        
                        {/* Left Column: Form - SCROLLABLE */}
                        <div className="flex flex-col h-full overflow-y-auto pr-2">
                            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                                
                                {/* Form Header */}
                                <div className="mb-6 pb-6 border-b border-gray-200">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Vos informations</h2>
                                            <p className="text-sm text-gray-600 mt-1">Complétez votre profil professionnel</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dropzone Card */}
                                <div className="mb-8 p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-dashed border-teal-300 rounded-xl hover:border-teal-500 transition-colors">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Photo de profil</h3>
                                            <p className="text-xs text-gray-600 mt-1">JPG, PNG (Recommandé: carré 200x200px)</p>
                                        </div>
                                    </div>
                                    <ResumeDropzone onFileUrlChange={setImageUrl} />
                                </div>

                                {/* Info Banner */}
                                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 8a1 1 0 000 2h6a1 1 0 100-2H8zm1 5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-900 text-sm mb-1">💡 Conseil</p>
                                        <p className="text-xs text-blue-800">Remplissez tous les champs pour maximiser vos chances. Une photo professionnelle augmente votre visibilité.</p>
                                    </div>
                                </div>

                                {/* Form Card */}
                                <div className="space-y-6">
                                    <div className="border-t border-gray-200 pt-6">
                                        <ResumeForm imageUrl={imageUrl} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Preview - FIXED et RESPONSIVE */}
                        <div className="h-full flex flex-col sticky top-[120px] max-h-[calc(100vh-120px)]">
                            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                                
                                {/* Preview Header - STICKY */}
                                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between z-40 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-white">Aperçu du CV</h3>
                                    </div>
                                    <div className="text-xs text-white/80 font-medium">Mise à jour en direct</div>
                                </div>

                                {/* Preview Content - SCROLLABLE INTERNE */}
                                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-gradient-to-b from-white via-white to-gray-50">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-full">
                                            <Resume imageUrl={imageUrl} postId={postId} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    @keyframes blob {
                        0%, 100% {
                            transform: translate(0, 0) scale(1);
                        }
                        33% {
                            transform: translate(30px, -50px) scale(1.1);
                        }
                        66% {
                            transform: translate(-20px, 20px) scale(0.9);
                        }
                    }
                    
                    .animate-blob {
                        animation: blob 7s infinite;
                    }
                    
                    .animation-delay-2000 {
                        animation-delay: 2s;
                    }
                    
                    .animation-delay-4000 {
                        animation-delay: 4s;
                    }
                `}</style>
            </main>
        </Provider>
    );
}