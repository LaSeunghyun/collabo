import { ProjectSummary } from '@/types/shared';

export type { ProjectSummary };

const resolveApiUrl = (path: string) => {
  if (typeof window === 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    return `${baseUrl}${path}`;
  }

  return path;
};

export const fetchProjects = async (): Promise<ProjectSummary[]> => {
  const res = await fetch(resolveApiUrl('/api/projects'), {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Failed to fetch projects');
  }

  return res.json();
};

export const fetchProjectById = async (id: string): Promise<ProjectSummary> => {
  const res = await fetch(resolveApiUrl(`/api/projects/${id}`), {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Failed to fetch project');
  }

  return res.json();
};
