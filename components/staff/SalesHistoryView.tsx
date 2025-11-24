import React, { useMemo, useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface SalesHistoryViewProps {
    orders: Order[];
}

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ orders }) => {
    const [expandedDate, setExpandedDate] = useState<string | null>(null);

    const historyData = useMemo(() => {
        // Filter for completed orders (SERVED or PAID)
        const completedOrders = orders.filter(
            o => o.status === OrderStatus.SERVED || o.status === OrderStatus.PAID
        );

        // Group by date
        const grouped = completedOrders.reduce((acc, order) => {
            const date = new Date(order.timestamp).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                weekday: 'short',
            });

            if (!acc[date]) {
                acc[date] = {
                    date,
                    orders: [],
                    totalAmount: 0,
                    count: 0,
                };
            }

            acc[date].orders.push(order);
            acc[date].totalAmount += order.totalAmount;
            acc[date].count += 1;

            return acc;
        }, {} as Record<string, { date: string; orders: Order[]; totalAmount: number; count: number }>);

        // Sort by date descending
        return Object.values(grouped).sort((a, b) =>
            new Date(b.orders[0].timestamp).getTime() - new Date(a.orders[0].timestamp).getTime()
        );
    }, [orders]);

    const toggleExpand = (date: string) => {
        setExpandedDate(expandedDate === date ? null : date);
    };

    if (historyData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Calendar size={48} className="mb-4 opacity-50" />
                <p>履歴データがありません</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-izakaya-wood mb-6 flex items-center gap-2">
                <Calendar /> 売上履歴
            </h2>

            {historyData.map((day) => (
                <div key={day.date} className="bg-white rounded-lg shadow overflow-hidden">
                    <button
                        onClick={() => toggleExpand(day.date)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-izakaya-wood">{day.date}</span>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {day.count}件
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-xl">¥{day.totalAmount.toLocaleString()}</span>
                            {expandedDate === day.date ? <ChevronUp /> : <ChevronDown />}
                        </div>
                    </button>

                    {expandedDate === day.date && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                            <div className="space-y-3">
                                {day.orders.map((order) => (
                                    <div key={order.id} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-izakaya-wood">Table {order.tableId}</span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(order.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <ul className="text-sm text-gray-600 space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <li key={idx}>
                                                        {item.name} x{item.quantity}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">¥{order.totalAmount.toLocaleString()}</div>
                                            <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${order.status === OrderStatus.PAID ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {order.status === OrderStatus.PAID ? '会計済' : '提供済'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SalesHistoryView;
