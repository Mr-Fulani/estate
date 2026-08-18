'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Property, Category } from '@/types';
import { deleteProperty, updateProperty } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Search,
  Filter
} from 'lucide-react';

export function PropertiesTable({
  initialProperties,
  categories,
}: {
  initialProperties: Property[];
  categories: Category[];
}) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setProperties(initialProperties);
  }, [initialProperties]);

  const filtered = properties.filter((p) => {
    const matchesSearch = search === '' || 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
      (p.address && p.address.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCat === '' || String(p.category_id) === selectedCat;

    return matchesSearch && matchesCat;
  });

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Вы действительно хотите удалить объект "${title}"?`)) return;
    setDeletingId(id);
    try {
      await deleteProperty(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (e) {
      alert('Ошибка при удалении объекта');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleFeatured = async (p: Property) => {
    try {
      const updated = await updateProperty(p.id, { is_featured: !p.is_featured });
      setProperties((prev) => prev.map((item) => (item.id === p.id ? { ...item, is_featured: updated.is_featured } : item)));
    } catch (e) {
      alert('Ошибка при обновлении статуса');
    }
  };

  const toggleActive = async (p: Property) => {
    try {
      const updated = await updateProperty(p.id, { is_active: !p.is_active });
      setProperties((prev) => prev.map((item) => (item.id === p.id ? { ...item, is_active: updated.is_active } : item)));
    } catch (e) {
      alert('Ошибка при обновлении активности');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию, городу, адресу..."
            className="w-full h-10 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
            >
              <option value="">Все категории</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
            Найдено: <b>{filtered.length}</b>
          </span>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Объект</th>
                <th className="py-3.5 px-4">Категория</th>
                <th className="py-3.5 px-4">Цена</th>
                <th className="py-3.5 px-4">Локация</th>
                <th className="py-3.5 px-4 text-center">Статус</th>
                <th className="py-3.5 px-4 text-center">Главная</th>
                <th className="py-3.5 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Объектов не найдено
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const image = p.images && p.images.length > 0 ? p.images[0] : null;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Property Title & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400 font-semibold text-xs border border-slate-200">
                            {image ? (
                              <img src={image} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              'Нет фото'
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-slate-900 truncate">{p.title}</h4>
                            <p className="text-xs text-slate-400 truncate">slug: {p.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {p.category?.name || 'Без категории'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-primary">
                        {formatPrice(p.price, p.currency)}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <div>{p.city || '-'}</div>
                        <div className="text-slate-400">{p.district || p.address || ''}</div>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleActive(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Нажмите, чтобы изменить статус"
                        >
                          {p.is_active ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              Активен
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-400" />
                              Скрыт
                            </>
                          )}
                        </button>
                      </td>

                      {/* Featured Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleFeatured(p)}
                          className={`p-1.5 rounded-lg transition-all ${
                            p.is_featured
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                          }`}
                          title={p.is_featured ? 'В избранном на главной' : 'Добавить на главную'}
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/properties/${p.id}`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                            title="Открыть на сайте"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/admin/properties/${p.id}/edit`}
                            className="p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                            title="Редактировать объект"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.title)}
                            disabled={deletingId === p.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Удалить объект"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
