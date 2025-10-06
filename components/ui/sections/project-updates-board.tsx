'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Edit3, Paperclip, Plus, ShieldCheck, Trash2, X } from 'lucide-react';

import { CommunityPostCard } from '@/components/ui/sections/community-board';
import type { CommunityPost } from '@/lib/data/community';
// PostVisibility enum removed - using string type

type ProjectUpdateAttachment = {
  url: string;
  label?: string | null;
  type?: string | null;
};

type ProjectUpdateMilestone = {
  id: string;
  title: string;
  status: string;
};

type ProjectUpdate = {
  id: string;
  title: string;
  content: string;
  visibility: 'PUBLIC' | 'SUPPORTERS' | 'PRIVATE';
  attachments: ProjectUpdateAttachment[];
  milestone: ProjectUpdateMilestone | null;
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: number;
  liked: boolean;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  canEdit: boolean;
};

type UpdateFormState = {
  title: string;
  content: string;
  visibility: 'PUBLIC' | 'SUPPORTERS' | 'PRIVATE';
  milestoneId: string;
  attachments: ProjectUpdateAttachment[];
  attachmentDraft: {
    url: string;
    label: string;
  };
};

type CreateUpdatePayload = {
  title: string;
  content: string;
  visibility: 'PUBLIC' | 'SUPPORTERS' | 'PRIVATE';
  attachments: ProjectUpdateAttachment[];
  milestoneId: string | null;
};

type UpdateUpdatePayload = Partial<CreateUpdatePayload>;

const emptyFormState: UpdateFormState = {
  title: '',
  content: '',
  visibility: 'PUBLIC',
  milestoneId: '',
  attachments: [],
  attachmentDraft: {
    url: '',
    label: ''
  }
};

const normalizeUpdate = (payload: any): ProjectUpdate => ({
  id: String(payload.id),
  title: String(payload.title ?? ''),
  content: String(payload.content ?? ''),
  visibility: (payload.visibility ?? 'PUBLIC') as 'PUBLIC' | 'SUPPORTERS' | 'PRIVATE',
  attachments: Array.isArray(payload.attachments)
    ? payload.attachments.map((item: any) => ({
      url: String(item.url ?? ''),
      label: item.label ?? null,
      type: item.type ?? null
    }))
    : [],
  milestone: payload.milestone
    ? {
      id: String(payload.milestone.id),
      title: String(payload.milestone.title ?? ''),
      status: String(payload.milestone.status ?? '')
    }
    : null,
  createdAt: String(payload.createdAt ?? new Date().toISOString()),
  updatedAt: String(payload.updatedAt ?? payload.createdAt ?? new Date().toISOString()),
  likes: Number(payload.likes ?? 0),
  comments: Number(payload.comments ?? 0),
  liked: Boolean(payload.liked),
  author: {
    id: String(payload.author?.id ?? ''),
    name: payload.author?.name ?? null,
    avatarUrl: payload.author?.avatarUrl ?? null
  },
  canEdit: Boolean(payload.canEdit)
});

