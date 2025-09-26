import type { Project } from '@prisma/client';

import type { ProjectSummary } from '@/lib/api/projects';
import { prisma } from '@/lib/prisma';

const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745';
const FUNDING_DURATION_IN_DAYS = 30;

type ProjectWithRelations = Project & {
  fundings: { id: string }[];
};

function toSummary(project: ProjectWithRelations): ProjectSummary {
  const deadline = new Date(project.createdAt);
  deadline.setDate(deadline.getDate() + FUNDING_DURATION_IN_DAYS);

  const timeDiff = deadline.getTime() - Date.now();
  const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

  return {
    id: project.id,
    title: project.title,
    category: project.category,
    thumbnail: project.thumbnail ?? FALLBACK_THUMBNAIL,
    participants: project.fundings.length,
    remainingDays,
    targetAmount: project.targetAmount,
    currentAmount: project.currentAmount,
    createdAt: project.createdAt.toISOString()
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  try {
    const projects = await prisma.project.findMany({
      include: { fundings: true },
      orderBy: { createdAt: 'desc' }
    });

    return projects.map(toSummary);
  } catch (error) {
    throw new Error('Failed to retrieve projects', { cause: error });
  }
}

export async function getProjectSummaryById(id: string): Promise<ProjectSummary | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { fundings: true }
    });

    if (!project) {
      return null;
    }

    return toSummary(project);
  } catch (error) {
    throw new Error('Failed to retrieve project detail', { cause: error });
  }
}

export async function listProjectsByOwner(ownerId: string): Promise<ProjectSummary[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId },
      include: { fundings: true },
      orderBy: { createdAt: 'desc' }
    });

    return projects.map(toSummary);
  } catch (error) {
    throw new Error('Failed to retrieve artist projects', { cause: error });
  }
}
