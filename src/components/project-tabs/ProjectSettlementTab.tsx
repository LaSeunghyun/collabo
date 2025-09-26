import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface ProjectSettlementTabProps {
  projectId: string;
}

// Mock settlement data
const mockSettlementData = {
  overview: {
    fundingGoal: 5000000,
    totalRaised: 3200000,
    totalSpent: 1200000,
    totalRevenue: 450000,
    distributedAmount: 180000,
    participantCount: 127,
    revenueParticipants: 45
  },
  budget: {
    categories: [
      {
        name: "스튜디오 녹음",
        budgeted: 2000000,
        spent: 800000,
        remaining: 1200000,
        status: "in-progress"
      },
      {
        name: "마스터링",
        budgeted: 800000,
        spent: 0,
        remaining: 800000,
        status: "pending"
      },
      {
        name: "앨범 커버 디자인",
        budgeted: 500000,
        spent: 300000,
        remaining: 200000,
        status: "in-progress"
      },
      {
        name: "물리 앨범 제작",
        budgeted: 1200000,
        spent: 0,
        remaining: 1200000,
        status: "pending"
      },
      {
        name: "홍보 및 마케팅",
        budgeted: 500000,
        spent: 100000,
        remaining: 400000,
        status: "in-progress"
      }
    ]
  },
  revenue: {
    streams: [
      {
        source: "디지털 스트리밍",
        amount: 250000,
        period: "2024년 1월",
        growth: "+15%"
      },
      {
        source: "굿즈 판매",
        amount: 150000,
        period: "2024년 1월",
        growth: "+25%"
      },
      {
        source: "라이브 공연",
        amount: 50000,
        period: "2024년 1월",
        growth: "0%"
      }
    ],
    distribution: {
      artistShare: 60, // 60%
      participantShare: 25, // 25%
      platformFee: 10, // 10%
      operatingCost: 5 // 5%
    }
  },
  transactions: [
    {
      id: "1",
      date: "2024-01-25",
      type: "expense",
      category: "스튜디오 녹음",
      amount: 800000,
      description: "1월 스튜디오 사용료",
      receipt: "receipt_001.pdf"
    },
    {
      id: "2",
      date: "2024-01-20",
      type: "expense", 
      category: "앨범 커버 디자인",
      amount: 300000,
      description: "디자인 1차 작업비",
      receipt: "receipt_002.pdf"
    },
    {
      id: "3",
      date: "2024-01-15",
      type: "revenue",
      category: "스트리밍",
      amount: 250000,
      description: "1월 스트리밍 수익",
      receipt: "revenue_001.pdf"
    },
    {
      id: "4",
      date: "2024-01-10",
      type: "distribution",
      category: "수익 분배",
      amount: 180000,
      description: "참여자 수익 분배 (1월)",
      receipt: "distribution_001.pdf"
    }
  ]
};

