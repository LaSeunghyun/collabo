import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import { ArtistProjectUpdates } from '@/components/artists/project-updates';
import { initI18n } from '@/lib/i18n';

describe('ArtistProjectUpdates', () => {
  const renderComponent = (updates: any[]) => {
    const i18n = initI18n();
    return render(
      <I18nextProvider i18n={i18n}>
        <ArtistProjectUpdates updates={updates} />
      </I18nextProvider>
    );
  };

  it('renders an empty state when there are no updates', () => {
    renderComponent([]);
    expect(screen.getByText('게시???�로?�트 ?�데?�트가 ?�습?�다.')).toBeInTheDocument();
  });

  it('renders update cards with project labels', () => {
    renderComponent([
      {
        id: 'update-1',
        title: '?�로??공연 ?�정',
        excerpt: '10???�째 �??�황 ?�화 진행',
        createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
        projectId: 'project-1',
        projectTitle: '?�과 ?�께 만드???�이�?
      }
    ]);

    expect(screen.getByText('?�로??공연 ?�정')).toBeInTheDocument();
    expect(screen.getByText('?�과 ?�께 만드???�이�??�데?�트')).toBeInTheDocument();
  });
});
