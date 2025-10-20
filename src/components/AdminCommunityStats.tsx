import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Activity,
  Flag,
  CheckCircle,
  Clock
} from "lucide-react";

// Mock admin data
const communityStats = {
  totalMembers: 2847,
  activeMembers: 1245,
  monthlyPosts: 156,
  monthlyComments: 892,
  growthRate: 23,
  reportedContent: 3,
  moderatedContent: 12,
  pendingReports: 1
};

const recentReports = [
  {
    id: "1",
    content: "부적절한 광고 게시글",
    reporter: "사용자***",
    timestamp: "2시간 전",
    status: "pending",
    severity: "medium"
  },
  {
    id: "2", 
    content: "욕설이 포함된 댓글",
    reporter: "사용자***",
    timestamp: "1일 전",
    status: "resolved",
    severity: "high"
  },
  {
    id: "3",
    content: "스팸성 협업 모집글",
    reporter: "사용자***", 
    timestamp: "2일 전",
    status: "resolved",
    severity: "low"
  }
];

const topCategories = [
  { category: "자유게시판", posts: 45, percentage: 29 },
  { category: "후기&리뷰", posts: 38, percentage: 24 },
  { category: "정보공유", posts: 32, percentage: 21 },
  { category: "협업모집", posts: 25, percentage: 16 },
  { category: "질문&답변", posts: 16, percentage: 10 }
];

export function AdminCommunityStats() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "resolved": return "bg-green-50 text-green-700 border-green-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600";
      case "medium": return "text-orange-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 
          style={{ 
            fontSize: 'var(--text-h2)', 
            lineHeight: 'var(--line-height-h2)', 
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-8)'
          }}
        >
          커뮤니티 관리 대시보드
        </h2>
        <p 
          style={{ 
            fontSize: 'var(--text-body-l)', 
            color: 'var(--text-secondary)'
          }}
        >
          커뮤니티 현황과 모니터링 정보를 관리할 수 있습니다
        </p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{ 
                    fontSize: 'var(--text-body-m)', 
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-8)'
                  }}
                >
                  전체 멤버
                </p>
                <p 
                  className="font-bold"
                  style={{ 
                    fontSize: 'var(--text-h2)', 
                    color: 'var(--text-primary)'
                  }}
                >
                  {communityStats.totalMembers.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{ 
                    fontSize: 'var(--text-body-m)', 
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-8)'
                  }}
                >
                  월간 게시물
                </p>
                <p 
                  className="font-bold"
                  style={{ 
                    fontSize: 'var(--text-h2)', 
                    color: 'var(--text-primary)'
                  }}
                >
                  {communityStats.monthlyPosts}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{ 
                    fontSize: 'var(--text-body-m)', 
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-8)'
                  }}
                >
                  성장률
                </p>
                <p 
                  className="font-bold text-green-600"
                  style={{ 
                    fontSize: 'var(--text-h2)'
                  }}
                >
                  +{communityStats.growthRate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{ 
                    fontSize: 'var(--text-body-m)', 
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-8)'
                  }}
                >
                  대기중 신고
                </p>
                <p 
                  className="font-bold"
                  style={{ 
                    fontSize: 'var(--text-h2)', 
                    color: communityStats.pendingReports > 0 ? 'var(--status-alert)' : 'var(--text-primary)'
                  }}
                >
                  {communityStats.pendingReports}
                </p>
              </div>
              <Flag className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리별 활동 */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle 
              style={{ 
                fontSize: 'var(--text-h3)', 
                color: 'var(--text-primary)'
              }}
            >
              카테고리별 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span 
                    style={{ 
                      fontSize: 'var(--text-body-m)', 
                      color: 'var(--text-primary)'
                    }}
                  >
                    {item.category}
                  </span>
                  <span 
                    style={{ 
                      fontSize: 'var(--text-body-m)', 
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {item.posts}개
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 최근 신고 내역 */}
        <Card>
          <CardHeader>
            <CardTitle 
              style={{ 
                fontSize: 'var(--text-h3)', 
                color: 'var(--text-primary)'
              }}
            >
              최근 신고 내역
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p 
                      className="font-medium"
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--space-4)'
                      }}
                    >
                      {report.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <span 
                        style={{ 
                          fontSize: 'var(--text-caption)', 
                          color: 'var(--text-secondary)'
                        }}
                      >
                        신고자: {report.reporter}
                      </span>
                      <span 
                        style={{ 
                          fontSize: 'var(--text-caption)', 
                          color: 'var(--text-secondary)'
                        }}
                      >
                        • {report.timestamp}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={`${getStatusColor(report.status)} border text-xs`}>
                      {report.status === 'pending' ? '대기' : '완료'}
                    </Badge>
                    <span 
                      className={`text-xs font-medium ${getSeverityColor(report.severity)}`}
                    >
                      {report.severity === 'high' ? '높음' : 
                       report.severity === 'medium' ? '보통' : '낮음'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 세부 통계 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-5 h-5" />
              활동 통계
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                활성 사용자
              </span>
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>
                {communityStats.activeMembers.toLocaleString()}명
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                월간 댓글
              </span>
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>
                {communityStats.monthlyComments.toLocaleString()}개
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle className="w-5 h-5" />
              모더레이션
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                총 신고 접수
              </span>
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>
                {communityStats.reportedContent}건
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                처리 완료
              </span>
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>
                {communityStats.moderatedContent}건
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock className="w-5 h-5" />
              응답 시간
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                평균 응답 시간
              </span>
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>
                2.4시간
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                24시간 내 처리율
              </span>
              <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--status-success)' }}>
                95%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}