import React, { useState, useEffect } from 'react';
import CustomerView from './components/CustomerView';
import StaffView from './components/staff/StaffView';
import { Product, Order, CartItem, OrderStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from './services/mockData';

const PRODUCTS_STORAGE_KEY = 'todoroki-products';
const ORDERS_STORAGE_KEY = 'todoroki-orders';

const loadStoredProducts = (): Product[] => {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Product[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read stored products', err);
  }
  return INITIAL_PRODUCTS;
};

const loadStoredOrders = (): Order[] => {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Order[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read stored orders', err);
  }
  return INITIAL_ORDERS;
};

const App: React.FC = () => {
  // Routing State
  const [route, setRoute] = useState<'LANDING' | 'CUSTOMER' | 'STAFF'>('LANDING');
  const [tableId, setTableId] = useState<string>('');
  const isValidTable = (id: string) => {
    const num = Number(id);
    return Number.isInteger(num) && num >= 1 && num <= 7;
  };

  // Data State (In a real app, this would be managed by Firebase Context or Query Hooks)
  const [products, setProducts] = useState<Product[]>(loadStoredProducts);
  const [orders, setOrders] = useState<Order[]>(loadStoredOrders);

  // Keep product list (incl. sold-out flags) in localStorage so staff changes reflect immediately across tabs
  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (err) {
      console.warn('Failed to persist products', err);
    }
  }, [products]);

  // Persist and sync orders so customer/staff views stay in sync across tabs
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.warn('Failed to persist orders', err);
    }
  }, [orders]);

  // Sync updates from other tabs/windows
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRODUCTS_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as Product[];
          if (Array.isArray(parsed)) {
            setProducts(parsed);
          }
        } catch (err) {
          console.warn('Failed to parse incoming products', err);
        }
      } else if (event.key === ORDERS_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as Order[];
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        } catch (err) {
          console.warn('Failed to parse incoming orders', err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Determine Route on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    const isStaff = window.location.hash === '#staff';

    if (isStaff) {
      setRoute('STAFF');
    } else if (tableParam && isValidTable(tableParam)) {
      setTableId(tableParam);
      setRoute('CUSTOMER');
    } else {
      setRoute('LANDING');
    }
  }, []);

  // Handlers
  const handlePlaceOrder = (items: CartItem[]) => {
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tableId: tableId,
      items: items.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        customizations: i.customizations
      })),
      status: OrderStatus.PENDING,
      totalAmount: items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      timestamp: Date.now()
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const handleCallStaff = () => {
    alert('スタッフを呼び出しました。少々お待ちください。');
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleToggleSoldOut = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isSoldOut: !p.isSoldOut } : p));
  };

  const handleAddProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleEnterTable = (id: string) => {
    if (!isValidTable(id)) {
      alert('テーブル番号は1〜7の範囲で選択してください。');
      return;
    }
    setTableId(id);
    setRoute('CUSTOMER');
    // Update URL without reload
    window.history.pushState({}, '', `?table=${id}`);
  };

  // Render
  if (route === 'LANDING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-izakaya-base via-white to-izakaya-base flex flex-col items-center justify-center p-4 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,163,107,0.12),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(31,37,40,0.12),transparent_30%)]" aria-hidden />
         <div className="relative bg-white/90 backdrop-blur border border-white/70 p-8 rounded-2xl shadow-[0_25px_60px_-32px_rgba(0,0,0,0.45)] max-w-sm w-full text-center overflow-hidden">
            <div className="absolute -top-24 -right-16 w-48 h-48 rounded-full bg-izakaya-wood/5 blur-3xl" aria-hidden />
            <div className="relative">
              <h1 className="font-heading text-3xl text-izakaya-wood mb-1">とどろき２丁目バル</h1>
              <p className="text-sm tracking-[0.22em] uppercase text-izakaya-muted mb-6">mobile order</p>
              
              <div className="mb-6 text-left">
                 <label className="block text-sm font-bold text-izakaya-wood mb-2">テーブル番号を入力</label>
                 <input 
                   type="number" 
                   min={1}
                   max={7}
                   className="w-full border border-izakaya-wood/20 rounded-lg p-3 text-lg text-center focus:border-izakaya-wood focus:ring-2 focus:ring-izakaya-wood/20 outline-none bg-white"
                   placeholder="1〜7"
                   value={tableId}
                   onChange={(e) => setTableId(e.target.value)}
                 />
              </div>
              
              <button 
                onClick={() => tableId && handleEnterTable(tableId)}
                disabled={!isValidTable(tableId)}
                className="w-full bg-izakaya-wood text-white font-bold py-3 rounded-lg hover:-translate-y-0.5 transition shadow-lg shadow-izakaya-wood/25"
              >
                メニューを見る
              </button>

              <div className="mt-8 border-t border-izakaya-wood/10 pt-4">
                <button 
                  onClick={() => { setRoute('STAFF'); window.location.hash = 'staff'; }}
                  className="text-sm text-izakaya-muted hover:text-izakaya-wood underline"
                >
                  スタッフログイン
                </button>
              </div>
            </div>
         </div>
      </div>
    );
  }

  if (route === 'CUSTOMER') {
    return (
      <CustomerView 
        tableId={tableId}
        products={products}
        orders={orders.filter(o => o.tableId === tableId)} // Only show orders for this table
        onPlaceOrder={handlePlaceOrder}
        onCallStaff={handleCallStaff}
      />
    );
  }

  if (route === 'STAFF') {
    return (
      <StaffView 
        orders={orders}
        products={products}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onToggleSoldOut={handleToggleSoldOut}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    );
  }

  return null;
};

export default App;
