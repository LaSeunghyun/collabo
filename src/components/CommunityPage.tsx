import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
// import exampleImage from 'figma:asset/6f39baabddf2e266f60b29915b215ef14f86332a.png';
import { 
  MessageCircle, 
  Heart, 
  Share2, 
  Plus,
  Search,
  Clock,
  Eye,
  PinIcon,
  Flame,
  User,
  Calendar,
  TrendingUp,
  HelpCircle,
  FileText,
  Users,
  Megaphone
} from "lucide-react";

// Enhanced community posts data with more entries for better table view
const communityPosts = [
  {
    id: "1",
    category: "공지사항",
    title: "새로운 창작자 분들 환영합니다! 🎉",
    content: "울림에 새로 가입하신 창작자 분들을 따뜻하게 환영합니다. 궁금한 점이 있으시면 언제든지 댓글로 물어보세요.",
    author: {
      name: "울림운영진",
      avatar: "",
      isVerified: true,
      role: "admin"
    },
    stats: {
      likes: 189,
      comments: 43,
      views: 1256
    },
    timestamp: "25-09-25",
    isPinned: true,
    isHot: false
  },
  {
    id: "2", 
    category: "자유게시판",
    title: "라이트닝 밴드 앨범 발매 후기 - 기대 이상이었어요!",
    content: "정말 기다렸던 앨범이었는데 기대 이상이에요! 특히 타이틀곡의 기타 솔로 부분이 정말 인상적이었습니다.",
    author: {
      name: "음악러버123",
      avatar: "",
      isVerified: false,
      role: "user"
    },
    stats: {
      likes: 124,
      comments: 28,
      views: 856
    },
    timestamp: "25-09-23",
    isPinned: false,
    isHot: true
  },
  {
    id: "3",
    category: "정보공유",
    title: "창작자들을 위한 세금 신고 팁 공유해요",
    content: "작년에 처음으로 창작 활동으로 수익이 생겨서 세금 신고를 했는데, 관련 정보를 찾기가 쉽지 않더라고요.",
    author: {
      name: "세무달인",
      avatar: "",
      isVerified: false,
      role: "user"
    },
    stats: {
      likes: 267,
      comments: 84,
      views: 1445
    },
    timestamp: "25-09-22",
    isPinned: false,
    isHot: true
  },
  {
    id: "4",
    category: "협업모집",
    title: "뮤직비디오 촬영 가능한 사진작가를 찾습니다",
    content: "안녕하세요! 인디 뮤지션과 협업하고 싶은 사진작가입니다. 뮤직비디오나 앨범 커버 촬영에 관심이 있으시면 연락 주세요.",
    author: {
      name: "렌즈마스터",
      avatar: "",
      isVerified: true,
      role: "creator"
    },
    stats: {
      likes: 91,
      comments: 32,
      views: 567
    },
    timestamp: "25-09-22",
    isPinned: false,
    isHot: false
  },
  {
    id: "5",
    category: "질문&답변",
    title: "첫 프로젝트 진행 시 주의사항이 있을까요?",
    content: "처음으로 펀딩 프로젝트를 준비하고 있는데, 경험이 있으신 창작자분들께 조언을 구하고 싶습니다.",
    author: {
      name: "신입창작자",
      avatar: "",
      isVerified: false,
      role: "creator"
    },
    stats: {
      likes: 45,
      comments: 78,
      views: 898
    },
    timestamp: "25-09-21",
    isPinned: false,
    isHot: false
  },
  {
    id: "6",
    category: "후기&리뷰",
    title: "김서영 작가 개인전 다녀왔어요! 후기 공유합니다",
    content: "지난 주말에 김서영 작가의 개인전에 다녀왔는데 정말 인상적이었어요. 도시 풍경을 바라보는 새로운 시각을 얻었습니다.",
    author: {
      name: "아트러버",
      avatar: "",
      isVerified: false,
      role: "user"
    },
    stats: {
      likes: 76,
      comments: 15,
      views: 432
    },
    timestamp: "25-09-20",
    isPinned: false,
    isHot: false
  },
  {
    id: "7",
    category: "자유게시판",
    title: "새로운 아트 스튜디오 오픈했습니다!",
    content: "드디어 개인 스튜디오를 열게 되었습니다! 앞으로 더 좋은 작품으로 찾아뵙겠습니다.",
    author: {
      name: "스튜디오메이커",
      avatar: "",
      isVerified: true,
      role: "creator"
    },
    stats: {
      likes: 156,
      comments: 24,
      views: 643
    },
    timestamp: "25-09-19",
    isPinned: false,
    isHot: false
  },
  {
    id: "8",
    category: "협업모집",
    title: "웹툰 작가와 음악가 협업 프로젝트 제안",
    content: "웹툰 OST 제작에 관심 있는 음악가분들을 찾습니다. 함께 멋진 작품을 만들어보아요!",
    author: {
      name: "웹툰작가김",
      avatar: "",
      isVerified: false,
      role: "creator"
    },
    stats: {
      likes: 89,
      comments: 19,
      views: 523
    },
    timestamp: "25-09-18",
    isPinned: false,
    isHot: false
  }
];

