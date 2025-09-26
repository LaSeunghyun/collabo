'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ProjectCard } from '@/components/shared/project-card';
import { useFilterStore } from '@/lib/stores/use-filter-store';
import type { ProjectSummary } from '@/lib/api/projects';

export function ProjectFilterPanel({ initialProjects }: { initialProjects: ProjectSummary[] }) {
  const { category, tags, sort } = useFilterStore();
  const { data = initialProjects } = useQuery({
    queryKey: ['projects'],
    initialData: initialProjects,
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      return res.json();
    }
  });

  const filtered = useMemo(() => {
    let items = [...data];
    if (category) {
      items = items.filter((item) => item.category === category);
    }
    if (tags.length > 0) {
      items = items.filter((item) => tags.every((tag) => item.title.toLowerCase().includes(tag.toLowerCase())));
    }
    if (sort === 'closing') {
      items.sort((a, b) => a.remainingDays - b.remainingDays);
    } else if (sort === 'newest') {
      items.sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf());
    } else {
      items.sort((a, b) => b.participants - a.participants);
    }
    return items;
  }, [category, data, sort, tags]);

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
