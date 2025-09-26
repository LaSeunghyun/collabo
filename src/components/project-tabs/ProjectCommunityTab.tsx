import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";

interface ProjectCommunityTabProps {
  projectId: string;
}

// Mock community data
const mockCommunityData = {
  posts: [
    {
      id: "1",
      title: "앨범 커버 디자인에 대한 의견을 들려주세요!",
      content: "현재 3가지 컨셉으로 진행 중인데, 어떤 느낌이 가장 좋을지 의견 부탁드려요. 댓글로 선호하는 스타일을 알려주시면 참고하겠습니다!",
      author: {
        name: "라이트닝 밴드",
        role: "creator",
        avatar: ""
      },
      date: "2024-01-21",
      likes: 24,
      comments: 18,
      isPinned: true
    },
    {
      id: "2",
      title: "라이브 공연 언제쯤 가능할까요?",
      content: "앨범 발매 후에 라이브 공연도 계획하고 계신지 궁금합니다!",
      author: {
        name: "음악러버",
        role: "supporter",
        avatar: ""
      },
      date: "2024-01-20",
      likes: 12,
      comments: 8,
      isPinned: false
    },
    {
      id: "3",
      title: "응원합니다! 대학교 때부터 팬이었어요",
      content: "드디어 정규앨범이 나오는군요. 대학 축제에서 처음 보고 팬이 됐는데, 이렇게 성장하는 모습을 보니 정말 기쁩니다. 꼭 성공하길 바랄게요!",
      author: {
        name: "대학동기",
        role: "supporter",
        avatar: ""
      },
      date: "2024-01-19",
      likes: 31,
      comments: 15,
      isPinned: false
    }
  ],
  qna: [
    {
      id: "1",
      question: "LP 버전도 제작할 예정인가요?",
      answer: "네, LP 버전도 제작할 예정입니다! 목표 금액 달성 시 추가로 LP 제작을 진행할 계획이에요. LP는 한정판으로 제작될 예정입니다.",
      author: {
        name: "비닐러버",
        role: "supporter"
      },
      answeredBy: {
        name: "라이트닝 밴드",
        role: "creator"
      },
      date: "2024-01-21",
      isAnswered: true
    },
    {
      id: "2", 
      question: "앨범에 수록될 곡은 총 몇 곡인가요?",
      answer: "총 10곡이 수록될 예정입니다. 타이틀곡 2곡과 수록곡 8곡으로 구성되어 있어요.",
      author: {
        name: "멜로디헌터",
        role: "supporter"
      },
      answeredBy: {
        name: "라이트닝 밴드", 
        role: "creator"
      },
      date: "2024-01-20",
      isAnswered: true
    },
    {
      id: "3",
      question: "콘서트는 언제쯤 열 예정이신가요?",
      answer: "",
      author: {
        name: "콘서트기다리는팬",
        role: "supporter"
      },
      date: "2024-01-19",
      isAnswered: false
    }
  ]
};

