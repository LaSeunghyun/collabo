import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  Heart, 
  Share2, 
  MapPin,
  Calendar,
  Users,
  Star,
  Award,
  ExternalLink,
  Play,
  Image as ImageIcon,
  Music,
  Video,
  Palette,
  MessageCircle,
  Clock,
  Eye,
  Send,
  Plus
} from "lucide-react";

// Mock artist data
const artistData = {
  id: "1",
  name: "라이트닝 밴드",
  genre: "인디록",
  bio: "2019년 결성된 5인조 인디 록 밴드입니다. 진솔한 가사와 강렬한 사운드로 젊은 세대의 마음을 울리는 음악을 만들고 있습니다. 언더그라운드에서 5년간 쌓아온 경험을 바탕으로 더 많은 사람들과 만나고 싶어 울림에 합류했습니다.",
  profileImage: "https://images.unsplash.com/photo-1637761566180-9dbde4fdab77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc3QlMjBwcm9maWxlJTIwcG9ydGZvbGlvfGVufDF8fHx8MTc1ODcxNzE0MXww&ixlib=rb-4.1.0&q=80&w=1080",
  coverImage: "https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  location: "서울, 홍대",
  joinDate: "2023년 3월",
  isVerified: true,
  followers: 1240,
  following: 89,
  totalFunded: 8500000,
  successRate: 89,
  projects: {
    total: 3,
    successful: 2,
    ongoing: 1
  },
  achievements: [
    { title: "첫 프로젝트 성공", date: "2023.05", icon: Star },
    { title: "목표 150% 달성", date: "2023.08", icon: Award },
    { title: "베스트 뮤지션", date: "2024.01", icon: Music }
  ],
  socialLinks: [
    { platform: "YouTube", url: "#", icon: Play },
    { platform: "Instagram", url: "#", icon: ImageIcon },
    { platform: "Spotify", url: "#", icon: Music }
  ]
};

const currentProjects = [
  {
    id: "1",
    title: "라이트닝 밴드의 첫 정규앨범 제작",
    description: "5년간 함께해온 멤버들과 만드는 첫 정규앨범. 스튜디오 녹음부터 마스터링까지 전 과정을 투명하게 공개합니다.",
    image: "https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    targetAmount: 5000000,
    currentAmount: 3200000,
    participantCount: 127,
    daysLeft: 18,
    status: "진행중"
  }
];

const pastProjects = [
  {
    id: "2",
    title: "라이트닝 밴드 첫 단독 콘서트",
    description: "팬들과 만나는 첫 단독 콘서트를 성공적으로 개최했습니다.",
    image: "https://images.unsplash.com/photo-1758522275018-2751894b49c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBjb2xsYWJvcmF0aW9uJTIwY3JlYXRpdmV8ZW58MXx8fHwxNzU4NzEwNzQzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    targetAmount: 3000000,
    finalAmount: 4500000,
    participantCount: 89,
    successRate: 150,
    status: "성공"
  },
  {
    id: "3",
    title: "라이트닝 밴드 EP 앨범 제작",
    description: "데뷔 EP 앨범을 제작하여 음원 플랫폼에 발매했습니다.",
    image: "https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    targetAmount: 2000000,
    finalAmount: 2300000,
    participantCount: 67,
    successRate: 115,
    status: "성공"
  }
];

const portfolio = [
  {
    id: "1",
    title: "Summer Night (2024)",
    type: "single",
    description: "여름밤의 감성을 담은 신곡",
    image: "https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: "2", 
    title: "Live at Club FF (2023)",
    type: "video",
    description: "클럽 FF에서의 라이브 공연 실황",
    image: "https://images.unsplash.com/photo-1758522275018-2751894b49c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBjb2xsYWJvcmF0aW9uJTIwY3JlYXRpdmV8ZW58MXx8fHwxNzU4NzEwNzQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: "3",
    title: "Midnight EP (2023)", 
    type: "album",
    description: "데뷔 EP 앨범 (5곡 수록)",
    image: "https://images.unsplash.com/photo-1607958377758-e307b3a03073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMG11c2ljJTIwYXJ0aXN0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MTA3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080"
  }
];

