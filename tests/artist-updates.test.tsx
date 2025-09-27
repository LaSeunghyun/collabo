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
    expect(screen.getByText('게시된 프로젝트 업데이트가 없습니다.')).toBeInTheDocument();
  });

  it('renders update cards with project labels', () => {
    renderComponent([
      {
        id: 'update-1',
        title: '새로운 공연 일정',
        excerpt: '10월 둘째 주 실황 녹화 진행',
        createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
        projectId: 'project-1',
        projectTitle: '팬과 함께 만드는 라이브'
      }
    ]);

    expect(screen.getByText('새로운 공연 일정')).toBeInTheDocument();
    expect(screen.getByText('팬과 함께 만드는 라이브 업데이트')).toBeInTheDocument();
  });
});
