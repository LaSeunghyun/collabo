import { ProjectSummary } from '@/lib/api/projects';

export const demoProjects: ProjectSummary[] = [
  {
    id: '1',
    title: 'Neo Seoul Live Session',
    category: 'music',
    thumbnail: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229',
    participants: 1240,
    remainingDays: 6,
    targetAmount: 50000000,
    currentAmount: 34000000,
    createdAt: '2024-09-02T00:00:00.000Z'
  },
  {
    id: '2',
    title: 'Immersive Media Art Pop-up',
    category: 'art',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    participants: 890,
    remainingDays: 2,
    targetAmount: 80000000,
    currentAmount: 76000000,
    createdAt: '2024-09-10T00:00:00.000Z'
  },
  {
    id: '3',
    title: 'Metaverse Fan Meeting',
    category: 'tech',
    thumbnail: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980',
    participants: 2200,
    remainingDays: 14,
    targetAmount: 120000000,
    currentAmount: 94000000,
    createdAt: '2024-09-15T00:00:00.000Z'
  }
];
