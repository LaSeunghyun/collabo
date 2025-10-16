// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'participant' | 'partner';
  avatar?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project types
export interface Project {
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
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    followers?: number;
  };
  rewardType: 'reward' | 'revenue' | 'both';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

// Artist types
export interface Artist {
  id: string;
  name: string;
  genre: string;
  bio: string;
  profileImage: string;
  coverImage: string;
  location: string;
  joinDate: string;
  isVerified: boolean;
  followers: number;
  following: number;
  totalFunded: number;
  successRate: number;
  projects: {
    total: number;
    successful: number;
    ongoing: number;
  };
  achievements: Array<{
    title: string;
    date: string;
    icon: string;
  }>;
  socialLinks: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
}

// Community types
export interface CommunityPost {
  id: string;
  category: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    role: 'admin' | 'creator' | 'user';
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
  };
  timestamp: string;
  isPinned: boolean;
  isHot: boolean;
  comments?: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
    likes: number;
  }>;
}

// Participation types
export interface Participation {
  id: string;
  projectId: string;
  userId: string;
  type: 'reward' | 'revenue';
  amount: number;
  rewardId?: string;
  participantInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    message?: string;
  };
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

// Reward types
export interface Reward {
  id: string;
  projectId: string;
  amount: number;
  title: string;
  description: string;
  items: string[];
  deliveryDate: string;
  popular?: boolean;
  limited?: number;
  availableCount?: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
  message?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  phone?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
  role: 'creator' | 'participant' | 'partner';
}

export interface ProjectForm {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  targetAmount: number;
  rewardType: 'reward' | 'revenue' | 'both';
  rewards?: Reward[];
  duration: number; // days
}

// Filter and sort types
export interface ProjectFilters {
  category?: string;
  rewardType?: string;
  verified?: boolean;
  status?: string;
  search?: string;
}

export interface ProjectSort {
  field: 'createdAt' | 'targetAmount' | 'currentAmount' | 'participantCount' | 'daysLeft';
  order: 'asc' | 'desc';
}

// Component Props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// Navigation types
export type ViewType = 'landing' | 'projects' | 'community' | 'artist' | 'project-detail' | 'partners' | 'help';

export interface NavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType, params?: Record<string, any>) => void;
}

