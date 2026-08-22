'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Property, Category, PropertyFormData } from '@/types';
import { createProperty, updateProperty } from '@/lib/api';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  Star,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Languages,
  SearchCheck,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { startNavigationFeedback } from '@/components/layout/NavigationFeedback';
import { localeLabels, locales, type Locale } from '@/i18n/config';

const sampleImages = [
  { name: 'Квартира премиум', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Загородный дом', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Современная кухня', url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Светлая гостиная', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Офис / Коммерция', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
];

const propertyLocales = locales;

export function PropertyForm({
  initialData,
  categories,
}: {
  initialData?: Property;
  categories: Category[];
}) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<PropertyFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    currency: initialData?.currency || 'RUB',
    address: initialData?.address || '',
    city: initialData?.city || 'Москва',
    district: initialData?.district || '',
    area: initialData?.area || undefined,
    rooms: initialData?.rooms || undefined,
    floor: initialData?.floor || undefined,
    total_floors: initialData?.total_floors || undefined,
    year_built: initialData?.year_built || undefined,
    images: initialData?.images || [],
    category_id: initialData?.category_id || (categories[0]?.id || 1),
    is_featured: initialData?.is_featured ?? false,
    is_active: initialData?.is_active ?? true,
    transaction_type: initialData?.transaction_type ?? 'sale',
    market_status: initialData?.market_status ?? 'available',
    status_badge: initialData?.status_badge ?? 'Актуально',
    translations: propertyLocales.map((locale) => {
      const existing = initialData?.translations?.find((item) => item.locale === locale);
      return {
        locale,
        title: existing?.title || (locale === 'ru' ? initialData?.title || '' : ''),
        description: existing?.description || (locale === 'ru' ? initialData?.description || '' : ''),
        city: existing?.city || (locale === 'ru' ? initialData?.city || '' : ''),
        district: existing?.district || (locale === 'ru' ? initialData?.district || '' : ''),
        address: existing?.address || (locale === 'ru' ? initialData?.address || '' : ''),
        meta_title: existing?.meta_title || '',
        meta_description: existing?.meta_description || '',
        status_badge: existing?.status_badge || (locale === 'ru' ? initialData?.status_badge || '' : ''),
      };
    }),
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (['price', 'area', 'rooms', 'floor', 'total_floors', 'year_built', 'category_id'].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else if (name === 'market_status') {
      const statusLabels: Record<string, string> = { available: 'Актуально', reserved: 'В брони', sold: 'Продано', rented: 'Сдано', archived: 'В архиве' };
      setFormData((prev) => ({ ...prev, market_status: value as PropertyFormData['market_status'], status_badge: statusLabels[value] || prev.status_badge }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        translations: ['title', 'description', 'city', 'district', 'address'].includes(name)
          ? prev.translations?.map((item) => item.locale === 'ru' ? { ...item, [name]: value } : item)
          : prev.translations,
      }));
    }
  };

  const updateTranslation = (
    locale: Locale,
    field: 'title' | 'description' | 'city' | 'district' | 'address' | 'meta_title' | 'meta_description' | 'status_badge',
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      translations: prev.translations?.map((item) => item.locale === locale ? { ...item, [field]: value } : item),
    }));
  };

  const handleAddImage = (urlToAdd?: string) => {
    const url = urlToAdd || newImageUrl.trim();
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), url],
    }));
    if (!urlToAdd) setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }));
  };

  const setAsPrimary = (index: number) => {
    if (index === 0 || !formData.images) return;
    const images = [...formData.images];
    const [selected] = images.splice(index, 1);
    images.unshift(selected);
    setFormData((prev) => ({ ...prev, images }));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (!formData.images) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.images.length) return;

    const images = [...formData.images];
    const temp = images[index];
    images[index] = images[targetIndex];
    images[targetIndex] = temp;
    setFormData((prev) => ({ ...prev, images }));
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !formData.images) return;

    const images = [...formData.images];
    const [draggedItem] = images.splice(draggedIndex, 1);
    images.splice(dropIndex, 0, draggedItem);

    setFormData((prev) => ({ ...prev, images }));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const russian = formData.translations?.find((item) => item.locale === 'ru');
      const payload: PropertyFormData = {
        ...formData,
        title: russian?.title.trim() || formData.title,
        description: russian?.description?.trim() || '',
        translations: formData.translations?.filter((item) => item.locale === 'ru' || [
          item.title,
          item.description,
          item.city,
          item.district,
          item.address,
          item.meta_title,
          item.meta_description,
          item.status_badge,
        ].some((value) => value?.trim())).map((item) => ({
          locale: item.locale,
          title: item.title.trim() || formData.title.trim(),
          description: item.description?.trim() || '',
          city: item.city?.trim() || undefined,
          district: item.district?.trim() || undefined,
          address: item.address?.trim() || undefined,
          meta_title: item.meta_title?.trim() || undefined,
          meta_description: item.meta_description?.trim() || undefined,
          status_badge: item.status_badge?.trim() || undefined,
        })),
      };
      if (isEditing && initialData) {
        await updateProperty(initialData.id, payload);
      } else {
        await createProperty(payload);
      }
      startNavigationFeedback();
      router.push('/admin/properties');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 max-w-6xl space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/properties"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Назад к списку объектов
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* 1. Basic Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Основная информация</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Название объявления на русском *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Например: Просторная 3-комнатная квартира с панорамным видом"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">SEO URL / slug</label>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="hidden items-center border-r border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-500 sm:flex">/properties/</span>
              <input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} placeholder="sozdaetsya-avtomaticheski" pattern="[a-z0-9-]*" className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-slate-900 outline-none" />
            </div>
            <p className="text-xs text-slate-500">Можно оставить пустым при создании. После индексации лучше не менять без редиректа.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Категория недвижимости *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Стоимость (₽) *
            </label>
            <input
              type="number"
              name="price"
              required
              value={formData.price || ''}
              onChange={handleChange}
              placeholder="15000000"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Тип предложения</label>
            <select name="transaction_type" value={formData.transaction_type} onChange={handleChange} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20">
              <option value="sale">Продажа</option>
              <option value="rent">Аренда</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Коммерческий статус</label>
            <select name="market_status" value={formData.market_status} onChange={handleChange} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20">
              <option value="available">Доступен</option>
              <option value="reserved">В брони</option>
              <option value="sold">Продан</option>
              <option value="rented">Сдан</option>
              <option value="archived">В архиве</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Location Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Расположение и адрес</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Город *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              placeholder="Москва"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Район / Округ
            </label>
            <input
              type="text"
              name="district"
              value={formData.district || ''}
              onChange={handleChange}
              placeholder="ЦАО, Хамовники"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Улица, дом
            </label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder="ул. Остоженка, 12"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. Characteristics Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Параметры и характеристики</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Площадь (м²)
            </label>
            <input
              type="number"
              step="0.1"
              name="area"
              value={formData.area || ''}
              onChange={handleChange}
              placeholder="85.5"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Комнаты
            </label>
            <input
              type="number"
              name="rooms"
              value={formData.rooms || ''}
              onChange={handleChange}
              placeholder="3"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Этаж
            </label>
            <input
              type="number"
              name="floor"
              value={formData.floor || ''}
              onChange={handleChange}
              placeholder="7"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Этажность
            </label>
            <input
              type="number"
              name="total_floors"
              value={formData.total_floors || ''}
              onChange={handleChange}
              placeholder="16"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Год постройки
            </label>
            <input
              type="number"
              name="year_built"
              value={formData.year_built || ''}
              onChange={handleChange}
              placeholder="2022"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Подробное описание объекта на русском
          </label>
          <textarea
            name="description"
            rows={5}
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Опишите преимущества, ремонт, мебель, инфраструктуру района, условия сделки..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium leading-relaxed"
          />
        </div>
      </div>

      {/* Translations */}
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Languages className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Переводы карточки объекта</h2>
            <p className="text-xs text-slate-500">Русская версия заполняется выше. Остальные языки необязательны; для арабского сначала используется английский fallback, затем русский.</p>
          </div>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          {(['en', 'tr', 'ar'] as const).map((locale) => {
            const translation = formData.translations?.find((item) => item.locale === locale);
            const label = localeLabels[locale];
            return (
              <fieldset key={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <legend className="px-2 text-sm font-bold text-primary">{label}</legend>
                <div>
                  <label htmlFor={`property-title-${locale}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Название</label>
                  <input id={`property-title-${locale}`} value={translation?.title || ''} onChange={(event) => updateTranslation(locale, 'title', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </div>
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Расположение и адрес</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Оставьте поле пустым, чтобы использовать русское значение.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`property-city-${locale}`} className="mb-1.5 block text-xs font-semibold text-slate-600">Город</label>
                      <input
                        id={`property-city-${locale}`}
                        value={translation?.city || ''}
                        onChange={(event) => updateTranslation(locale, 'city', event.target.value)}
                        placeholder={locale === 'en' ? 'Istanbul' : locale === 'ar' ? 'إسطنبول' : 'İstanbul'}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div>
                      <label htmlFor={`property-district-${locale}`} className="mb-1.5 block text-xs font-semibold text-slate-600">Район / Округ</label>
                      <input
                        id={`property-district-${locale}`}
                        value={translation?.district || ''}
                        onChange={(event) => updateTranslation(locale, 'district', event.target.value)}
                        placeholder={locale === 'en' ? 'Beylikduzu' : locale === 'ar' ? 'بيليك دوزو' : 'Beylikdüzü'}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`property-address-${locale}`} className="mb-1.5 block text-xs font-semibold text-slate-600">Улица, дом</label>
                      <input
                        id={`property-address-${locale}`}
                        value={translation?.address || ''}
                        onChange={(event) => updateTranslation(locale, 'address', event.target.value)}
                        placeholder={locale === 'en' ? 'Sahil St.' : locale === 'ar' ? 'شارع الساحل' : 'Sahil Mah.'}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor={`property-description-${locale}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Описание</label>
                  <textarea id={`property-description-${locale}`} rows={6} value={translation?.description || ''} onChange={(event) => updateTranslation(locale, 'description', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </div>
                <div>
                  <label htmlFor={`property-status-${locale}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Маркетинговый статус</label>
                  <input id={`property-status-${locale}`} value={translation?.status_badge || ''} onChange={(event) => updateTranslation(locale, 'status_badge', event.target.value)} placeholder={locale === 'ar' ? 'عرض خاص' : ''} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>

      {/* Per-locale SEO */}
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><SearchCheck className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">SEO каждого объекта</h2>
            <p className="text-xs leading-relaxed text-slate-500">Уникальные заголовок и описание для Google и превью в соцсетях. Если поле пустое, сайт соберёт текст из названия, адреса и описания объекта.</p>
          </div>
        </div>
        <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)] md:p-5">
          <div className="relative aspect-[1200/630] min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
            {formData.images?.[0] ? (
              <img src={formData.images[0]} alt="Превью OG-изображения объекта" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs font-semibold">Добавьте главное фото объекта</span>
              </div>
            )}
            <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-slate-950/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">OG · 1200 × 630</span>
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <p className="text-sm font-bold text-slate-900">OG-изображение объекта</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">В превью ссылки автоматически используется первое фото. Оно же отмечено как «Главное фото» в медиаблоке.</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Рекомендуемый размер — 1200 × 630 px. Важные детали лучше располагать ближе к центру, чтобы соцсети не обрезали их.</p>
            <a href="#property-media" className="mt-4 inline-flex w-fit items-center gap-2 text-xs font-bold text-primary transition-colors hover:text-secondary">
              <ImageIcon className="h-4 w-4" />
              Управлять фотографиями
            </a>
          </div>
        </div>
        <div className="grid min-w-0 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {propertyLocales.map((locale) => {
            const translation = formData.translations?.find((item) => item.locale === locale);
            const localeLabel = localeLabels[locale];
            const titleLength = translation?.meta_title?.length || 0;
            const descriptionLength = translation?.meta_description?.length || 0;
            return (
              <fieldset key={`seo-${locale}`} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <legend className="px-2 text-sm font-bold text-primary">{localeLabel}</legend>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor={`property-meta-title-${locale}`} className="text-xs font-semibold uppercase tracking-wider text-slate-600">SEO title</label>
                    <span className={cn('text-[11px] font-bold', titleLength > 60 ? 'text-amber-700' : 'text-slate-400')}>{titleLength}/60</span>
                  </div>
                  <input id={`property-meta-title-${locale}`} maxLength={240} value={translation?.meta_title || ''} onChange={(event) => updateTranslation(locale, 'meta_title', event.target.value)} placeholder={translation?.title || formData.title} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor={`property-meta-description-${locale}`} className="text-xs font-semibold uppercase tracking-wider text-slate-600">Meta description</label>
                    <span className={cn('text-[11px] font-bold', descriptionLength > 160 ? 'text-amber-700' : 'text-slate-400')}>{descriptionLength}/160</span>
                  </div>
                  <textarea id={`property-meta-description-${locale}`} rows={4} maxLength={320} value={translation?.meta_description || ''} onChange={(event) => updateTranslation(locale, 'meta_description', event.target.value)} placeholder={translation?.description?.slice(0, 160) || 'Кратко опишите главное преимущество объекта'} className="w-full min-w-0 resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </div>
                <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                  <p className="truncate text-sm font-semibold text-blue-700">{translation?.meta_title || translation?.title || formData.title || 'Название объекта'}</p>
                  <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-slate-600">{translation?.meta_description || translation?.description || formData.description || 'Описание объекта появится здесь.'}</p>
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>

      {/* 4. Media & Photos Card with Drag and Drop Reordering */}
      <div id="property-media" className="scroll-mt-28 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-900">Управление медиа и фотографиями</h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Перетягивайте фото мышкой для смены порядка
          </span>
        </div>

        {/* Add Image Input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Вставьте прямую ссылку на фото (https://...)"
            className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
          />
          <button
            type="button"
            onClick={() => handleAddImage()}
            className="h-11 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        {/* Sample Presets */}
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-2">
            Или выберите готовые фото:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleImages.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddImage(s.url)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-primary hover:text-white text-slate-700 font-medium transition-colors border border-slate-200"
              >
                + {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Drag & Drop Images Grid */}
        {formData.images && formData.images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
            {formData.images.map((imgUrl, i) => {
              const isPrimary = i === 0;
              const isBeingDragged = draggedIndex === i;
              const isDropTarget = dragOverIndex === i;

              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'relative rounded-2xl overflow-hidden bg-slate-100 border transition-all select-none cursor-grab active:cursor-grabbing group shadow-sm',
                    isPrimary ? 'border-primary ring-2 ring-primary/20 bg-primary-50/20' : 'border-slate-200',
                    isBeingDragged && 'opacity-40 scale-95 border-dashed border-primary',
                    isDropTarget && 'ring-4 ring-secondary border-secondary scale-105'
                  )}
                >
                  {/* Image Aspect Ratio Box */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img src={imgUrl} alt={`Фото ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />

                    {/* Order & Primary Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <span className="w-6 h-6 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center justify-center backdrop-blur-sm">
                        {i + 1}
                      </span>
                      {isPrimary && (
                        <span className="bg-primary text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          Главное фото
                        </span>
                      )}
                    </div>

                    {/* Drag Handle Indicator */}
                    <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-900/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Actions Toolbar on Bottom of card */}
                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      {/* Move Left */}
                      <button
                        type="button"
                        onClick={() => moveImage(i, 'left')}
                        disabled={i === 0}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Сдвинуть влево"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Move Right */}
                      <button
                        type="button"
                        onClick={() => moveImage(i, 'right')}
                        disabled={i === (formData.images?.length || 1) - 1}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Сдвинуть вправо"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Make Primary Button */}
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => setAsPrimary(i)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
                          title="Сделать главным фото объекта"
                        >
                          <Star className="w-3 h-3 text-secondary" />
                          На обложку
                        </button>
                      )}
                    </div>

                    {/* Delete Photo */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить это фото"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
            Фотографии еще не добавлены. Вставьте ссылку или выберите из готовых выше.
          </div>
        )}
      </div>

      {/* 5. Publication & Badge Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
          Статус объекта и видимость
        </h2>

        {/* Custom Status Badge */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Текст плашки / Бейдж статуса
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="status_badge"
              value={formData.status_badge || ''}
              onChange={handleChange}
              placeholder="Например: Актуально, В брони, Продано, Спецпредложение, Торг..."
              className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Badge Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: '🟢 Актуально', val: 'Актуально' },
              { label: '🟡 В брони', val: 'В брони' },
              { label: '🔴 Продано', val: 'Продано' },
              { label: '🟣 Спецпредложение', val: 'Спецпредложение' },
              { label: '🔥 Горячая цена', val: 'Горячая цена' },
              { label: '⭐ Эксклюзив', val: 'Эксклюзив' },
              { label: '⏳ Рассрочка 0%', val: 'Рассрочка 0%' },
              { label: '🤝 Торг уместен', val: 'Торг уместен' },
              { label: '❌ Без плашки', val: '' },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, status_badge: preset.val }))}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  formData.status_badge === preset.val
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Готовые плашки автоматически переводятся на русский, английский и турецкий языки.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-slate-900 block">Опубликован на сайте</span>
              <span className="text-xs text-slate-500">Объект виден в каталоге и поиске</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="w-5 h-5 text-secondary rounded border-slate-300 focus:ring-secondary cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-slate-900 block">Рекомендуемый объект</span>
              <span className="text-xs text-slate-500">Отображать в блоке на главной странице</span>
            </div>
          </label>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Link
          href="/admin/properties"
          className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
        >
          Отмена
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-primary hover:bg-primary-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Создать объект'}
        </button>
      </div>
    </form>
  );
}
