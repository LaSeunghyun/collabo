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

        setSettlementError(error instanceof Error ? error.message : '정산 정보를 불러오지 못했습니다.');
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
            팬들의 서포트로 완성되는 공연. 참여자 피드백을 바탕으로 매주 시나리오와 무대를 업데이트합니다.
          </p>
          <p>
            프리미엄 티켓과 메타버스 중계, 한정판 굿즈까지 다양한 리워드를 제공하며, 글로벌 팬과의 실시간 인터랙션을 지원합니다.
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
              <p className="mt-1 text-xs text-white/60">9월 1주차 – 콘셉트 디자인 확정</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white">Live Recording</h4>
              <p className="mt-1 text-xs text-white/60">10월 4주차 – 라이브 공연 진행</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white">Settlement</h4>
              <p className="mt-1 text-xs text-white/60">11월 1주차 – 정산 리포트 공유</p>
            </div>
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="settlement" className="space-y-4 text-sm text-white/70">
          {isSettlementLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              정산 데이터를 불러오는 중입니다...
            </div>
          ) : settlementError ? (
            <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
              {settlementError}
            </div>
          ) : latestSettlement ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60">최신 정산 금액</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {currencyFormatter.format(latestSettlement.totalAmount)}
                </p>
                <p className="mt-2 text-xs text-white/60">
                  제작자 {currencyFormatter.format(latestSettlement.creatorShare)} · 플랫폼{' '}
                  {currencyFormatter.format(latestSettlement.platformShare)}
                </p>
                <p className="mt-2 text-xs text-white/50">
                  {latestSettlement.distributed ? '분배 완료' : '분배 대기'} ·{' '}
                  {dateFormatter.format(new Date(latestSettlement.createdAt))}
                </p>
              </div>

              {settlementHistory.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">정산 히스토리</p>
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
                        <span className="text-white/40">{item.distributed ? '분배 완료' : '분배 준비'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              아직 정산 내역이 없습니다. 목표 금액을 달성하면 정산 리포트가 자동으로 갱신됩니다.
            </div>
          )}
        </TabsPrimitive.Content>
      </div>
    </TabsPrimitive.Root>
  );
}
