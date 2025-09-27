'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PartnerType } from '@/types/prisma';

interface PartnerFormData {
    name: string;
    description: string;
    type: PartnerType;
    contactInfo: string;
    location: string;
    portfolioUrl: string;
}

interface PartnerFormProps {
    onSubmit: (data: PartnerFormData) => void;
    initialData?: Partial<PartnerFormData>;
    isLoading?: boolean;
}

export function PartnerForm({ onSubmit, initialData, isLoading = false }: PartnerFormProps) {
    const [formData, setFormData] = useState<PartnerFormData>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        type: initialData?.type || PartnerType.STUDIO,
        contactInfo: initialData?.contactInfo || '',
        location: initialData?.location || '',
        portfolioUrl: initialData?.portfolioUrl || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof PartnerFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">파트너명 *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="파트너명을 입력하세요"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="파트너에 대한 설명을 입력하세요"
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">파트너 유형 *</Label>
                <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value as PartnerType)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="파트너 유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={PartnerType.STUDIO}>스튜디오</SelectItem>
                        <SelectItem value={PartnerType.VENUE}>공연장</SelectItem>
                        <SelectItem value={PartnerType.PRODUCTION}>제작 스튜디오</SelectItem>
                        <SelectItem value={PartnerType.MERCHANDISE}>머천다이즈</SelectItem>
                        <SelectItem value={PartnerType.OTHER}>기타</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="contactInfo">연락처 *</Label>
                <Input
                    id="contactInfo"
                    value={formData.contactInfo}
                    onChange={(e) => handleChange('contactInfo', e.target.value)}
                    placeholder="연락처를 입력하세요"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="location">위치</Label>
                <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="위치를 입력하세요"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="portfolioUrl">포트폴리오 URL</Label>
                <Input
                    id="portfolioUrl"
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                    placeholder="https://example.com"
                />
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline">
                    취소
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? '저장 중...' : '저장'}
                </Button>
            </div>
        </form>
    );
}