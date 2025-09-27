import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';

import { ProjectCard } from '@/components/ui/cards/project-card';
import { initI18n } from '@/lib/i18n';

const project = {
  id: 'test',
  title: 'Test Project',
  description: 'Test Description',
  category: 'music',
  thumbnail: 'https://example.com/thumb.jpg',
  participants: 100,
  remainingDays: 5,
  targetAmount: 1000,
  currentAmount: 500,
  status: 'LIVE' as any,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  owner: {
    id: 'owner-id',
    name: 'Owner Name',
    avatarUrl: null
  },
  _count: {
    fundings: 100
  }
};

describe('ProjectCard', () => {
  it('renders project information', () => {
    const i18n = initI18n();
    render(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={project} />
      </I18nextProvider>
    );
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('100 supporters')).toBeInTheDocument();
  });
});
