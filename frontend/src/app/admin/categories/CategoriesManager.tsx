'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';
import { createCategory, deleteCategory } from '@/lib/api';
import { Tags, Plus, Trash2, Building, Home, Trees, Briefcase } from 'lucide-react';

const categoryIcons: Record<string, any> = {
  kvartira: Building,
  dom: Home,
  uchastok: Trees,
  kommerciya: Briefcase,
};

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
      const newCat = await createCategory({
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim() || undefined,
      });
      setCategories((prev) => [...prev, newCat]);
      setName('');
      setSlug('');
      setDescription('');
      router.refresh();
    } catch (e) {
      alert('Ошибка при создании категории');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, catName: string) => {
    if (!confirm(`Удалить категорию "${catName}"?`)) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } catch (e) {
      alert('Не удалось удалить категорию (возможно, к ней привязаны объекты)');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Category List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Категория</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Описание</th>
                <th className="py-3.5 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat.slug] || Building;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {cat.slug}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {cat.description || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Добавить категорию
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Название *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Пентхаусы"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Slug (URL)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="penthouse"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Описание
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание категории..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-2.5 bg-primary hover:bg-primary-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Добавить категорию'}
          </button>
        </form>
      </div>
    </div>
  );
}
