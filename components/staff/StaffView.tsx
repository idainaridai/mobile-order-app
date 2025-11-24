import React, { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { Product, Order, OrderStatus } from '../../types';
import KitchenView from './KitchenView';
import MenuManagement from './MenuManagement';

interface StaffViewProps {
  orders: Order[];
  products: Product[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onToggleSoldOut: (productId: string) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
}

const StaffView: React.FC<StaffViewProps> = ({ orders, products, onUpdateOrderStatus, onToggleSoldOut, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [viewMode, setViewMode] = useState<'KITCHEN' | 'MENU'>('KITCHEN');

  const pendingOrders = orders
    .filter(o => o.status === OrderStatus.PENDING)
    .sort((a, b) => a.timestamp - b.timestamp);
  const servedOrders = orders
    .filter(o => o.status === OrderStatus.SERVED)
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Staff Header */}
      <header className="bg-izakaya-wood text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ChefHat />
          <h1 className="font-bold text-xl">Staff Dashboard</h1>
        </div>
        <div className="flex bg-izakaya-woodLight rounded p-1">
          <button
            onClick={() => setViewMode('KITCHEN')}
            className={`px-4 py-1 rounded text-sm font-bold transition-all ${
              viewMode === 'KITCHEN' ? 'bg-white text-izakaya-wood shadow' : 'text-white opacity-70'
            }`}
          >
            オーダー (KDS)
          </button>
          <button
            onClick={() => setViewMode('MENU')}
            className={`px-4 py-1 rounded text-sm font-bold transition-all ${
              viewMode === 'MENU' ? 'bg-white text-izakaya-wood shadow' : 'text-white opacity-70'
            }`}
          >
            メニュー管理
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {viewMode === 'KITCHEN' ? (
          <KitchenView
            pendingOrders={pendingOrders}
            servedOrders={servedOrders}
            onUpdateOrderStatus={onUpdateOrderStatus}
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            <MenuManagement 
              products={products} 
              onToggleSoldOut={onToggleSoldOut} 
              onAddProduct={onAddProduct}
              onUpdateProduct={onUpdateProduct}
              onDeleteProduct={onDeleteProduct}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffView;
