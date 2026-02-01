
import React, { Component, useState, useMemo, useEffect, ReactNode, ErrorInfo } from 'react';
import { EventRecord } from './types';
import { MOCK_EVENTS } from './constants';
import EventForm from './components/EventForm';
import DashboardStats from './components/DashboardStats';
import EventSheet from './components/EventSheet';
import MonthlyRevenueChart from './components/MonthlyRevenueChart';
import PublicEventForm from './components/PublicEventForm';
import EmbedModal from './components/EmbedModal';
import AdminLogin from './components/AdminLogin';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { formatTimeWindow } from './services/utils';

interface EBProps { children?: ReactNode; }
interface EBState { hasError: boolean; error: Error | null; }

// Fixed: Inherit from Component directly to ensure generic types are properly inferred for state and props
class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): EBState { 
    return { hasError: true, error }; 
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) { 
    console.error("Pipeline Runtime Error:", error, errorInfo); 
  }

  render() {
    // Fixed: Ensure state and props are accessed from 'this' within the class method
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-12">
          <div className="max-w-xl w-full text-center">
            <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter mb-4">Pipeline Halted</h1>
            <p className="text-gray-600 mb-6 font-medium">Critical rendering error detected.</p>
            <div className="bg-gray-900 p-6 rounded-2xl text-[12px] font-mono text-amber-400 mb-8 text-left overflow-auto max-h-64 shadow-2xl">
              {error?.message || "Render Context Failure"}
            </div>
            <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-amber-700 transition-colors">Reboot System</button>
          </div>
        </div>
      );
    }
    return children;
  }
}

