import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ArrowLeft, MessageCircle, Book, Users, CreditCard, Shield, HelpCircle, MessageSquare } from "lucide-react";

interface HelpPageProps {
  onBack: () => void;
}

const helpCategories = [
  {
    icon: <Book className="w-6 h-6" />,
    title: "시작하기",
    description: "울림 플랫폼 이용 방법"
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "결제 & 정산",
    description: "펀딩과 수익 분배 관련"
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "프로젝트 관리",
    description: "프로젝트 생성과 운영"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "정책 & 안전",
    description: "이용약관과 안전 정책"
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "커뮤니티 가이드",
    description: "건전한 소통을 위한 규칙"
  }
];

const faqData = [
  {
    category: "시작하기",
    questions: [
      {
        question: "울림은 어떤 플랫폼인가요?",
        answer: "울림은 창작자와 팬이 함께 성장하는 펀딩 & 협업 플랫폼입니다. 단순한 펀딩을 넘어 실행 지원, 투명한 정산, 지속 가능한 커뮤니티를 제공합니다."
      },
      {
        question: "회원가입은 어떻게 하나요?",
        answer: "홈페이지 우측 상단의 '회원가입' 버튼을 클릭하여 이메일 또는 소셜 로그인으로 간편하게 가입할 수 있습니다. 창작자, 참여자, 파트너 중 역할을 선택해주세요."
      },
      {
        question: "어떤 장르의 프로젝트를 지원하나요?",
        answer: "음악, 시각예술, 사진, 영상, 문학, 공연예술 등 모든 창작 분야를 지원합니다. 장르에 제한 없이 창의적인 프로젝트라면 누구나 참여할 수 있습니다."
      }
    ]
  },
  {
    category: "결제 & 정산", 
    questions: [
      {
        question: "리워드형과 수익분배형의 차이는 무엇인가요?",
        answer: "리워드형은 일정 금액 후원 시 굿즈나 경험을 제공받는 방식이고, 수익분배형은 프로젝트 수익에 따라 배당을 받는 방식입니다. 프로젝트에 따라 선택하거나 혼합 운영이 가능합니다."
      },
      {
        question: "정산은 언제 이뤄지나요?",
        answer: "펀딩 목표 달성 후 프로젝트 완료 시점부터 정산이 시작됩니다. 수익분배형의 경우 분기별로 투명하게 정산 내역을 공개하고 자동 분배합니다."
      },
      {
        question: "수수료는 얼마인가요?",
        answer: "울림은 투명한 수수료 정책을 유지합니다. 펀딩 성공 시에만 5%의 플랫폼 수수료가 발생하며, 별도의 숨겨진 비용은 없습니다."
      }
    ]
  },
  {
    category: "프로젝트 관리",
    questions: [
      {
        question: "프로젝트는 어떻게 만드나요?",
        answer: "로그인 후 '프로젝트 만들기' 버튼을 클릭하세요. 프로젝트 소개, 목표 금액, 리워드 설정 등 단계별 가이드를 따라 쉽게 만들 수 있습니다."
      },
      {
        question: "파트너 매칭은 어떻게 받나요?",
        answer: "프로젝트 등록 시 필요한 파트너 유형(공연장, 스튜디오 등)을 선택하면, 울림이 적합한 파트너를 매칭해드립니다. 파트너와 직접 협의하여 진행할 수 있습니다."
      },
      {
        question: "프로젝트 업데이트는 어떻게 하나요?",
        answer: "프로젝트 관리 페이지에서 언제든 진행 상황을 업데이트할 수 있습니다. 참여자들과 소통하고 투명한 진행 과정을 공유해주세요."
      }
    ]
  },
  {
    category: "커뮤니티 가이드",
    questions: [
      {
        question: "커뮤니티 이용 규칙은 무엇인가요?",
        answer: "울림 커뮤니티는 모든 구성원이 서로 존중하며 소통하는 공간입니다. • 서로 존중하며 소통해요 • 건설적인 피드백을 나눠요 • 개인정보는 공유하지 않아요 • 스팸이나 광고는 금지돼요"
      },
      {
        question: "어떤 글을 올릴 수 있나요?",
        answer: "자유게시판, 후기&리뷰, 정보공유, 협업모집, 질문&답변 등 다양한 카테고리에서 창작 활동과 관련된 건전한 내용을 공유할 수 있습니다. 창작자는 개인 프로필에서 팬들과 직접 소통할 수도 있습니다."
      },
      {
        question: "부적절한 내용을 신고하고 싶어요",
        answer: "부적절한 게시글이나 댓글을 발견하시면 해당 콘텐츠의 신고 버튼을 통해 신고해주세요. 운영진이 신속하게 검토하여 조치하겠습니다."
      },
      {
        question: "창작자 개인 커뮤니티는 어떻게 이용하나요?",
        answer: "창작자 프로필의 '커뮤니티' 탭에서 해당 창작자의 소식을 확인하고 댓글로 소통할 수 있습니다. 창작자만 글을 작성할 수 있으며, 팬들은 댓글과 좋아요로 참여할 수 있습니다."
      }
    ]
  }
];

