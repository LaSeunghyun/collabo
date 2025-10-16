import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Building2, MapPin, Users, Star, Award } from "lucide-react";

interface PartnersPageProps {
  onBack: () => void;
}

const mockPartners = [
  {
    id: "1",
    name: "홍대 라이브클럽",
    type: "공연장",
    location: "서울 마포구",
    description: "인디 뮤지션들의 성장 무대를 제공하는 홍대 대표 라이브클럽입니다.",
    capacity: "150명",
    rating: 4.8,
    projects: 45
  },
  {
    id: "2", 
    name: "스튜디오 ECHO",
    type: "녹음실",
    location: "서울 강남구",
    description: "최신 장비와 전문 엔지니어가 함께하는 프리미엄 레코딩 스튜디오",
    capacity: "24시간",
    rating: 4.9,
    projects: 78
  },
  {
    id: "3",
    name: "갤러리 모던",
    type: "전시공간",
    location: "서울 종로구",
    description: "현대 미술과 실험적 작품을 위한 독립 갤러리 공간",
    capacity: "100㎡",
    rating: 4.7,
    projects: 32
  },
  {
    id: "4",
    name: "영상제작소 픽셀",
    type: "제작사",
    location: "서울 서초구", 
    description: "다큐멘터리와 뮤직비디오 전문 영상 제작팀",
    capacity: "풀서비스",
    rating: 4.6,
    projects: 56
  }
];

export function PartnersPage({ onBack }: PartnersPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-base)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <h1 
            style={{ 
              fontSize: 'var(--text-display)', 
              lineHeight: 'var(--line-height-display)', 
              fontWeight: 'bold',
              color: 'var(--text-primary)'
            }}
          >
            파트너
          </h1>
          <p 
            className="mt-4"
            style={{ 
              fontSize: 'var(--text-body-l)', 
              lineHeight: 'var(--line-height-body-l)',
              color: 'var(--text-secondary)'
            }}
          >
            창작자들의 프로젝트 실행을 도와주는 파트너들을 만나보세요
          </p>
        </div>

        {/* 파트너 타입별 카테고리 */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {["공연장", "스튜디오", "갤러리", "제작사"].map((type, index) => (
            <Card key={type} className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--background-muted)' }}>
                {index === 0 && <Building2 className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />}
                {index === 1 && <Users className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />}
                {index === 2 && <Award className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />}
                {index === 3 && <Star className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />}
              </div>
              <h3 style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                {type}
              </h3>
            </Card>
          ))}
        </div>

        {/* 파트너 목록 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPartners.map((partner) => (
            <Card key={partner.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle style={{ fontSize: 'var(--text-h3)', color: 'var(--text-primary)' }}>
                      {partner.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span 
                        className="px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: 'var(--background-muted)', color: 'var(--text-secondary)' }}
                      >
                        {partner.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                          {partner.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                  {partner.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                      {partner.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                      {partner.capacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                      {partner.projects}개 프로젝트 진행
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  style={{
                    backgroundColor: 'var(--action-primary-bg)',
                    color: 'var(--action-primary-text)'
                  }}
                >
                  연결 문의
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 파트너 신청 안내 */}
        <Card className="mt-12 p-8 text-center" style={{ backgroundColor: 'var(--background-surface)' }}>
          <div className="max-w-2xl mx-auto">
            <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-16)' }}>
              울림 파트너가 되어주세요
            </h2>
            <p style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-secondary)', marginBottom: 'var(--space-24)' }}>
              창작자들의 꿈을 현실로 만드는 데 함께해주세요. 
              공연장, 스튜디오, 갤러리, 제작사 등 다양한 파트너를 찾고 있습니다.
            </p>
            <Button 
              size="lg"
              style={{
                backgroundColor: 'var(--action-primary-bg)',
                color: 'var(--action-primary-text)'
              }}
            >
              파트너 신청하기
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}