export function ProjectSettlementTab({ projectId }: ProjectSettlementTabProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isSupporter, setIsSupporter] = useState(true); // 실제로는 사용자 참여 상태 확인

  const data = mockSettlementData;
  const fundingProgress = (data.overview.totalRaised / data.overview.fundingGoal) * 100;
  const budgetUsage = (data.overview.totalSpent / data.overview.totalRaised) * 100;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + "원";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "expense":
        return "💸";
      case "revenue":
        return "💰";
      case "distribution":
        return "📊";
      default:
        return "📋";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "expense":
        return 'var(--status-error)';
      case "revenue":
        return 'var(--status-success)';
      case "distribution":
        return 'var(--status-info)';
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI 카드 4분할 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-8)' }}>🎯</div>
            <h3 style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              목표 달성률
            </h3>
            <p style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              {Math.round(fundingProgress)}%
            </p>
            <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
              {formatCurrency(data.overview.totalRaised)} / {formatCurrency(data.overview.fundingGoal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-8)' }}>📊</div>
            <h3 style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              예산 집행률
            </h3>
            <p style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              {Math.round(budgetUsage)}%
            </p>
            <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
              {formatCurrency(data.overview.totalSpent)} 집행
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-8)' }}>💰</div>
            <h3 style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              총 수익
            </h3>
            <p style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              {formatCurrency(data.overview.totalRevenue)}
            </p>
            <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
              이번 달 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-8)' }}>🤝</div>
            <h3 style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              분배 완료
            </h3>
            <p style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              {formatCurrency(data.overview.distributedAmount)}
            </p>
            <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
              {data.overview.revenueParticipants}명에게 분배
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="budget">예산</TabsTrigger>
          <TabsTrigger value="revenue">수익</TabsTrigger>
          <TabsTrigger value="transactions">거래내역</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
                프로젝트 재정 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 style={{ fontSize: 'var(--text-h3)', marginBottom: 'var(--space-12)', color: 'var(--text-primary)' }}>펀딩 현황</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>목표 금액</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                        {formatCurrency(data.overview.fundingGoal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>모금 금액</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                        {formatCurrency(data.overview.totalRaised)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>참여자 수</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                        {data.overview.participantCount}명
                      </span>
                    </div>
                    <Progress value={fundingProgress} />
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 'var(--text-h3)', marginBottom: 'var(--space-12)', color: 'var(--text-primary)' }}>예산 사용</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>총 예산</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                        {formatCurrency(data.overview.totalRaised)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>사용된 예산</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                        {formatCurrency(data.overview.totalSpent)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>잔여 예산</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                        {formatCurrency(data.overview.totalRaised - data.overview.totalSpent)}
                      </span>
                    </div>
                    <Progress value={budgetUsage} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 투명성 인증 */}
          <Card style={{ backgroundColor: 'var(--background-muted)' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span style={{ fontSize: '24px' }}>✅</span>
                <h4 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  투명한 정산 인증
                </h4>
              </div>
              <div className="grid md:grid-cols-3 gap-4" style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>모든 거래내역 공개</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <span>영수증 첨부 의무</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <span>실시간 수익 분배</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 예산 탭 */}
        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
                예산 카테고리별 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.budget.categories.map((category, index) => {
                  const usageRate = (category.spent / category.budgeted) * 100;
                  return (
                    <div key={index} className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {category.name}
                          </h5>
                          <Badge 
                            variant="outline" 
                            style={{ 
                              fontSize: 'var(--text-caption)',
                              color: category.status === 'pending' ? 'var(--text-secondary)' : 'var(--status-info)'
                            }}
                          >
                            {category.status === 'pending' ? '대기중' : '진행중'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {formatCurrency(category.spent)} / {formatCurrency(category.budgeted)}
                          </p>
                          <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                            {Math.round(usageRate)}% 사용
                          </p>
                        </div>
                      </div>
                      <Progress value={usageRate} />
                      <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)', marginTop: 'var(--space-8)' }}>
                        잔여: {formatCurrency(category.remaining)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 수익 탭 */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
                수익 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 style={{ fontSize: 'var(--text-h3)', marginBottom: 'var(--space-12)', color: 'var(--text-primary)' }}>수익원별 현황</h4>
                  <div className="space-y-4">
                    {data.revenue.streams.map((stream, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded" style={{ borderColor: 'var(--border-light)' }}>
                        <div>
                          <p style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>{stream.source}</p>
                          <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>{stream.period}</p>
                        </div>
                        <div className="text-right">
                          <p style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {formatCurrency(stream.amount)}
                          </p>
                          <p style={{ 
                            fontSize: 'var(--text-body-m)', 
                            color: stream.growth === '0%' ? 'var(--text-secondary)' : 'var(--status-success)'
                          }}>
                            {stream.growth}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 'var(--text-h3)', marginBottom: 'var(--space-12)', color: 'var(--text-primary)' }}>수익 분배 구조</h4>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--background-muted)' }}>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>아티스트</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                            {data.revenue.distribution.artistShare}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>참여자 분배</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                            {data.revenue.distribution.participantShare}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>플랫폼 수수료</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                            {data.revenue.distribution.platformFee}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>운영비</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                            {data.revenue.distribution.operatingCost}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 거래내역 탭 */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
                  거래 내역
                </CardTitle>
                {!isSupporter && (
                  <Badge variant="outline">참여자만 열람 가능</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isSupporter ? (
                <div className="space-y-4">
                  {data.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center gap-4 p-4 border rounded-lg" style={{ borderColor: 'var(--border-light)' }}>
                      <div style={{ fontSize: '24px' }}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                              {transaction.description}
                            </p>
                            <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                              {transaction.category} • {formatDate(transaction.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p style={{ 
                              fontSize: 'var(--text-body-l)', 
                              fontWeight: 'var(--font-weight-medium)',
                              color: getTransactionColor(transaction.type)
                            }}>
                              {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                            </p>
                            <Button variant="ghost" size="sm" style={{ fontSize: 'var(--text-caption)' }}>
                              영수증 보기
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-muted)' }}>
                    <span style={{ fontSize: '24px' }}>🔒</span>
                  </div>
                  <h3 style={{ fontSize: 'var(--text-h3)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)' }}>
                    참여자 전용 콘텐츠
                  </h3>
                  <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)', marginBottom: 'var(--space-16)' }}>
                    거래 내역은 프로젝트에 참여한 분들만 확인할 수 있습니다.
                  </p>
                  <Button 
                    style={{
                      backgroundColor: 'var(--action-primary-bg)',
                      color: 'var(--action-primary-text)'
                    }}
                  >
                    프로젝트 참여하고 보기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}