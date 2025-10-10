import React from 'react';

interface Update {
  id: string;
  title: string;
  content: string;
  projectTitle: string;
  createdAt: string;
}

interface ArtistUpdatesProps {
  updates: Update[];
}

export function ArtistUpdates({ updates }: ArtistUpdatesProps) {
  if (updates.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>아직 업데이트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <div key={update.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold text-white">{update.title}</h3>
          <p className="text-sm text-white/70 mt-2">{update.content}</p>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <span>{update.projectTitle}</span>
            <span>•</span>
            <span>{new Date(update.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
