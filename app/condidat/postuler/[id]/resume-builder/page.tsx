"use client";
import { Provider } from "react-redux";
import { store } from "@/condidat/resume/lib/redux/store";
import { ResumeForm } from "@/condidat/resume/components/ResumeForm";
import { Resume } from "@/condidat/resume/components/Resume";
import { ResumeDropzone } from "@/condidat/resume/components/importimg";
import { useState } from "react";
import { useRouter, useParams } from 'next/navigation';

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

/* ── Reset & tokens ── */
.cvb * { box-sizing: border-box; margin: 0; padding: 0; }
.cvb {
  --teal:    #14b8a6;
  --teal-d:  #0d9488;
  --teal-l:  #5eead4;
  --cyan:    #06b6d4;
  --cyan-l:  #22d3ee;
  --ink:     #0f172a;
  --ink2:    #334155;
  --muted:   #64748b;
  --light:   #94a3b8;
  --border:  rgba(20,184,166,.18);
  --glass:   rgba(255,255,255,.82);
  --bg:      #f0fdfa;
  font-family: 'Sora', sans-serif;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}

/* ── Background ── */
.cvb-bg {
  position: fixed; inset: 0; z-index: 0; overflow: hidden;
  background: linear-gradient(145deg, #ecfdf5 0%, #f0f9ff 40%, #fafffe 70%, #e0f2fe 100%);
}
/* Mesh blobs */
.cvb-blob {
  position: absolute; border-radius: 50%;
  filter: blur(70px); pointer-events: none;
  mix-blend-mode: multiply;
}
.cvb-blob-1 { width:520px; height:520px; top:-120px; right:-100px; background:rgba(45,212,191,.16); animation: bfloat 9s ease-in-out infinite; }
.cvb-blob-2 { width:400px; height:400px; bottom:-80px; left:-60px;  background:rgba(34,211,238,.13); animation: bfloat 11s ease-in-out infinite reverse; }
.cvb-blob-3 { width:260px; height:260px; top:45%; left:35%;         background:rgba(94,234,212,.10); animation: bfloat 7s  ease-in-out infinite 2s; }
@keyframes bfloat {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(20px,-30px) scale(1.06); }
  66%     { transform: translate(-15px,15px) scale(.96); }
}

/* Dot grid overlay */
.cvb-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(20,184,166,.12) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}

/* ── Top accent bar ── */
.cvb-bar {
  position: fixed; top:0; left:0; right:0; z-index:60;
  height: 3px;
  background: linear-gradient(90deg, #0d9488 0%, #14b8a6 30%, #22d3ee 60%, #06b6d4 100%);
}

/* ── Header ── */
.cvb-header {
  position: fixed; top:3px; left:0; right:0; z-index:50;
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1.5px solid var(--border);
  box-shadow: 0 2px 20px rgba(20,184,166,.07);
}
.cvb-header-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; gap: 12px;
}
@media(min-width:640px){ .cvb-header-inner { padding: 12px 24px; } }

