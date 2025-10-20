import { ProjectSummary } from '@/types/prisma';

export type { ProjectSummary };

const resolveApiUrl = (path: string) => {
  if (typeof window === 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    return `${baseUrl}${path}`;
  }

  return path;
};

export const fetchProjects = async (options?: { limit?: number; category?: string; status?: string }): Promise<ProjectSummary[]> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.category) params.append('category', options.category);
  if (options?.status) params.append('status', options.status);

  const url = `/api/projects${params.toString() ? `?${params.toString()}` : ''}`;
  
  const res = await fetch(resolveApiUrl(url), {
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
