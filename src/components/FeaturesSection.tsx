import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  Rocket, 
  HandHeart, 
  Users, 
  Eye,
  ArrowRight,
  CheckCircle,
  Building,
  BarChart3,
  Shield
} from "lucide-react";

const features = [
  {
    id: 'funding-plus',
    title: '펀딩을 넘어선 실행 지원',
    description: '자금 조달뿐만 아니라 공연장, 스튜디오, 제작팀까지 원스톱으로 연결해드립니다.',
    icon: Rocket,
    color: 'bg-blue-500',
    benefits: [
      '검증된 파트너 네트워크',
      '견적 비교 및 선택',
      '계약 및 일정 관리',
      '품질 보증'
    ],
    image: 'https://images.unsplash.com/photo-1758521233291-c78d04f9af9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXN1YWwlMjBhcnRpc3QlMjBwYWludGluZyUyMHN0dWRpb3xlbnwxfHx8fDE3NTg3MTA3Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'transparent',
    title: '투명한 정산 & 분배 시스템',
    description: '모든 수익과 지출을 투명하게 공개하고, 사전 약속된 비율로 자동 분배합니다.',
    icon: Eye,
    color: 'bg-green-500',
    benefits: [
      '실시간 수익 현황',
      '자동 분배 시스템',
      '세금 서류 자동 생성',
      '감사 가능한 기록'
    ],
    image: 'https://images.unsplash.com/photo-1758522275018-2751894b49c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBjb2xsYWJvcmF0aW9uJTIwY3JlYXRpdmV8ZW58MXx8fHwxNzU4NzEwNzQzfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'collaboration',
    title: '협업 생태계',
    description: '다양한 장르의 창작자들이 만나 새로운 프로젝트를 함께 만들어갑니다.',
    icon: Users,
    color: 'bg-purple-500',
    benefits: [
      '장르별 창작자 매칭',
      '공동 프로젝트 관리',
      '역할별 분배 설정',
      '협업 성과 추적'
    ],
    image: 'https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'community',
    title: '지속 가능한 커뮤니티',
    description: '프로젝트가 끝나도 관계는 계속됩니다. 팬과 창작자가 함께 성장하는 생태계를 만들어갑니다.',
    icon: HandHeart,
    color: 'bg-coral-500',
    benefits: [
      '팬 커뮤니티 구축',
      '후속 프로젝트 연결',
      '멤버십 혜택',
      '창작자 성장 지원'
    ],
    image: 'https://images.unsplash.com/photo-1758522275018-2751894b49c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBjb2xsYWJvcmF0aW9uJTIwY3JlYXRpdmV8ZW58MXx8fHwxNzU4NzEwNzQzfDA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

const trustIndicators = [
  {
    icon: Shield,
    title: '안전한 에스크로',
    description: '결제부터 정산까지 안전하게 보호'
  },
  {
    icon: Building,
    title: '검증된 파트너',
    description: '신뢰할 수 있는 협력업체만 선별'
  },
  {
    icon: BarChart3,
    title: '데이터 기반 운영',
    description: '투명한 성과 지표와 실시간 분석'
  }
];

interface FeaturesSectionProps {
  onLearnMore: () => void;
}

export function FeaturesSection({ onLearnMore }: FeaturesSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            단순 펀딩을 넘어선 <span className="text-indigo-600">새로운 경험</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            울림은 창작자와 팬이 함께 성장할 수 있는 지속 가능한 생태계를 제공합니다.
            펀딩부터 실행, 정산, 커뮤니티까지 모든 것이 연결된 새로운 플랫폼을 경험해보세요.
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div key={feature.id} className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
                {/* Content */}
                <div className={`space-y-6 ${!isEven ? 'lg:order-2' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                  </div>
                  
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={onLearnMore}
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    자세히 알아보기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Visual */}
                <div className={`relative ${!isEven ? 'lg:order-1' : ''}`}>
                  <div className="relative">
                    <div className={`absolute inset-0 ${feature.color} opacity-10 rounded-3xl transform rotate-6`} />
                    <Card className="relative bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
                      <CardContent className="p-0">
                        <ImageWithFallback
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-64 object-cover"
                        />
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 ${feature.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900">{feature.title}</span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            실제 플랫폼에서 제공되는 기능을 미리 체험해보세요.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 pt-16 border-t border-gray-200">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">신뢰할 수 있는 플랫폼</h3>
            <p className="text-gray-600">창작자와 참여자 모두가 안심하고 이용할 수 있습니다</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {trustIndicators.map((indicator, index) => {
              const Icon = indicator.icon;
              return (
                <Card key={index} className="text-center border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-gray-600" />
                    </div>
                    <CardTitle className="text-xl">{indicator.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{indicator.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}