// Artist community posts (creator's posts with fan comments)
const artistPosts = [
  {
    id: "1",
    title: "앨범 녹음 과정을 공유합니다 🎵",
    content: "안녕하세요! 현재 정규앨범 녹음이 한창 진행 중입니다. 스튜디오에서의 일상과 작업 과정을 여러분과 나누고 싶어서 글을 올립니다. 오늘은 드럼 녹음을 마쳤는데, 정말 만족스러운 사운드가 나왔어요!",
    timestamp: "3시간 전",
    likes: 45,
    views: 234,
    comments: [
      {
        id: "1",
        author: "팬123",
        content: "와 정말 기대돼요! 드럼 사운드 궁금하네요",
        timestamp: "2시간 전",
        likes: 12
      },
      {
        id: "2", 
        author: "음악애호가",
        content: "언제나 응원하고 있어요! 화이팅!",
        timestamp: "1시간 전",
        likes: 8
      }
    ]
  },
  {
    id: "2",
    title: "다음 주 라이브 스트리밍 예고!",
    content: "다음 주 금요일 저녁 8시에 라이브 스트리밍을 진행할 예정입니다. 새로운 곡도 조금 공개할 예정이니 많은 관심 부탁드려요. 궁금한 점이나 듣고 싶은 곡이 있으면 댓글로 남겨주세요!",
    timestamp: "2일 전",
    likes: 78,
    views: 567,
    comments: [
      {
        id: "1",
        author: "라이트닝팬",
        content: "와 진짜 기대돼요! Summer Night 라이브로 들을 수 있을까요?",
        timestamp: "2일 전",
        likes: 15
      },
      {
        id: "2",
        author: "콘서트가고싶어",
        content: "시간 맞춰서 꼭 볼게요! 새 곡 너무 궁금해요",
        timestamp: "1일 전", 
        likes: 10
      },
      {
        id: "3",
        author: "뮤직러버",
        content: "다른 멤버들도 같이 나오나요?",
        timestamp: "1일 전",
        likes: 6
      }
    ]
  }
];