const categories = [
  { id: "all", name: "전체", icon: null },
  { id: "notice", name: "공지사항", icon: Megaphone },
  { id: "free", name: "자유게시판", icon: MessageCircle },
  { id: "review", name: "후기&리뷰", icon: Heart },
  { id: "info", name: "정보공유", icon: FileText },
  { id: "collaboration", name: "협업모집", icon: Users },
  { id: "qna", name: "질문&답변", icon: HelpCircle }
];

const categoryMapping = {
  "notice": "공지사항",
  "free": "자유게시판", 
  "review": "후기&리뷰",
  "info": "정보공유",
  "collaboration": "협업모집",
  "qna": "질문&답변"
};

// Recent popular posts for sidebar
const recentPopularPosts = [
  { title: "라이트닝 밴드 앨범 발매 후기", author: "음악러버123", comments: 28 },
  { title: "창작자들을 위한 세금 신고 팁", author: "세무달인", comments: 84 },
  { title: "첫 프로젝트 진행 시 주의사항", author: "신입창작자", comments: 78 },
  { title: "김서영 작가 개인전 후기", author: "아트러버", comments: 15 },
  { title: "웹툰 작가와 음악가 협업", author: "웹툰작가김", comments: 19 }
];

interface CommunityPageProps {
  onBack: () => void;
}