export function ProjectCommunityTab({ projectId }: ProjectCommunityTabProps) {
  const [selectedTab, setSelectedTab] = useState("board");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "creator":
        return <Badge variant="secondary" style={{ fontSize: 'var(--text-caption)', backgroundColor: 'var(--status-info)', color: 'white' }}>창작자</Badge>;
      case "partner":
        return <Badge variant="secondary" style={{ fontSize: 'var(--text-caption)', backgroundColor: 'var(--status-success)', color: 'white' }}>파트너</Badge>;
      case "supporter":
        return <Badge variant="outline" style={{ fontSize: 'var(--text-caption)' }}>참여자</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-2 w-fit">
          <TabsTrigger value="board" style={{ fontSize: 'var(--text-body-m)' }}>
            게시판
          </TabsTrigger>
          <TabsTrigger value="qna" style={{ fontSize: 'var(--text-body-m)' }}>
            Q&A
          </TabsTrigger>
        </TabsList>

        {/* 게시판 탭 */}
        <TabsContent value="board" className="space-y-6">
          {/* 새 글 작성 */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                새 글 작성
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="제목을 입력하세요"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <Textarea
                placeholder="내용을 입력하세요"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button
                  style={{
                    backgroundColor: 'var(--action-primary-bg)',
                    color: 'var(--action-primary-text)'
                  }}
                >
                  글 작성하기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 게시글 목록 */}
          <div className="space-y-4">
            {mockCommunityData.posts.map((post) => (
              <Card key={post.id} className={post.isPinned ? "border-2" : ""} style={{ borderColor: post.isPinned ? 'var(--status-info)' : 'var(--border-light)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {post.author.name}
                          </span>
                          {getRoleBadge(post.author.role)}
                          {post.isPinned && (
                            <Badge style={{ fontSize: 'var(--text-caption)', backgroundColor: 'var(--status-info)', color: 'white' }}>
                              📌 고정
                            </Badge>
                          )}
                        </div>
                        <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                          {formatDate(post.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 style={{ 
                    fontSize: 'var(--text-h3)', 
                    fontWeight: 'var(--font-weight-medium)', 
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-8)'
                  }}>
                    {post.title}
                  </h4>
                  <p style={{ 
                    fontSize: 'var(--text-body-l)', 
                    lineHeight: 'var(--line-height-body-l)', 
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-16)'
                  }}>
                    {post.content}
                  </p>
                  
                  {/* 반응 버튼 */}
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="p-0">
                      <span className="mr-1">👍</span>
                      <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                        {post.likes}
                      </span>
                    </Button>
                    <Button variant="ghost" size="sm" className="p-0">
                      <span className="mr-1">💬</span>
                      <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                        {post.comments}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Q&A 탭 */}
        <TabsContent value="qna" className="space-y-6">
          {/* 새 질문 작성 */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                새 질문하기
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="궁금한 점을 질문해보세요"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  style={{
                    backgroundColor: 'var(--action-primary-bg)',
                    color: 'var(--action-primary-text)'
                  }}
                >
                  질문하기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Q&A 목록 */}
          <div className="space-y-4">
            {mockCommunityData.qna.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  {/* 질문 */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontSize: '16px' }}>❓</span>
                      <Badge variant="outline" style={{ fontSize: 'var(--text-caption)' }}>질문</Badge>
                      <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                        {item.author.name} · {formatDate(item.date)}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: 'var(--text-body-l)', 
                      color: 'var(--text-primary)',
                      marginLeft: '24px'
                    }}>
                      {item.question}
                    </p>
                  </div>

                  {/* 답변 */}
                  {item.isAnswered ? (
                    <div className="ml-6 pl-4 border-l-2" style={{ borderColor: 'var(--status-success)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ fontSize: '16px' }}>✅</span>
                        <Badge style={{ fontSize: 'var(--text-caption)', backgroundColor: 'var(--status-success)', color: 'white' }}>
                          답변완료
                        </Badge>
                        <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                          {item.answeredBy?.name}
                        </span>
                        {getRoleBadge(item.answeredBy?.role || "")}
                      </div>
                      <p style={{ 
                        fontSize: 'var(--text-body-l)', 
                        color: 'var(--text-primary)'
                      }}>
                        {item.answer}
                      </p>
                    </div>
                  ) : (
                    <div className="ml-6 pl-4 border-l-2" style={{ borderColor: 'var(--status-alert)' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '16px' }}>⏳</span>
                        <Badge style={{ fontSize: 'var(--text-caption)', backgroundColor: 'var(--status-alert)', color: 'white' }}>
                          답변대기
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 커뮤니티 가이드라인 */}
      <Card style={{ backgroundColor: 'var(--background-muted)' }}>
        <CardContent className="p-4">
          <h4 style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-8)' }}>
            💡 커뮤니티 가이드라인
          </h4>
          <ul className="space-y-1" style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
            <li>• 서로 존중하는 마음으로 소통해주세요</li>
            <li>• 프로젝트와 관련된 내용으로 대화해주세요</li>
            <li>• 개인정보나 홍보성 글은 자제해주세요</li>
            <li>• 창작자가 답변하기까지 시간이 걸릴 수 있어요</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}