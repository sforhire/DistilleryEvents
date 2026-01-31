
import React, { useState, useMemo, useEffect, ReactNode, ErrorInfo } from 'react';
import { EventRecord } from './types';
import { MOCK_EVENTS } from './constants';
import EventForm from './components/EventForm';
import DashboardStats from './components/DashboardStats';
import EventSheet from './components/EventSheet';
import MonthlyRevenueChart from './components/MonthlyRevenueChart';
import PublicEventForm from './components/PublicEventForm';
import EmbedModal from './components/EmbedModal';
import AdminLogin from './components/AdminLogin';
import { generateFOHBriefing } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

interface EBProps { children?: ReactNode; }
interface EBState { hasError: boolean; error: Error | null; }

// Use React.Component explicitly to fix "Property 'props' does not exist on type 'ErrorBoundary'"
class ErrorBoundary extends React.Component<EBProps, EBState> {
  public state: EBState = { hasError: false, error: null };

  constructor(props: EBProps) { 
    super(props); 
  }
  
  static getDerivedStateFromError(error: Error): EBState { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { 
    console.error("DistilleryEvents Dashboard Crash:", error, errorInfo); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-12">
          <div className="max-w-xl w-full">
            <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter mb-4">Pipeline Crash</h1>
            <p className="text-gray-600 mb-6 font-medium">The dashboard encountered a fatal runtime error. This usually happens when component state becomes inconsistent during a transition.</p>
            <div className="bg-gray-900 p-6 rounded-2xl text-[12px] font-mono text-amber-400 mb-8 overflow-auto max-h-64 shadow-2xl">
              {this.state.error?.stack || this.state.error?.message}
            </div>
            <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Reboot Pipeline</button>
          </div>
        </div>
      );
    }
    // Access children through this.props which is inherited from React.Component
    return this.props.children;
  }
}

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
  const [aiBriefing, setAiBriefing] = useState<string>('');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    }).catch(err => {
      console.error("Auth session fetch error:", err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isSupabaseConfigured) {
        setEvents(MOCK_EVENTS);
        setLoading(false);
        return;
      }

      // If we are in admin view but have no session, don't try to fetch
      if (!session && !isPublicView) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('dateRequested', { ascending: true });

        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('not found')) {
            setDbError("Pipeline Database offline. Using local storage.");
            setEvents(MOCK_EVENTS);
          } else {
            throw error;
          }
        } else {
          setEvents(data || []);
          setDbError(null);
        }
      } catch (err: any) {
        setDbError(err.message || "Cloud connection failure.");
        setEvents(MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [session, isPublicView]);

  const stats = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    return safeEvents.reduce((acc, curr) => ({
      totalEvents: acc.totalEvents + 1,
      totalRevenue: acc.totalRevenue + (Number(curr?.totalAmount) || 0),
      newRequests: acc.newRequests + (curr?.contacted ? 0 : 1),
      pendingDeposits: acc.pendingDeposits + (!curr?.depositPaid || !curr?.balancePaid ? 1 : 0)
    }), { totalEvents: 0, totalRevenue: 0, newRequests: 0, pendingDeposits: 0 });
  }, [events]);

  const filteredEvents = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    let result = [...safeEvents];
    if (activeFilter === 'new') {
      result = result.filter(e => e && !e.contacted);
    } else if (activeFilter === 'pending_deposit') {
      result = result.filter(e => e && (!e.depositPaid || !e.balancePaid));
    }
    
    return result.sort((a, b) => {
      const dateA = a?.dateRequested ? new Date(a.dateRequested).getTime() : 0;
      const dateB = b?.dateRequested ? new Date(b.dateRequested).getTime() : 0;
      return dateA - dateB;
    });
  }, [events, activeFilter]);

  const handleSaveEvent = async (event: EventRecord) => {
    if (!isSupabaseConfigured) {
      setEvents(prev => {
        const exists = prev.find(e => e.id === event.id);
        if (exists) return prev.map(e => e.id === event.id ? event : e);
        return [...prev, event];
      });
      setShowForm(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .upsert(event)
        .select();

      if (error) throw error;
      if (editingEvent) {
        setEvents(prev => prev.map(e => e.id === event.id ? data[0] : e));
      } else {
        setEvents(prev => [...prev, data[0]]);
      }
    } catch (err: any) {
      alert('Sync error: ' + err.message);
    }
    setShowForm(false);
    setEditingEvent(undefined);
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Permanently remove this booking record?')) {
      if (!isSupabaseConfigured) {
        setEvents(prev => prev.filter(ev => ev.id !== id));
        return;
      }
      try {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
        setEvents(prev => prev.filter(ev => ev.id !== id));
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

  const handlePrint = async (e: React.MouseEvent, event: EventRecord) => {
    e.stopPropagation();
    setPrintingEvent(event);
    setAiBriefing('');
    setIsGeneratingBriefing(true);
    
    try {
      const briefing = await generateFOHBriefing(event);
      setAiBriefing(briefing);
      setTimeout(() => {
        window.print();
        setIsGeneratingBriefing(false);
      }, 500);
    } catch (err) {
      setIsGeneratingBriefing(false);
    }
  };

  if (isPublicView) {
    return <PublicEventForm onSubmit={async (e) => {
      if (isSupabaseConfigured) await supabase.from('events').insert(e);
    }} />;
  }

  if (isSupabaseConfigured && !session) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="no-print">
        <header className="bg-[#1a1a1a] h-20 flex items-center justify-between px-6 border-b border-amber-900/20 sticky top-0 z-40 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-amber-700 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(180,83,9,0.5)]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight uppercase leading-none">Distillery<span className="text-amber-600">Events</span></h1>
              <p className="text-[9px] text-amber-500 font-bold tracking-widest uppercase mt-1">Operations Control</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setShowEmbedModal(true)} className="bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2 rounded font-bold transition-all text-[10px] uppercase tracking-widest border border-white/5 hidden md:block">Embed</button>
            <button onClick={() => { setEditingEvent(undefined); setShowForm(true); }} className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2.5 rounded font-bold transition-all shadow-lg text-[10px] uppercase tracking-widest">New Booking</button>
            <button onClick={() => supabase.auth.signOut()} className="p-2 text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700"></div>
            </div>
          ) : (
            <>
              <DashboardStats 
                stats={stats} 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter}
                onShowChart={() => setShowChart(true)}
              />

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Active Pipeline</h2>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{filteredEvents.length} Active Records</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fcfbf7] text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Schedule</th>
                        <th className="px-6 py-4">Financials</th>
                        <th className="px-6 py-4">Provisioning</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredEvents.length > 0 ? filteredEvents.map(event => (
                        <tr key={event.id} onClick={() => { setEditingEvent(event); setShowForm(true); }} className="group hover:bg-amber-50/10 transition-all cursor-pointer">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-gray-900 leading-none">{event.firstName} {event.lastName}</div>
                              {!event.contacted && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>}
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{event.eventType}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-900 font-bold">{event.dateRequested || 'TBD'}</div>
                            <div className="text-[10px] text-amber-700 font-black uppercase mt-0.5 tracking-tighter">{event.time} — {event.duration}h</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-black text-gray-900 tracking-tight mb-1">${Number(event.totalAmount || 0).toLocaleString()}</div>
                            <div className="flex gap-1">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${event.depositPaid ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                Dep: {event.depositPaid ? 'PAID' : 'PEND'}
                              </span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${event.balancePaid ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                Bal: {event.balancePaid ? 'PAID' : 'PEND'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-[10px] text-gray-400 font-black uppercase mb-1">{event.barType}</div>
                            {event.hasFood && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black border border-blue-100">FOOD SERVICE</span>}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => handlePrint(e, event)} className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded hover:bg-amber-100">Print</button>
                              <button onClick={(e) => handleDeleteEvent(e, event.id)} className="text-[10px] font-black text-red-700 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded hover:bg-red-100">Delete</button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 uppercase font-black tracking-widest text-xs">No records matching criteria</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>

        {showForm && <EventForm event={editingEvent} onSave={handleSaveEvent} onClose={() => setShowForm(false)} />}
        {showChart && <MonthlyRevenueChart events={events} onClose={() => setShowChart(false)} />}
        {showEmbedModal && <EmbedModal onClose={() => setShowEmbedModal(false)} />}
      </div>

      {isGeneratingBriefing && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center no-print">
          <div className="bg-white p-12 rounded-3xl text-center">
            <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-lg font-black uppercase tracking-tighter">Synthesizing Briefing...</p>
          </div>
        </div>
      )}

      <div className="print-only">{printingEvent && <EventSheet event={printingEvent} aiBriefing={aiBriefing} />}</div>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
