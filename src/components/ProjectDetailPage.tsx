import { useState } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ProjectStoryTab } from "./project-tabs/ProjectStoryTab";
import { ProjectUpdatesTab } from "./project-tabs/ProjectUpdatesTab";
import { ProjectCommunityTab } from "./project-tabs/ProjectCommunityTab";
import { ProjectRoadmapTab } from "./project-tabs/ProjectRoadmapTab";
import { ProjectSettlementTab } from "./project-tabs/ProjectSettlementTab";
import { ParticipationModal } from "./ParticipationModal";

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
}

// Mock project data - 실제로는 API에서 가져올 데이터
const mockProjectData = {
  id: "1",
  title: "인디 밴드 '라이트닝'의 첫 정규앨범 제작",
  description: "5년간 함께해온 멤버들과 만드는 첫 정규앨범. 스튜디오 녹음부터 마스터링, 앨범 커버 디자인까지 전 과정을 투명하게 공개합니다.",
  category: "음악",
  imageUrl: "https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  targetAmount: 5000000,
  currentAmount: 3200000,
  participantCount: 127,
  daysLeft: 18,
  artist: {
    name: "라이트닝 밴드",
    avatar: "",
    verified: true,
    followers: 1240
  },
  rewardType: "both" as const,
  verified: true,
  createdAt: "2024-01-15"
};

export function ProjectDetailPage({ projectId, onBack }: ProjectDetailPageProps) {
  const [selectedTab, setSelectedTab] = useState("story");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isParticipationModalOpen, setIsParticipationModalOpen] = useState(false);
  
  const project = mockProjectData; // 실제로는 projectId로 데이터 조회
  const progressPercentage = (project.currentAmount / project.targetAmount) * 100;

  const handleParticipate = () => {
    setIsParticipationModalOpen(true);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: 'var(--background-surface)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              style={{ color: 'var(--text-secondary)' }}
            >
              ← 뒤로가기
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" style={{ fontSize: 'var(--text-caption)' }}>
                  {project.category}
                </Badge>
                {project.verified && (
                  <Badge variant="secondary" style={{ fontSize: 'var(--text-caption)' }}>
                    검수완료
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ backgroundColor: 'var(--background-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* 프로젝트 이미지 */}
            <div className="aspect-video overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
              <img 
                src={project.imageUrl} 
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 프로젝트 정보 */}
            <div className="space-y-6">
              <div>
                <h1 
                  style={{ 
                    fontSize: 'var(--text-display)', 
                    lineHeight: 'var(--line-height-display)',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    marginBottom: 'var(--space-16)'
                  }}
                >
                  {project.title}
                </h1>
                <p 
                  style={{ 
                    fontSize: 'var(--text-body-l)', 
                    lineHeight: 'var(--line-height-body-l)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {project.description}
                </p>
              </div>

              {/* 아티스트 정보 */}
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={project.artist.avatar} />
                  <AvatarFallback>{project.artist.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                      {project.artist.name}
                    </span>
                    {project.artist.verified && (
                      <Badge variant="outline" style={{ fontSize: 'var(--text-caption)' }}>
                        인증 아티스트
                      </Badge>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                    팔로워 {project.artist.followers?.toLocaleString()}명
                  </p>
                </div>
              </div>

              {/* 펀딩 진행 상황 */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>모금액</p>
                      <p style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {project.currentAmount.toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>참여자</p>
                      <p style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {project.participantCount}명
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>남은 시간</p>
                      <p style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {project.daysLeft}일
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={progressPercentage} className="mb-2" />
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      목표금액 {project.targetAmount.toLocaleString()}원
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                      {Math.round(progressPercentage)}% 달성
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleParticipate}
                  className="flex-1"
                  style={{
                    backgroundColor: 'var(--action-primary-bg)',
                    color: 'var(--action-primary-text)'
                  }}
                >
                  프로젝트 참여하기
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleFollow}
                  style={{
                    borderColor: 'var(--border-medium)',
                    color: isFollowing ? 'var(--action-primary-bg)' : 'var(--text-primary)'
                  }}
                >
                  {isFollowing ? '팔로잉' : '팔로우'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 및 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          {/* 탭 네비게이션 */}
          <div style={{ backgroundColor: 'var(--background-surface)', borderBottom: '1px solid var(--border-light)' }}>
            <div className="overflow-x-auto">
              <TabsList className="grid grid-cols-5 w-full min-w-max" style={{ backgroundColor: 'transparent', borderBottom: 'none' }}>
                <TabsTrigger value="story" style={{ fontSize: 'var(--text-body-m)', whiteSpace: 'nowrap' }}>스토리</TabsTrigger>
                <TabsTrigger value="updates" style={{ fontSize: 'var(--text-body-m)', whiteSpace: 'nowrap' }}>업데이트</TabsTrigger>
                <TabsTrigger value="community" style={{ fontSize: 'var(--text-body-m)', whiteSpace: 'nowrap' }}>커뮤니티</TabsTrigger>
                <TabsTrigger value="roadmap" style={{ fontSize: 'var(--text-body-m)', whiteSpace: 'nowrap' }}>로드맵</TabsTrigger>
                <TabsTrigger value="settlement" style={{ fontSize: 'var(--text-body-m)', whiteSpace: 'nowrap' }}>정산</TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="py-8">
            <TabsContent value="story">
              <ProjectStoryTab project={project} />
            </TabsContent>
            <TabsContent value="updates">
              <ProjectUpdatesTab projectId={project.id} />
            </TabsContent>
            <TabsContent value="community">
              <ProjectCommunityTab projectId={project.id} />
            </TabsContent>
            <TabsContent value="roadmap">
              <ProjectRoadmapTab projectId={project.id} />
            </TabsContent>
            <TabsContent value="settlement">
              <ProjectSettlementTab projectId={project.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* 참여하기 모달 */}
      <ParticipationModal
        isOpen={isParticipationModalOpen}
        onClose={() => setIsParticipationModalOpen(false)}
        project={project}
      />
    </div>
  );
}