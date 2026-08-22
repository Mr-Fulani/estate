'use client';

import { useId, useState } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { submitContact } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { siteCopy } from '@/i18n/siteCopy';
import { collectContactAttribution } from '@/lib/attribution';

export function ContactForm({ propertyId }: { propertyId?: number }) {
  const { locale } = useLocale();
  const copy = siteCopy[locale].form;
  const formId = useId();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: propertyId ? copy.propertyMessage : '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await submitContact({
        ...formData,
        website: String(new FormData(e.currentTarget as HTMLFormElement).get('website') || ''),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        kind: 'form',
        channel: 'form',
        ...collectContactAttribution(locale, propertyId ? 'property_form' : 'contact_form', propertyId),
      });
      setSuccess(true);
    } catch {
      setError(copy.error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8" role="status" aria-live="polite">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h4 className="text-xl font-bold text-slate-900 mb-2">{copy.successTitle}</h4>
        <p className="text-slate-600">{copy.successDescription}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100" role="alert">
          {error}
        </div>
      )}

      <label className="hidden" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      
      <Input
        id={`${formId}-name`}
        label={copy.name}
        name="name"
        required
        value={formData.name}
        onChange={handleChange}
        placeholder={copy.namePlaceholder}
        autoComplete="name"
      />
      
      <Input
        id={`${formId}-phone`}
        label={copy.phone}
        name="phone"
        type="tel"
        required
        value={formData.phone}
        onChange={handleChange}
        placeholder="+7 (999) 000-00-00"
        autoComplete="tel"
      />
      
      <Input
        id={`${formId}-email`}
        label={copy.email}
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="ivan@example.com"
        autoComplete="email"
      />
      
      <Textarea
        id={`${formId}-message`}
        label={copy.message}
        name="message"
        required
        value={formData.message}
        onChange={handleChange}
        placeholder={copy.messagePlaceholder}
      />
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
