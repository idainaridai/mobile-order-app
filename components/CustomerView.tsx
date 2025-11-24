import React, { useState, useMemo } from 'react';
import { Product, CartItem, ProductCategory, Order, OrderStatus, FoodSubcategory } from '../types';
import { ShoppingCart, Clock, Bell, X } from 'lucide-react';

type DrinkCustomizationKey = 'style';

// Shochu only: allow choosing how to mix
const DRINK_CUSTOMIZATION_OPTIONS: { key: DrinkCustomizationKey; label: string; choices: string[] }[] = [
  { key: 'style', label: '割り方', choices: ['ソーダ割り', '水割り', 'お湯割り', 'ウーロン割り', 'ロック', 'ストレート'] },
];

const DEFAULT_CUSTOMIZATIONS: Record<DrinkCustomizationKey, string> = {
  style: 'ソーダ割り',
};

const DRINK_CATEGORIES = [ProductCategory.DRINK_ALCOHOL, ProductCategory.DRINK_SOFT];

const isShochu = (product: Product) => (
  product.category === ProductCategory.DRINK_ALCOHOL &&
  (product.name.includes('海') || product.name.includes('蔵の師魂') || product.name.includes('つくし'))
);

const isBottleBeer = (product: Product) => (
  product.category === ProductCategory.DRINK_ALCOHOL &&
  product.name.includes('瓶ビール')
);

// Data definitions: drink display categories and helpers
const DRINK_GROUPS = [
  { key: 'beer', label: 'ビール', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && name.includes('ビール') },
  { key: 'highball', label: 'ハイボール', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && name.includes('ハイボール') },
  { key: 'wine', label: 'ワイン', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && (name.includes('ワイン') || name.includes('利きワイン')) },
  { key: 'sparkling', label: 'スパークリングワイン', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && name.includes('スマイルヌブリナ') },
  { key: 'sangria', label: 'サングリア', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && name.includes('サングリア') },
  { key: 'sour', label: 'サワー', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && name.includes('サワー') },
  { key: 'shochu', label: '焼酎', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && (name.includes('海') || name.includes('蔵の師魂') || name.includes('つくし')) },
  { key: 'sake', label: '日本酒', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && name.includes('龍力') },
  { key: 'cocktail', label: 'カクテル', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && (name.includes('カシス') || name.includes('ライチ')) },
  { key: 'liqueur', label: 'リキュール', match: (name: string, category: ProductCategory) => category === ProductCategory.DRINK_ALCOHOL && (name.includes('梅酒') || name.includes('お酒')) },
  { key: 'soft', label: 'ソフトドリンク', match: (_name: string, category: ProductCategory) => category === ProductCategory.DRINK_SOFT },
];

const buildCartKey = (productId: string, customizations: string[]) => {
  const suffix = customizations.length > 0 ? customizations.join('|') : 'plain';
  return `${productId}__${suffix}`;
};

