'use client';

import { useState } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { submitContact } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';

export function ContactForm({ propertyId }: { propertyId?: number }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: propertyId ? 'Здравствуйте! Меня интересует этот объект недвижимости.' : '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await submitContact({ ...formData, property_id: propertyId });
      setSuccess(true);
    } catch (err) {
      setError('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h4 className="text-xl font-bold text-slate-900 mb-2">Заявка отправлена!</h4>
        <p className="text-slate-600">Наш специалист свяжется с вами в ближайшее время.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {error}
        </div>
      )}
      
      <Input
        label="Ваше имя"
        name="name"
        required
        value={formData.name}
        onChange={handleChange}
        placeholder="Иван Иванов"
      />
      
      <Input
        label="Телефон"
        name="phone"
        type="tel"
        required
        value={formData.phone}
        onChange={handleChange}
        placeholder="+7 (999) 000-00-00"
      />
      
      <Input
        label="Email (необязательно)"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="ivan@example.com"
      />
      
      <Textarea
        label="Сообщение"
        name="message"
        required
        value={formData.message}
        onChange={handleChange}
        placeholder="Ваш вопрос или комментарий..."
      />
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Отправка...' : 'Оставить заявку'}
      </Button>
    </form>
  );
}
