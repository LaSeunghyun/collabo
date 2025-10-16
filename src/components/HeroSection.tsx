import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  ArrowRight, 
  Play, 
  Star, 
  Users, 
  Target,
  Sparkles
} from "lucide-react";

interface HeroSectionProps {
  onExploreProjects: () => void;
  onStartCreating: () => void;
}

export function HeroSection({ onExploreProjects, onStartCreating }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16 pb-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,154,158,0.1),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Announcement Badge */}
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              새로운 창작 생태계가 열렸습니다
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                모든 창작자가<br />
                자신의 무대를<br />
                가질 수 있도록
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                단순 펀딩을 넘어, 실행 지원부터 투명한 정산, 지속 가능한 커뮤니티까지. 
                창작자와 팬이 함께 만드는 새로운 예술 생태계에 참여하세요.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">245+</div>
                <div className="text-sm text-gray-600">진행 중인 프로젝트</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-coral-600">12,000+</div>
                <div className="text-sm text-gray-600">참여한 서포터</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">89%</div>
                <div className="text-sm text-gray-600">성공률</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onExploreProjects}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg"
              >
                프로젝트 둘러보기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={onStartCreating}
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-8 py-3 text-lg"
              >
                창작자로 시작하기
                <Play className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">투명한 정산 시스템</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">검증된 파트너 네트워크</span>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl" />
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="창작자와 팬들이 함께하는 모습"
                className="w-full h-96 object-cover rounded-3xl shadow-2xl"
              />
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">목표 달성!</div>
                  <div className="text-sm text-gray-600">152% 달성</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">89명 참여</div>
                  <div className="text-sm text-gray-600">실시간 증가 중</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories Marquee */}
        <div className="mt-20">
          <p className="text-center text-gray-600 mb-8">함께 성공한 창작자들</p>
          <div className="flex items-center justify-center gap-12 opacity-60">
            {/* Mock success stories */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">김</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">김민수 작곡가</div>
                <div className="text-sm text-green-600">240% 목표 달성</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">이</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">이지영 화가</div>
                <div className="text-sm text-green-600">개인전 성공 개최</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">박</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">박성현 밴드</div>
                <div className="text-sm text-green-600">앨범 발매 & 투어</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}