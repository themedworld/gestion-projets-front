'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

type Props = {
  projectId?: number;
  projectName?: string;
  companyName?: string;
  isPM: boolean;
};

export default function ProjectHeader({ projectId, projectName, companyName, isPM }: Props) {
  const hrefProject = isPM
    ? `/Dashboard/project/projectmanager_details/${projectId}`
    : `/Dashboard/project/${projectId}`;

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold">{projectName}</h1>
        <p className="text-sm text-slate-500 mt-1">
          #{projectId} • {companyName || '—'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/Dashboard" className="text-sm text-slate-600 hover:underline">
          ← Retour
        </Link>
        <Link
          href={hrefProject}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-sm font-semibold hover:bg-indigo-600 transition"
        >
          Accéder au projet <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}