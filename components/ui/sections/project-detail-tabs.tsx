'use client';

import { useEffect, useMemo, useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { CommunityBoard } from '@/components/ui/sections/community-board';
import { ProjectUpdatesBoard } from '@/components/ui/sections/project-updates-board';
import { fetchSettlement, SettlementRecord } from '@/lib/api/settlement';

const tabItems = [
  { value: 'story', label: 'Story' },
  { value: 'updates', label: 'Updates' },
  { value: 'community', label: 'Community' },
  { value: 'roadmap', label: 'Roadmap' },
  { value: 'settlement', label: 'Settlement' }
];

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export function ProjectDetailTabs({
  projectId,
  canManageUpdates = false
}: {
  projectId: string;
  canManageUpdates?: boolean;
}) {
  const [current, setCurrent] = useState('story');
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [isSettlementLoading, setIsSettlementLoading] = useState(false);

  useEffect(() => {
    if (current !== 'settlement') {
      return;
    }

    let active = true;

    const load = async (showLoading = false) => {
      if (showLoading) {
        setIsSettlementLoading(true);
      }

      try {
        const data = await fetchSettlement(projectId);
        if (!active) {
          return;
        }

        setSettlements(data);
        setSettlementError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setSettlementError(error instanceof Error ? error.message : '?•ì‚° ?•ë³´ë¥?ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ??');
      } finally {
        if (showLoading && active) {
          setIsSettlementLoading(false);
        }
      }
    };

    void load(true);
    const interval = window.setInterval(() => {
      void load();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [current, projectId]);

  const latestSettlement = useMemo(() => settlements.at(0) ?? null, [settlements]);
  const settlementHistory = useMemo(() => settlements.slice(1), [settlements]);

  return (
    <TabsPrimitive.Root value={current} onValueChange={setCurrent} className="w-full">
      <TabsPrimitive.List className="flex flex-wrap gap-2 rounded-full bg-white/5 p-2">
        {tabItems.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${current === tab.value ? 'bg-primary text-primary-foreground' : 'text-white/70'
              }`}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      <div className="mt-6 space-y-4">
        <TabsPrimitive.Content value="story" className="space-y-4 text-sm text-white/70">
          <p>
            ?¬ë“¤???œí¬?¸ë¡œ ?„ì„±?˜ëŠ” ê³µì—°. ì°¸ì—¬???¼ë“œë°±ì„ ë°”íƒ•?¼ë¡œ ë§¤ì£¼ ?œë‚˜ë¦¬ì˜¤?€ ë¬´ë?ë¥??…ë°?´íŠ¸?©ë‹ˆ??
          </p>
          <p>
            ?„ë¦¬ë¯¸ì—„ ?°ì¼“ê³?ë©”í?ë²„ìŠ¤ ì¤‘ê³„, ?œì •??êµ¿ì¦ˆê¹Œì? ?¤ì–‘??ë¦¬ì›Œ?œë? ?œê³µ?˜ë©°, ê¸€ë¡œë²Œ ?¬ê³¼???¤ì‹œê°??¸í„°?™ì…˜??ì§€?í•©?ˆë‹¤.
          </p>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="updates">
          <ProjectUpdatesBoard projectId={projectId} canManageUpdates={canManageUpdates} />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="community">
          <CommunityBoard projectId={projectId} />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="roadmap" className="space-y-4 text-sm text-white/70">
          <div className="grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white">Pre-production</h4>
              <p className="mt-1 text-xs text-white/60">9??1ì£¼ì°¨ ??ì½˜ì…‰???”ì???•ì •</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white">Live Recording</h4>
              <p className="mt-1 text-xs text-white/60">10??4ì£¼ì°¨ ???¼ì´ë¸?ê³µì—° ì§„í–‰</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white">Settlement</h4>
              <p className="mt-1 text-xs text-white/60">11??1ì£¼ì°¨ ???•ì‚° ë¦¬í¬??ê³µìœ </p>
            </div>
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="settlement" className="space-y-4 text-sm text-white/70">
          {isSettlementLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              ?•ì‚° ?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤‘ì…?ˆë‹¤...
            </div>
          ) : settlementError ? (
            <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
              {settlementError}
            </div>
          ) : latestSettlement ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60">ìµœì‹  ?•ì‚° ê¸ˆì•¡</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {currencyFormatter.format(latestSettlement.totalAmount)}
                </p>
                <p className="mt-2 text-xs text-white/60">
                  ?œì‘??{currencyFormatter.format(latestSettlement.creatorShare)} Â· ?Œë«??' '}
                  {currencyFormatter.format(latestSettlement.platformShare)}
                </p>
                <p className="mt-2 text-xs text-white/50">
                  {latestSettlement.distributed ? 'ë¶„ë°° ?„ë£Œ' : 'ë¶„ë°° ?€ê¸?} Â·{' '}
                  {dateFormatter.format(new Date(latestSettlement.createdAt))}
                </p>
              </div>

              {settlementHistory.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">?•ì‚° ?ˆìŠ¤? ë¦¬</p>
                  <ul className="space-y-3 text-xs text-white/60">
                    {settlementHistory.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-neutral-950/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-medium text-white/80">
                          {currencyFormatter.format(item.totalAmount)}
                        </span>
                        <span>{dateFormatter.format(new Date(item.createdAt))}</span>
                        <span className="text-white/40">{item.distributed ? 'ë¶„ë°° ?„ë£Œ' : 'ë¶„ë°° ì¤€ë¹?}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              ?„ì§ ?•ì‚° ?´ì—­???†ìŠµ?ˆë‹¤. ëª©í‘œ ê¸ˆì•¡???¬ì„±?˜ë©´ ?•ì‚° ë¦¬í¬?¸ê? ?ë™?¼ë¡œ ê°±ì‹ ?©ë‹ˆ??
            </div>
          )}
        </TabsPrimitive.Content>
      </div>
    </TabsPrimitive.Root>
  );
}
