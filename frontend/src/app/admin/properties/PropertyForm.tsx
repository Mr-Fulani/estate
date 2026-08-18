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
  Sparkles,
  Eye,
  Check
} from 'lucide-react';
import Link from 'next/link';

const sampleImages = [
  { name: 'Квартира премиум', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Загородный дом', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Современная кухня', url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Светлая гостиная', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Офис / Коммерция', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
];

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
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (['price', 'area', 'rooms', 'floor', 'total_floors', 'year_built', 'category_id'].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && initialData) {
        await updateProperty(initialData.id, formData);
      } else {
        await createProperty(formData);
      }
      router.push('/admin/properties');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
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
              Название объявления *
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
            Подробное описание объекта
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

      {/* 4. Media & Photos Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Фотографии и медиа</h2>
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

        {/* Uploaded Images Preview Grid */}
        {formData.images && formData.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3">
            {formData.images.map((imgUrl, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200">
                <img src={imgUrl} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                    title="Удалить фото"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {i === 0 && (
                  <span className="absolute bottom-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                    Главное
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Publication Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
          Настройки видимости
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
