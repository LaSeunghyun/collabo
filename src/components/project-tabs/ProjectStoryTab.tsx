import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface ProjectStoryTabProps {
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    rewardType: "reward" | "revenue" | "both";
    targetAmount: number;
    artist: {
      name: string;
      verified: boolean;
    };
  };
}

export function ProjectStoryTab({ project }: ProjectStoryTabProps) {
  return (
    <div className="space-y-8">
      {/* 프로젝트 소개 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
            프로젝트 소개
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p style={{ fontSize: 'var(--text-body-l)', lineHeight: 'var(--line-height-body-l)', color: 'var(--text-primary)' }}>
              안녕하세요, 인디 밴드 '라이트닝'입니다. 
            </p>
            <p style={{ fontSize: 'var(--text-body-l)', lineHeight: 'var(--line-height-body-l)', color: 'var(--text-primary)', marginTop: 'var(--space-16)' }}>
              저희는 5년간 함께 음악을 만들어온 4인조 밴드로, 드디어 첫 정규앨범을 제작하게 되었습니다. 
              이번 앨범은 '도시 속 청춘의 이야기'를 주제로, 현대 사회를 살아가는 젊은이들의 고민과 꿈을 담았습니다.
            </p>
            <p style={{ fontSize: 'var(--text-body-l)', lineHeight: 'var(--line-height-body-l)', color: 'var(--text-primary)', marginTop: 'var(--space-16)' }}>
              앨범 제작 과정을 투명하게 공개하며, 팬 여러분과 함께 만들어가고 싶습니다. 
              스튜디오 녹음부터 마스터링, 앨범 커버 디자인까지 모든 과정을 실시간으로 공유할 예정입니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 리워드 및 수익 분배 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
            참여 방식
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 리워드형 참여 */}
            <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--background-muted)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">리워드형</Badge>
                <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  굿즈 & 경험 리워드
                </span>
              </div>
              <ul className="space-y-2" style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                <li>• 10,000원: 디지털 앨범 + 감사 메시지</li>
                <li>• 30,000원: CD + 포토카드 세트</li>
                <li>• 50,000원: LP + 한정판 티셔츠</li>
                <li>• 100,000원: 앨범 제작 과정 참관 + 사인회 참여</li>
              </ul>
            </div>

            {/* 수익분배형 참여 */}
            <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--background-muted)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">수익분배형</Badge>
                <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  앨범 수익 연동
                </span>
              </div>
              <ul className="space-y-2" style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                <li>• 스트리밍 수익의 일정 비율 분배</li>
                <li>• 콘서트 수익 공유</li>
                <li>• 굿즈 판매 수익 분배</li>
                <li>• 투명한 정산 내역 제공</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--background-surface)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-12)' }}>
              예상 수익 분배 구조
            </h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>제작비</p>
                <p style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>60%</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>플랫폼 수수료</p>
                <p style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>10%</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>아티스트</p>
                <p style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>20%</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>참여자 분배</p>
                <p style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>10%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 협업 파트너 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
            함께하는 파트너
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded" style={{ borderColor: 'var(--border-light)' }}>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span style={{ fontSize: 'var(--text-body-m)' }}>🎵</span>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  사운드 스튜디오
                </p>
                <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                  녹음 및 마스터링
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded" style={{ borderColor: 'var(--border-light)' }}>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span style={{ fontSize: 'var(--text-body-m)' }}>🎨</span>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  디자인 스튜디오
                </p>
                <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                  앨범 커버 디자인
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예산 계획 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
            예산 사용 계획
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>스튜디오 녹음비</span>
              <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>2,000,000원</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>마스터링</span>
              <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>800,000원</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>앨범 커버 디자인</span>
              <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>500,000원</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>물리 앨범 제작</span>
              <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>1,200,000원</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>홍보 및 마케팅</span>
              <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>500,000원</span>
            </div>
            <div className="flex justify-between items-center py-2 pt-4 border-t" style={{ borderColor: 'var(--border-medium)' }}>
              <span style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>총 예산</span>
              <span style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>5,000,000원</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA 버튼 */}
      <div className="flex justify-center pt-8">
        <Button size="lg" style={{
          backgroundColor: 'var(--action-primary-bg)',
          color: 'var(--action-primary-text)',
          fontSize: 'var(--text-body-l)',
          padding: 'var(--space-16) var(--space-32)'
        }}>
          지금 프로젝트 참여하기
        </Button>
      </div>
    </div>
  );
}