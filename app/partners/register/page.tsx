'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PartnerType } from '@/types/drizzle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const PARTNER_TYPE_LABELS = {
  [PartnerType.STUDIO]: '?¤íŠœ?”ì˜¤',
  [PartnerType.VENUE]: 'ê³µì—°??,
  [PartnerType.PRODUCTION]: '?œì‘ ?¤íŠœ?”ì˜¤',
  [PartnerType.MERCHANDISE]: 'ë¨¸ì²œ?¤ì´ì¦?,
  [PartnerType.OTHER]: 'ê¸°í?'
};

interface FormData {
  type: PartnerType | '';
  name: string;
  description: string;
  services: string[];
  pricingModel: string;
  contactInfo: string;
  location: string;
  portfolioUrl: string;
  terms: boolean;
}

export default function PartnerRegisterPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    type: '',
    name: '',
    description: '',
    services: [],
    pricingModel: '',
    contactInfo: '',
    location: '',
    portfolioUrl: '',
    terms: false
  });

  const [serviceInput, setServiceInput] = useState('');

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, serviceInput.trim()]
      }));
      setServiceInput('');
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms) {
      toast({
        title: '?½ê? ?™ì˜ ?„ìš”',
        description: '?´ìš©?½ê????™ì˜?´ì•¼ ?©ë‹ˆ??',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          description: formData.description,
          services: formData.services,
          pricingModel: formData.pricingModel,
          contactInfo: formData.contactInfo,
          location: formData.location,
          portfolioUrl: formData.portfolioUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '?ŒíŠ¸???±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }

      toast({
        title: '?±ë¡ ?„ë£Œ',
        description: '?ŒíŠ¸???±ë¡???„ë£Œ?˜ì—ˆ?µë‹ˆ?? ê²€?????¹ì¸?©ë‹ˆ??',
      });

      router.push('/partners');
    } catch (error) {
      console.error('?ŒíŠ¸???±ë¡ ?¤íŒ¨:', error);
      toast({
        title: '?±ë¡ ?¤íŒ¨',
        description: error instanceof Error ? error.message : '?ŒíŠ¸???±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">?ŒíŠ¸???±ë¡</h1>
        <p className="text-gray-600">
          ?„ë¬¸ ?ŒíŠ¸?ˆë¡œ ?±ë¡?˜ì—¬ ?„ë¡œ?íŠ¸??ì°¸ì—¬?´ë³´?¸ìš”.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ê¸°ë³¸ ?•ë³´</CardTitle>
          <CardDescription>
            ?ŒíŠ¸???±ë¡???„ìš”??ê¸°ë³¸ ?•ë³´ë¥??…ë ¥?´ì£¼?¸ìš”.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ?ŒíŠ¸??? í˜• */}
            <div className="space-y-2">
              <Label htmlFor="type">?ŒíŠ¸??? í˜• *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="?ŒíŠ¸??? í˜•??? íƒ?˜ì„¸?? />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ?ŒíŠ¸?ˆëª… */}
            <div className="space-y-2">
              <Label htmlFor="name">?ŒíŠ¸?ˆëª… *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="?ŒíŠ¸?ˆëª…???…ë ¥?˜ì„¸??
                required
              />
            </div>

            {/* ?¤ëª… */}
            <div className="space-y-2">
              <Label htmlFor="description">?¤ëª…</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="?ŒíŠ¸?ˆì— ?€???¤ëª…???…ë ¥?˜ì„¸??
                rows={4}
              />
            </div>

            {/* ?œë¹„??*/}
            <div className="space-y-2">
              <Label>?œê³µ ?œë¹„??/Label>
              <div className="flex space-x-2">
                <Input
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  placeholder="?œë¹„?¤ë? ?…ë ¥?˜ì„¸??
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                />
                <Button type="button" onClick={addService} variant="outline">
                  ì¶”ê?
                </Button>
              </div>
              {formData.services.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.services.map((service, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-sm">{service}</span>
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Ã—
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ê°€ê²?ëª¨ë¸ */}
            <div className="space-y-2">
              <Label htmlFor="pricingModel">ê°€ê²?ëª¨ë¸</Label>
              <Input
                id="pricingModel"
                value={formData.pricingModel}
                onChange={(e) => handleInputChange('pricingModel', e.target.value)}
                placeholder="?? ?œê°„?? ?„ë¡œ?íŠ¸?? ê³ ì •ê°€ ??
              />
            </div>

            {/* ?°ë½ì²?*/}
            <div className="space-y-2">
              <Label htmlFor="contactInfo">?°ë½ì²?*</Label>
              <Input
                id="contactInfo"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                placeholder="?´ë©”???ëŠ” ?„í™”ë²ˆí˜¸"
                required
              />
            </div>

            {/* ?„ì¹˜ */}
            <div className="space-y-2">
              <Label htmlFor="location">?„ì¹˜</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="?œìš¸??ê°•ë‚¨êµ???
              />
            </div>

            {/* ?¬íŠ¸?´ë¦¬??URL */}
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">?¬íŠ¸?´ë¦¬??URL</Label>
              <Input
                id="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>

            {/* ?½ê? ?™ì˜ */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.terms}
                onCheckedChange={(checked) => handleInputChange('terms', checked)}
              />
              <Label htmlFor="terms" className="text-sm">
                ?ŒíŠ¸???±ë¡ ?½ê????™ì˜?©ë‹ˆ??*
              </Label>
            </div>

            {/* ?œì¶œ ë²„íŠ¼ */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                ì·¨ì†Œ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.type || !formData.name || !formData.contactInfo || !formData.terms}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ?±ë¡?˜ê¸°
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