interface CustomerViewProps {
  tableId: string;
  products: Product[];
  orders: Order[];
  onPlaceOrder: (items: CartItem[]) => void;
  onCallStaff: () => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ tableId, products, orders, onPlaceOrder, onCallStaff }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductCategory | 'ALL'>('ALL');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [quantityProduct, setQuantityProduct] = useState<Product | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number>(1);
  const [pendingGlasses, setPendingGlasses] = useState<number>(0);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<DrinkCustomizationKey, string>>(DEFAULT_CUSTOMIZATIONS);

  const addToCart = (product: Product, customizations: string[] = [], quantity = 1) => {
    const cartKey = buildCartKey(product.id, customizations);
    setCart(prev => {
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev.map(item => item.cartKey === cartKey ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity, customizations, cartKey }];
    });
  };

  const removeFromCart = (cartKey: string) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleProductSelect = (product: Product) => {
    setPendingQuantity(1);
    setPendingGlasses(0);
    if (isShochu(product)) {
      setCustomizingProduct(product);
      setSelectedCustomizations({ ...DEFAULT_CUSTOMIZATIONS });
      return;
    }
    setQuantityProduct(product);
  };

  const handleConfirmCustomization = () => {
    if (!customizingProduct) return;
    const customizations = DRINK_CUSTOMIZATION_OPTIONS.map(opt => `${opt.label}: ${selectedCustomizations[opt.key] || ''}`).filter(Boolean);
    addToCart(customizingProduct, customizations, pendingQuantity);
    setCustomizingProduct(null);
  };

  const closeCustomization = () => {
    setCustomizingProduct(null);
  };

  const closeQuantityModal = () => {
    setQuantityProduct(null);
    setPendingGlasses(0);
  };

  const handleConfirmQuantity = () => {
    if (!quantityProduct) return;
    const customizations = isBottleBeer(quantityProduct) ? [`グラス: ${pendingGlasses}個`] : [];
    addToCart(quantityProduct, customizations, pendingQuantity);
    setQuantityProduct(null);
  };

  const updateCustomization = (key: DrinkCustomizationKey, value: string) => {
    setSelectedCustomizations(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    onPlaceOrder(cart);
    setCart([]);
    setIsCartOpen(false);
    // Show simplified feedback (in real app, use toast)
    alert("注文を送信しました！");
  };

  const totalCartPrice = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const totalHistoryPrice = useMemo(() => 
    orders.filter(o => o.status !== OrderStatus.CANCELLED).reduce((sum, o) => sum + o.totalAmount, 0), 
  [orders]);

  const filteredProducts = useMemo(() => {
    if (activeTab === 'ALL') return products;
    return products.filter(p => p.category === activeTab);
  }, [products, activeTab]);

  // Display data: drinks grouped by category label and split into alcohol/soft
  const groupedDrinkSections = useMemo(() => {
    const alcoholGroups = DRINK_GROUPS.filter(g => g.key !== 'soft').map(group => {
      const items = products.filter(p => group.match(p.name, p.category));
      return { ...group, items };
    }).filter(group => group.items.length > 0);

    const softGroupDef = DRINK_GROUPS.find(g => g.key === 'soft');
    const softGroup = softGroupDef
      ? [{ ...softGroupDef, items: products.filter(p => softGroupDef.match(p.name, p.category)) }].filter(g => g.items.length > 0)
      : [];

    const sections = [];
    if (alcoholGroups.length) sections.push({ key: 'alcohol', label: 'アルコール', groups: alcoholGroups });
    if (softGroup.length) sections.push({ key: 'soft', label: 'ソフトドリンク', groups: softGroup });
    return sections;
  }, [products]);

  const groupedFoodProducts = useMemo(() => {
    if (activeTab !== ProductCategory.FOOD) return null;
    const buckets: Record<string, Product[]> = {};
    filteredProducts.forEach(item => {
      const key = item.subCategory || FoodSubcategory.OTHER;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(item);
    });
    return buckets;
  }, [activeTab, filteredProducts]);

  // Calculate cart items count for badge
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const renderProductCard = (product: Product) => {
    const requiresMixSelect = isShochu(product);
    return (
      <div
        key={product.id}
        className={`group relative flex flex-row sm:flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 ${product.isSoldOut ? 'opacity-60 grayscale' : ''}`}
      >
        {/* Image */}
        <div className="relative w-32 sm:w-full h-32 sm:h-48 shrink-0 bg-gray-100 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />
          {product.isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold border border-white px-3 py-1 rounded-full tracking-wide text-xs">SOLD OUT</span>
            </div>
          )}
          {product.isSpecial && (
            <div className="absolute top-3 left-3 bg-white/85 text-izakaya-wood text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-izakaya-wood/10">
              本日限定
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-izakaya-muted">Chef's Pick</p>
            <h3 className="font-heading text-lg sm:text-xl text-izakaya-wood leading-tight line-clamp-2">{product.name}</h3>
            <p className="text-sm text-izakaya-muted line-clamp-2">{product.description}</p>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.14em] text-izakaya-muted mb-1">Price</span>
              <span className="font-semibold text-xl text-izakaya-wood">¥{product.price.toLocaleString()}</span>
            </div>
            {!product.isSoldOut ? (
              <button
                type="button"
                onClick={() => handleProductSelect(product)}
                className="inline-flex items-center gap-2 bg-izakaya-wood text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-izakaya-wood/20 hover:shadow-izakaya-wood/30 active:scale-[0.99] transition relative overflow-hidden"
              >
                <span className="relative z-10">{requiresMixSelect ? '割り方を選ぶ' : '追加'}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] bg-white/20 px-2 py-0.5 rounded-full relative z-10">
                  {requiresMixSelect ? 'Select' : 'Add'}
                </span>
                {/* Feedback pulse */}
                <span className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition duration-300" />
              </button>
            ) : (
              <span className="text-xs text-red-600 font-bold">売り切れ</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 relative bg-gradient-to-br from-izakaya-base via-[#f7f3ec] to-white text-izakaya-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(201,163,107,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(31,37,40,0.12),transparent_28%)]" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/75 border-b border-white/70 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.5)] px-4 py-3 sm:px-6 flex justify-between items-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-izakaya-muted">Todoroki Dining</p>
          <h1 className="font-heading text-2xl text-izakaya-wood leading-tight">とどろき２丁目バル</h1>
          <p className="text-[12px] text-izakaya-muted">季節の小皿とグラスワインをどうぞ</p>
          <div className="sm:hidden inline-flex items-center gap-2 mt-1 bg-white/70 border border-izakaya-wood/15 text-izakaya-wood px-3 py-1 rounded-full text-xs">
            <span className="uppercase tracking-[0.12em] opacity-70">Table</span>
            <span className="font-semibold">#{tableId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-izakaya-wood text-white px-3 py-2 rounded-full shadow-sm shadow-izakaya-wood/20">
            <span className="text-xs uppercase tracking-[0.14em] opacity-80">Table</span>
            <span className="font-bold text-lg">#{tableId}</span>
          </div>
          <button onClick={() => setIsHistoryOpen(true)} className="relative p-2 bg-white/80 border border-izakaya-wood/10 text-izakaya-wood rounded-full hover:-translate-y-0.5 transition shadow-sm">
             <Clock size={20} />
          </button>
          <button onClick={onCallStaff} className="relative p-2 bg-izakaya-wood text-white rounded-full hover:-translate-y-0.5 transition shadow-lg shadow-izakaya-wood/30">
             <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[76px] z-10 bg-gradient-to-b from-white/80 to-white/60 backdrop-blur border-b border-white/70 overflow-x-auto whitespace-nowrap px-3 py-3 flex gap-2 no-scrollbar shadow-[0_12px_24px_-20px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition transform ${activeTab === 'ALL' ? 'bg-izakaya-wood text-white shadow-lg shadow-izakaya-wood/25' : 'bg-white/70 text-izakaya-wood border border-izakaya-wood/15 hover:-translate-y-0.5'}`}
        >
          すべて
        </button>
        {Object.values(ProductCategory).map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition transform ${activeTab === cat ? 'bg-izakaya-wood text-white shadow-lg shadow-izakaya-wood/25' : 'bg-white/70 text-izakaya-wood border border-izakaya-wood/15 hover:-translate-y-0.5'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="p-4 sm:p-6">
        {activeTab === ProductCategory.FOOD && groupedFoodProducts ? (
          Object.entries(groupedFoodProducts).map(([group, items]) => (
            <div key={group} className="mb-6">
              <div className="flex items-center mb-2">
                <span className="text-sm font-bold text-izakaya-wood border-b border-izakaya-wood/30 px-1">{group}</span>
                <span className="text-xs text-izakaya-muted ml-2">{items.length}品</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(renderProductCard)}
              </div>
            </div>
          ))
        ) : activeTab === ProductCategory.DRINK_ALCOHOL || activeTab === ProductCategory.DRINK_SOFT || activeTab === 'ALL' ? (
          <div className="space-y-8">
            {groupedDrinkSections
              .filter(section => {
                if (activeTab === ProductCategory.DRINK_ALCOHOL) return section.key === 'alcohol';
                if (activeTab === ProductCategory.DRINK_SOFT) return section.key === 'soft';
                return true;
              })
              .map(section => (
                <div key={section.key} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-heading text-izakaya-wood">{section.label}</span>
                    <span className="text-xs text-izakaya-muted bg-white/70 border border-izakaya-wood/10 rounded-full px-2 py-0.5">
                      {section.groups.reduce((acc, g) => acc + g.items.length, 0)}品
                    </span>
                  </div>
                  <div className="space-y-4">
                    {section.groups.map(group => (
                      <div key={group.key} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-izakaya-wood">{group.label}</span>
                          <span className="text-xs text-izakaya-muted bg-white/70 border border-izakaya-wood/10 rounded-full px-2 py-0.5">
                            {group.items.length}品
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {group.items.map(renderProductCard)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(renderProductCard)}
          </div>
        )}
      </div>

      {/* Drink Customization Modal (Shochu only) */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white/95 backdrop-blur-md border border-white/70 w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-[0_25px_50px_-24px_rgba(0,0,0,0.5)] max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-izakaya-wood to-izakaya-woodLight text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">割り方を選択</h2>
                <p className="text-xs text-izakaya-base/80">{customizingProduct.name}（焼酎）</p>
              </div>
              <button onClick={closeCustomization}><X /></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              {DRINK_CUSTOMIZATION_OPTIONS.map(option => (
                <div key={option.key}>
                  <div className="text-sm font-bold text-izakaya-text mb-2">{option.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {option.choices.map(choice => (
                      <button
                        key={choice}
                        onClick={() => updateCustomization(option.key, choice)}
                        className={`px-3 py-2 rounded-full text-sm border transition-colors ${selectedCustomizations[option.key] === choice ? 'bg-izakaya-wood text-white border-izakaya-wood' : 'bg-white text-izakaya-text border-izakaya-wood/15 shadow-sm'}`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-izakaya-accent/10 border border-izakaya-accent/30 rounded-lg p-3 text-xs text-izakaya-wood">
                氷の有無は固定です。割り方のみお選びください。
              </div>
              <div className="border border-izakaya-wood/15 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-izakaya-wood">数量</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPendingQuantity(q => Math.max(1, q - 1))}
                      className="w-8 h-8 bg-white border border-izakaya-wood/15 rounded-full flex items-center justify-center text-lg font-bold hover:-translate-y-0.5 transition"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{pendingQuantity}</span>
                    <button
                      onClick={() => setPendingQuantity(q => q + 1)}
                      className="w-8 h-8 bg-izakaya-wood text-white rounded-full flex items-center justify-center text-lg font-bold hover:-translate-y-0.5 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-izakaya-base border-t flex gap-2">
              <button
                onClick={closeCustomization}
                className="flex-1 bg-white text-izakaya-text border border-izakaya-wood/15 py-3 rounded-lg font-bold hover:-translate-y-0.5 transition"
              >
                やめる
              </button>
              <button
                onClick={handleConfirmCustomization}
                className="flex-1 bg-izakaya-wood text-white py-3 rounded-lg font-bold shadow-md shadow-izakaya-wood/25 active:scale-[0.99]"
              >
                カートに追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Modal (non-shochu) */}
      {quantityProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white/95 backdrop-blur-md border border-white/70 w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-[0_25px_50px_-24px_rgba(0,0,0,0.5)] max-h-[70vh] flex flex-col">
            <div className="bg-gradient-to-r from-izakaya-wood to-izakaya-woodLight text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">数量を選択</h2>
                <p className="text-xs text-izakaya-base/80">{quantityProduct.name}</p>
              </div>
              <button onClick={closeQuantityModal}><X /></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <p className="text-sm text-izakaya-muted">{quantityProduct.description}</p>
              <div className="flex items-center justify-between border border-izakaya-wood/15 rounded-lg p-3">
                <span className="font-bold text-sm text-izakaya-wood">数量</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPendingQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 bg-white border border-izakaya-wood/15 rounded-full flex items-center justify-center text-lg font-bold hover:-translate-y-0.5 transition"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold">{pendingQuantity}</span>
                  <button
                    onClick={() => setPendingQuantity(q => q + 1)}
                    className="w-8 h-8 bg-izakaya-wood text-white rounded-full flex items-center justify-center text-lg font-bold hover:-translate-y-0.5 transition"
                  >
                    +
                  </button>
                </div>
              </div>
              {isBottleBeer(quantityProduct) && (
                <div className="flex items-center justify-between border border-izakaya-wood/15 rounded-lg p-3">
                  <span className="font-bold text-sm text-izakaya-wood">グラス数</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPendingGlasses(g => Math.max(0, g - 1))}
                      className="w-8 h-8 bg-white border border-izakaya-wood/15 rounded-full flex items-center justify-center text-lg font-bold hover:-translate-y-0.5 transition"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{pendingGlasses}</span>
                    <button
                      onClick={() => setPendingGlasses(g => g + 1)}
                      className="w-8 h-8 bg-izakaya-wood text-white rounded-full flex items-center justify-center text-lg font-bold hover:-translate-y-0.5 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-izakaya-base border-t flex gap-2">
              <button
                onClick={closeQuantityModal}
                className="flex-1 bg-white text-izakaya-text border border-izakaya-wood/15 py-3 rounded-lg font-bold hover:-translate-y-0.5 transition"
              >
                やめる
              </button>
              <button
                onClick={handleConfirmQuantity}
                className="flex-1 bg-izakaya-wood text-white py-3 rounded-lg font-bold shadow-md shadow-izakaya-wood/25 active:scale-[0.99]"
              >
                カートに追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Cart) */}
      {cart.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-izakaya-wood text-white p-4 rounded-full shadow-[0_14px_40px_-18px_rgba(0,0,0,0.65)] flex items-center gap-2 hover:scale-105 transition-transform z-20"
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 bg-izakaya-accent text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-white">
            {cartItemCount}
          </span>
        </button>
      )}

      {/* Cart Drawer (Modal) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white/95 backdrop-blur-md border border-white/70 w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-[0_25px_50px_-24px_rgba(0,0,0,0.5)] max-h-[85vh] flex flex-col">
              <div className="bg-gradient-to-r from-izakaya-wood to-izakaya-woodLight text-white p-4 flex justify-between items-center">
                 <h2 className="font-bold text-lg">ご注文内容の確認</h2>
                 <button onClick={() => setIsCartOpen(false)}><X /></button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                 {cart.length === 0 ? (
                 <p className="text-center text-gray-500 py-8">カートは空です</p>
                 ) : (
                   <ul className="space-y-3">
                    {cart.map(item => (
                      <li key={item.cartKey} className="flex justify-between items-center bg-izakaya-base rounded-xl border border-izakaya-wood/10 px-3 py-2.5">
                          <div className="flex-1 pr-3">
                            <div className="font-bold text-izakaya-text">{item.name}</div>
                            {item.customizations?.length ? (
                              <div className="text-xs text-gray-500">{item.customizations.join(' / ')}</div>
                            ) : null}
                            <div className="text-sm text-gray-500">¥{item.price.toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => updateQuantity(item.cartKey, -1)} className="w-8 h-8 bg-white border border-izakaya-wood/15 rounded-full flex items-center justify-center text-lg font-bold hover:-translate-y-0.5 transition">-</button>
                            <span className="w-6 text-center font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartKey, 1)} className="w-8 h-8 bg-izakaya-wood text-white rounded-full flex items-center justify-center text-lg font-bold hover:-translate-y-0.5 transition">+</button>
                          </div>
                       </li>
                     ))}
                   </ul>
                 )}
              </div>

              <div className="p-4 bg-izakaya-base border-t">
                 <div className="flex justify-between items-center text-xl font-bold mb-4">
                    <span>合計</span>
                    <span>¥{totalCartPrice.toLocaleString()}</span>
                 </div>
                 <button 
                   onClick={handleCheckout}
                   disabled={cart.length === 0}
                   className="w-full bg-izakaya-wood text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-izakaya-wood/25 active:scale-[0.99]"
                 >
                   注文を確定する
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white/95 backdrop-blur-md border border-white/70 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_25px_50px_-24px_rgba(0,0,0,0.5)] max-h-[80vh] flex flex-col">
              <div className="bg-gradient-to-r from-izakaya-wood to-izakaya-woodLight text-white p-4 flex justify-between items-center">
                 <h2 className="font-bold text-lg">注文履歴</h2>
                 <button onClick={() => setIsHistoryOpen(false)}><X /></button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 bg-izakaya-base">
                 {orders.length === 0 ? (
                   <p className="text-center text-gray-500 py-4">まだ注文がありません</p>
                 ) : (
                   <div className="space-y-4">
                     {orders.slice().reverse().map(order => (
                       <div key={order.id} className="bg-white/90 backdrop-blur border border-izakaya-wood/10 p-3 rounded-xl shadow-sm">
                          <div className="flex justify-between text-sm text-gray-500 mb-2">
                             <span>{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                               order.status === OrderStatus.SERVED ? 'bg-green-100 text-green-700' : 
                               order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200'
                             }`}>
                               {order.status === OrderStatus.SERVED ? '提供済' : '準備中'}
                             </span>
                          </div>
                          <ul className="text-sm space-y-1">
                             {order.items.map((item, idx) => (
                               <li key={idx} className="flex justify-between">
                                 <div className="flex flex-col">
                                   <span>{item.name} x{item.quantity}</span>
                                  {item.customizations?.length ? (
                                     <span className="text-xs text-gray-500">{item.customizations.join(' / ')}</span>
                                   ) : null}
                                 </div>
                                 <span>¥{(item.price * item.quantity).toLocaleString()}</span>
                               </li>
                             ))}
                          </ul>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
              <div className="p-4 bg-izakaya-base border-t flex justify-between items-center font-bold">
                <span>お会計合計</span>
                <span className="text-xl">¥{totalHistoryPrice.toLocaleString()}</span>
              </div>
              <div className="p-2 text-center text-xs text-gray-500 bg-white">
                ※お会計は伝票をレジまでお持ちください
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;