export function CommunityPage({ onBack }: CommunityPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    category: "자유게시판",
    title: "",
    content: ""
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "공지사항": return "bg-red-50 text-red-700 border-red-200";
      case "자유게시판": return "bg-blue-50 text-blue-700 border-blue-200";
      case "후기&리뷰": return "bg-green-50 text-green-700 border-green-200";
      case "정보공유": return "bg-purple-50 text-purple-700 border-purple-200";
      case "협업모집": return "bg-orange-50 text-orange-700 border-orange-200";
      case "질문&답변": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const filteredPosts = communityPosts.filter(post => {
    const matchesCategory = selectedCategory === "all" || 
      post.category === (categoryMapping[selectedCategory as keyof typeof categoryMapping] || selectedCategory);
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreatePost = () => {
    console.log("Creating post:", newPost);
    setShowNewPost(false);
    setNewPost({ category: "자유게시판", title: "", content: "" });
  };

  const EmptyState = () => (
    <div className="text-center py-20">
      <div 
        className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--background-muted)' }}
      >
        <Search className="w-10 h-10" style={{ color: 'var(--text-disabled)' }} />
      </div>
      <h3 
        className="mb-4"
        style={{ 
          fontSize: 'var(--text-h2)', 
          color: 'var(--text-primary)',
          fontWeight: 'var(--font-weight-medium)'
        }}
      >
        {searchQuery ? "검색 결과가 없습니다" : "아직 게시글이 없습니다"}
      </h3>
      <p 
        className="mb-8 max-w-md mx-auto"
        style={{ 
          fontSize: 'var(--text-body-m)', 
          color: 'var(--text-secondary)',
          lineHeight: 'var(--line-height-body-m)'
        }}
      >
        {searchQuery 
          ? "다른 키워드로 검색해보거나 카테고리를 변경해보세요" 
          : "첫 번째 게시글을 작성해서 커뮤니티를 시작해보세요"}
      </p>
      {!searchQuery && (
        <Button 
          onClick={() => setShowNewPost(true)}
          style={{ 
            backgroundColor: 'var(--action-primary-bg)',
            color: 'var(--action-primary-text)'
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          첫 글 작성하기
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-base)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-6 -ml-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← 뒤로가기
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="mb-2"
                style={{ 
                  fontSize: 'var(--text-display)', 
                  lineHeight: 'var(--line-height-display)', 
                  fontWeight: 'bold',
                  color: 'var(--text-primary)'
                }}
              >
                울림 커뮤니티
              </h1>
              <p 
                style={{ 
                  fontSize: 'var(--text-body-l)', 
                  lineHeight: 'var(--line-height-body-l)',
                  color: 'var(--text-secondary)'
                }}
              >
                창작자와 팬들이 소통하며 함께 성장하는 공간입니다
              </p>
            </div>
            
            <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  style={{ 
                    backgroundColor: 'var(--action-primary-bg)',
                    color: 'var(--action-primary-text)'
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  글 쓰기
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle style={{ fontSize: 'var(--text-h2)' }}>새 글 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <label 
                      className="block mb-3"
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      카테고리
                    </label>
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                      className="w-full p-3 border rounded-lg"
                      style={{ 
                        borderColor: 'var(--border-light)', 
                        backgroundColor: 'var(--background-surface)',
                        fontSize: 'var(--text-body-m)'
                      }}
                    >
                      {categories.slice(1).map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label 
                      className="block mb-3"
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      제목
                    </label>
                    <Input
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      placeholder="제목을 입력하세요"
                      className="text-base"
                    />
                  </div>
                  <div>
                    <label 
                      className="block mb-3"
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      내용
                    </label>
                    <Textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      placeholder="내용을 입력하세요"
                      rows={8}
                      className="text-base"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowNewPost(false)}>
                      취소
                    </Button>
                    <Button 
                      onClick={handleCreatePost}
                      disabled={!newPost.title || !newPost.content}
                      style={{ 
                        backgroundColor: 'var(--action-primary-bg)',
                        color: 'var(--action-primary-text)'
                      }}
                    >
                      작성하기
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Content Area */}
          <div className="lg:col-span-3">
            {/* Navigation & Search */}
            <div className="mb-8">
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`h-10 px-4 ${selectedCategory === category.id 
                        ? "" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      style={selectedCategory === category.id ? {
                        backgroundColor: 'var(--action-primary-bg)',
                        color: 'var(--action-primary-text)'
                      } : {}}
                    >
                      {Icon && <Icon className="w-4 h-4 mr-2" />}
                      {category.name}
                    </Button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative max-w-lg">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: 'var(--text-disabled)' }} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제목이나 내용으로 검색..."
                  className="pl-12 h-12 text-base"
                  style={{ 
                    borderColor: 'var(--border-light)',
                    backgroundColor: 'var(--background-surface)'
                  }}
                />
              </div>
            </div>

            {/* Posts Table */}
            {filteredPosts.length === 0 ? (
              <EmptyState />
            ) : (
              <Card 
                className="border-0 overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--background-surface)',
                  borderRadius: 'var(--radius-xl)'
                }}
              >
                {/* Table Header */}
                <div 
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b"
                  style={{ 
                    backgroundColor: 'var(--background-muted)',
                    borderColor: 'var(--border-light)'
                  }}
                >
                  <div className="col-span-1 text-center">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      상태
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      카테고리
                    </span>
                  </div>
                  <div className="col-span-5">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      제목
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      작성자
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      날짜
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      조회
                    </span>
                  </div>
                </div>

                {/* Table Body */}
                <div>
                  {filteredPosts.map((post, index) => (
                    <div 
                      key={post.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                        post.isPinned ? 'bg-orange-50' : ''
                      }`}
                      style={{ 
                        borderColor: 'var(--border-light)'
                      }}
                    >
                      {/* Status */}
                      <div className="col-span-1 flex justify-center items-center">
                        {post.isPinned ? (
                          <PinIcon className="w-4 h-4 text-orange-500" />
                        ) : post.isHot ? (
                          <Flame className="w-4 h-4 text-red-500" />
                        ) : (
                          <span 
                            style={{ 
                              fontSize: 'var(--text-body-m)', 
                              color: 'var(--text-disabled)'
                            }}
                          >
                            {filteredPosts.length - index}
                          </span>
                        )}
                      </div>

                      {/* Category */}
                      <div className="col-span-2">
                        <Badge 
                          className={`${getCategoryColor(post.category)} border text-xs`}
                        >
                          {post.category}
                        </Badge>
                      </div>

                      {/* Title */}
                      <div className="col-span-5">
                        <div className="flex items-center gap-2">
                          <h3 
                            className="font-medium hover:text-blue-600 transition-colors truncate"
                            style={{ 
                              fontSize: 'var(--text-body-m)', 
                              color: 'var(--text-primary)'
                            }}
                          >
                            {post.title}
                          </h3>
                          {post.stats.comments > 0 && (
                            <span 
                              className="text-blue-500 ml-1"
                              style={{ fontSize: 'var(--text-caption)' }}
                            >
                              [{post.stats.comments}]
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Author */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <span 
                            style={{ 
                              fontSize: 'var(--text-body-m)', 
                              color: 'var(--text-primary)'
                            }}
                          >
                            {post.author.name}
                          </span>
                          {post.author.isVerified && (
                            <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-xs px-1">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-1">
                        <span 
                          style={{ 
                            fontSize: 'var(--text-caption)', 
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {post.timestamp}
                        </span>
                      </div>

                      {/* Views */}
                      <div className="col-span-1 text-center">
                        <span 
                          style={{ 
                            fontSize: 'var(--text-caption)', 
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {post.stats.views}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-2 py-6">
                  <Button variant="outline" size="sm" disabled>
                    이전
                  </Button>
                  {[1, 2, 3, 4, 5].map((page) => (
                    <Button 
                      key={page}
                      variant={page === 1 ? "default" : "outline"} 
                      size="sm"
                      className="w-8 h-8"
                      style={page === 1 ? {
                        backgroundColor: 'var(--action-primary-bg)',
                        color: 'var(--action-primary-text)'
                      } : {}}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm">
                    다음
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Community Stats */}
              <Card 
                className="p-6 border-0"
                style={{ 
                  backgroundColor: 'var(--background-surface)',
                  borderRadius: 'var(--radius-xl)'
                }}
              >
                <h3 
                  className="mb-4"
                  style={{ 
                    fontSize: 'var(--text-h3)', 
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)'
                  }}
                >
                  커뮤니티 현황
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        color: 'var(--text-secondary)'
                      }}
                    >
                      전체 게시글
                    </span>
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {communityPosts.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        color: 'var(--text-secondary)'
                      }}
                    >
                      오늘 신규
                    </span>
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      3
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        color: 'var(--text-secondary)'
                      }}
                    >
                      활성 사용자
                    </span>
                    <span 
                      style={{ 
                        fontSize: 'var(--text-body-m)', 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      127
                    </span>
                  </div>
                </div>
              </Card>

              {/* Popular Posts */}
              <Card 
                className="p-6 border-0"
                style={{ 
                  backgroundColor: 'var(--background-surface)',
                  borderRadius: 'var(--radius-xl)'
                }}
              >
                <h3 
                  className="mb-4"
                  style={{ 
                    fontSize: 'var(--text-h3)', 
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)'
                  }}
                >
                  인기 게시글
                </h3>
                <div className="space-y-3">
                  {recentPopularPosts.map((post, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span 
                        className="text-center w-5 h-5 flex items-center justify-center rounded"
                        style={{ 
                          backgroundColor: index < 3 ? 'var(--status-info)' : 'var(--background-muted)',
                          color: index < 3 ? 'white' : 'var(--text-disabled)',
                          fontSize: 'var(--text-caption)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="truncate cursor-pointer hover:text-blue-600 transition-colors"
                          style={{ 
                            fontSize: 'var(--text-body-m)', 
                            color: 'var(--text-primary)'
                          }}
                        >
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            style={{ 
                              fontSize: 'var(--text-caption)', 
                              color: 'var(--text-disabled)'
                            }}
                          >
                            {post.author}
                          </span>
                          <span 
                            style={{ 
                              fontSize: 'var(--text-caption)', 
                              color: 'var(--text-disabled)'
                            }}
                          >
                            •
                          </span>
                          <span 
                            style={{ 
                              fontSize: 'var(--text-caption)', 
                              color: 'var(--text-disabled)'
                            }}
                          >
                            댓글 {post.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Featured Banner */}
              <Card 
                className="p-0 border-0 overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--background-surface)',
                  borderRadius: 'var(--radius-xl)'
                }}
              >
                    <div
                      className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
                    >
                      <span className="text-white font-medium">Community Banner</span>
                    </div>
                <div className="p-4">
                  <h4 
                    className="mb-2"
                    style={{ 
                      fontSize: 'var(--text-body-m)', 
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    창작자 가이드
                  </h4>
                  <p 
                    style={{ 
                      fontSize: 'var(--text-caption)', 
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--line-height-caption)'
                    }}
                  >
                    프로젝트 시작을 위한 단계별 가이드를 확인해보세요
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}