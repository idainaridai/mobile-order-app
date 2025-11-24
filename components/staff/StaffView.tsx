import React, { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { Product, Order, OrderStatus } from '../../types';
import KitchenView from './KitchenView';
import MenuManagement from './MenuManagement';
import SalesHistoryView from './SalesHistoryView';

interface StaffViewProps {
  orders: Order[];
  products: Product[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onToggleSoldOut: (productId: string) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  isFoodOrderEnabled: boolean;
  onToggleFoodOrder: (enabled: boolean) => void;
}

const StaffView: React.FC<StaffViewProps> = ({
  orders,
  products,
  onUpdateOrderStatus,
  onToggleSoldOut,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  isFoodOrderEnabled,
  onToggleFoodOrder
}) => {
  const [viewMode, setViewMode] = useState<'KITCHEN' | 'MENU' | 'HISTORY'>('KITCHEN');

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChefHat />
            <h1 className="font-bold text-xl">Staff Dashboard</h1>
          </div>

          {/* Food Order Toggle */}
          <button
            onClick={() => onToggleFoodOrder(!isFoodOrderEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${isFoodOrderEnabled
                ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-900/20'
                : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${isFoodOrderEnabled ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
            {isFoodOrderEnabled ? 'フード受付中' : 'フード停止中'}
          </button>
        </div>
        <div className="flex bg-izakaya-woodLight rounded p-1">
          <button
            onClick={() => setViewMode('KITCHEN')}
            className={`px-4 py-1 rounded text-sm font-bold transition-all ${viewMode === 'KITCHEN' ? 'bg-white text-izakaya-wood shadow' : 'text-white opacity-70'
              }`}
          >
            オーダー (KDS)
          </button>
          <button
            onClick={() => setViewMode('MENU')}
            className={`px-4 py-1 rounded text-sm font-bold transition-all ${viewMode === 'MENU' ? 'bg-white text-izakaya-wood shadow' : 'text-white opacity-70'
              }`}
          >
            メニュー管理
          </button>
          <button
            onClick={() => setViewMode('HISTORY')}
            className={`px-4 py-1 rounded text-sm font-bold transition-all ${viewMode === 'HISTORY' ? 'bg-white text-izakaya-wood shadow' : 'text-white opacity-70'
              }`}
          >
            売上履歴
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {viewMode === 'KITCHEN' && (
          <KitchenView
            pendingOrders={pendingOrders}
            servedOrders={servedOrders}
            onUpdateOrderStatus={onUpdateOrderStatus}
          />
        )}

        {viewMode === 'MENU' && (
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

        {viewMode === 'HISTORY' && (
          <SalesHistoryView orders={orders} />
        )}
      </main>
    </div>
  );
};

export default StaffView;
