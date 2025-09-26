import { useState } from "react";
import { Header } from "./components/Header";
import { SimpleLanding } from "./components/SimpleLanding";
import { ProjectCard } from "./components/ProjectCard";
import { CommunityPage } from "./components/CommunityPage";
import { ArtistProfilePage } from "./components/ArtistProfilePage";
import { ProjectDetailPage } from "./components/ProjectDetailPage";
import { PartnersPage } from "./components/PartnersPage";
import { HelpPage } from "./components/HelpPage";
import { AuthModal } from "./components/AuthModal";
import { Button } from "./components/ui/button";

// Mock data for projects
const mockProjects = [
  {
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
      avatar: ""
    },
    rewardType: "both" as const,
    verified: true
  },
  {
    id: "2", 
    title: "도시 풍경을 담은 유화 개인전 '일상의 빛'",
    description: "도시에서 발견한 소소한 아름다움을 캔버스에 담았습니다. 갤러리 대관부터 작품 제작, 도록 인쇄까지 전 과정을 함께해요.",
    category: "시각예술",
    imageUrl: "https://images.unsplash.com/photo-1758521233291-c78d04f9af9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXN1YWwlMjBhcnRpc3QlMjBwYWludGluZyUyMHN0dWRpb3xlbnwxfHx8fDE3NTg3MTA3Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    targetAmount: 3000000,
    currentAmount: 2100000,
    participantCount: 89,
    daysLeft: 25,
    artist: {
      name: "김서영",
      avatar: ""
    },
    rewardType: "reward" as const,
    verified: false
  },
  {
    id: "3",
    title: "로컬 스토리를 담은 다큐멘터리 '골목의 기억'",
    description: "사라져가는 골목길의 이야기를 기록합니다. 촬영부터 편집, 상영회까지 지역 커뮤니티와 함께 만드는 다큐멘터리입니다.",
    category: "영상",
    imageUrl: "https://images.unsplash.com/photo-1758522275018-2751894b49c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBjb2xsYWJvcmF0aW9uJTIwY3JlYXRpdmV8ZW58MXx8fHwxNzU4NzEwNzQzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    targetAmount: 8000000,
    currentAmount: 4800000,
    participantCount: 203,
    daysLeft: 12,
    artist: {
      name: "이준혁",
      avatar: ""
    },
    rewardType: "revenue" as const,
    verified: true
  },
  {
    id: "4",
    title: "클래식 기타와 재즈의 만남 '어쿠스틱 세션'",
    description: "클래식 기타리스트와 재즈 피아니스트의 특별한 협업. 스튜디오 녹음과 라이브 공연을 통해 새로운 장르의 음악을 선보입니다.",
    category: "음악",
    imageUrl: "https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    targetAmount: 2500000,
    currentAmount: 2700000,
    participantCount: 94,
    daysLeft: 8,
    artist: {
      name: "박준호 & 김민재",
      avatar: ""
    },
    rewardType: "both" as const,
    verified: true
  },
  {
    id: "5",
    title: "청춘을 담은 사진집 '스무살의 여름'",
    description: "대학가의 청춘들을 1년간 기록한 사진들을 모아 사진집으로 만듭니다. 흑백 필름으로 담아낸 진솔한 순간들을 나누고 싶어요.",
    category: "사진",
    imageUrl: "https://images.unsplash.com/photo-1758522275018-2751894b49c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBjb2xsYWJvcmF0aW9uJTIwY3JlYXRpdmV8ZW58MXx8fHwxNzU4NzEwNzQzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    targetAmount: 1500000,
    currentAmount: 890000,
    participantCount: 52,
    daysLeft: 31,
    artist: {
      name: "정수민",
      avatar: ""
    },
    rewardType: "reward" as const,
    verified: false
  },
  {
    id: "6",
    title: "현대무용과 라이브 페인팅의 콜라보 '색채의 몸짓'",
    description: "무용수의 움직임을 보며 실시간으로 그림을 그리는 라이브 퍼포먼스. 움직임과 색채가 하나가 되는 특별한 경험을 선사합니다.",
    category: "공연예술",
    imageUrl: "https://images.unsplash.com/photo-1758521233291-c78d04f9af9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXN1YWwlMjBhcnRpc3QlMjBwYWludGluZyUyMHN0dWRpb3xlbnwxfHx8fDE3NTg3MTA3Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    targetAmount: 4000000,
    currentAmount: 1200000,
    participantCount: 38,
    daysLeft: 22,
    artist: {
      name: "춤추는그림단",
      avatar: ""
    },
    rewardType: "reward" as const,
    verified: true
  }
];

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("recent");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<"landing" | "projects" | "community" | "artist" | "project-detail" | "partners" | "help">("landing");
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData: { name: string; role: string }) => {
    setUser(userData);
    setIsAuthModalOpen(false);
  };

  const handleExploreProjects = () => {
    setCurrentView("projects");
    // Scroll to projects section
    setTimeout(() => {
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleViewProfile = (artistId: string) => {
    setSelectedArtistId(artistId);
    setCurrentView("artist");
  };

  const handleJoinCommunity = () => {
    setCurrentView("community");
  };

  const handleNavigateToPartners = () => {
    setCurrentView("partners");
  };

  const handleNavigateToHelp = () => {
    setCurrentView("help");
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
    setSelectedArtistId(null);
    setSelectedProjectId(null);
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView("project-detail");
  };

  const handleStartCreating = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      // Navigate to project creation
      console.log("Navigate to project creation");
    }
  };

  const filteredProjects = mockProjects.filter(project => {
    // Category filter
    if (selectedCategory !== "all") {
      const categoryMap: Record<string, string> = {
        "music": "음악",
        "visual": "시각예술", 
        "photography": "사진",
        "video": "영상",
        "literature": "문학",
        "performance": "공연예술"
      };
      if (project.category !== categoryMap[selectedCategory]) {
        return false;
      }
    }

    // Type filters
    if (selectedFilters.includes("reward") && project.rewardType === "revenue") {
      return false;
    }
    if (selectedFilters.includes("revenue") && project.rewardType === "reward") {
      return false;
    }
    if (selectedFilters.includes("verified") && !project.verified) {
      return false;
    }

    return true;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (selectedSort) {
      case "popular":
        return b.participantCount - a.participantCount;
      case "ending":
        return a.daysLeft - b.daysLeft;
      case "success":
        return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
      default: // recent
        return 0; // Keep original order for demo
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isLoggedIn={!!user}
        userRole={user?.role as any}
        userName={user?.name}
        onLogin={handleLogin}
        onCreateProject={handleStartCreating}
        onNavigateToProjects={handleExploreProjects}
        onNavigateToCommunity={handleJoinCommunity}
        onNavigateToPartners={handleNavigateToPartners}
        onNavigateToHelp={handleNavigateToHelp}
      />

      {currentView === "landing" && (
        <SimpleLanding 
          featuredProjects={mockProjects}
          onViewAllProjects={handleExploreProjects}
          onViewProfile={handleViewProfile}
          onJoinCommunity={handleJoinCommunity}
        />
      )}

      {/* Community Page */}
      {currentView === "community" && (
        <CommunityPage onBack={handleBackToLanding} />
      )}

      {/* Artist Profile Page */}
      {currentView === "artist" && selectedArtistId && (
        <ArtistProfilePage 
          artistId={selectedArtistId} 
          onBack={handleBackToLanding} 
        />
      )}

      {/* Project Detail Page */}
      {currentView === "project-detail" && selectedProjectId && (
        <ProjectDetailPage 
          projectId={selectedProjectId} 
          onBack={handleBackToLanding} 
        />
      )}

      {/* Partners Page */}
      {currentView === "partners" && (
        <PartnersPage onBack={handleBackToLanding} />
      )}

      {/* Help Page */}
      {currentView === "help" && (
        <HelpPage onBack={handleBackToLanding} />
      )}

      {/* Projects Section */}
      {currentView === "projects" && (
        <section id="projects" className="py-16" style={{ backgroundColor: 'var(--background-base)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Button 
                  variant="ghost" 
                  onClick={handleBackToLanding}
                  className="mb-4"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ← 뒤로가기
                </Button>
                <h2 
                  className="mb-4"
                  style={{ 
                    fontSize: 'var(--text-display)', 
                    lineHeight: 'var(--line-height-display)', 
                    fontWeight: 'bold',
                    color: 'var(--text-primary)'
                  }}
                >
                  진행 중인 프로젝트
                </h2>
                <p 
                  style={{ 
                    fontSize: 'var(--text-body-l)', 
                    lineHeight: 'var(--line-height-body-l)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  창작자들의 꿈을 현실로 만들어가는 여정에 함께하세요
                </p>
              </div>
            </div>

            {/* 필터 및 정렬 */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--background-surface)', border: '1px solid var(--border-light)' }}>
              <div className="flex-1">
                <label style={{ fontSize: 'var(--text-body-m)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)', display: 'block' }}>
                  카테고리
                </label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{ 
                    borderColor: 'var(--border-light)', 
                    backgroundColor: 'var(--background-surface)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">전체</option>
                  <option value="music">음악</option>
                  <option value="visual">시각예술</option>
                  <option value="photography">사진</option>
                  <option value="video">영상</option>
                  <option value="literature">문학</option>
                  <option value="performance">공연예술</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label style={{ fontSize: 'var(--text-body-m)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)', display: 'block' }}>
                  정렬
                </label>
                <select 
                  value={selectedSort} 
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{ 
                    borderColor: 'var(--border-light)', 
                    backgroundColor: 'var(--background-surface)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="recent">최신순</option>
                  <option value="popular">인기순</option>
                  <option value="ending">마감임박</option>
                  <option value="success">달성률순</option>
                </select>
              </div>

              <div className="flex-1">
                <label style={{ fontSize: 'var(--text-body-m)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)', display: 'block' }}>
                  필터
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["verified", "reward", "revenue"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        const newFilters = selectedFilters.includes(filter)
                          ? selectedFilters.filter(f => f !== filter)
                          : [...selectedFilters, filter];
                        setSelectedFilters(newFilters);
                      }}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedFilters.includes(filter) 
                          ? 'text-white' 
                          : 'border'
                      }`}
                      style={{
                        backgroundColor: selectedFilters.includes(filter) 
                          ? 'var(--action-primary-bg)' 
                          : 'transparent',
                        borderColor: 'var(--border-light)',
                        color: selectedFilters.includes(filter) 
                          ? 'white' 
                          : 'var(--text-primary)'
                      }}
                    >
                      {filter === "verified" ? "검수완료" : 
                       filter === "reward" ? "리워드형" : "수익분배형"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProjects.map((project) => (
                <ProjectCard key={project.id} {...project} onViewProject={handleViewProject} />
              ))}
            </div>

            {sortedProjects.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-muted)' }}>
                  <span style={{ fontSize: '32px' }}>🔍</span>
                </div>
                <h3 style={{ fontSize: 'var(--text-h3)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)' }}>
                  조건에 맞는 프로젝트가 없습니다
                </h3>
                <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                  다른 조건으로 검색해보세요
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer - Only show on landing and projects view */}
      {(currentView === "landing" || currentView === "projects") && (
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">울</span>
                  </div>
                  <span className="text-xl font-bold">울림</span>
                </div>
                <p className="text-gray-400 mb-6 max-w-md">
                  모든 창작자가 자신의 무대를 가질 수 있도록 돕는 플랫폼입니다. 
                  창작자와 팬이 함께 성장하는 새로운 생태계를 만들어갑니다.
                </p>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                    <span className="text-sm">📧</span>
                  </div>
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                    <span className="text-sm">🐦</span>
                  </div>
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                    <span className="text-sm">📘</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">플랫폼</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><button onClick={handleExploreProjects} className="hover:text-white transition-colors text-left">프로젝트 탐색</button></li>
                  <li><button onClick={handleStartCreating} className="hover:text-white transition-colors text-left">창작자 되기</button></li>
                  <li><button onClick={handleNavigateToPartners} className="hover:text-white transition-colors text-left">파트너 가입</button></li>
                  <li><button onClick={handleJoinCommunity} className="hover:text-white transition-colors text-left">커뮤니티</button></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">지원</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><button onClick={handleNavigateToHelp} className="hover:text-white transition-colors text-left">도움말 센터</button></li>
                  <li><button onClick={handleNavigateToHelp} className="hover:text-white transition-colors text-left">창작자 가이드</button></li>
                  <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 울림. All rights reserved.
              </p>
              <p className="text-gray-400 text-sm mt-4 md:mt-0">
                창작자와 팬이 함께 성장하는 플랫폼
              </p>
            </div>
          </div>
        </footer>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}