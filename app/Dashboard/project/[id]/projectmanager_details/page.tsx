'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight,
  Search,
  X,
  Code,
  Megaphone,
  Headphones,
  Lock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type UserLite = {
  id: number;
  fullname?: string;
  email?: string;
  company?: { id?: number } | null;
  companyId?: number;
};
export type AddMembersPayload = {
  memberIds: number[];
};

type ProjectSummary = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  domain: string;
  startDate?: string | null;
  endDate?: string | null;
  company?: { id?: number; name?: string } | null;
  createdBy?: { id?: number; fullname?: string } | null;
  projectManager?: { id?: number; fullname?: string } | null;
  assignedTo: UserLite[];
  isActive?: boolean;
  updatedAt?: string | null;
};

type ProjectDetailsResponse = {
  project: ProjectSummary;
  domainDetails: Record<string, any> | null;
};
export type AddMembersResponse = {
  message: string;
  project: {
    id: number;
    name: string;
    assignedTo: Array<{ id: number; fullname?: string; email?: string }>;
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_NEST_API_URL || '';

const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('access_token') || localStorage.getItem('token')
    : '';

// ─── IT Field Options ─────────────────────────────────────────────────────────

const IT_OPTIONS = {
  programmingLanguages: [
    'C#','Dart','Elixir','Go','Java','JavaScript','Kotlin','PHP','Python',
    'Python|C++','Python|PyTorch','Python|R','Ruby','Rust','Scala','Solidity',
    'Solidity|JavaScript','Swift','TypeScript','TypeScript|NodeJS','TypeScript|Python',
  ],
  framework: [
    'ASP.NET','ASP.NET Core','Absinthe','Actix','Actix-Web','Aiohttp','Akka',
    'Android','Android SDK','Angular','Axum','Beego','Blazor','Bottle','Buffalo',
    'Camel','Celery','Channels','Chi','CodeIgniter','Dapper','Deno','Django',
    'Django REST','Dramatiq','Dropwizard','Echo','Electron','Entity Framework',
    'Exposed','Express','Falcon','FastAPI','Fastify','Fiber','Flask','Flutter',
    'Foundry','Gin','GoFiber','Gorilla','GraphQL','Hapi','Hardhat','Hibernate',
    'Ionic','Iris','Jakarta EE','Jersey','Kit','Koa','Kraken','Ktor','Laravel',
    'Litestar','Micro','Micronaut','Minimal API','Mux','Nerves','NestJS','Netty',
    'Next.js','NextJS','NextJS|FastAPI','Nuxt','NuxtJS','Orleans','Phoenix','Play',
    'Poem','PyTorch','Pyramid','Quarkus','Rails','Razor','React','React Native',
    'Reactor','Remix','Revel','Rocket','Sanic','SignalR','Sinatra','Spring',
    'Spring Batch','Spring Boot','Spring Cloud','Spring Data','Spring Integration',
    'Spring MVC','Spring Security','Starlette','Svelte','SvelteKit','Symfony',
    'TensorFlow','Tide','Tornado','Truffle','Vapor','Vert.x','Vue','WCF','Warp',
    'WebAPI','gRPC','iOS SDK',
  ],
  database: [
    'Cassandra','CoreData','CosmosDB','DB2','DynamoDB','Elasticsearch','FaunaDB',
    'Firebase','Firestore','IPFS','InfluxDB','MariaDB','MongoDB','MySQL','Neo4j',
    'Oracle','Oracle DB','PostgreSQL','Redis','SQL Server','SQLite','SurrealDB',
    'TimescaleDB',
  ],
  serverDetails: [
    'AWS','AWS Amplify','AWS EC2','AWS ECS','AWS Fargate','AWS GPU','AWS IoT',
    'AWS Lambda','AWS RDS','AWS SageMaker','Azure','Azure App Service',
    'Azure Kubernetes','Desktop App','DigitalOcean','Docker','Edge','Edge Device',
    'Ethereum','Firebase','Firebase Hosting','GCP','GCP GKE','GCP Vertex',
    'Google Cloud Run','Heroku','IBM Cloud','Kubernetes','Local','Mobile',
    'Mobile Backend','Netlify','OCI','On-Premise','On-premise','OpenShift',
    'Polygon','RabbitMQ','Vercel',
  ],
  architecture: [
    'Decentralized','Event-Driven','Event-driven','Hexagonal','Microservices',
    'Mobile','Monolith','Monolithic','N-Tier','Reactive','Serverless',
  ],
  apiIntegration: [
    'AMQP','GraphQL','Local API','MQTT','REST','SOAP','SSE','Web3',
    'WebSocket','WebSockets','gRPC',
  ],
  securityRequirements: [
    'API Key','API Keys','Argon2','Audit','Auth0','Azure AD','Basic','Bcrypt',
    'Clerk','Cognito','Devise','Encryption','Firebase Auth','IAM','JWT',
    'Multisig','OAuth2','SSL/TLS','Sanctum','Session-based','mTLS',
  ],
  devOpsRequirements: [
    'Amplify CLI','Ansible','Azure DevOps','Azure Pipe','Azure Pipeline','Bitrise',
    'CI/CD','CI/CD|Docker','CI/CD|Kubernetes','CircleCI','Cloud Build','Codemagic',
    'Docker','Docker|CircleCI','Docker|Jenkins','Docker|Kubernetes','Docker|Terraform',
    'Forge','GitHub Actions','GitLab CI','Helm','Heroku','Heroku Pipeline','Jenkins',
    'Kubernetes','Kubernetes|Helm','Manual','Serverless','Serverless Framework',
    'Terraform','Terraform|GitHub Actions','Vercel','Vercel Edge','Xcode Cloud',
  ],
  priority: ['Low','Medium','High'],
  businessImpact: ['Low','Normal','Important','Critical'],
  complexity: ['Low','Medium','High'],
  teamSize: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','18'],
};

type MultiKey =
  | 'programmingLanguages' | 'framework' | 'database' | 'serverDetails'
  | 'architecture' | 'apiIntegration' | 'securityRequirements' | 'devOpsRequirements';

type SingleKey = 'priority' | 'businessImpact' | 'complexity' | 'teamSize';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Barre de recherche + liste scrollable de badges — sélection multiple */
function MultiSelectField({
  label,
  fieldKey,
  selected,
  onChange,
  readOnly = false,
}: {
  label: string;
  fieldKey: MultiKey;
  selected: string[];
  onChange: (vals: string[]) => void;
  readOnly?: boolean;
}) {
  const [search, setSearch] = useState('');
  const options = IT_OPTIONS[fieldKey];
  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(val: string) {
    if (readOnly) return;
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  }

  if (readOnly) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border rounded-lg min-h-[2.5rem]">
          {selected.length === 0 ? (
            <span className="text-xs text-slate-400 self-center">—</span>
          ) : (
            selected.map(v => (
              <span
                key={v}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium"
              >
                {v}
              </span>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map(v => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium"
            >
              {v}
              <button type="button" onClick={() => toggle(v)} className="hover:text-indigo-600">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher..."
        className="w-full px-3 py-1.5 border rounded text-sm mb-2"
      />

      <div className="max-h-36 overflow-y-auto border rounded p-2 flex flex-wrap gap-1 bg-slate-50">
        {filtered.length === 0 && (
          <span className="text-xs text-slate-400">Aucun résultat</span>
        )}
        {filtered.map(opt => {
          const isSel = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-2 py-0.5 rounded-full border text-xs font-medium transition-colors ${
                isSel
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Badges radio — sélection unique */
function SingleSelectField({
  label,
  fieldKey,
  selected,
  onChange,
  readOnly = false,
}: {
  label: string;
  fieldKey: SingleKey;
  selected: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
          {IT_OPTIONS[fieldKey].map(opt => (
            <span
              key={opt}
              className={`px-3 py-1 rounded-full border text-sm font-medium ${
                selected === opt
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              {opt}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {IT_OPTIONS[fieldKey].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt === selected ? '' : opt)}
            className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
              selected === opt
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ReadOnly field helper ────────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-600">{label}</label>
      <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[2.375rem]">
        {value || <span className="text-slate-400">—</span>}
      </div>
    </div>
  );
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function readUserFromLocalStorage() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function decodeJwtRole(token?: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const obj = JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))));
    return obj.role || obj.roles?.[0] || obj.userRole || obj.realm_access?.roles?.[0] || null;
  } catch { return null; }
}

function getUserRoleNormalized(): string | null {
  const u = readUserFromLocalStorage();
  if (u?.role) return String(u.role).toLowerCase();
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const r = decodeJwtRole(token);
  return r ? String(r).toLowerCase() : null;
}

function isProjectManager(role: string | null): boolean {
  if (!role) return false;
  return ['project_manager', 'project-manager', 'projectmanager'].includes(role);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const params = useParams() as { id?: string };
  const projectId = params?.id;

  const [data, setData]                     = useState<ProjectDetailsResponse | null>(null);
  const [loading, setLoading]               = useState(true);
  const [savingProject, setSavingProject]   = useState(false);
  const [savingDomain, setSavingDomain]     = useState(false);
  const [addingMembers, setAddingMembers]   = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [actionMsg, setActionMsg]           = useState<string | null>(null);

  // ── Project fields ──
  const [name, setName]                         = useState('');
  const [description, setDescription]           = useState('');
  const [status, setStatus]                     = useState('');
  const [domain, setDomain]                     = useState('');
  const [startDate, setStartDate]               = useState('');
  const [endDate, setEndDate]                   = useState('');
  const [projectManagerId, setProjectManagerId] = useState<number | ''>('');

  // ── Domain form ──
  const [domainForm, setDomainForm] = useState<Record<string, any>>({});

  // ── Members ──
  const [users, setUsers]               = useState<UserLite[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch]     = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());

  const roleNormalized = useMemo(() => getUserRoleNormalized(), []);
  const isPM = useMemo(() => isProjectManager(roleNormalized), [roleNormalized]);

  useEffect(() => { if (projectId) loadAll(); }, [projectId]);

  // ── Helpers pour domainForm ──
  function getMulti(key: string): string[] {
    const val = domainForm[key];
    if (!val) return [];
    return String(val).split('|').map(s => s.trim()).filter(Boolean);
  }
  function setMulti(key: string, vals: string[]) {
    setDomainForm(f => ({ ...f, [key]: vals.join('|') }));
  }
  function getSingle(key: string): string {
    return domainForm[key] ?? '';
  }
  function setSingle(key: string, val: string) {
    setDomainForm(f => ({ ...f, [key]: val }));
  }

  // ── Load ──
  async function loadAll() {
    setLoading(true);
    setUsersLoading(true);
    setError(null);
    setActionMsg(null);
    try {
      const token = getToken();
      const headers = (extra?: Record<string, string>) => ({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
      });

      const resProject = await fetch(
        `${API_BASE}/projects/${projectId}/details?includeDomainDetails=true`,
        { headers: headers() }
      );
      if (!resProject.ok) throw new Error(await resProject.text() || `Erreur ${resProject.status}`);
      const json: ProjectDetailsResponse = await resProject.json();
      setData(json);

      setName(json.project.name || '');
      setDescription(json.project.description || '');
      setStatus(json.project.status || '');
      setDomain(json.project.domain || '');
      setStartDate(json.project.startDate?.split('T')[0] || '');
      setEndDate(json.project.endDate?.split('T')[0] || '');
      setProjectManagerId(json.project.projectManager?.id ?? '');
      setDomainForm(json.domainDetails ?? {});

      const resAllUsers = await fetch(`${API_BASE}/users`, { headers: headers() });
      if (!resAllUsers.ok) throw new Error('Impossible de récupérer les utilisateurs');
      const allUsers: UserLite[] = await resAllUsers.json();

      const companyId = json.project.company?.id;
      const companyUsers = companyId
        ? allUsers.filter(u => (u.company as any)?.id === companyId || u.companyId === companyId)
        : allUsers;
      setUsers(companyUsers);

      setSelectedUserIds(new Set((json.project.assignedTo || []).map(u => u.id)));
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
      setUsersLoading(false);
    }
  }

  // ── Save project (admin only) ──
  async function saveProject() {
    if (!projectId || isPM) return;
    setSavingProject(true);
    setError(null);
    setActionMsg(null);
    try {
      const token = getToken();
      const payload: any = { name, description, status, domain, startDate: startDate || null, endDate: endDate || null };
      if (projectManagerId) payload.projectManagerId = projectManagerId;
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text() || `Erreur ${res.status}`);
      setActionMsg('Projet mis à jour.');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingProject(false);
    }
  }

  // ── Save domain details ──
  async function saveDomainDetails() {
    if (!projectId) return;
    setSavingDomain(true);
    setError(null);
    setActionMsg(null);
    try {
      const token = getToken();
      const endpointMap: Record<string, string> = {
        IT: `${API_BASE}/projects/${projectId}/it-details`,
        Marketing: `${API_BASE}/projects/${projectId}/marketing-details`,
        CallCenter: `${API_BASE}/projects/${projectId}/callcenter-details`,
      };
      const url = endpointMap[domain];
      if (!url) { setActionMsg('Aucun détail spécifique pour ce domaine.'); return; }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(domainForm),
      });
      if (!res.ok) throw new Error(await res.text() || `Erreur ${res.status}`);
      setActionMsg('Détails domaine sauvegardés.');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Erreur sauvegarde domaine');
    } finally {
      setSavingDomain(false);
    }
  }

  // ── Add members ──
  async function addSelectedMembers() {
  if (!projectId) return;
  
  const ids = Array.from(selectedUserIds);
  if (ids.length === 0) { 
    setActionMsg('Aucun membre sélectionné.'); 
    return; 
  }
  
  setAddingMembers(true);
  setError(null);
  setActionMsg(null);
  
  try {
    const token = getToken();
    
    // ✅ Créez le payload avec une meilleure structure
    const payload = {
      memberIds: ids
    };
    
    console.log('📤 Envoi de:', payload); // Pour déboguer
    
    const res = await fetch(`${API_BASE}/projects/${projectId}/add-members`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json', 
        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
      },
      body: JSON.stringify(payload),
    });
    
    // ✅ Log la réponse
    console.log('📥 Statut:', res.status);
    
    const json = await res.json();
    console.log('📥 Réponse:', json);
    
    if (!res.ok) {
      throw new Error(json?.message || `Erreur ${res.status}`);
    }
    
    // ✅ Message de succès personnalisé
    setActionMsg(json?.message || `${ids.length} membre(s) ajouté(s) avec succès`);
    
    // ✅ Réinitialiser la sélection
    setSelectedUserIds(new Set());
    
    // ✅ Recharger les données
    await loadAll();
    
  } catch (err: any) {
    console.error('❌ Erreur:', err);
    setError(err.message || "Erreur lors de l'ajout des membres");
  } finally {
    setAddingMembers(false);
  }
}

  function toggleSelectUser(id: number) {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── teamSize auto-computed for PM: reflects selectedUserIds count ──
  const computedTeamSize = useMemo(() => String(selectedUserIds.size), [selectedUserIds]);

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    return (u.fullname || u.email || '').toLowerCase().includes(userSearch.toLowerCase());
  });

  // ── Guards ──
  if (!projectId) return <div className="p-6">Identifiant du projet manquant.</div>;
  if (loading) return <div className="p-6 text-center text-slate-500">Chargement...</div>;

  const hrefForProject =
    isPM
      ? `/Dashboard/project/projectmanager_details/${data?.project.id}`
      : `/Dashboard/project/${data?.project.id}`;

  const domainIcon =
    domain === 'IT' ? <Code size={16} className="text-indigo-600" /> :
    domain === 'Marketing' ? <Megaphone size={16} className="text-rose-600" /> :
    <Headphones size={16} className="text-emerald-600" />;

  // Status label helper
  const statusLabels: Record<string, string> = {
    planned: 'Planned',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{data?.project.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            #{data?.project.id} • {data?.project.company?.name || '—'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/Dashboard" className="text-sm text-slate-600 hover:underline">
            ← Retour
          </Link>
          <Link
            href={hrefForProject}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-sm font-semibold hover:bg-indigo-600 transition"
          >
            Accéder au projet <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error    && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {actionMsg && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{actionMsg}</div>}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Informations du projet
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Informations du projet</h2>
          {isPM && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              <Lock size={11} /> Lecture seule
            </span>
          )}
        </div>

        {/* ── PM: read-only view ── */}
        {isPM ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <ReadOnlyField label="Nom du projet" value={name} />
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Description</label>
                <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[6rem] whitespace-pre-wrap">
                  {description || <span className="text-slate-400">—</span>}
                </div>
              </div>
              <ReadOnlyField label="Domaine" value={domain} />
            </div>
            <div className="space-y-3">
              <ReadOnlyField label="Statut" value={statusLabels[status] ?? status} />
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyField label="Date de début" value={startDate || undefined} />
                <ReadOnlyField label="Date de fin" value={endDate || undefined} />
              </div>
              <ReadOnlyField
                label="Project Manager"
                value={data?.project.projectManager?.fullname ?? (projectManagerId ? `ID: ${projectManagerId}` : undefined)}
              />
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1 border">
                <div>
                  <span className="font-medium">Créé par :</span>{' '}
                  {(data?.project as any)?.createdby?.fullname || '—'}
                </div>
                <div>
                  <span className="font-medium">Entreprise :</span>{' '}
                  {data?.project.company?.name || '—'}
                </div>
                <div>
                  <span className="font-medium">Mis à jour :</span>{' '}
                  {data?.project.updatedAt
                    ? new Date(data.project.updatedAt).toLocaleString()
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Admin: editable view ── */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du projet</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domaine</label>
                  <select
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="IT">IT</option>
                    <option value="Marketing">Marketing</option>
                    <option value="CallCenter">Call Center</option>
                    <option value="Other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Statut</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date de début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Project Manager (ID)</label>
                  <input
                    type="number"
                    value={projectManagerId ?? ''}
                    onChange={e => setProjectManagerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="ID du manager..."
                  />
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1 border">
                  <div>
                    <span className="font-medium">Créé par :</span>{' '}
                    {(data?.project as any)?.createdby?.fullname || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Entreprise :</span>{' '}
                    {data?.project.company?.name || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Mis à jour :</span>{' '}
                    {data?.project.updatedAt
                      ? new Date(data.project.updatedAt).toLocaleString()
                      : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveProject}
                disabled={savingProject}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-indigo-700 transition"
              >
                {savingProject ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                onClick={loadAll}
                className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition"
              >
                Annuler
              </button>
            </div>
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Membres
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Membres du projet</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Sélectionnez les membres à ajouter au projet.
          </p>
        </div>

        {/* Membres actuellement assignés */}
        {(data?.project.assignedTo?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Membres actuels ({data!.project.assignedTo.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {data!.project.assignedTo.map(u => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium shadow-sm"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {(u.fullname || u.email || '?')[0].toUpperCase()}
                  </span>
                  <span>
                    {u.fullname || u.email || `User ${u.id}`}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Barre de recherche + toggle all */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="pl-9 pr-3 py-2 border rounded-lg w-full text-sm"
            />
          </div>
          <button
            onClick={() => {
              const visibleIds = filteredUsers.map(u => u.id);
              const allSelected = visibleIds.every(id => selectedUserIds.has(id));
              setSelectedUserIds(prev => {
                const next = new Set(prev);
                if (allSelected) visibleIds.forEach(id => next.delete(id));
                else visibleIds.forEach(id => next.add(id));
                return next;
              });
            }}
            className="px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition whitespace-nowrap"
          >
            Tout basculer
          </button>
        </div>

        {/* Liste membres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {usersLoading ? (
            <div className="col-span-full text-center py-6 text-slate-400 text-sm">
              Chargement des utilisateurs...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full text-sm text-slate-400 py-4 text-center">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            filteredUsers.map(u => {
              // ✅ Vérifier si l'utilisateur est déjà assigné
              const isAlreadyAssigned = data?.project.assignedTo?.some(member => member.id === u.id) ?? false;
              
              return (
                <label
                  key={u.id}
                  className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition ${
                    isAlreadyAssigned
                      ? 'bg-emerald-50 border-emerald-200 opacity-60 cursor-not-allowed'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(u.id) || isAlreadyAssigned}
                    onChange={() => {
                      if (!isAlreadyAssigned) {
                        toggleSelectUser(u.id);
                      }
                    }}
                    disabled={isAlreadyAssigned}
                    className="w-4 h-4 accent-indigo-600 disabled:accent-emerald-600 disabled:cursor-not-allowed"
                  />
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {(u.fullname || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {u.fullname || u.email || `User ${u.id}`}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{u.email || '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAlreadyAssigned && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ Assigné
                      </span>
                    )}
                    <span className="text-xs text-slate-300">#{u.id}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={addSelectedMembers}
            disabled={addingMembers || selectedUserIds.size === 0}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-emerald-600 transition"
          >
            {addingMembers ? (
              <>
                <span className="inline-block animate-spin mr-2">��</span>
                Ajout en cours...
              </>
            ) : (
              `Ajouter les membres sélectionnés (${selectedUserIds.size})`
            )}
          </button>
          <button
            onClick={() => { 
              setSelectedUserIds(new Set()); 
              setUserSearch('');
              setActionMsg(null); 
            }}
            className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition"
          >
            Réinitialiser
          </button>
        </div>
      </section>
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Détails domaine
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-2 mb-5">
          {domainIcon}
          <h2 className="text-lg font-semibold">Détails domaine — {domain}</h2>
        </div>

        {/* ── IT ── */}
        {domain === 'IT' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
                Stack technique
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MultiSelectField
                  label="Programming Languages"
                  fieldKey="programmingLanguages"
                  selected={getMulti('programmingLanguages')}
                  onChange={v => setMulti('programmingLanguages', v)}
                />
                <MultiSelectField
                  label="Framework"
                  fieldKey="framework"
                  selected={getMulti('framework')}
                  onChange={v => setMulti('framework', v)}
                />
                <MultiSelectField
                  label="Database"
                  fieldKey="database"
                  selected={getMulti('database')}
                  onChange={v => setMulti('database', v)}
                />
                <MultiSelectField
                  label="Server Details"
                  fieldKey="serverDetails"
                  selected={getMulti('serverDetails')}
                  onChange={v => setMulti('serverDetails', v)}
                />
                <MultiSelectField
                  label="Architecture"
                  fieldKey="architecture"
                  selected={getMulti('architecture')}
                  onChange={v => setMulti('architecture', v)}
                />
                <MultiSelectField
                  label="API Integration"
                  fieldKey="apiIntegration"
                  selected={getMulti('apiIntegration')}
                  onChange={v => setMulti('apiIntegration', v)}
                />
                <MultiSelectField
                  label="Security Requirements"
                  fieldKey="securityRequirements"
                  selected={getMulti('securityRequirements')}
                  onChange={v => setMulti('securityRequirements', v)}
                />
                <MultiSelectField
                  label="DevOps Requirements"
                  fieldKey="devOpsRequirements"
                  selected={getMulti('devOpsRequirements')}
                  onChange={v => setMulti('devOpsRequirements', v)}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
                Planification & estimation
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SingleSelectField
                  label="Priority"
                  fieldKey="priority"
                  selected={getSingle('priority')}
                  onChange={v => setSingle('priority', v)}
                />
                <SingleSelectField
                  label="Business Impact"
                  fieldKey="businessImpact"
                  selected={getSingle('businessImpact')}
                  onChange={v => setSingle('businessImpact', v)}
                />
                <SingleSelectField
                  label="Complexity"
                  fieldKey="complexity"
                  selected={getSingle('complexity')}
                  onChange={v => setSingle('complexity', v)}
                />

                {/* ── Team Size ── */}
                {isPM ? (
                  /* PM: auto-calculated from selected members, read-only display */
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Team Size
                      <span className="ml-2 text-xs text-indigo-500 font-normal">
                        (calculé automatiquement)
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-300 text-sm font-semibold w-fit">
                        {computedTeamSize}
                      </div>
                      <span className="text-xs text-slate-400">
                        = nombre de membres sélectionnés
                      </span>
                    </div>
                  </div>
                ) : (
                  <SingleSelectField
                    label="Team Size"
                    fieldKey="teamSize"
                    selected={String(domainForm.teamSize ?? '')}
                    onChange={v => setDomainForm(f => ({ ...f, teamSize: v ? Number(v) : '' }))}
                  />
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
                Modules & livrables
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Key Deliverables</label>
                  <input
                    type="text"
                    value={domainForm.keyDeliverables ?? ''}
                    onChange={e => setDomainForm(f => ({ ...f, keyDeliverables: e.target.value }))}
                    placeholder="API v1, Frontend v1..."
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dependencies</label>
                  <input
                    type="text"
                    value={domainForm.dependencies ?? ''}
                    onChange={e => setDomainForm(f => ({ ...f, dependencies: e.target.value }))}
                    placeholder="Autres projets ou services..."
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Risks</label>
                  <input
                    type="text"
                    value={domainForm.risks ?? ''}
                    onChange={e => setDomainForm(f => ({ ...f, risks: e.target.value }))}
                    placeholder="Retard, bug critique..."
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Additional Notes</label>
                  <textarea
                    rows={3}
                    value={domainForm.additionalNotes ?? ''}
                    onChange={e => setDomainForm(f => ({ ...f, additionalNotes: e.target.value }))}
                    placeholder="Remarques, liens docs..."
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Marketing ── */}
        {domain === 'Marketing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'campaignType',   label: 'Campaign Type',   placeholder: 'Ex: Display, Email...' },
              { key: 'targetAudience', label: 'Target Audience', placeholder: 'Ex: 18-35 ans, B2B...' },
              { key: 'channels',       label: 'Channels',        placeholder: 'Ex: Social, SEO...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type="text"
                  value={domainForm[key] ?? ''}
                  onChange={e => setDomainForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Duration (days)</label>
              <input
                type="number"
                value={domainForm.estimatedDurationDays ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, estimatedDurationDays: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Budget</label>
              <input
                type="number"
                step="0.01"
                value={domainForm.estimatedBudget ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, estimatedBudget: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Additional Notes</label>
              <textarea
                rows={3}
                value={domainForm.additionalNotes ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, additionalNotes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* ── CallCenter ── */}
        {domain === 'CallCenter' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Number of Agents</label>
              <input
                type="number"
                value={domainForm.numberOfAgents ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, numberOfAgents: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number of Calls Per Day</label>
              <input
                type="number"
                value={domainForm.numberOfCallsPerDay ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, numberOfCallsPerDay: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SLA Target</label>
              <input
                type="text"
                value={domainForm.slaTarget ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, slaTarget: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Budget</label>
              <input
                type="number"
                step="0.01"
                value={domainForm.estimatedBudget ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, estimatedBudget: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Additional Notes</label>
              <textarea
                rows={3}
                value={domainForm.additionalNotes ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, additionalNotes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
              />
            </div>
          </div>
        )}

        {domain === 'Other' && (
          <p className="text-sm text-slate-400">Aucun formulaire spécifique pour ce domaine.</p>
        )}

        {domain !== 'Other' && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                // For PM: inject computed team size before saving
                if (isPM) {
                  setDomainForm(f => ({ ...f, teamSize: selectedUserIds.size }));
                  // Use a timeout to let state update before save
                  setTimeout(saveDomainDetails, 0);
                } else {
                  saveDomainDetails();
                }
              }}
              disabled={savingDomain}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-indigo-700 transition"
            >
              {savingDomain ? 'Sauvegarde...' : 'Sauvegarder les détails domaine'}
            </button>
            <button
              onClick={() => setDomainForm(data?.domainDetails ?? {})}
              className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition"
            >
              Annuler
            </button>
          </div>
        )}
      </section>

      {/* ── Raw preview ── */}
      <section className="bg-white p-4 rounded-2xl border">
        <h3 className="text-sm font-medium mb-2 text-slate-600">Aperçu brut des détails domaine</h3>
        {data?.domainDetails ? (
          <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg max-h-48 overflow-auto text-xs">
            {JSON.stringify(data.domainDetails, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">Aucun détail spécifique enregistré.</p>
        )}
      </section>

    </div>
  );
}