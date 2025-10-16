import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart, Users, Calendar, Target } from "lucide-react";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  targetAmount: number;
  currentAmount: number;
  participantCount: number;
  daysLeft: number;
  artist: {
    name: string;
    avatar?: string;
  };
  rewardType: "reward" | "revenue" | "both";
  verified: boolean;
  onViewProject?: (projectId: string) => void;
}

export function ProjectCard({
  id,
  title,
  description,
  category,
  imageUrl,
  targetAmount,
  currentAmount,
  participantCount,
  daysLeft,
  artist,
  rewardType,
  verified,
  onViewProject
}: ProjectCardProps) {
  const progressPercentage = (currentAmount / targetAmount) * 100;
  const formattedTarget = new Intl.NumberFormat('ko-KR').format(targetAmount);
  const formattedCurrent = new Intl.NumberFormat('ko-KR').format(currentAmount);

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case "reward": return "리워드형";
      case "revenue": return "수익분배형";
      case "both": return "선택형";
      default: return "미정";
    }
  };

  const getRewardTypeText = (type: string) => {
    switch (type) {
      case "reward": return "리워드형";
      case "revenue": return "수익분배형";
      case "both": return "혼합형";
      default: return "기타";
    }
  };

  const handleCardClick = () => {
    if (onViewProject) {
      onViewProject(id);
    }
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
      style={{ 
        backgroundColor: 'var(--background-surface)', 
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)'
      }}
      onClick={handleCardClick}
    >
      <CardHeader className="p-0 relative">
        <div className="aspect-[4/3] overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <Badge variant="secondary" className="backdrop-blur-sm text-xs px-2 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--text-primary)' }}>
            {category}
          </Badge>
          <Badge variant="outline" className="backdrop-blur-sm text-xs px-2 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
            {getRewardTypeLabel(rewardType)}
          </Badge>
          {verified && (
            <Badge className="backdrop-blur-sm text-xs px-2 py-1" style={{ backgroundColor: 'var(--status-success)', color: 'white' }}>
              ✓
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 
            className="line-clamp-2 transition-colors group-hover:opacity-80"
            style={{ 
              fontSize: 'var(--text-body-l)', 
              fontWeight: 'var(--font-weight-medium)', 
              color: 'var(--text-primary)',
              lineHeight: 'var(--line-height-body-l)'
            }}
          >
            {title}
          </h3>
          <p 
            className="line-clamp-2"
            style={{ 
              fontSize: 'var(--text-body-m)', 
              color: 'var(--text-secondary)',
              lineHeight: 'var(--line-height-body-m)'
            }}
          >
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-muted)' }}>
            {artist.avatar ? (
              <ImageWithFallback
                src={artist.avatar}
                alt={artist.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>
                {artist.name[0]}
              </span>
            )}
          </div>
          <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
            {artist.name}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              {Math.round(progressPercentage)}%
            </span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              목표: {formattedTarget}원
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 'var(--text-body-m)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
              {formattedCurrent}원
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <Users className="w-3 h-3" />
            <span style={{ fontSize: 'var(--text-caption)' }}>
              {participantCount}명
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <Calendar className="w-3 h-3" />
            <span style={{ fontSize: 'var(--text-caption)' }}>
              {daysLeft}일 남음
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              // 관심 추가 로직
            }}
          >
            <Heart className="w-3 h-3 mr-1" />
            관심
          </Button>
          <Button 
            size="sm"
            className="flex-1"
            style={{
              backgroundColor: 'var(--action-primary-bg)',
              color: 'var(--action-primary-text)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onViewProject?.(id);
            }}
          >
            참여하기
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}