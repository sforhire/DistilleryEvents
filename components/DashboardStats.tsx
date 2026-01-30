
import React from 'react';
import { DashboardStats as IStats } from '../types';

interface DashboardStatsProps {
  stats: IStats;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onShowChart: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, activeFilter, onFilterChange, onShowChart }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 no-print">
      <button 
        onClick={onShowChart}
        className="text-left bg-[#1a1a1a] p-6 rounded-xl shadow-lg border-l-4 border-amber-600 hover:translate-y-[-2px] transition-all group ring-offset-2 focus:ring-2 focus:ring-amber-600 outline-none"
      >
        <div className="flex justify-between items-start">
          <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Monthly Revenue</p>
          <svg className="w-4 h-4 text-amber-600 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-2xl font-black text-white mt-1 tracking-tight">${stats.totalRevenue.toLocaleString()}</p>
        <p className="text-[10px] text-gray-500 mt-2 uppercase font-black tracking-widest border-t border-white/10 pt-2 group-hover:text-amber-500 transition-colors">Analytics & Trends</p>
      </button>

      <button 
        onClick={() => onFilterChange('all')}
        className={`text-left p-6 rounded-xl border transition-all ring-offset-2 outline-none ${activeFilter === 'all' ? 'bg-white border-amber-600 shadow-xl ring-2 ring-amber-600/20' : 'bg-white border-gray-200 shadow-sm hover:border-amber-400 hover:shadow-md'}`}
      >
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Bookings</p>
        <p className="text-2xl font-black text-gray-900 mt-1 tracking-tight">{stats.totalEvents}</p>
        <p className={`text-[10px] mt-2 uppercase font-black tracking-widest pt-2 border-t ${activeFilter === 'all' ? 'text-amber-600 border-amber-100' : 'text-gray-400 border-gray-50'}`}>Pipeline Manifest</p>
      </button>

      <button 
        onClick={() => onFilterChange('new')}
        className={`text-left p-6 rounded-xl border relative overflow-hidden transition-all ring-offset-2 outline-none ${activeFilter === 'new' ? 'bg-white border-amber-600 shadow-xl ring-2 ring-amber-600/20' : 'bg-white border-gray-200 shadow-sm hover:border-amber-400 hover:shadow-md'}`}
      >
        {stats.newRequests > 0 && (
          <div className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] px-2 py-0.5 font-black animate-pulse">
            NEW INQUIRY
          </div>
        )}
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">New Requests</p>
        <p className={`text-2xl font-black mt-1 tracking-tight ${stats.newRequests > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
          {stats.newRequests}
        </p>
        <p className={`text-[10px] mt-2 uppercase font-black tracking-widest pt-2 border-t ${activeFilter === 'new' ? 'text-amber-600 border-amber-100' : 'text-gray-400 border-gray-50'}`}>Client Outreach</p>
      </button>

      <button 
        onClick={() => onFilterChange('pending_deposit')}
        className={`text-left p-6 rounded-xl border transition-all ring-offset-2 outline-none ${activeFilter === 'pending_deposit' ? 'bg-white border-amber-600 shadow-xl ring-2 ring-amber-600/20' : 'bg-white border-gray-200 shadow-sm hover:border-amber-400 hover:shadow-md'}`}
      >
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Outstanding Balance</p>
        <p className="text-2xl font-black text-gray-900 mt-1 tracking-tight">{stats.pendingDeposits}</p>
        <p className={`text-[10px] mt-2 uppercase font-black tracking-widest pt-2 border-t ${activeFilter === 'pending_deposit' ? 'text-amber-600 border-amber-100' : 'text-gray-400 border-gray-50'}`}>Collections View</p>
      </button>
    </div>
  );
};

export default DashboardStats;
