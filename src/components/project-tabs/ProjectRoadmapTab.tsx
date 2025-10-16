import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

interface ProjectRoadmapTabProps {
  projectId: string;
}

// Mock roadmap data
const mockRoadmapData = {
  milestones: [
    {
      id: "1",
      title: "프로젝트 시작 및 기획",
      description: "프로젝트 계획 수립 및 팀 구성",
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      status: "completed",
      progress: 100,
      tasks: [
        { name: "프로젝트 기획안 작성", completed: true },
        { name: "팀원 모집 및 역할 분담", completed: true },
        { name: "예산 계획 수립", completed: true }
      ]
    },
    {
      id: "2",
      title: "사전 제작 단계",
      description: "곡 작업 및 편곡, 사전 녹음 준비",
      startDate: "2024-01-16", 
      endDate: "2024-02-15",
      status: "in-progress",
      progress: 70,
      tasks: [
        { name: "10곡 작사 및 작곡 완료", completed: true },
        { name: "편곡 작업", completed: true },
        { name: "데모 녹음", completed: false },
        { name: "스튜디오 예약", completed: false }
      ]
    },
    {
      id: "3",
      title: "본 녹음 및 믹싱",
      description: "전문 스튜디오에서 앨범 녹음",
      startDate: "2024-02-16",
      endDate: "2024-03-31",
      status: "upcoming",
      progress: 0,
      tasks: [
        { name: "보컬 녹음", completed: false },
        { name: "악기 녹음", completed: false },
        { name: "믹싱 작업", completed: false },
        { name: "마스터링", completed: false }
      ]
    },
    {
      id: "4", 
      title: "앨범 커버 및 디자인",
      description: "앨범 커버 디자인 및 패키징 디자인",
      startDate: "2024-03-01",
      endDate: "2024-04-15",
      status: "upcoming",
      progress: 0,
      tasks: [
        { name: "콘셉트 기획", completed: false },
        { name: "포토 촬영", completed: false },
        { name: "디자인 작업", completed: false },
        { name: "인쇄 준비", completed: false }
      ]
    },
    {
      id: "5",
      title: "물리 앨범 제작",
      description: "CD/LP 제작 및 굿즈 제작",
      startDate: "2024-04-16",
      endDate: "2024-05-31",
      status: "upcoming", 
      progress: 0,
      tasks: [
        { name: "CD 프레싱", completed: false },
        { name: "LP 제작", completed: false },
        { name: "굿즈 제작", completed: false },
        { name: "포장 및 배송 준비", completed: false }
      ]
    },
    {
      id: "6",
      title: "앨범 발매 및 홍보",
      description: "앨범 발매 및 프로모션 활동",
      startDate: "2024-06-01",
      endDate: "2024-06-30",
      status: "upcoming",
      progress: 0,
      tasks: [
        { name: "디지털 앨범 발매", completed: false },
        { name: "물리 앨범 배송", completed: false },
        { name: "홍보 활동", completed: false },
        { name: "라이브 공연", completed: false }
      ]
    }
  ],
  risks: [
    {
      id: "1",
      type: "delay",
      title: "스튜디오 예약 지연 가능성",
      description: "인기 스튜디오의 예약이 밀려 녹음 일정이 지연될 수 있습니다.",
      probability: "medium",
      impact: "medium",
      mitigation: "백업 스튜디오 3곳을 사전에 협의해두었습니다."
    },
    {
      id: "2", 
      type: "budget",
      title: "마스터링 비용 증가",
      description: "고품질 마스터링을 위해 추가 비용이 필요할 수 있습니다.",
      probability: "low",
      impact: "low", 
      mitigation: "예산의 10%를 예비비로 확보해두었습니다."
    }
  ]
};

