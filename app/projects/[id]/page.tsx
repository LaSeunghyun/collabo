import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProjectDetailView } from './_components/project-detail-view';

interface ProjectPageProps {
  params: { id: string };
}

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      rewards: {
        orderBy: { price: 'asc' }
      },
      fundings: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          fundings: true,
          rewards: true
        }
      }
    }
  });

  return project;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}