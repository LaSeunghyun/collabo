import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  Search, 
  Bell, 
  User, 
  Menu,
  Heart,
  Plus,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  isLoggedIn: boolean;
  userRole?: 'creator' | 'participant' | 'partner';
  userName?: string;
  onLogin: () => void;
  onCreateProject?: () => void;
  onProfile?: () => void;
  onNavigateToProjects?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToPartners?: () => void;
  onNavigateToHelp?: () => void;
}

export function Header({ 
  isLoggedIn, 
  userRole, 
  userName, 
  onLogin, 
  onCreateProject,
  onProfile,
  onNavigateToProjects,
  onNavigateToCommunity,
  onNavigateToPartners,
  onNavigateToHelp
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">울</span>
              </div>
              <span className="text-xl font-bold text-gray-900">울림</span>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={onNavigateToProjects}
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                프로젝트
              </button>
              <button 
                onClick={onNavigateToCommunity}
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                커뮤니티
              </button>
              <button 
                onClick={onNavigateToPartners}
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                파트너
              </button>
              <button 
                onClick={onNavigateToHelp}
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                도움말
              </button>
            </nav>
          </div>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="search"
                placeholder="프로젝트, 아티스트 검색..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* Create Project Button - Only for creators */}
                {userRole === 'creator' && (
                  <Button 
                    onClick={onCreateProject}
                    className="bg-red-500 hover:bg-red-600 text-white hidden md:flex"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    프로젝트 만들기
                  </Button>
                )}

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    3
                  </Badge>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 text-sm">
                          {userName?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="hidden md:inline text-gray-700">{userName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-gray-600 capitalize">{userRole}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onProfile}>
                      <User className="w-4 h-4 mr-2" />
                      프로필
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Heart className="w-4 h-4 mr-2" />
                      관심 프로젝트
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      설정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={onLogin}>
                  로그인
                </Button>
                <Button onClick={onLogin} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  회원가입
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="search"
              placeholder="프로젝트, 아티스트 검색..."
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>
      </div>
    </header>
  );
}