const useProjectUpdates = (projectId: string) =>
  useQuery<ProjectUpdate[]>({
    queryKey: ['projects', projectId, 'updates'],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/updates`);
      if (!res.ok) {
        throw new Error('?ÖÎç∞?¥Ìä∏Î•?Î∂àÎü¨?§Ï? Î™ªÌñà?µÎãà??');
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(normalizeUpdate);
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000
  });

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const toCommunityPost = (update: ProjectUpdate): CommunityPost => ({
  id: update.id,
  title: update.title,
  content: update.content,
  likes: update.likes,
  comments: update.comments,
  dislikes: 0,
  reports: 0,
  category: 'general',
  createdAt: update.createdAt,
  liked: update.liked,
  disliked: false,
  isPinned: false,
  isTrending: false,
  author: {
    id: update.author.id,
    name: update.author.name || 'Unknown',
    avatarUrl: update.author.avatarUrl
  }
});

interface ProjectUpdatesBoardProps {
  projectId: string;
  canManageUpdates?: boolean;
}

export function ProjectUpdatesBoard({ projectId, canManageUpdates = false }: ProjectUpdatesBoardProps) {
  const queryClient = useQueryClient();
  const { data: updates = [], isLoading, isError } = useProjectUpdates(projectId);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerState, setComposerState] = useState<UpdateFormState>(emptyFormState);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<UpdateFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const toggleLikeMutation = useMutation<
    CommunityPost,
    Error,
    { updateId: string; like: boolean },
    { previous: ProjectUpdate[] | undefined }
  >({
    mutationFn: async ({ updateId, like }) => {
      const res = await fetch(`/api/community/${updateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: like ? 'like' : 'unlike' })
      });

      if (!res.ok) {
        throw new Error('Ï¢ãÏïÑ?îÎ? Î≥ÄÍ≤ΩÌïòÏßÄ Î™ªÌñà?µÎãà??');
      }

      return (await res.json()) as CommunityPost;
    },
    onMutate: async ({ updateId, like }) => {
      const previous = queryClient.getQueryData<ProjectUpdate[]>(['projects', projectId, 'updates']);
      if (!previous) {
        return { previous };
      }

      queryClient.setQueryData<ProjectUpdate[]>(['projects', projectId, 'updates'], (current) =>
        current?.map((item) =>
          item.id === updateId
            ? {
              ...item,
              liked: like,
              likes: Math.max(0, item.likes + (like ? 1 : -1))
            }
            : item
        ) ?? []
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId, 'updates'], context.previous);
      }
    },
    onSuccess: (post) => {
      queryClient.setQueryData<ProjectUpdate[]>(['projects', projectId, 'updates'], (current) =>
        current?.map((item) =>
          item.id === post.id
            ? {
              ...item,
              likes: post.likes,
              comments: post.comments,
              liked: post.liked ?? false
            }
            : item
        ) ?? []
      );
    }
  });

  const createMutation = useMutation<ProjectUpdate, Error, CreateUpdatePayload>({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/projects/${projectId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.message ?? '?ÖÎç∞?¥Ìä∏Î•??ùÏÑ±?òÏ? Î™ªÌñà?µÎãà??');
      }

      const json = await res.json();
      return normalizeUpdate(json);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<ProjectUpdate[]>(['projects', projectId, 'updates'], (current) => [
        created,
        ...(current ?? [])
      ]);
      setComposerState(emptyFormState);
      setComposerOpen(false);
      setComposerError(null);
    },
    onError: (error) => {
      setComposerError(error.message);
    }
  });

  const updateMutation = useMutation<ProjectUpdate, Error, { updateId: string; data: UpdateUpdatePayload }, { previous: ProjectUpdate[] | undefined }>({
    mutationFn: async ({ updateId, data }) => {
      const res = await fetch(`/api/projects/${projectId}/updates/${updateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.message ?? '?ÖÎç∞?¥Ìä∏Î•??òÏ†ï?òÏ? Î™ªÌñà?µÎãà??');
      }

      const json = await res.json();
      return normalizeUpdate(json);
    },
    onMutate: async ({ updateId, data }) => {
      const previous = queryClient.getQueryData<ProjectUpdate[]>(['projects', projectId, 'updates']);
      if (!previous) {
        return { previous };
      }

      queryClient.setQueryData<ProjectUpdate[]>(['projects', projectId, 'updates'], (current) =>
        current?.map((item) =>
          item.id === updateId
            ? {
              ...item,
              title: data.title ?? item.title,
              content: data.content ?? item.content,
              visibility: data.visibility ?? item.visibility,
              attachments: data.attachments ?? item.attachments,
              milestone:
                data.milestoneId !== undefined
                  ? data.milestoneId === null
                    ? null
                    : item.milestone
                  : item.milestone
            }
            : item
        ) ?? []
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId, 'updates'], context.previous);
      }
      setEditError(error.message);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ProjectUpdate[]>(['projects', projectId, 'updates'], (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ?? []
      );
      setEditingId(null);
      setEditState(null);
      setEditError(null);
    }
  });

  const deleteMutation = useMutation<void, Error, { updateId: string }, { previous: ProjectUpdate[] | undefined }>({
    mutationFn: async ({ updateId }) => {
      const res = await fetch(`/api/projects/${projectId}/updates/${updateId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.message ?? '?ÖÎç∞?¥Ìä∏Î•???†ú?òÏ? Î™ªÌñà?µÎãà??');
      }
    },
    onMutate: async ({ updateId }) => {
      const previous = queryClient.getQueryData<ProjectUpdate[]>(['projects', projectId, 'updates']);
      if (!previous) {
        return { previous };
      }

      queryClient.setQueryData<ProjectUpdate[]>(['projects', projectId, 'updates'], (current) =>
        current?.filter((item) => item.id !== updateId) ?? []
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId, 'updates'], context.previous);
      }
      setEditError(error.message);
    }
  });

  const visibleUpdates = useMemo(() => updates, [updates]);

  const handleAddAttachment = (state: UpdateFormState, setState: (value: UpdateFormState) => void) => {
    const trimmedUrl = state.attachmentDraft.url.trim();
    if (!trimmedUrl) {
      return;
    }

    setState({
      ...state,
      attachments: [
        ...state.attachments,
        {
          url: trimmedUrl,
          label: state.attachmentDraft.label.trim() ? state.attachmentDraft.label.trim() : null
        }
      ],
      attachmentDraft: { url: '', label: '' }
    });
  };

  const handleRemoveAttachment = (
    state: UpdateFormState,
    setState: (value: UpdateFormState) => void,
    index: number
  ) => {
    setState({
      ...state,
      attachments: state.attachments.filter((_, idx) => idx !== index)
    });
  };

  const submitCreate = () => {
    if (!composerState.title.trim() || !composerState.content.trim()) {
      setComposerError('?úÎ™©Í≥??¥Ïö©???ÖÎ†•?¥Ï£º?∏Ïöî.');
      return;
    }

    const payload: CreateUpdatePayload = {
      title: composerState.title.trim(),
      content: composerState.content.trim(),
      visibility: composerState.visibility,
      attachments: composerState.attachments,
      milestoneId: composerState.milestoneId.trim() ? composerState.milestoneId.trim() : null
    };

    createMutation.mutate(payload);
  };

  const submitEdit = () => {
    if (!editingId || !editState) {
      return;
    }

    if (!editState.title.trim() || !editState.content.trim()) {
      setEditError('?úÎ™©Í≥??¥Ïö©???ÖÎ†•?¥Ï£º?∏Ïöî.');
      return;
    }

    const payload: UpdateUpdatePayload = {
      title: editState.title.trim(),
      content: editState.content.trim(),
      visibility: editState.visibility,
      attachments: editState.attachments,
      milestoneId: editState.milestoneId.trim() ? editState.milestoneId.trim() : null
    };

    updateMutation.mutate({ updateId: editingId, data: payload });
  };

  return (
    <section className="space-y-8">
      {canManageUpdates ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">?ÑÎ°ú?ùÌä∏ ?ÖÎç∞?¥Ìä∏</h3>
            <button
              type="button"
              onClick={() => {
                setComposerOpen((prev) => !prev);
                setComposerError(null);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {composerOpen ? (
                <>
                  <X className="h-4 w-4" />
                  ?´Í∏∞
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  ???ÖÎç∞?¥Ìä∏ ?ëÏÑ±
                </>
              )}
            </button>
          </header>

          {composerOpen ? (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="update-title">
                  ?úÎ™©
                </label>
                <input
                  id="update-title"
                  type="text"
                  value={composerState.title}
                  onChange={(event) =>
                    setComposerState({ ...composerState, title: event.target.value })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="?¨Îì§?êÍ≤å Í≥µÏú†???åÏãù???ÅÏñ¥Ï£ºÏÑ∏??
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="update-content">
                  ?¥Ïö©
                </label>
                <textarea
                  id="update-content"
                  value={composerState.content}
                  onChange={(event) =>
                    setComposerState({ ...composerState, content: event.target.value })
                  }
                  className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="?ÖÎç∞?¥Ìä∏ ?¥Ïö©???ÅÏÑ∏???ëÏÑ±?¥Ï£º?∏Ïöî"
                />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-white/80">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="update-visibility"
                    value="PUBLIC"
                    checked={composerState.visibility === 'PUBLIC'}
                    onChange={() =>
                      setComposerState({ ...composerState, visibility: 'PUBLIC' })
                    }
                  />
                  ?ÑÏ≤¥ Í≥µÍ∞ú
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="update-visibility"
                    value="SUPPORTERS"
                    checked={composerState.visibility === 'SUPPORTERS'}
                    onChange={() =>
                      setComposerState({ ...composerState, visibility: 'SUPPORTERS' })
                    }
                  />
                  ?ÑÏõê???ÑÏö©
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-white/80">Ï≤®Î? ?êÎ£å</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="url"
                    placeholder="?êÎ£å ÎßÅÌÅ¨"
                    value={composerState.attachmentDraft.url}
                    onChange={(event) =>
                      setComposerState({
                        ...composerState,
                        attachmentDraft: {
                          ...composerState.attachmentDraft,
                          url: event.target.value
                        }
                      })
                    }
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <input
                    type="text"
                    placeholder="?úÏãú ?¥Î¶Ñ (?†ÌÉù)"
                    value={composerState.attachmentDraft.label}
                    onChange={(event) =>
                      setComposerState({
                        ...composerState,
                        attachmentDraft: {
                          ...composerState.attachmentDraft,
                          label: event.target.value
                        }
                      })
                    }
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAttachment(composerState, setComposerState)}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm text-primary"
                  >
                    <Plus className="h-4 w-4" /> Ï∂îÍ?
                  </button>
                </div>
                {composerState.attachments.length ? (
                  <ul className="space-y-2 text-sm text-white/70">
                    {composerState.attachments.map((attachment, index) => (
                      <li key={`${attachment.url}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-2">
                        <span className="truncate">
                          {attachment.label ? `${attachment.label} ¬∑ ` : ''}
                          {attachment.url}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(composerState, setComposerState, index)}
                          className="text-xs text-red-300"
                        >
                          ??†ú
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="update-milestone">
                  ?∞Í≤∞??ÎßàÏùº?§ÌÜ§ (?†ÌÉù)
                </label>
                <input
                  id="update-milestone"
                  type="text"
                  value={composerState.milestoneId}
                  onChange={(event) =>
                    setComposerState({ ...composerState, milestoneId: event.target.value })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="ÎßàÏùº?§ÌÜ§ IDÎ•??ÖÎ†•?òÏÑ∏??
                />
              </div>

              {composerError ? <p className="text-sm text-red-400">{composerError}</p> : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={submitCreate}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {createMutation.isPending ? '?ëÏÑ± Ï§?..' : '?ÖÎç∞?¥Ìä∏ ?±Î°ù'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? <p className="text-sm text-white/60">Î∂àÎü¨?§Îäî Ï§ëÏûÖ?àÎã§...</p> : null}
      {isError ? <p className="text-sm text-red-400">?ÖÎç∞?¥Ìä∏Î•?Î∂àÎü¨?§Ï? Î™ªÌñà?µÎãà??</p> : null}

      <ol className="relative ml-2 space-y-8 border-l border-white/10 pl-6">
        {visibleUpdates.map((update) => {
          const isEditing = editingId === update.id && editState !== null;

          return (
            <li key={update.id} className="relative">
              <span className="absolute -left-[1.375rem] top-6 inline-flex h-3 w-3 items-center justify-center rounded-full border-2 border-primary bg-neutral-950" />

              <CommunityPostCard
                post={toCommunityPost(update)}
                onToggleLike={(like) => toggleLikeMutation.mutate({ updateId: update.id, like })}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                <div className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <time dateTime={update.createdAt}>{formatDateTime(update.createdAt)}</time>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {update.visibility === 'SUPPORTERS' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                      <ShieldCheck className="h-3 w-3" /> ?ÑÏõê???ÑÏö©
                    </span>
                  ) : null}
                  {update.milestone ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-primary/20 px-3 py-1 text-[11px] font-semibold text-primary">
                      {update.milestone.title}
                    </span>
                  ) : null}
                </div>
              </div>

              {isEditing && editState ? (
                <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80" htmlFor={`edit-title-${update.id}`}>
                      ?úÎ™©
                    </label>
                    <input
                      id={`edit-title-${update.id}`}
                      type="text"
                      value={editState.title}
                      onChange={(event) =>
                        setEditState({ ...editState, title: event.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80" htmlFor={`edit-content-${update.id}`}>
                      ?¥Ïö©
                    </label>
                    <textarea
                      id={`edit-content-${update.id}`}
                      value={editState.content}
                      onChange={(event) =>
                        setEditState({ ...editState, content: event.target.value })
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-white/80">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`visibility-${update.id}`}
                        value="PUBLIC"
                        checked={editState.visibility === 'PUBLIC'}
                        onChange={() =>
                          setEditState({ ...editState, visibility: 'PUBLIC' })
                        }
                      />
                      ?ÑÏ≤¥ Í≥µÍ∞ú
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`visibility-${update.id}`}
                        value="SUPPORTERS"
                        checked={editState.visibility === 'SUPPORTERS'}
                        onChange={() =>
                          setEditState({ ...editState, visibility: 'SUPPORTERS' })
                        }
                      />
                      ?ÑÏõê???ÑÏö©
                    </label>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white/80">Ï≤®Î? ?êÎ£å</p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="url"
                        placeholder="?êÎ£å ÎßÅÌÅ¨"
                        value={editState.attachmentDraft.url}
                        onChange={(event) =>
                          setEditState({
                            ...editState,
                            attachmentDraft: {
                              ...editState.attachmentDraft,
                              url: event.target.value
                            }
                          })
                        }
                        className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="text"
                        placeholder="?úÏãú ?¥Î¶Ñ (?†ÌÉù)"
                        value={editState.attachmentDraft.label}
                        onChange={(event) =>
                          setEditState({
                            ...editState,
                            attachmentDraft: {
                              ...editState.attachmentDraft,
                              label: event.target.value
                            }
                          })
                        }
                        className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          editState && handleAddAttachment(editState, (value) => setEditState(value))
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm text-primary"
                      >
                        <Plus className="h-4 w-4" /> Ï∂îÍ?
                      </button>
                    </div>
                    {editState.attachments.length ? (
                      <ul className="space-y-2 text-sm text-white/70">
                        {editState.attachments.map((attachment, index) => (
                          <li key={`${attachment.url}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2">
                            <span className="truncate">
                              {attachment.label ? `${attachment.label} ¬∑ ` : ''}
                              {attachment.url}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                editState &&
                                handleRemoveAttachment(editState, (value) => setEditState(value), index)
                              }
                              className="text-xs text-red-300"
                            >
                              ??†ú
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80" htmlFor={`edit-milestone-${update.id}`}>
                      ?∞Í≤∞??ÎßàÏùº?§ÌÜ§ (?†ÌÉù)
                    </label>
                    <input
                      id={`edit-milestone-${update.id}`}
                      type="text"
                      value={editState.milestoneId}
                      onChange={(event) =>
                        setEditState({ ...editState, milestoneId: event.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="ÎßàÏùº?§ÌÜ§ IDÎ•??ÖÎ†•?òÏÑ∏??
                    />
                  </div>

                  {editError ? <p className="text-sm text-red-400">{editError}</p> : null}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditState(null);
                        setEditError(null);
                      }}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70"
                    >
                      Ï∑®ÏÜå
                    </button>
                    <button
                      type="button"
                      onClick={submitEdit}
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {updateMutation.isPending ? '?Ä??Ï§?..' : 'Î≥ÄÍ≤??¨Ìï≠ ?Ä??}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {update.attachments.length ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                        Ï≤®Î? ?êÎ£å
                      </p>
                      <ul className="space-y-2">
                        {update.attachments.map((attachment, index) => (
                          <li
                            key={`${attachment.url}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80"
                          >
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 hover:text-primary"
                            >
                              <Paperclip className="h-4 w-4" />
                              <span className="truncate">{attachment.label ?? attachment.url}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {update.canEdit ? (
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(update.id);
                          setEditError(null);
                          setEditState({
                            title: update.title,
                            content: update.content,
                            visibility: update.visibility,
                            milestoneId: update.milestone?.id ?? '',
                            attachments: update.attachments,
                            attachmentDraft: { url: '', label: '' }
                          });
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/70 hover:text-white"
                      >
                        <Edit3 className="h-3 w-3" /> ?òÏ†ï
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate({ updateId: update.id })}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full border border-red-400/40 px-4 py-2 text-red-300 hover:text-red-200 disabled:opacity-60"
                      >
                        <Trash2 className="h-3 w-3" /> ??†ú
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
