import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import { ArtistMetrics } from '@/components/artists/artist-metrics';
import { initI18n } from '@/lib/i18n';

describe('ArtistMetrics layout', () => {
  it('uses responsive grid classes', () => {
    const i18n = initI18n();
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <ArtistMetrics followerCount={1234} totalBackers={5678} projectCount={9} />
      </I18nextProvider>
    );

    const section = container.querySelector('section');
    expect(section).toHaveClass('grid');
    expect(section).toHaveClass('md:grid-cols-3');
  });
});
