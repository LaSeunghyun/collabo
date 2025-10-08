'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PartnerType, type PartnerTypeType } from '@/types/shared';

export type PartnerFormData = {
  name: string;
  description: string;
  type: PartnerTypeType;
  contactInfo: string;
  location: string;
  portfolioUrl: string;
};

interface PartnerFormProps {
  onSubmit: (data: PartnerFormData) => Promise<void>;
  initialData?: Partial<PartnerFormData>;
  onSuccess?: () => void;
}

const buildInitialValues = (initialData?: Partial<PartnerFormData>): PartnerFormData => ({
  name: initialData?.name ?? '',
  description: initialData?.description ?? '',
  type: initialData?.type ?? PartnerType.STUDIO,
  contactInfo: initialData?.contactInfo ?? '',
  location: initialData?.location ?? '',
  portfolioUrl: initialData?.portfolioUrl ?? ''
});

const SUBMIT_ERROR_FALLBACK = '?�트???�록 ?�청???�료?��? 못했?�요. ?�시 ???�시 ?�도??주세??';

export function PartnerForm({ onSubmit, initialData, onSuccess }: PartnerFormProps) {
  const initialValues = useMemo(() => buildInitialValues(initialData), [initialData]);
  const [formData, setFormData] = useState<PartnerFormData>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setFormData(buildInitialValues(initialData));
      onSuccess?.();
    } catch (submissionError) {
      if (submissionError instanceof Error && submissionError.message) {
        setError(submissionError.message);
      } else {
        setError(SUBMIT_ERROR_FALLBACK);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof PartnerFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (error) {
      setError(null);
    }
  };

  const handleReset = () => {
    setFormData(buildInitialValues(initialData));
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">?�트?�명 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(event) => handleChange('name', event.target.value)}
          placeholder="?�트?�명???�력?�세??
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">?�명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(event) => handleChange('description', event.target.value)}
          placeholder="?�공 ?�비?��? ?�로?�트 경험???�개??주세??
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">?�트???�형 *</Label>
        <Select value={formData.type} onValueChange={(value) => handleChange('type', value as PartnerTypeType)}>
          <SelectTrigger>
            <SelectValue placeholder="?�트???�형???�택?�세?? />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PartnerType.STUDIO}>?�튜?�오</SelectItem>
            <SelectItem value={PartnerType.VENUE}>공연??/SelectItem>
            <SelectItem value={PartnerType.PRODUCTION}>?�작 ?�튜?�오</SelectItem>
            <SelectItem value={PartnerType.MERCHANDISE}>머천?�이�?/SelectItem>
            <SelectItem value={PartnerType.OTHER}>기�?</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactInfo">?�락�?*</Label>
        <Input
          id="contactInfo"
          value={formData.contactInfo}
          onChange={(event) => handleChange('contactInfo', event.target.value)}
          placeholder="?�락 가?�한 ?�메???�는 ?�화번호"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">?�치</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(event) => handleChange('location', event.target.value)}
          placeholder="기반 지??�� ?�력?�세??
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolioUrl">?�트?�리??URL</Label>
        <Input
          id="portfolioUrl"
          type="url"
          value={formData.portfolioUrl}
          onChange={(event) => handleChange('portfolioUrl', event.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {error ? (
        <p className="text-sm text-rose-300" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
          초기??
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '?�록 ?�청 중�? : '?�트???�록 ?�청'}
        </Button>
      </div>
    </form>
  );
}
