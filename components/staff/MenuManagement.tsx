import React, { useMemo, useState } from 'react';
import { Product, ProductCategory, FoodSubcategory } from '../../types';
import { Plus, Trash2, PencilLine, Check, X, Folder, FolderOpen, ChevronDown } from 'lucide-react';

interface MenuManagementProps {
  products: Product[];
  onToggleSoldOut: (productId: string) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
}

type ProductForm = {
  name: string;
  price: string;
  category: ProductCategory;
  subCategory?: FoodSubcategory;
  description: string;
  imageUrl: string;
};

const DEFAULT_FORM: ProductForm = {
  name: '',
  price: '',
  category: ProductCategory.FOOD,
  subCategory: FoodSubcategory.OTHER,
  description: '',
  imageUrl: '',
};

const MenuManagement: React.FC<MenuManagementProps> = ({ products, onToggleSoldOut, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [form, setForm] = useState<ProductForm>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(DEFAULT_FORM);

  const resetForm = () => setForm(DEFAULT_FORM);

  const handleCreate = () => {
    if (!form.name.trim() || !form.price) return;
    const price = Number(form.price);
    if (Number.isNaN(price)) return;
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: form.name.trim(),
      price,
      category: form.category,
      subCategory: form.subCategory,
      description: form.description.trim(),
      imageUrl: form.imageUrl || 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
      isSoldOut: false,
    };
    onAddProduct(newProduct);
    resetForm();
  };

  const beginEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      subCategory: product.subCategory,
      description: product.description || '',
      imageUrl: product.imageUrl,
    });
  };

  const handleUpdate = (productId: string) => {
    if (!editForm.name.trim() || !editForm.price) return;
    const price = Number(editForm.price);
    if (Number.isNaN(price)) return;
    onUpdateProduct(productId, {
      name: editForm.name.trim(),
      price,
      category: editForm.category,
      subCategory: editForm.subCategory,
      description: editForm.description.trim(),
      imageUrl: editForm.imageUrl,
    });
    setEditingId(null);
  };

  const categories = useMemo(() => Object.values(ProductCategory), []);
  const foodSubcategories = useMemo(() => Object.values(FoodSubcategory), []);
  const [openCategories, setOpenCategories] = useState<Record<ProductCategory, boolean>>(() => {
    const initial: Record<ProductCategory, boolean> = {} as Record<ProductCategory, boolean>;
    categories.forEach(cat => { initial[cat as ProductCategory] = true; });
    return initial;
  });

  const groupedByCategory = useMemo(() => {
    const buckets: Record<ProductCategory, Product[]> = {} as Record<ProductCategory, Product[]>;
    products.forEach(p => {
      if (!buckets[p.category]) buckets[p.category] = [];
      buckets[p.category].push(p);
    });
    Object.values(buckets).forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));
    return buckets;
  }, [products]);

  const toggleCategory = (category: ProductCategory) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 border border-izakaya-wood/10">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Plus size={18} /> 商品を追加
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="商品名"
            className="border border-gray-200 rounded px-3 py-2"
          />
          <input
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            placeholder="価格 (数字)"
            className="border border-gray-200 rounded px-3 py-2"
            inputMode="numeric"
          />
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value as ProductCategory })}
            className="border border-gray-200 rounded px-3 py-2"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={form.subCategory}
            onChange={e => setForm({ ...form, subCategory: e.target.value as FoodSubcategory })}
            className="border border-gray-200 rounded px-3 py-2"
          >
            {foodSubcategories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <input
            value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="画像URL"
            className="border border-gray-200 rounded px-3 py-2 md:col-span-2 lg:col-span-1"
          />
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="説明 (任意)"
            className="border border-gray-200 rounded px-3 py-2 md:col-span-2 lg:col-span-2"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-izakaya-wood text-white rounded font-bold shadow hover:shadow-md"
            >
              追加する
            </button>
            <button
              onClick={resetForm}
              className="px-3 py-2 border border-gray-200 rounded text-sm"
            >
              リセット
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map(cat => {
          const items = groupedByCategory[cat as ProductCategory] || [];
          const open = openCategories[cat as ProductCategory];
          return (
            <div key={cat} className="bg-white rounded-lg shadow border border-izakaya-wood/10">
              <button
                type="button"
                onClick={() => toggleCategory(cat as ProductCategory)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  {open ? <FolderOpen size={18} /> : <Folder size={18} />}
                  <span className="font-bold">{cat}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {items.length}件
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`transition ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <div className="border-t border-gray-100">
                  {items.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-400">このカテゴリの商品はありません</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                      {items.map(product => {
                        const isEditing = editingId === product.id;
                        return (
                          <div
                            key={product.id}
                            className="p-3 rounded-lg border border-gray-100 shadow-sm bg-white flex flex-col gap-2"
                          >
                            {isEditing ? (
                              <>
                                <input
                                  value={editForm.name}
                                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                  className="border border-gray-200 rounded px-2 py-1"
                                />
                                <textarea
                                  value={editForm.description}
                                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                  className="border border-gray-200 rounded px-2 py-1 text-sm"
                                />
                              </>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-bold">{product.name}</div>
                                    <div className="text-xs text-gray-400 line-clamp-2">{product.description}</div>
                                  </div>
                                  <button
                                    onClick={() => onToggleSoldOut(product.id)}
                                    className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                                      product.isSoldOut ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                    }`}
                                  >
                                    {product.isSoldOut ? '売切中' : '販売中'}
                                  </button>
                                </div>
                              </>
                            )}

                            <div className="flex items-center gap-2 text-sm">
                              {isEditing ? (
                                <input
                                  value={editForm.price}
                                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                  className="border border-gray-200 rounded px-2 py-1 w-24"
                                  inputMode="numeric"
                                />
                              ) : (
                                <span className="font-bold">¥{product.price.toLocaleString()}</span>
                              )}
                              <span className="text-xs text-gray-400">
                                {product.subCategory ? product.subCategory : product.category}
                              </span>
                            </div>

                            {isEditing ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <select
                                  value={editForm.category}
                                  onChange={e => setEditForm({ ...editForm, category: e.target.value as ProductCategory })}
                                  className="border border-gray-200 rounded px-2 py-1"
                                >
                                  {categories.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                {editForm.category === ProductCategory.FOOD ? (
                                  <select
                                    value={editForm.subCategory}
                                    onChange={e => setEditForm({ ...editForm, subCategory: e.target.value as FoodSubcategory })}
                                    className="border border-gray-200 rounded px-2 py-1"
                                  >
                                    {foodSubcategories.map(sub => (
                                      <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                  </select>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleUpdate(product.id)}
                                    className="p-2 rounded bg-green-100 text-green-700"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-2 rounded bg-gray-100 text-gray-600"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => beginEdit(product)}
                                  className="p-2 rounded bg-gray-100 text-gray-700"
                                >
                                  <PencilLine size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteProduct(product.id)}
                                className="p-2 rounded bg-red-100 text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuManagement;
