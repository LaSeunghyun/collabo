import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface ProjectUpdatesTabProps {
  projectId: string;
}

// Mock updates data
const mockUpdates = {
  announcements: [
    {
      id: "1",
      title: "앨범 녹음 시작! 첫 번째 세션 현장",
      content: "드디어 스튜디오에 들어가서 녹음을 시작했습니다! 첫 번째 트랙 '도시의 밤'을 녹음했는데, 정말 만족스러운 결과가 나왔어요. 다음 주에는 나머지 트랙들도 녹음할 예정입니다.",
      date: "2024-01-20",
      author: "라이트닝 밴드",
      type: "announcement",
      isPublic: true,
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWNvcmRpbmclMjBzdHVkaW98ZW58MXx8fHwxNzU4NzEwNzM1fDA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      id: "2", 
      title: "앨범 커버 디자인 작업 시작",
      content: "앨범 커버 디자인 작업이 시작되었습니다. 여러 컨셉 중에서 선택하게 될 텐데, 참여해주신 분들의 의견도 반영할 예정이에요!",
      date: "2024-01-18",
      author: "라이트닝 밴드", 
      type: "announcement",
      isPublic: true
    }
  ],
  behind: [
    {
      id: "3",
      title: "[후원자 전용] 스튜디오 비하인드 영상",
      content: "녹음 과정에서의 재미있는 에피소드들을 담은 비하인드 영상입니다. 실수 장면들도 포함되어 있어요 😅",
      date: "2024-01-19",
      author: "라이트닝 밴드",
      type: "behind",
      isPublic: false,
      videoUrl: "https://example.com/behind-video"
    },
    {
      id: "4",
      title: "[후원자 전용] 작사 과정 공개",
      content: "새로운 곡의 가사를 쓰는 과정을 공개합니다. 처음 썼던 가사와 최종 가사를 비교해보세요!",
      date: "2024-01-17",
      author: "라이트닝 밴드",
      type: "behind", 
      isPublic: false
    }
  ]
};

export function ProjectUpdatesTab({ projectId }: ProjectUpdatesTabProps) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isSupporter, setIsSupporter] = useState(false); // 실제로는 사용자 참여 상태 확인

  const allUpdates = [...mockUpdates.announcements, ...mockUpdates.behind]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredUpdates = allUpdates.filter(update => {
    if (selectedFilter === "all") return true;
    return update.type === selectedFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* 필터 탭 */}
      <div className="flex gap-2">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          onClick={() => setSelectedFilter("all")}
          style={{ fontSize: 'var(--text-body-m)' }}
        >
          전체
        </Button>
        <Button
          variant={selectedFilter === "announcement" ? "default" : "outline"}
          onClick={() => setSelectedFilter("announcement")}
          style={{ fontSize: 'var(--text-body-m)' }}
        >
          공지사항
        </Button>
        <Button
          variant={selectedFilter === "behind" ? "default" : "outline"}
          onClick={() => setSelectedFilter("behind")}
          style={{ fontSize: 'var(--text-body-m)' }}
        >
          비하인드
        </Button>
      </div>

      {/* 업데이트 목록 */}
      <div className="space-y-4">
        {filteredUpdates.map((update) => (
          <Card key={update.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>라</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 'var(--text-body-m)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                        {update.author}
                      </span>
                      <Badge variant="outline" style={{ fontSize: 'var(--text-caption)' }}>
                        창작자
                      </Badge>
                      {!update.isPublic && (
                        <Badge variant="secondary" style={{ fontSize: 'var(--text-caption)' }}>
                          참여자 전용
                        </Badge>
                      )}
                    </div>
                    <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                      {formatDate(update.date)}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  style={{ 
                    fontSize: 'var(--text-caption)',
                    color: update.type === 'announcement' ? 'var(--status-info)' : 'var(--status-success)'
                  }}
                >
                  {update.type === 'announcement' ? '공지' : '비하인드'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h3 style={{ 
                fontSize: 'var(--text-h3)', 
                fontWeight: 'var(--font-weight-medium)', 
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-12)'
              }}>
                {update.title}
              </h3>
              
              {/* 참여자 전용 콘텐츠 접근 제한 */}
              {!update.isPublic && !isSupporter ? (
                <div className="p-6 text-center border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--background-muted)' }}>
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-surface)' }}>
                      <span style={{ fontSize: '24px' }}>🔒</span>
                    </div>
                    <h4 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)' }}>
                      참여자 전용 콘텐츠
                    </h4>
                    <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)', marginBottom: 'var(--space-16)' }}>
                      이 콘텐츠는 프로젝트에 참여한 분들만 볼 수 있습니다.
                    </p>
                  </div>
                  <Button 
                    style={{
                      backgroundColor: 'var(--action-primary-bg)',
                      color: 'var(--action-primary-text)'
                    }}
                  >
                    프로젝트 참여하고 보기
                  </Button>
                </div>
              ) : (
                <div>
                  <p style={{ 
                    fontSize: 'var(--text-body-l)', 
                    lineHeight: 'var(--line-height-body-l)', 
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-16)'
                  }}>
                    {update.content}
                  </p>
                  
                  {/* 이미지가 있는 경우 */}
                  {update.imageUrl && (
                    <div className="mt-4">
                      <img 
                        src={update.imageUrl} 
                        alt={update.title}
                        className="w-full max-w-md rounded-lg"
                      />
                    </div>
                  )}
                  
                  {/* 비디오가 있는 경우 */}
                  {update.videoUrl && (
                    <div className="mt-4 p-4 border rounded-lg" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--background-muted)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ fontSize: '16px' }}>🎬</span>
                        <span style={{ fontSize: 'var(--text-body-m)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                          비하인드 영상
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        영상 보기
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 더 보기 버튼 */}
      {filteredUpdates.length > 5 && (
        <div className="text-center pt-4">
          <Button variant="outline">
            더 많은 업데이트 보기
          </Button>
        </div>
      )}

      {/* 빈 상태 */}
      {filteredUpdates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-muted)' }}>
            <span style={{ fontSize: '24px' }}>📝</span>
          </div>
          <h3 style={{ fontSize: 'var(--text-h3)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)' }}>
            아직 업데이트가 없습니다
          </h3>
          <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
            프로젝트 진행 상황을 업데이트로 확인해보세요.
          </p>
        </div>
      )}
    </div>
  );
}