// Component for Artist Community Tab
function ArtistCommunityTab({ artistId, artistName }: { artistId: string, artistName: string }) {
  const [newComment, setNewComment] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return;
    console.log("Adding comment to post", postId, ":", newComment);
    setNewComment("");
    setSelectedPostId(null);
  };

  const handleCreatePost = () => {
    console.log("Creating new post:", newPost);
    setShowNewPost(false);
    setNewPost({ title: "", content: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 
            className="font-bold"
            style={{ 
              fontSize: 'var(--text-h2)', 
              lineHeight: 'var(--line-height-h2)',
              color: 'var(--text-primary)'
            }}
          >
            {artistName}의 소식
          </h3>
          <p 
            style={{ 
              fontSize: 'var(--text-body-m)', 
              color: 'var(--text-secondary)'
            }}
          >
            창작자와 팬들이 소통하는 공간입니다
          </p>
        </div>
        <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              style={{ 
                backgroundColor: 'var(--action-primary-bg)',
                color: 'var(--action-primary-text)'
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              새 소식
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>새 소식 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label 
                  className="block mb-2"
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
                />
              </div>
              <div>
                <label 
                  className="block mb-2"
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
                  placeholder="팬들과 나누고 싶은 소식을 작성하세요"
                  rows={6}
                />
              </div>
              <div className="flex gap-2 justify-end">
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
                  게시하기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {artistPosts.map((post) => (
          <Card key={post.id} className="border" style={{ borderColor: 'var(--border-light)' }}>
            <CardContent className="p-6">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--background-muted)' }}
                >
                  <span 
                    className="font-medium"
                    style={{ 
                      fontSize: 'var(--text-body-m)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {artistName[0]}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-medium"
                      style={{ 
                        fontSize: 'var(--text-body-m)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {artistName}
                    </span>
                    <Badge className="bg-blue-50 text-blue-700 text-xs border border-blue-200">
                      창작자
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span style={{ fontSize: 'var(--text-caption)' }}>
                      {post.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <h4 
                className="font-semibold mb-3"
                style={{ 
                  fontSize: 'var(--text-h3)', 
                  lineHeight: 'var(--line-height-h3)',
                  color: 'var(--text-primary)'
                }}
              >
                {post.title}
              </h4>
              <p 
                className="mb-4"
                style={{ 
                  fontSize: 'var(--text-body-l)', 
                  lineHeight: 'var(--line-height-body-l)',
                  color: 'var(--text-secondary)'
                }}
              >
                {post.content}
              </p>

              {/* Post Stats */}
              <div className="flex items-center gap-6 mb-4 pb-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span style={{ fontSize: 'var(--text-caption)' }}>
                    {post.likes}
                  </span>
                </button>
                <div className="flex items-center gap-1 text-gray-500">
                  <MessageCircle className="w-4 h-4" />
                  <span style={{ fontSize: 'var(--text-caption)' }}>
                    {post.comments.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span style={{ fontSize: 'var(--text-caption)' }}>
                    {post.views}
                  </span>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--background-muted)' }}
                    >
                      <span 
                        className="font-medium"
                        style={{ 
                          fontSize: 'var(--text-caption)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {comment.author[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-medium"
                          style={{ 
                            fontSize: 'var(--text-body-m)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {comment.author}
                        </span>
                        <span 
                          className="text-gray-500"
                          style={{ fontSize: 'var(--text-caption)' }}
                        >
                          {comment.timestamp}
                        </span>
                      </div>
                      <p 
                        style={{ 
                          fontSize: 'var(--text-body-m)', 
                          color: 'var(--text-secondary)',
                          marginBottom: 'var(--space-8)'
                        }}
                      >
                        {comment.content}
                      </p>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                        <Heart className="w-3 h-3" />
                        <span style={{ fontSize: 'var(--text-caption)' }}>
                          {comment.likes}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Comment */}
                <div className="flex gap-3 pt-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--background-muted)' }}
                  >
                    <span 
                      className="font-medium"
                      style={{ 
                        fontSize: 'var(--text-caption)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      나
                    </span>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={selectedPostId === post.id ? newComment : ""}
                      onChange={(e) => {
                        setNewComment(e.target.value);
                        setSelectedPostId(post.id);
                      }}
                      placeholder="댓글을 입력하세요..."
                      style={{ fontSize: 'var(--text-body-m)' }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment.trim() || selectedPostId !== post.id}
                      style={{ 
                        backgroundColor: 'var(--action-primary-bg)',
                        color: 'var(--action-primary-text)'
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface ArtistProfilePageProps {
  artistId: string;
  onBack: () => void;
}

export function ArtistProfilePage({ artistId, onBack }: ArtistProfilePageProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Section */}
      <div className="relative h-80 bg-gray-900 overflow-hidden">
        <ImageWithFallback
          src={artistData.coverImage}
          alt="Cover"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="absolute top-4 left-4 text-white hover:bg-white/20"
        >
          ← 뒤로가기
        </Button>
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <ImageWithFallback
                    src={artistData.profileImage}
                    alt={artistData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 
                        className="text-gray-900"
                        style={{ fontSize: 'var(--text-display)', lineHeight: 'var(--line-height-display)', fontWeight: 'bold' }}
                      >
                        {artistData.name}
                      </h1>
                      {artistData.isVerified && (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
                          ✓ 검증됨
                        </Badge>
                      )}
                    </div>
                    <p 
                      className="text-gray-600 mb-2"
                      style={{ fontSize: 'var(--text-h3)', lineHeight: 'var(--line-height-h3)' }}
                    >
                      {artistData.genre}
                    </p>
                    <div className="flex items-center gap-4 text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span style={{ fontSize: 'var(--text-body-m)' }}>{artistData.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span style={{ fontSize: 'var(--text-body-m)' }}>가입 {artistData.joinDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setIsFollowing(!isFollowing)}
                      className={isFollowing 
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300" 
                        : "bg-gray-900 text-white hover:bg-gray-800"
                      }
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                      {isFollowing ? '팔로잉' : '팔로우'}
                    </Button>
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      <Share2 className="w-4 h-4 mr-2" />
                      공유
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div 
                      className="font-bold text-gray-900"
                      style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--line-height-h2)' }}
                    >
                      {artistData.followers.toLocaleString()}
                    </div>
                    <div 
                      className="text-gray-600"
                      style={{ fontSize: 'var(--text-body-m)' }}
                    >
                      팔로워
                    </div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="font-bold text-gray-900"
                      style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--line-height-h2)' }}
                    >
                      {artistData.projects.total}
                    </div>
                    <div 
                      className="text-gray-600"
                      style={{ fontSize: 'var(--text-body-m)' }}
                    >
                      프로젝트
                    </div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="font-bold text-gray-900"
                      style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--line-height-h2)' }}
                    >
                      {artistData.successRate}%
                    </div>
                    <div 
                      className="text-gray-600"
                      style={{ fontSize: 'var(--text-body-m)' }}
                    >
                      성공률
                    </div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="font-bold text-gray-900"
                      style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--line-height-h2)' }}
                    >
                      {Math.floor(artistData.totalFunded / 1000000)}M
                    </div>
                    <div 
                      className="text-gray-600"
                      style={{ fontSize: 'var(--text-body-m)' }}
                    >
                      총 펀딩액
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="about" className="mb-12">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger value="about" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              소개
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              프로젝트
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              포트폴리오
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              커뮤니티
            </TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle 
                      className="text-gray-900"
                      style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--line-height-h2)' }}
                    >
                      아티스트 소개
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p 
                      className="text-gray-700 leading-relaxed"
                      style={{ fontSize: 'var(--text-body-l)', lineHeight: 'var(--line-height-body-l)' }}
                    >
                      {artistData.bio}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle 
                      className="text-gray-900"
                      style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--line-height-h2)' }}
                    >
                      성과
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {artistData.achievements.map((achievement, index) => {
                        const Icon = achievement.icon;
                        return (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Icon className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 
                                className="font-medium text-gray-900"
                                style={{ fontSize: 'var(--text-body-l)' }}
                              >
                                {achievement.title}
                              </h4>
                              <p 
                                className="text-gray-500"
                                style={{ fontSize: 'var(--text-body-m)' }}
                              >
                                {achievement.date}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle 
                      className="text-gray-900"
                      style={{ fontSize: 'var(--text-h3)', lineHeight: 'var(--line-height-h3)' }}
                    >
                      소셜 링크
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {artistData.socialLinks.map((link, index) => {
                        const Icon = link.icon;
                        return (
                          <a
                            key={index}
                            href={link.url}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <Icon className="w-5 h-5 text-gray-600" />
                            <span 
                              className="text-gray-700"
                              style={{ fontSize: 'var(--text-body-m)' }}
                            >
                              {link.platform}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                          </a>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-6">
            <div className="space-y-8">
              {/* Current Projects */}
              {currentProjects.length > 0 && (
                <div>
                  <h3 
                    className="text-gray-900 mb-6"
                    style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--line-height-h2)', fontWeight: 'bold' }}
                  >
                    진행 중인 프로젝트
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {currentProjects.map((project) => (
                      <Card key={project.id} className="border border-gray-200 overflow-hidden">
                        <div className="aspect-video">
                          <ImageWithFallback
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-6">
                          <h4 
                            className="font-semibold text-gray-900 mb-2"
                            style={{ fontSize: 'var(--text-h3)', lineHeight: 'var(--line-height-h3)' }}
                          >
                            {project.title}
                          </h4>
                          <p 
                            className="text-gray-600 mb-4"
                            style={{ fontSize: 'var(--text-body-m)' }}
                          >
                            {project.description}
                          </p>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span 
                                className="text-gray-600"
                                style={{ fontSize: 'var(--text-body-m)' }}
                              >
                                진행률
                              </span>
                              <span 
                                className="font-medium text-gray-900"
                                style={{ fontSize: 'var(--text-body-m)' }}
                              >
                                {Math.round((project.currentAmount / project.targetAmount) * 100)}%
                              </span>
                            </div>
                            <Progress value={(project.currentAmount / project.targetAmount) * 100} />
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>{project.currentAmount.toLocaleString()}원</span>
                              <span>{project.daysLeft}일 남음</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Projects */}
              <div>
                <h3 
                  className="text-gray-900 mb-6"
                  style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--line-height-h2)', fontWeight: 'bold' }}
                >
                  완료된 프로젝트
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {pastProjects.map((project) => (
                    <Card key={project.id} className="border border-gray-200 overflow-hidden">
                      <div className="aspect-video">
                        <ImageWithFallback
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 
                            className="font-semibold text-gray-900"
                            style={{ fontSize: 'var(--text-h3)', lineHeight: 'var(--line-height-h3)' }}
                          >
                            {project.title}
                          </h4>
                          <Badge className="bg-green-50 text-green-700 border border-green-200">
                            성공
                          </Badge>
                        </div>
                        <p 
                          className="text-gray-600 mb-4"
                          style={{ fontSize: 'var(--text-body-m)' }}
                        >
                          {project.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span 
                              className="text-gray-600"
                              style={{ fontSize: 'var(--text-body-m)' }}
                            >
                              최종 달성률
                            </span>
                            <span 
                              className="font-medium text-green-600"
                              style={{ fontSize: 'var(--text-body-m)' }}
                            >
                              {project.successRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span 
                              className="text-gray-600"
                              style={{ fontSize: 'var(--text-body-m)' }}
                            >
                              참여자
                            </span>
                            <span 
                              className="text-gray-900"
                              style={{ fontSize: 'var(--text-body-m)' }}
                            >
                              {project.participantCount}명
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {portfolio.map((item) => (
                <Card key={item.id} className="border border-gray-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="aspect-square">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <h4 
                      className="font-semibold text-gray-900 mb-1"
                      style={{ fontSize: 'var(--text-body-l)' }}
                    >
                      {item.title}
                    </h4>
                    <p 
                      className="text-gray-600"
                      style={{ fontSize: 'var(--text-body-m)' }}
                    >
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="mt-6">
            <ArtistCommunityTab artistId={artistId} artistName={artistData.name} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}