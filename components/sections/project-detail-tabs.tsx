'use client';

import { useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { CommunityBoard } from '@/components/sections/community-board';

const tabItems = [
  { value: 'story', label: 'Story' },
  { value: 'updates', label: 'Updates' },
  { value: 'community', label: 'Community' },
  { value: 'roadmap', label: 'Roadmap' },
  { value: 'settlement', label: 'Settlement' }
];

export function ProjectDetailTabs({ projectId }: { projectId: string }) {
  const [current, setCurrent] = useState('story');

  return (
    <TabsPrimitive.Root value={current} onValueChange={setCurrent} className="w-full">
      <TabsPrimitive.List className="flex flex-wrap gap-2 rounded-full bg-white/5 p-2">
        {tabItems.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              current === tab.value ? 'bg-primary text-primary-foreground' : 'text-white/70'
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
        <TabsPrimitive.Content value="updates" className="space-y-4 text-sm text-white/70">
          <ul className="space-y-3">
            <li>• 10월 3주차 – 사운드 체크 완료, 협력 스튜디오 확정</li>
            <li>• 10월 2주차 – 팬아트 공모전 오픈</li>
            <li>• 10월 1주차 – 티저 영상 공개</li>
          </ul>
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
          <p>목표 금액의 85% 달성 – 정산 준비 중입니다.</p>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">총 펀딩 금액</p>
            <p className="text-lg font-semibold text-white">₩94,000,000</p>
            <p className="mt-2 text-xs text-white/60">후원자 2,200명 · 예상 분배율 70% / 30%</p>
          </div>
        </TabsPrimitive.Content>
      </div>
    </TabsPrimitive.Root>
  );
}
