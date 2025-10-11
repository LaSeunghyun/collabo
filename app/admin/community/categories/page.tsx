'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoryManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    displayOrder: 0,
  });

  // 로그인 및 권한 확인
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/admin/community/categories');
      return;
    }
    // TODO: 관리자 권한 확인
  }, [session, status, router]);

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/community/categories');
        const data = await response.json();

        if (data.success) {
          setCategories(data.categories);
        } else {
          setError(data.error || '카테고리를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('카테고리 로드 오류:', error);
        setError('카테고리를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/community/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setCategories(prev => [...prev, data.category]);
        setIsCreateDialogOpen(false);
        setFormData({ slug: '', name: '', description: '', displayOrder: 0 });
      } else {
        alert(data.error || '카테고리 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 생성 오류:', error);
      alert('카테고리 생성에 실패했습니다.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/community/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? data.category : cat
        ));
        setEditingCategory(null);
        setFormData({ slug: '', name: '', description: '', displayOrder: 0 });
      } else {
        alert(data.error || '카테고리 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      alert('카테고리 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('정말로 이 카테고리를 비활성화하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/community/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCategories(prev => prev.map(cat => 
          cat.id === categoryId ? { ...cat, isActive: false } : cat
        ));
      } else {
        alert(data.error || '카테고리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      slug: category.slug,
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">카테고리 관리</h1>
        <p className="text-neutral-600">커뮤니티 카테고리를 관리할 수 있습니다</p>
      </div>

      {/* 카테고리 생성 버튼 */}
      <div className="mb-6">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>새 카테고리 생성</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 카테고리 생성</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="slug">슬러그</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="category-slug"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="카테고리 이름"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="카테고리 설명"
                />
              </div>
              <div>
                <Label htmlFor="displayOrder">표시 순서</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">생성</Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 카테고리 목록 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? '활성' : '비활성'}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">
                      슬러그: {category.slug}
                    </p>
                    {category.description && (
                      <p className="text-sm text-neutral-600 mb-2">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500">
                      순서: {category.displayOrder} | 생성: {formatDate(category.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      disabled={!category.isActive}
                    >
                      비활성화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 수정 다이얼로그 */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>카테고리 수정</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">이름</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="카테고리 이름"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">설명</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="카테고리 설명"
                />
              </div>
              <div>
                <Label htmlFor="edit-displayOrder">표시 순서</Label>
                <Input
                  id="edit-displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-isActive">상태</Label>
                <select
                  id="edit-isActive"
                  value={editingCategory.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, isActive: e.target.value === 'true' } : null)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">수정</Button>
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                  취소
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
