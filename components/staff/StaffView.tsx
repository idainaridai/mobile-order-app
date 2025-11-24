import React, { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { Product, Order, OrderStatus, TableOrderMode, TableOrderModeMap } from '../../types';
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
  tableOrderModes: TableOrderModeMap;
  onUpdateTableOrderMode: (tableId: string, mode: TableOrderMode) => void;
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
  onToggleFoodOrder,
  tableOrderModes,
  onUpdateTableOrderMode
}) => {
  const [viewMode, setViewMode] = useState<'KITCHEN' | 'MENU' | 'HISTORY'>('KITCHEN');
  const [selectedTable, setSelectedTable] = useState<string>('1');

  const pendingOrders = orders
    .filter(o => o.status === OrderStatus.PENDING)
    .sort((a, b) => a.timestamp - b.timestamp);
  const servedOrders = orders
    .filter(o => o.status === OrderStatus.SERVED)
    .sort((a, b) => b.timestamp - a.timestamp);

  const currentMode = tableOrderModes[selectedTable] || TableOrderMode.A_LA_CARTE;
  const handleSetMode = (mode: TableOrderMode) => {
    onUpdateTableOrderMode(selectedTable, mode);
    const message = mode === TableOrderMode.A_LA_CARTE
      ? `テーブル${selectedTable}はアラカルト注文に切り替えました`
      : `テーブル${selectedTable}は飲み放題＋コース注文に切り替えました`;
    alert(message);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Staff Header */}
      <header className="bg-izakaya-wood text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChefHat />
            <h1 className="font-bold text-xl">Staff Dashboard</h1>
          </div>

          {/* Food / Recommendation Order Toggle */}
          <button
            onClick={() => onToggleFoodOrder(!isFoodOrderEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${isFoodOrderEnabled
                ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-900/20'
                : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${isFoodOrderEnabled ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
            {isFoodOrderEnabled ? 'フード・おすすめ受付中' : 'フード・おすすめ停止中'}
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
        <div className="max-w-5xl mx-auto mb-4">
          <div className="bg-white border border-izakaya-wood/10 rounded-lg shadow p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm font-bold text-izakaya-wood">
                テーブル番号
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm"
              >
                {['1','2','3','4','5','6','7'].map(num => (
                  <option key={num} value={num}>#{num}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                現在: {currentMode === TableOrderMode.A_LA_CARTE ? 'アラカルト' : '飲み放題＋コース'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleSetMode(TableOrderMode.A_LA_CARTE)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border transition ${currentMode === TableOrderMode.A_LA_CARTE
                  ? 'bg-izakaya-wood text-white border-izakaya-wood'
                  : 'bg-white text-izakaya-wood border-izakaya-wood/30 hover:border-izakaya-wood/60'
                }`}
              >
                アラカルトに切り替え
              </button>
              <button
                onClick={() => handleSetMode(TableOrderMode.COURSE_WITH_DRINK_PLAN)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border transition ${currentMode === TableOrderMode.COURSE_WITH_DRINK_PLAN
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-green-700 border-green-200 hover:border-green-400'
                }`}
              >
                飲み放題＋コースに切り替え
              </button>
            </div>
          </div>
        </div>

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
