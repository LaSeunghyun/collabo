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

        setSettlementError(error instanceof Error ? error.message : '?�산 ?�보�?불러?��? 못했?�니??');
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
            ?�들???�포?�로 ?�성?�는 공연. 참여???�드백을 바탕?�로 매주 ?�나리오?� 무�?�??�데?�트?�니??
          </p>
          <p>
            ?�리미엄 ?�켓�?메�?버스 중계, ?�정??굿즈까�? ?�양??리워?��? ?�공?�며, 글로벌 ?�과???�시�??�터?�션??지?�합?�다.
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
              <p className="mt-1 text-xs text-white/60">9??1주차 ??콘셉???�자???�정</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white">Live Recording</h4>
              <p className="mt-1 text-xs text-white/60">10??4주차 ???�이�?공연 진행</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white">Settlement</h4>
              <p className="mt-1 text-xs text-white/60">11??1주차 ???�산 리포??공유</p>
            </div>
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="settlement" className="space-y-4 text-sm text-white/70">
          {isSettlementLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              ?�산 ?�이?��? 불러?�는 중입?�다...
            </div>
          ) : settlementError ? (
            <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
              {settlementError}
            </div>
          ) : latestSettlement ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60">최신 ?�산 금액</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {currencyFormatter.format(latestSettlement.totalAmount)}
                </p>
                <p className="mt-2 text-xs text-white/60">
                  ?�작??{currencyFormatter.format(latestSettlement.creatorShare)} · ?�랫??' '}
                  {currencyFormatter.format(latestSettlement.platformShare)}
                </p>
                <p className="mt-2 text-xs text-white/50">
                  {latestSettlement.distributed ? '분배 ?�료' : '분배 ?��?} ·{' '}
                  {dateFormatter.format(new Date(latestSettlement.createdAt))}
                </p>
              </div>

              {settlementHistory.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">?�산 ?�스?�리</p>
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
                        <span className="text-white/40">{item.distributed ? '분배 ?�료' : '분배 준�?}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              ?�직 ?�산 ?�역???�습?�다. 목표 금액???�성?�면 ?�산 리포?��? ?�동?�로 갱신?�니??
            </div>
          )}
        </TabsPrimitive.Content>
      </div>
    </TabsPrimitive.Root>
  );
}