export function HelpPage({ onBack }: HelpPageProps) {
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
            도움말 센터
          </h1>
          <p 
            className="mt-4"
            style={{ 
              fontSize: 'var(--text-body-l)', 
              lineHeight: 'var(--line-height-body-l)',
              color: 'var(--text-secondary)'
            }}
          >
            울림 이용에 필요한 모든 정보를 찾아보세요
          </p>
        </div>

        {/* 도움말 카테고리 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {helpCategories.map((category, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--background-muted)' }}>
                <div style={{ color: 'var(--text-primary)' }}>
                  {category.icon}
                </div>
              </div>
              <h3 style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)' }}>
                {category.title}
              </h3>
              <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                {category.description}
              </p>
            </Card>
          ))}
        </div>

        {/* FAQ 섹션 */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-24)' }}>
              자주 묻는 질문
            </h2>
            
            {faqData.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-8">
                <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-16)' }}>
                  {category.category}
                </h3>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`} className="border rounded-lg px-4" style={{ borderColor: 'var(--border-light)' }}>
                      <AccordionTrigger className="text-left" style={{ color: 'var(--text-primary)' }}>
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent style={{ color: 'var(--text-secondary)' }}>
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* 사이드바 - 추가 도움 */}
          <div className="space-y-6">
            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <MessageCircle className="w-5 h-5" />
                  문의하기
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                  찾으시는 답변이 없으신가요? 직접 문의해주세요.
                </p>
                <Button 
                  className="w-full"
                  style={{
                    backgroundColor: 'var(--action-primary-bg)',
                    color: 'var(--action-primary-text)'
                  }}
                >
                  1:1 문의하기
                </Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Book className="w-5 h-5" />
                  가이드북
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <div className="space-y-2">
                  <a href="#" className="block p-3 rounded hover:bg-gray-50 transition-colors" style={{ backgroundColor: 'var(--background-muted)' }}>
                    <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>창작자 가이드</span>
                  </a>
                  <a href="#" className="block p-3 rounded hover:bg-gray-50 transition-colors" style={{ backgroundColor: 'var(--background-muted)' }}>
                    <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>참여자 가이드</span>
                  </a>
                  <a href="#" className="block p-3 rounded hover:bg-gray-50 transition-colors" style={{ backgroundColor: 'var(--background-muted)' }}>
                    <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>파트너 가이드</span>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6" style={{ backgroundColor: 'var(--background-surface)', border: '1px solid var(--status-info)' }}>
              <div className="text-center">
                <HelpCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--status-info)' }} />
                <h3 style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)' }}>
                  더 궁금한 점이 있으신가요?
                </h3>
                <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)', marginBottom: 'var(--space-16)' }}>
                  help@ulrim.co.kr로 언제든 연락주세요
                </p>
                <Button variant="outline" className="w-full">
                  이메일 보내기
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}