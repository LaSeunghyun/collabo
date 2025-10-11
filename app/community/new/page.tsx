'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, FileText, Plus, X, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export default function NewPostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    tags: ['RAY'] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  // 로그인 확인
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/community/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('카테고리 로드 오류:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/community/${data.post.id}`);
      } else {
        console.error('API Error:', data);
        if (data.details) {
          alert(`입력 오류: ${data.details.map((d: any) => d.message).join(', ')}`);
        } else {
          alert(data.error || '게시글 작성에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('게시글 작성 오류:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    // 'RAY' 태그는 제거할 수 없음
    if (tagToRemove === 'RAY') return;
    
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">글쓰기</h1>
          <p className="text-gray-600">커뮤니티에 새로운 글을 작성해보세요</p>
        </div>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              새 게시글 작성
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="제목을 입력하세요"
                  required
                  maxLength={200}
                  className="text-lg py-3"
                />
                <p className="text-sm text-gray-500">
                  {formData.title.length}/200
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-medium">카테고리</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger className="py-3">
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-base font-medium">내용</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="내용을 입력하세요"
                  required
                  maxLength={10000}
                  rows={12}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500">
                  {formData.content.length}/10,000
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium"># 태그</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="태그를 입력하세요"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleTagAdd} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    추가
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={tag === 'RAY' ? 'default' : 'secondary'}
                        className={`gap-1 px-3 py-1 text-sm ${
                          tag === 'RAY' 
                            ? 'bg-blue-600 text-white cursor-default' 
                            : 'cursor-pointer hover:bg-gray-200'
                        }`}
                        onClick={() => handleTagRemove(tag)}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                        {tag !== 'RAY' && <X className="w-3 h-3" />}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="flex-1"
                >
                  {loading ? '작성 중...' : '게시글 작성'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="px-8"
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}