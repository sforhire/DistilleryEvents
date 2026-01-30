
import React from 'react';
import { EventRecord } from '../types';

interface MonthlyRevenueChartProps {
  events: EventRecord[];
  onClose: () => void;
}

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ events, onClose }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const monthlyData = months.reduce((acc, month, index) => {
    const monthTotal = events
      .filter(e => new Date(e.dateRequested).getMonth() === index)
      .reduce((sum, e) => sum + e.totalAmount, 0);
    acc[month] = monthTotal;
    return acc;
  }, {} as Record<string, number>);

  const maxRevenue = Math.max(...Object.values(monthlyData), 1000);

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-amber-900/20">
        <div className="p-8 border-b flex justify-between items-center bg-[#1a1a1a]">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Revenue Analytics</h2>
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mt-1">Fiscal Year Projection</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl">&times;</button>
        </div>
        
        <div className="p-8">
          <div className="flex items-end justify-between h-64 gap-2">
            {months.map(month => {
              const amount = monthlyData[month];
              const height = (amount / maxRevenue) * 100;
              return (
                <div key={month} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex justify-center">
                    <div 
                      className="absolute bottom-full mb-2 bg-[#1a1a1a] text-amber-500 text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                    >
                      ${amount.toLocaleString()}
                    </div>
                  </div>
                  <div 
                    style={{ height: `${Math.max(height, 2)}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 ${amount > 0 ? 'bg-amber-600 group-hover:bg-amber-500' : 'bg-gray-100'}`}
                  ></div>
                  <span className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-tighter">{month}</span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Peak Month</p>
              <p className="text-xl font-black text-gray-900">
                {months[Object.values(monthlyData).indexOf(Math.max(...Object.values(monthlyData)))]}
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Avg per Event</p>
              <p className="text-xl font-black text-gray-900">
                ${events.length ? Math.round(events.reduce((s, e) => s + e.totalAmount, 0) / events.length).toLocaleString() : 0}
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pipeline</p>
              <p className="text-xl font-black text-amber-600">
                ${events.reduce((s, e) => s + e.totalAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRevenueChart;
