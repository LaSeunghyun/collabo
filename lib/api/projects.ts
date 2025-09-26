import { Prisma } from '@prisma/client';

export const projectWithMetricsInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  _count: {
    select: {
      fundings: true,
      settlements: true
    }
  }
} satisfies Prisma.ProjectInclude;

export type ProjectWithMetrics = Prisma.ProjectGetPayload<{
  include: typeof projectWithMetricsInclude;
}>;

export function formatProject(project: ProjectWithMetrics) {
  const { _count, ...projectData } = project;

  return {
    ...projectData,
    metrics: {
      fundings: _count.fundings,
      settlements: _count.settlements
    }
  };
}

export interface ProjectSummary {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  participants: number;
  remainingDays: number;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

export const fetchProjects = async (): Promise<ProjectSummary[]> => {
  const res = await fetch('/api/projects');
  if (!res.ok) {
    throw new Error('Failed to fetch projects');
  }

  return res.json();
};
