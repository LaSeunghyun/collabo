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

const SUBMIT_ERROR_FALLBACK = '?ŒíŠ¸???±ë¡ ? ì²­???„ë£Œ?˜ì? ëª»í–ˆ?µë‹ˆ?? ?¤ì‹œ ?œë„??ì£¼ì„¸??';

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
        <Label htmlFor="name">?ŒíŠ¸?ˆëª… *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(event) => handleChange('name', event.target.value)}
          placeholder="?ŒíŠ¸?ˆëª…???…ë ¥?´ì£¼?¸ìš”"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">?¤ëª…</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(event) => handleChange('description', event.target.value)}
          placeholder="?œê³µ ?œë¹„?¤ë‚˜ ?„ë¡œ?íŠ¸ ê²½í—˜??ê°„ë‹¨???¤ëª…?´ì£¼?¸ìš”"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">?ŒíŠ¸??? í˜• *</Label>
        <Select value={formData.type} onValueChange={(value) => handleChange('type', value as PartnerTypeType)}>
          <SelectTrigger>
            <SelectValue placeholder="?ŒíŠ¸??? í˜•??? íƒ?´ì£¼?¸ìš”" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PartnerType.STUDIO}>?¤íŠœ?”ì˜¤</SelectItem>
            <SelectItem value={PartnerType.VENUE}>ê³µì—°??/SelectItem>
            <SelectItem value={PartnerType.PRODUCTION}>?œì‘ ?¤íŠœ?”ì˜¤</SelectItem>
            <SelectItem value={PartnerType.MERCHANDISE}>ë¨¸ì²œ?¤ì´ì¦?/SelectItem>
            <SelectItem value={PartnerType.OTHER}>ê¸°í?</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactInfo">?°ë½ì²?*</Label>
        <Input
          id="contactInfo"
          value={formData.contactInfo}
          onChange={(event) => handleChange('contactInfo', event.target.value)}
          placeholder="?°ë½ ê°€?¥í•œ ?´ë©”?¼ì´???„í™”ë²ˆí˜¸"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">?„ì¹˜</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(event) => handleChange('location', event.target.value)}
          placeholder="ê¸°ë°˜ ì§€??„ ?…ë ¥?´ì£¼?¸ìš”"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolioUrl">?¬íŠ¸?´ë¦¬??URL</Label>
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
          ì´ˆê¸°??
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '?±ë¡ ? ì²­ ì¤?..' : '?ŒíŠ¸???±ë¡ ? ì²­'}
        </Button>
      </div>
    </form>
  );
}
