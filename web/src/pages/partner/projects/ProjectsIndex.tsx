import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

interface ProjectItem {
  id: string;
  name: string;
  code?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export default function ProjectsIndex() {
  const { organization } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.fetchWithAuth('/projects');
        const list: ProjectItem[] = Array.isArray(res) ? res : (res?.data ?? []);
        setProjects(list);
      } catch (e: any) {
        console.error('Failed to load projects', e);
        setError(e?.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setCurrentAndOpen = (p: ProjectItem) => {
    try { localStorage.setItem('currentProjectId', p.id); } catch {}
    navigate(`/partner/projects/${p.id}/budget`);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Select a project to manage budget, reports, contracts and documents</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-2">📂</div>
          <div className="text-slate-700 dark:text-slate-300">No projects available</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-slate-900 dark:text-white truncate">{p.name}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{p.status || 'active'}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                {p.code && <span className="inline-flex items-center gap-1"><span className="text-slate-400">#</span>{p.code}</span>}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => setCurrentAndOpen(p)} className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700">Open</button>
                <Link to={`/partner/projects/${p.id}/reports`} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-center">Reports</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
