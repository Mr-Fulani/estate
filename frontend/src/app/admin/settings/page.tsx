'use client';

import { useState, useEffect } from 'react';
import { SiteSettings } from '@/types';
import { fetchSiteSettings, updateSiteSettings } from '@/lib/api';
import {
  Settings,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
  Check,
  ExternalLink,
} from 'lucide-react';
import { TelegramIcon, WhatsappIcon, VkIcon, YoutubeIcon } from '@/components/ui/SocialIcons';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteSettings()
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof SiteSettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await updateSiteSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Настройки сайта
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Управление контактными данными и ссылками на соц. сети. Изменения отображаются в хедере и футере сайта.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Phone className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Контактные данные</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Номер телефона
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+7 (495) 123-45-67"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <span className="text-[11px] text-slate-400">Отображается в шапке сайта и футере</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="info@estate-agency.ru"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Адрес офиса
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="г. Москва, ул. Примерная, 1"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Часы работы
            </label>
            <input
              type="text"
              value={settings.working_hours}
              onChange={(e) => handleChange('working_hours', e.target.value)}
              placeholder="Ежедневно с 9:00 до 21:00"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ExternalLink className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Ссылки на социальные сети</h2>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Оставьте поле пустым, чтобы скрыть иконку соц. сети с сайта.
        </p>

        <div className="space-y-4">
          {/* Telegram */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#27A7E7]/10 flex items-center justify-center text-[#27A7E7] shrink-0">
              <TelegramIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Telegram</label>
              <input
                type="url"
                value={settings.telegram || ''}
                onChange={(e) => handleChange('telegram', e.target.value)}
                placeholder="https://t.me/your_channel"
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0">
              <WhatsappIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-600 block mb-1">WhatsApp</label>
              <input
                type="url"
                value={settings.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="https://wa.me/79991234567"
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* VK */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4C75A3]/10 flex items-center justify-center text-[#4C75A3] shrink-0">
              <VkIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-600 block mb-1">ВКонтакте</label>
              <input
                type="url"
                value={settings.vk || ''}
                onChange={(e) => handleChange('vk', e.target.value)}
                placeholder="https://vk.com/your_group"
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* YouTube */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] shrink-0">
              <YoutubeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-600 block mb-1">YouTube</label>
              <input
                type="url"
                value={settings.youtube || ''}
                onChange={(e) => handleChange('youtube', e.target.value)}
                placeholder="https://youtube.com/@your_channel"
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <Check className="w-4 h-4" />
            Настройки сохранены!
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-primary hover:bg-primary-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>
    </div>
  );
}