const PrintPreviewModal: React.FC<{ event: EventRecord, onClose: () => void }> = ({ event, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-gray-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter">FOH Manifest Preview</h2>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em]">Operational Review Required</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handlePrint}
              className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Manifest
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl font-black p-2">&times;</button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 bg-gray-100 p-8">
          <div className="bg-white shadow-xl mx-auto" style={{ width: '100%', maxWidth: '8.5in' }}>
            <EventSheet event={event} />
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const isPublicView = new URLSearchParams(window.location.search).get('view') === 'public';
  const [session, setSession] = useState<any>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingEvent, setEditingEvent] = useState<EventRecord | undefined>();
  const [printingEvent, setPrintingEvent] = useState<EventRecord | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkInitialAuth = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (mounted) { setSession(s); setLoading(false); }
      } catch (err) { if (mounted) setLoading(false); }
    };
    checkInitialAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      if (mounted) { setSession(s); setLoading(false); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isSupabaseConfigured) { setEvents(MOCK_EVENTS); setLoading(false); return; }
      if (!session && !isPublicView) { setLoading(false); return; }
      try {
        setLoading(true);
        const { data, error } = await supabase.from('events').select('*').order('dateRequested', { ascending: true });
        if (error) throw error;
        setEvents(data || []);
      } catch (err: any) { setEvents(MOCK_EVENTS); } finally { setLoading(false); }
    };
    fetchEvents();
  }, [session, isPublicView]);

  const handleSaveEvent = async (event: EventRecord) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('events').upsert(event);
        if (error) throw error;
      }
      setEvents(prev => {
        const exists = prev.some(e => e.id === event.id);
        if (exists) return prev.map(e => e.id === event.id ? event : e);
        return [...prev, event];
      });
      setShowForm(false);
      setEditingEvent(undefined);
    } catch (err: any) {}
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
      }
      setEvents(prev => prev.filter(e => e.id !== id));
      setShowForm(false);
      setEditingEvent(undefined);
    } catch (err: any) {
      console.error("Delete failure:", err);
    }
  };

  const handleOpenPrintPreview = (e: React.MouseEvent, event: EventRecord) => {
    e.stopPropagation();
    setPrintingEvent(event);
  };

  const stats = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    return safeEvents.reduce((acc, curr) => {
      if (!curr) return acc;
      return {
        totalEvents: acc.totalEvents + 1,
        totalRevenue: acc.totalRevenue + (Number(curr.totalAmount) || 0),
        newRequests: acc.newRequests + (curr.contacted ? 0 : 1),
        pendingDeposits: acc.pendingDeposits + (!curr.depositPaid || !curr.balancePaid ? 1 : 0)
      };
    }, { totalEvents: 0, totalRevenue: 0, newRequests: 0, pendingDeposits: 0 });
  }, [events]);

  const filteredEvents = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    let result = [...safeEvents].filter(Boolean);
    if (activeFilter === 'new') result = result.filter(e => !e.contacted);
    else if (activeFilter === 'pending_deposit') result = result.filter(e => !e.depositPaid || !e.balancePaid);
    return result.sort((a, b) => (new Date(a.dateRequested || 0).getTime() - new Date(b.dateRequested || 0).getTime()));
  }, [events, activeFilter]);

  if (isPublicView) return <PublicEventForm onSubmit={async (e) => { if (isSupabaseConfigured) await supabase.from('events').insert(e); }} />;
  if (loading && !session && isSupabaseConfigured) return (
    <div className="h-screen bg-[#faf9f6] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Engine...</p>
    </div>
  );
  if (isSupabaseConfigured && !session) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="no-print">
        <header className="bg-[#111111] h-20 flex items-center justify-between px-8 border-b border-amber-900/40 sticky top-0 z-40 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-amber-700 rounded-full flex items-center justify-center shadow-lg pulse-amber">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Distillery<span className="text-amber-500">Events</span></h1>
              <p className="text-[9px] text-amber-500/80 font-black tracking-[0.3em] uppercase mt-1">Operational Manifest</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowEmbedModal(true)} className="bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2 rounded-lg font-black transition-all text-[10px] uppercase tracking-widest hidden md:block border border-white/5">Embed</button>
            <button onClick={() => { setEditingEvent(undefined); setShowForm(true); }} className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-black shadow-xl text-[10px] uppercase tracking-widest transition-all active:scale-95">Add Booking</button>
            {session && <button onClick={() => supabase.auth.signOut()} className="p-2 text-gray-500 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          <DashboardStats stats={stats} activeFilter={activeFilter} onFilterChange={setActiveFilter} onShowChart={() => setShowChart(true)} />
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Active Records Manifest</h2>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] bg-gray-100 px-3 py-1 rounded-full">{filteredEvents.length} Active</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfbf7]/80 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Date & Time</th>
                    <th className="px-8 py-5">Financial</th>
                    <th className="px-8 py-5">Summary</th>
                    <th className="px-8 py-5 text-right">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEvents.length > 0 ? filteredEvents.map(event => (
                    <tr key={event.id} onClick={() => { setEditingEvent(event); setShowForm(true); }} className="group hover:bg-amber-50/10 transition-all cursor-pointer">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-black uppercase">{event.firstName?.[0]}{event.lastName?.[0]}</div>
                          <div>
                            <div className="font-black text-gray-900 leading-none flex items-center gap-2">{event.firstName} {event.lastName} {!event.contacted && <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-ping"></span>}</div>
                            <div className="text-[9px] text-amber-700 font-black uppercase mt-1.5 tracking-widest">{event.eventType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[13px] text-gray-900 font-black">{event.dateRequested ? new Date(event.dateRequested).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'DATE TBD'}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-tighter">{formatTimeWindow(event.time, event.endTime)}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-base font-black text-gray-900 tracking-tighter mb-1.5">${Number(event.totalAmount || 0).toLocaleString()}</div>
                        <div className="flex gap-1.5">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${event.depositPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>D: {event.depositPaid ? 'SETTLED' : 'PENDING'}</span>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${event.balancePaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>B: {event.balancePaid ? 'SETTLED' : 'PENDING'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[10px] text-gray-500 font-black uppercase mb-1.5">{event.barType}</div>
                        <div className="flex gap-1 flex-wrap">
                          {event.hasFood && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black border border-blue-100 uppercase">Catering</span>}
                          {event.hasTasting && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-black border border-purple-100 uppercase">Tasting</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleOpenPrintPreview(e, event)} 
                            title="Print FOH Summary" 
                            className="p-2.5 rounded-lg bg-gray-100 hover:bg-amber-600 text-gray-500 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan={5} className="px-8 py-32 text-center text-gray-300 uppercase font-black tracking-[0.3em] text-xs">No entries found</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </main>
        {showForm && (
          <EventForm 
            event={editingEvent} 
            onSave={handleSaveEvent} 
            onDelete={handleDeleteEvent}
            onClose={() => setShowForm(false)} 
          />
        )}
        {showChart && <MonthlyRevenueChart events={events} onClose={() => setShowChart(false)} />}
        {showEmbedModal && <EmbedModal onClose={() => setShowEmbedModal(false)} />}
      </div>
      <div className="print-only">
        {printingEvent && <EventSheet event={printingEvent} />}
      </div>
      {printingEvent && <PrintPreviewModal event={printingEvent} onClose={() => setPrintingEvent(null)} />}
    </div>
  );
};

const App: React.FC = () => (<ErrorBoundary><AppContent /></ErrorBoundary>);
export default App;
