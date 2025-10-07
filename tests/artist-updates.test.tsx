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
    expect(screen.getByText('ê²Œì‹œ???„ë¡œ?íŠ¸ ?…ë°?´íŠ¸ê°€ ?†ìŠµ?ˆë‹¤.')).toBeInTheDocument();
  });

  it('renders update cards with project labels', () => {
    renderComponent([
      {
        id: 'update-1',
        title: '?ˆë¡œ??ê³µì—° ?¼ì •',
        excerpt: '10???˜ì§¸ ì£??¤í™© ?¹í™” ì§„í–‰',
        createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
        projectId: 'project-1',
        projectTitle: '?¬ê³¼ ?¨ê»˜ ë§Œë“œ???¼ì´ë¸?
      }
    ]);

    expect(screen.getByText('?ˆë¡œ??ê³µì—° ?¼ì •')).toBeInTheDocument();
    expect(screen.getByText('?¬ê³¼ ?¨ê»˜ ë§Œë“œ???¼ì´ë¸??…ë°?´íŠ¸')).toBeInTheDocument();
  });
});