/* Back btn */
.cvb-back {
  width:36px; height:36px; border-radius:10px;
  border: 1.5px solid rgba(20,184,166,.25);
  background: white; cursor: pointer;
  display:flex; align-items:center; justify-content:center;
  transition: all .2s; flex-shrink:0;
  box-shadow: 0 1px 4px rgba(20,184,166,.1);
}
.cvb-back:hover { background: #f0fdfa; border-color: var(--teal); transform: translateX(-2px); }

/* Title */
.cvb-title-wrap { display:flex; flex-direction:column; min-width:0; }
.cvb-eyebrow {
  font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase;
  color: var(--teal-d); line-height:1; margin-bottom:3px;
}
.cvb-title {
  font-size: clamp(15px, 2.5vw, 22px); font-weight:800; line-height:1.1;
  background: linear-gradient(125deg, #0f766e, #0891b2);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Live badge */
.cvb-live {
  display:inline-flex; align-items:center; gap:6px;
  background: linear-gradient(135deg, #0d9488, #06b6d4);
  border-radius:100px; padding:5px 12px;
  font-size:11px; font-weight:700; color:white; flex-shrink:0;
  box-shadow: 0 2px 12px rgba(20,184,166,.3);
}
.cvb-live-dot {
  width:6px; height:6px; border-radius:50%;
  background: #a7f3d0;
  animation: livepulse 1.6s ease-in-out infinite;
}
@keyframes livepulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%     { opacity:.5; transform:scale(.75); }
}

/* ── Layout shell ── */
.cvb-shell {
  position: relative; z-index:10;
  padding-top: 63px; /* header height */
  height: 100vh;
  display: flex; flex-direction: column;
}

/* ── Split grid (ALWAYS side by side) ── */
.cvb-split {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

/* On very small screens: stack but still show both */
@media(max-width: 480px) {
  .cvb-split {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

/* ── Panel shared styles ── */
.cvb-panel {
  display: flex; flex-direction: column;
  min-height: 0; overflow: hidden;
  position: relative;
}

/* Form panel */
.cvb-panel-form {
  border-right: 1.5px solid rgba(20,184,166,.15);
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(12px);
}

/* Preview panel */
.cvb-panel-preview {
  background: linear-gradient(160deg, rgba(240,253,250,.9) 0%, rgba(224,242,254,.7) 100%);
  backdrop-filter: blur(12px);
}

/* Panel header */
.cvb-panel-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; flex-shrink:0;
  border-bottom: 1.5px solid rgba(20,184,166,.1);
  background: rgba(255,255,255,.6);
}
@media(min-width:640px){ .cvb-panel-hdr { padding: 12px 20px; } }

.cvb-panel-hdr-left { display:flex; align-items:center; gap:8px; }
.cvb-panel-hdr-icon {
  width:30px; height:30px; border-radius:9px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background: linear-gradient(135deg, #0d9488, #06b6d4);
}
.cvb-panel-title { font-size:12.5px; font-weight:700; color:var(--ink); }
.cvb-panel-sub   { font-size:10px; color:var(--muted); margin-top:1px; }

/* Preview panel header — teal gradient */
.cvb-panel-preview .cvb-panel-hdr {
  background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
  border-color: transparent;
}
.cvb-panel-preview .cvb-panel-title { color: white; }
.cvb-panel-preview .cvb-panel-sub   { color: rgba(255,255,255,.7); }
.cvb-panel-preview .cvb-panel-hdr-icon { background: rgba(255,255,255,.2); }

/* Resize handle */
.cvb-resize-hint {
  position: absolute; left:0; top:50%; transform:translateY(-50%);
  width:4px; height:48px; border-radius:2px;
  background: linear-gradient(180deg, var(--teal-l), var(--cyan));
  opacity:.5;
}

/* ── Scrollable body ── */
.cvb-scroll {
  flex:1; overflow-y:auto; overflow-x:hidden;
  -webkit-overflow-scrolling: touch;
}
.cvb-scroll::-webkit-scrollbar { width:3px; }
.cvb-scroll::-webkit-scrollbar-thumb { background: var(--teal-l); border-radius:2px; }
.cvb-scroll::-webkit-scrollbar-track { background:transparent; }

.cvb-form-body { padding: 14px; }
@media(min-width:640px){ .cvb-form-body { padding: 20px; } }

/* ── Dropzone ── */
.cvb-dropzone-wrap {
  background: linear-gradient(135deg, #f0fdfa, #ecfeff);
  border: 2px dashed rgba(94,234,212,.6);
  border-radius: 14px; padding: 14px;
  transition: border-color .2s, background .2s;
  margin-bottom: 14px;
}
.cvb-dropzone-wrap:hover { border-color: var(--teal); background: rgba(240,253,250,.9); }
.cvb-dropzone-label {
  display:flex; align-items:center; gap:8px; margin-bottom:10px;
}
.cvb-dz-icon {
  width:28px; height:28px; border-radius:8px; flex-shrink:0;
  background: linear-gradient(135deg, #0d9488, #22d3ee);
  display:flex; align-items:center; justify-content:center;
}
.cvb-dz-title { font-size:12px; font-weight:700; color:var(--ink); }
.cvb-dz-sub   { font-size:10px; color:var(--muted); margin-top:1px; }

/* ── Info banner ── */
.cvb-info {
  background: linear-gradient(135deg, #f0fdfa, #eff6ff);
  border: 1.5px solid rgba(94,234,212,.4);
  border-radius: 12px; padding: 10px 12px;
  display:flex; gap:8px; align-items:flex-start;
  margin-bottom: 14px;
}
.cvb-info-icon {
  width:20px; height:20px; border-radius:50%; flex-shrink:0; margin-top:1px;
  background: linear-gradient(135deg, #0d9488, #06b6d4);
  display:flex; align-items:center; justify-content:center;
}
.cvb-info-text { font-size:11px; color:#0f766e; line-height:1.55; }

/* ── Form section divider ── */
.cvb-form-divider {
  border-top: 1.5px solid rgba(20,184,166,.12);
  padding-top: 14px; margin-top: 4px;
}

/* ── Preview container ── */
.cvb-preview-body {
  padding: 12px;
  background: transparent;
}
@media(min-width:640px){ .cvb-preview-body { padding: 16px 18px; } }

/* Preview floating label */
.cvb-preview-float {
  display:inline-flex; align-items:center; gap:5px;
  background: linear-gradient(135deg,#0d9488,#06b6d4);
  color:white; font-size:10px; font-weight:700; letter-spacing:.5px;
  padding:3px 10px; border-radius:100px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(20,184,166,.25);
}

/* ── Splitter label between panels (desktop) ── */
.cvb-divider-label {
  position: absolute; left: -1px; top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.cvb-divider-bar {
  width: 3px; height: 50px; border-radius: 2px;
  background: linear-gradient(180deg, var(--teal), var(--cyan));
  opacity: .4;
}
.cvb-divider-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  opacity: .6; flex-shrink:0;
}

/* ── Corner decoration ── */
.cvb-corner {
  position: absolute; bottom:16px; right:16px;
  font-family: 'DM Mono', monospace;
  font-size: 9px; color: rgba(20,184,166,.35);
  letter-spacing: 1.5px; text-transform: uppercase;
  pointer-events: none; user-select: none;
}
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Create() {
  const params = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const postId = params?.id as string;
  const router = useRouter();

  return (
    <Provider store={store}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="cvb">
        {/* Background */}
        <div className="cvb-bg">
          <div className="cvb-dots" />
          <div className="cvb-blob cvb-blob-1" />
          <div className="cvb-blob cvb-blob-2" />
          <div className="cvb-blob cvb-blob-3" />
        </div>

        {/* Top accent bar */}
        <div className="cvb-bar" />

        {/* Header */}
        <header className="cvb-header">
          <div className="cvb-header-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <button className="cvb-back" onClick={() => router.back()} aria-label="Retour">
                <svg width="15" height="15" fill="none" stroke="#0d9488" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="cvb-title-wrap">
                <span className="cvb-eyebrow">✦ Candidature</span>
                <h1 className="cvb-title">Créer votre CV</h1>
              </div>
            </div>

            <div className="cvb-live">
              <span className="cvb-live-dot" />
              En direct
            </div>
          </div>
        </header>

        {/* Main shell */}
        <div className="cvb-shell">
          <div className="cvb-split">

            {/* ── LEFT: FORM PANEL ── */}
            <div className="cvb-panel cvb-panel-form">
              {/* Panel header */}
              <div className="cvb-panel-hdr">
                <div className="cvb-panel-hdr-left">
                  <div className="cvb-panel-hdr-icon">
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                      <path d="M15.5 2.5a2.121 2.121 0 013 3L12 12l-4 1 1-4 6.5-6.5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="cvb-panel-title">Vos informations</div>
                    <div className="cvb-panel-sub">Profil professionnel</div>
                  </div>
                </div>
                {/* Mini step indicator */}
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                  {[1,2,3].map(n => (
                    <div key={n} style={{
                      width: n===1 ? 18 : 6, height:6, borderRadius:3,
                      background: n===1 ? 'linear-gradient(90deg,#0d9488,#06b6d4)' : 'rgba(20,184,166,.2)'
                    }} />
                  ))}
                </div>
              </div>

              {/* Scrollable form body */}
              <div className="cvb-scroll">
                <div className="cvb-form-body">

                  {/* Photo upload */}
                  <div className="cvb-dropzone-wrap">
                    <div className="cvb-dropzone-label">
                      <div className="cvb-dz-icon">
                        <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <div>
                        <div className="cvb-dz-title">Photo de profil</div>
                        <div className="cvb-dz-sub">JPG, PNG — 200×200 px recommandé</div>
                      </div>
                    </div>
                    <ResumeDropzone onFileUrlChange={setImageUrl} />
                  </div>

                  {/* Info banner */}
                  <div className="cvb-info">
                    <div className="cvb-info-icon">
                      <svg width="10" height="10" fill="#fff" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="cvb-info-text">
                      Chaque modification est reflétée instantanément dans l'aperçu à droite. Remplissez tous les champs pour maximiser vos chances.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="cvb-form-divider">
                    <ResumeForm imageUrl={imageUrl} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: PREVIEW PANEL ── */}
            <div className="cvb-panel cvb-panel-preview" style={{ position: 'relative' }}>
              {/* Vertical divider accent */}
              <div className="cvb-divider-label">
                <div className="cvb-divider-dot" />
                <div className="cvb-divider-bar" />
                <div className="cvb-divider-dot" />
              </div>

              {/* Panel header */}
              <div className="cvb-panel-hdr">
                <div className="cvb-panel-hdr-left">
                  <div className="cvb-panel-hdr-icon">
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div>
                    <div className="cvb-panel-title">Aperçu du CV</div>
                    <div className="cvb-panel-sub">Mise à jour automatique</div>
                  </div>
                </div>
                {/* Page badge */}
                <div style={{
                  fontSize:10, fontWeight:700, color:'rgba(255,255,255,.85)',
                  background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.2)',
                  borderRadius:100, padding:'3px 9px', letterSpacing:.5
                }}>
                  PDF · A4
                </div>
              </div>

              {/* Scrollable preview */}
              <div className="cvb-scroll">
                <div className="cvb-preview-body">
                  <div className="cvb-preview-float">
                    <span style={{ animation:'livepulse 1.6s ease-in-out infinite', display:'inline-block', width:5, height:5, borderRadius:'50%', background:'#a7f3d0' }} />
                    Aperçu en temps réel
                  </div>
                  <Resume imageUrl={imageUrl} postId={postId} />
                </div>
              </div>

              {/* Corner mono label */}
              <div className="cvb-corner">CV · FORMAT A4</div>
            </div>

          </div>
        </div>
      </div>
    </Provider>
  );
}