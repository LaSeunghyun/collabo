import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProjectCard } from "./ProjectCard";
import { 
  ArrowRight, 
  Users, 
  Star,
  MessageCircle,
  Heart,
  TrendingUp,
  Award
} from "lucide-react";

// Featured artists data
const featuredArtists = [
  {
    id: "1",
    name: "라이트닝 밴드",
    genre: "인디록",
    description: "5년간의 언더그라운드 활동을 통해 쌓인 진정성 있는 음악",
    image: "https://images.unsplash.com/photo-1647438752249-3a7ca1335830?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZWF0dXJlZCUyMGFydGlzdCUyMG11c2ljaWFufGVufDF8fHx8MTc1ODcxNjYzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    followers: 1240,
    successRate: 89,
    isVerified: true
  },
  {
    id: "2", 
    name: "김서영",
    genre: "현대미술",
    description: "도시 풍경 속에서 발견하는 일상의 아름다움을 그리는 화가",
    image: "https://images.unsplash.com/photo-1758521233291-c78d04f9af9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXN1YWwlMjBhcnRpc3QlMjBwYWludGluZyUyMHN0dWRpb3xlbnwxfHx8fDE3NTg3MTA3Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    followers: 890,
    successRate: 92,
    isVerified: false
  },
  {
    id: "3",
    name: "춤추는그림단",
    genre: "퍼포먼스",
    description: "무용과 미술이 만나는 새로운 장르의 실험적 예술가 그룹", 
    image: "https://images.unsplash.com/photo-1758522275018-2751894b49c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBjb2xsYWJvcmF0aW9uJTIwY3JlYXRpdmV8ZW58MXx8fHwxNzU4NzEwNzQzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    followers: 456,
    successRate: 100,
    isVerified: true
  }
];

// Community highlights data
const communityHighlights = [
  {
    id: "1",
    type: "review",
    title: "라이트닝 밴드 앨범 발매 후기",
    author: "음악러버123",
    content: "정말 기다렸던 앨범이었는데 기대 이상이에요! 특히 타이틀곡의 기타 솔로 부분이...",
    likes: 24,
    comments: 8,
    timestamp: "2시간 전"
  },
  {
    id: "2", 
    type: "update",
    title: "개인전 준비 현황 업데이트", 
    author: "김서영",
    content: "갤러리 공간 확정되었습니다! 다음 주부터 작품 설치 시작해요. 많은 관심 부탁드려요 🎨",
    likes: 67,
    comments: 15,
    timestamp: "1일 전"
  },
  {
    id: "3",
    type: "collaboration",
    title: "사진작가 협업 제안",
    author: "렌즈마스터",
    content: "뮤직비디오 촬영 가능한 사진작가입니다. 인디 뮤지션분들과 협업하고 싶어요!",
    likes: 31,
    comments: 12,
    timestamp: "3일 전"
  }
];

interface SimpleLandingProps {
  featuredProjects: any[];
  onViewAllProjects: () => void;
  onViewProfile: (artistId: string) => void;
  onJoinCommunity: () => void;
  onViewProject?: (projectId: string) => void;
}

export function SimpleLanding({ 
  featuredProjects, 
  onViewAllProjects, 
  onViewProfile,
  onJoinCommunity 
}: SimpleLandingProps) {
  return (
    <div className="space-y-20 py-16">
      {/* Hero Section - 간소화 */}
      <section className="text-center max-w-4xl mx-auto px-4">
        <div className="space-y-6">
          <Badge className="bg-gray-100 text-gray-700 px-4 py-2 border border-gray-300">
            창작자와 팬이 함께 만드는 플랫폼
          </Badge>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            모든 창작자가 자신의 무대를<br />
            가질 수 있도록
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            펀딩부터 실행, 정산까지 투명하게. 창작자와 팬이 함께 성장하는 새로운 생태계입니다.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Button onClick={onViewAllProjects} className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3">
              프로젝트 둘러보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50">
              창작자로 시작하기
            </Button>
          </div>
        </div>
      </section>

      {/* 1. 진행 중인 프로젝트 */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">지금 주목받는 프로젝트</h2>
            <p className="text-gray-600">창작자들의 꿈이 현실이 되는 순간을 함께하세요</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onViewAllProjects}
            className="hidden md:flex items-center gap-2"
          >
            전체 보기
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {featuredProjects.slice(0, 3).map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button onClick={onViewAllProjects} className="w-full sm:w-auto">
            전체 프로젝트 보기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* 2. 주요 아티스트 */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">주목할 만한 창작자들</h2>
          <p className="text-gray-600">검증된 실력과 높은 성공률을 자랑하는 창작자들을 만나보세요</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredArtists.map((artist) => (
            <Card 
              key={artist.id} 
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-gray-200"
              onClick={() => onViewProfile(artist.id)}
            >
              <CardHeader className="p-0">
                <div className="aspect-square overflow-hidden rounded-t-xl">
                  <ImageWithFallback
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{artist.name}</h3>
                      {artist.isVerified && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          ✓ 검증됨
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{artist.genre}</p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {artist.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{artist.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{artist.successRate}%</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                    팔로우
                    <Heart className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. 커뮤니티 하이라이트 */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">활발한 커뮤니티</h2>
            <p className="text-gray-600">창작자와 팬들이 소통하며 함께 성장하고 있어요</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onJoinCommunity}
            className="hidden md:flex items-center gap-2"
          >
            커뮤니티 참여
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {communityHighlights.map((highlight) => (
            <Card key={highlight.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {highlight.author[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">{highlight.author}</h4>
                      {highlight.type === "review" && (
                        <Badge variant="secondary" className="text-xs">후기</Badge>
                      )}
                      {highlight.type === "update" && (
                        <Badge className="bg-green-100 text-green-700 text-xs">업데이트</Badge>
                      )}
                      {highlight.type === "collaboration" && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs">협업</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{highlight.timestamp}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h5 className="font-medium text-gray-900 mb-2 line-clamp-1">
                  {highlight.title}
                </h5>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {highlight.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{highlight.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{highlight.comments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button onClick={onJoinCommunity} variant="outline" className="px-8">
            더 많은 소식 보기
            <TrendingUp className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-gray-50 rounded-3xl p-12 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">울림과 함께하는 창작 생태계</h3>
          <p className="text-gray-600">투명하고 지속 가능한 창작 환경을 만들어가고 있습니다</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">245+</div>
            <div className="text-gray-600">진행 중인 프로젝트</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">12,000+</div>
            <div className="text-gray-600">참여한 서포터</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">89%</div>
            <div className="text-gray-600">프로젝트 성공률</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">450+</div>
            <div className="text-gray-600">파트너 네트워크</div>
          </div>
        </div>
      </section>
    </div>
  );
}