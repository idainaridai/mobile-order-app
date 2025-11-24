import React from 'react';
import { CheckSquare } from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface KitchenViewProps {
  pendingOrders: Order[];
  servedOrders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const KitchenView: React.FC<KitchenViewProps> = ({ pendingOrders, servedOrders, onUpdateOrderStatus }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-xl font-bold text-gray-700 mb-4 border-b-2 border-izakaya-accent inline-block">
        未提供オーダー ({pendingOrders.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {pendingOrders.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
            現在オーダーはありません
          </div>
        )}
        {pendingOrders.map(order => (
          <div
            key={order.id}
            className="bg-white border-l-8 border-izakaya-accent rounded shadow-md p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <span className="text-2xl font-bold text-izakaya-wood">Table {order.tableId}</span>
              <span className="text-sm text-gray-500 font-mono">
                {Math.floor((Date.now() - order.timestamp) / 1000 / 60)} min ago
              </span>
            </div>
            <ul className="space-y-2 mb-4">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between text-lg font-medium">
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {item.customizations?.length ? (
                      <span className="text-xs text-gray-500">{item.customizations.join(' / ')}</span>
                    ) : null}
                  </div>
                  <span className="bg-gray-100 px-2 rounded">x{item.quantity}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onUpdateOrderStatus(order.id, OrderStatus.SERVED)}
              className="w-full bg-izakaya-wood text-white py-3 rounded font-bold hover:bg-opacity-90 flex items-center justify-center gap-2"
            >
              <CheckSquare size={20} /> 提供完了
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-gray-500 mb-4">提供済み履歴 (直近)</h2>
      <div className="space-y-2 opacity-70">
        {servedOrders.slice(0, 5).map(order => (
          <div key={order.id} className="bg-gray-200 rounded p-3 flex justify-between items-center">
            <span className="font-bold">Table {order.tableId}</span>
            <span className="text-sm">
              {order.items
                .map(i => (i.customizations?.length ? `${i.name} (${i.customizations.join(' / ')})` : i.name))
                .join(', ')}
            </span>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Done</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenView;
