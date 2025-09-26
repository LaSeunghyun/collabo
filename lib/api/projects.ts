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