export function ProjectRoadmapTab({ projectId }: ProjectRoadmapTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge style={{ backgroundColor: 'var(--status-success)', color: 'white' }}>완료</Badge>;
      case "in-progress":
        return <Badge style={{ backgroundColor: 'var(--status-info)', color: 'white' }}>진행중</Badge>;
      case "upcoming":
        return <Badge variant="outline">예정</Badge>;
      case "delayed":
        return <Badge style={{ backgroundColor: 'var(--status-alert)', color: 'white' }}>지연</Badge>;
      default:
        return <Badge variant="outline">미정</Badge>;
    }
  };

  const getRiskBadge = (probability: string, impact: string) => {
    if (probability === 'high' || impact === 'high') {
      return <Badge style={{ backgroundColor: 'var(--status-error)', color: 'white' }}>높음</Badge>;
    } else if (probability === 'medium' || impact === 'medium') {
      return <Badge style={{ backgroundColor: 'var(--status-alert)', color: 'white' }}>보통</Badge>;
    } else {
      return <Badge style={{ backgroundColor: 'var(--status-success)', color: 'white' }}>낮음</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* 전체 진행률 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
            전체 프로젝트 진행률
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>
                6단계 중 1단계 완료
              </span>
              <span style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                28%
              </span>
            </div>
            <Progress value={28} />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>완료</p>
                <p style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--status-success)' }}>1</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>진행중</p>
                <p style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--status-info)' }}>1</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>예정</p>
                <p style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>4</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 타임라인 */}
      <div className="space-y-6">
        <h3 style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          프로젝트 타임라인
        </h3>
        
        <div className="relative">
          {/* 타임라인 선 */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ backgroundColor: 'var(--border-medium)' }}></div>
          
          <div className="space-y-8">
            {mockRoadmapData.milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex items-start gap-6">
                {/* 타임라인 도트 */}
                <div 
                  className="relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center"
                  style={{
                    backgroundColor: milestone.status === 'completed' ? 'var(--status-success)' : 
                                   milestone.status === 'in-progress' ? 'var(--status-info)' : 'var(--background-surface)',
                    borderColor: milestone.status === 'completed' ? 'var(--status-success)' : 
                                milestone.status === 'in-progress' ? 'var(--status-info)' : 'var(--border-medium)'
                  }}
                >
                  <span style={{ 
                    fontSize: 'var(--text-body-m)', 
                    fontWeight: 'bold',
                    color: milestone.status === 'completed' || milestone.status === 'in-progress' ? 'white' : 'var(--text-secondary)'
                  }}>
                    {index + 1}
                  </span>
                </div>

                {/* 마일스톤 카드 */}
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {milestone.title}
                          </h4>
                          {getStatusBadge(milestone.status)}
                        </div>
                        <p style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
                          {milestone.description}
                        </p>
                        <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                          {formatDate(milestone.startDate)} - {formatDate(milestone.endDate)}
                        </p>
                      </div>
                    </div>

                    {/* 진행률 */}
                    {milestone.status !== 'upcoming' && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>진행률</span>
                          <span style={{ fontSize: 'var(--text-body-m)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {milestone.progress}%
                          </span>
                        </div>
                        <Progress value={milestone.progress} />
                      </div>
                    )}

                    {/* 세부 작업 */}
                    <div>
                      <h5 style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)' }}>
                        세부 작업
                      </h5>
                      <ul className="space-y-2">
                        {milestone.tasks.map((task, taskIndex) => (
                          <li key={taskIndex} className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ 
                                backgroundColor: task.completed ? 'var(--status-success)' : 'var(--background-muted)',
                                border: task.completed ? 'none' : '1px solid var(--border-medium)'
                              }}
                            >
                              {task.completed && (
                                <span style={{ color: 'white', fontSize: '10px' }}>✓</span>
                              )}
                            </div>
                            <span style={{ 
                              fontSize: 'var(--text-body-m)', 
                              color: task.completed ? 'var(--text-primary)' : 'var(--text-secondary)',
                              textDecoration: task.completed ? 'line-through' : 'none'
                            }}>
                              {task.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 리스크 및 대응방안 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
            리스크 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRoadmapData.risks.map((risk) => (
              <div key={risk.id} className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--background-muted)' }}>
                <div className="flex items-start justify-between mb-2">
                  <h5 style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                    {risk.title}
                  </h5>
                  {getRiskBadge(risk.probability, risk.impact)}
                </div>
                <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)', marginBottom: 'var(--space-12)' }}>
                  {risk.description}
                </p>
                <div className="p-3 rounded" style={{ backgroundColor: 'var(--background-surface)' }}>
                  <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>
                    <strong>대응방안:</strong> {risk.mitigation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 대체 계획 */}
      <Card style={{ backgroundColor: 'var(--background-muted)' }}>
        <CardContent className="p-6">
          <h4 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-12)' }}>
            ⚠️ 일정 지연 시 대체 계획
          </h4>
          <div className="space-y-3" style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
            <p>• <strong>1주 지연</strong>: 기존 일정 유지, 추가 인력 투입</p>
            <p>• <strong>2주 지연</strong>: 홍보 일정 조정, 발매일 1주 연기</p>
            <p>• <strong>1개월 지연</strong>: 추가 리워드 제공, 참여자 투표로 최종 일정 결정</p>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm">
              상세 대체 계획 보기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}