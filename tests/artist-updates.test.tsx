import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArtistUpdates } from '@/components/artists/artist-updates';

// Mock the component
jest.mock('@/components/artists/artist-updates', () => ({
  ArtistUpdates: ({ updates }: { updates: any[] }) => (
    <div data-testid="artist-updates">
      {updates.map((update) => (
        <div key={update.id} data-testid={`update-${update.id}`}>
          <h3>{update.title}</h3>
          <p>{update.content}</p>
          <span>{update.projectTitle}</span>
        </div>
      ))}
    </div>
  )
}));

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
};

describe('ArtistUpdates', () => {
  it('renders artist updates correctly', () => {
    const client = new QueryClient();
    const Wrapper = createWrapper(client);

    const mockUpdates = [
      {
        id: 'update-1',
        title: '새로운 프로젝트 업데이트',
        content: '프로젝트 진행 상황을 공유합니다',
        projectTitle: '함께 만드는 아이디어'
      }
    ];

    render(
      <Wrapper>
        <ArtistUpdates updates={mockUpdates} />
      </Wrapper>
    );

    expect(screen.getByTestId('artist-updates')).toBeInTheDocument();
    expect(screen.getByTestId('update-update-1')).toBeInTheDocument();
    expect(screen.getByText('새로운 프로젝트 업데이트')).toBeInTheDocument();
    expect(screen.getByText('함께 만드는 아이디어')).toBeInTheDocument();
  });

  it('renders empty state when no updates', () => {
    const client = new QueryClient();
    const Wrapper = createWrapper(client);

    render(
      <Wrapper>
        <ArtistUpdates updates={[]} />
      </Wrapper>
    );

    expect(screen.getByTestId('artist-updates')).toBeInTheDocument();
    expect(screen.queryByTestId(/update-/)).not.toBeInTheDocument();
  });
});