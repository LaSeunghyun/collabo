import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Music, 
  Palette, 
  Camera, 
  Video, 
  BookOpen, 
  Theater,
  Filter,
  SlidersHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const categories = [
  { id: 'all', name: '전체', icon: null, count: 245 },
  { id: 'music', name: '음악', icon: Music, count: 89 },
  { id: 'visual', name: '시각예술', icon: Palette, count: 67 },
  { id: 'photography', name: '사진', icon: Camera, count: 34 },
  { id: 'video', name: '영상', icon: Video, count: 28 },
  { id: 'literature', name: '문학', icon: BookOpen, count: 15 },
  { id: 'performance', name: '공연예술', icon: Theater, count: 12 }
];

const sortOptions = [
  { id: 'recent', name: '최신순' },
  { id: 'popular', name: '인기순' },
  { id: 'ending', name: '마감임박순' },
  { id: 'success', name: '성공률순' }
];

const filterOptions = [
  { id: 'reward', name: '리워드형' },
  { id: 'revenue', name: '수익분배형' },
  { id: 'verified', name: '검증된 프로젝트' },
  { id: 'collaboration', name: '협업 프로젝트' }
];

interface CategoryFilterProps {
  selectedCategory: string;
  selectedSort: string;
  selectedFilters: string[];
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
  onFilterChange: (filters: string[]) => void;
}

export function CategoryFilter({
  selectedCategory,
  selectedSort,
  selectedFilters,
  onCategoryChange,
  onSortChange,
  onFilterChange
}: CategoryFilterProps) {
  const toggleFilter = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(f => f !== filterId)
      : [...selectedFilters, filterId];
    onFilterChange(newFilters);
  };

  const currentSort = sortOptions.find(option => option.id === selectedSort);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => onCategoryChange(category.id)}
                className={`flex items-center gap-2 whitespace-nowrap ${
                  isSelected 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{category.name}</span>
                <Badge 
                  variant="secondary" 
                  className={`ml-1 ${
                    isSelected 
                      ? "bg-indigo-500 text-white" 
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {category.count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  정렬: {currentSort?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => onSortChange(option.id)}
                    className={selectedSort === option.id ? "bg-indigo-50 text-indigo-600" : ""}
                  >
                    {option.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  필터
                  {selectedFilters.length > 0 && (
                    <Badge className="bg-coral-500 text-white">
                      {selectedFilters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="p-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">프로젝트 유형</p>
                  {filterOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(option.id)}
                        onChange={() => toggleFilter(option.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{option.name}</span>
                    </label>
                  ))}
                </div>
                {selectedFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onFilterChange([])}
                      className="text-red-600"
                    >
                      필터 초기화
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active Filters */}
          {selectedFilters.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">활성 필터:</span>
              <div className="flex gap-2">
                {selectedFilters.map((filterId) => {
                  const filter = filterOptions.find(f => f.id === filterId);
                  return (
                    <Badge
                      key={filterId}
                      className="bg-coral-100 text-coral-800 hover:bg-coral-200 cursor-pointer"
                      onClick={() => toggleFilter(filterId)}
                    >
                      {filter?.name} ×
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}