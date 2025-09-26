import { cache } from 'react';

import type { ProjectSummary } from '@/lib/api/projects';
import { prisma } from '@/lib/prisma';

const CAMPAIGN_DURATION_DAYS = 30;
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980';

type ProjectSummaryOptions = {
  ownerId?: string;
};

const fetchProjectsFromDb = async (options?: ProjectSummaryOptions) => {
  const where = options?.ownerId ? { ownerId: options.ownerId } : undefined;

  return prisma.project.findMany({
    where,
    include: {
      _count: { select: { fundings: true } }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

type ProjectWithCounts = Awaited<ReturnType<typeof fetchProjectsFromDb>>[number];

const toProjectSummary = (project: ProjectWithCounts): ProjectSummary => {
  const endDate = new Date(project.createdAt);
  endDate.setDate(endDate.getDate() + CAMPAIGN_DURATION_DAYS);
  const remainingMs = endDate.getTime() - Date.now();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  return {
    id: project.id,
    title: project.title,
    category: project.category,
    thumbnail: project.thumbnail ?? DEFAULT_THUMBNAIL,
    participants: project._count.fundings,
    remainingDays,
    targetAmount: project.targetAmount,
    currentAmount: project.currentAmount,
    createdAt: project.createdAt.toISOString()
  };
};

export const getProjectSummaries = cache(async (options?: ProjectSummaryOptions) => {
  const projects = await fetchProjectsFromDb(options);
  return projects.map(toProjectSummary);
});

export const getProjectSummaryById = cache(async (id: string) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { fundings: true } }
    }
  });

  if (!project) {
    return null;
  }

  return toProjectSummary(project);
});
