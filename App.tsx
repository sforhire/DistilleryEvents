
import React, { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
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

// --- Error Boundary for Runtime Resilience ---
// Fixed EBProps: making children optional to resolve usage errors (Property 'children' is missing)
interface EBProps { children?: ReactNode; }
interface EBState { hasError: boolean; error: Error | null; }

// Fixed: Explicitly extending React.Component and ensuring state/props are correctly typed
class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) { 
    super(props); 
    this.state = { hasError: false, error: null }; 
  }
  
  static getDerivedStateFromError(error: Error): EBState { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { 
    console.error("App Crash:", error, errorInfo); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-red-100">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4">Component Crash</h1>
            <p className="text-sm text-gray-500 mb-6 font-medium">The dashboard encountered a rendering error. This often happens if the database structure doesn't match the expected types.</p>
            <div className="bg-red-50 p-4 rounded-xl text-xs font-mono text-red-700 mb-6 overflow-auto max-h-40">
              {this.state.error?.message}
            </div>
            <button onClick={() => window.location.reload()} className="w-full bg-[#1a1a1a] text-amber-500 font-black uppercase tracking-widest py-4 rounded-xl">Reload Dashboard</button>
          </div>
        </div>
      );
    }
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

  // Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!isSupabaseConfigured) {
        setEvents(MOCK_EVENTS);
        setLoading(false);
        return;
      }

      // If we are in admin view but not logged in, wait for login
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
          // Check specifically for "table not found"
          if (error.code === 'PGRST116' || error.message.includes('not found')) {
            setDbError("Table 'events' does not exist in Supabase. Please run the setup SQL.");
            setEvents(MOCK_EVENTS);
          } else {
            throw error;
          }
        } else {
          setEvents(data || []);
          setDbError(null);
        }
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setDbError(err.message || "Failed to fetch data.");
        setEvents(MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [session, isPublicView]);

  const stats = useMemo(() => {
    if (!Array.isArray(events)) return { totalEvents: 0, totalRevenue: 0, newRequests: 0, pendingDeposits: 0 };
    return events.reduce((acc, curr) => ({
      totalEvents: acc.totalEvents + 1,
      totalRevenue: acc.totalRevenue + (Number(curr.totalAmount) || 0),
      newRequests: acc.newRequests + (curr.contacted ? 0 : 1),
      pendingDeposits: acc.pendingDeposits + (!curr.depositPaid || !curr.balancePaid ? 1 : 0)
    }), { totalEvents: 0, totalRevenue: 0, newRequests: 0, pendingDeposits: 0 });
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    let result = [...events];
    if (activeFilter === 'new') {
      result = result.filter(e => !e.contacted);
    } else if (activeFilter === 'pending_deposit') {
      result = result.filter(e => !e.depositPaid || !e.balancePaid);
    }
    
    return result.sort((a, b) => {
      const dateA = a.dateRequested ? new Date(a.dateRequested).getTime() : 0;
      const dateB = b.dateRequested ? new Date(b.dateRequested).getTime() : 0;
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
      console.error('Error saving event:', err);
      alert('Sync failed: ' + (err.message || 'Unknown error'));
    }
    setShowForm(false);
    setEditingEvent(undefined);
  };

  const handlePublicSubmit = async (event: EventRecord) => {
    if (!isSupabaseConfigured) {
      console.info("Demo Submission Recorded:", event);
      return;
    }
    try {
      const { error } = await supabase.from('events').insert(event);
      if (error) throw error;
    } catch (err) {
      console.error('Error submitting public inquiry:', err);
      throw err;
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Permanently remove this booking record?')) {
      if (!isSupabaseConfigured) {
        setEvents(prev => prev.filter(e => e.id !== id));
        return;
      }
      try {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
        setEvents(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
  };

  const format12hWindow = (startTime: string, duration: number) => {
    if (!startTime || typeof startTime !== 'string' || !startTime.includes(':')) return "TBD";
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + (Number(duration) || 0) * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${fmt(start)} — ${fmt(end)}`;
    } catch {
      return startTime;
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
      }, 1000);
    } catch (err) {
      console.error("Print Error:", err);
      setIsGeneratingBriefing(false);
    }
  };

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <PublicEventForm onSubmit={handlePublicSubmit} />
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="no-print">
        <header className="bg-[#1a1a1a] border-b border-amber-900/20 sticky top-0 z-30 shadow-md">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-amber-700 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(180,83,9,0.3)]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Distillery<span className="text-amber-600">Events</span></h1>
                <p className="text-[10px] text-amber-500 font-bold tracking-widest uppercase">Operations Control</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmbedModal(true)}
                className="bg-transparent hover:bg-white/5 text-gray-300 px-4 py-2.5 rounded-md font-bold transition-all text-[10px] uppercase tracking-widest border border-white/10 hidden md:flex items-center gap-2"
              >
                Embed Form
              </button>
              <button
                onClick={() => {
                  setEditingEvent(undefined);
                  setShowForm(true);
                }}
                className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2.5 rounded-md font-bold transition-all shadow-lg flex items-center gap-2 border border-amber-600"
              >
                New Booking
              </button>
              <button onClick={handleLogout} className="p-2.5 text-gray-500 hover:text-white transition-colors" title="Log Out">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-10">
          {dbError && (
            <div className="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">{dbError}</p>
              <span className="text-[10px] bg-amber-200 px-2 py-1 rounded font-black text-amber-900">DEMO MODE ACTIVE</span>
            </div>
          )}

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
                  <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">
                    {activeFilter === 'all' && 'Total Pipeline'}
                    {activeFilter === 'new' && 'Pending Inquiries'}
                    {activeFilter === 'pending_deposit' && 'Outstanding Balances'}
                  </h2>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                    {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''}
                  </div>
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
                    <tbody className="divide-y divide-gray-50">
                      {filteredEvents.length > 0 ? filteredEvents.map(event => (
                        <tr key={event.id} onClick={() => { setEditingEvent(event); setShowForm(true); }} className="group hover:bg-amber-50/10 transition-all cursor-pointer">
                          <td className="px-6 py-5">
                            <div className="font-bold text-gray-900 group-hover:text-amber-900 leading-none">{event.firstName} {event.lastName}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">{event.eventType}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-900 font-bold">{event.dateRequested || 'TBD'}</div>
                            <div className="text-[10px] text-amber-700 font-black uppercase tracking-tighter">{format12hWindow(event.time, event.duration)}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-black text-gray-900 mb-1.5 tracking-tight">${Number(event.totalAmount || 0).toLocaleString()}</div>
                            <div className={`text-[9px] font-black px-1.5 py-0.5 rounded w-fit uppercase border ${event.depositPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              Dep: {event.depositPaid ? 'PAID' : 'PENDING'}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-[10px] text-gray-400 font-black uppercase mb-1">{event.barType}</div>
                            {event.hasFood && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-black border border-blue-100">FOOD</span>}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => handlePrint(e, event)} className="p-2 text-amber-700 hover:bg-amber-100 rounded-md">Print</button>
                              <button onClick={(e) => handleDeleteEvent(e, event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md">Del</button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 uppercase font-black tracking-widest text-xs">No records in pipeline</td></tr>
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
        
        <footer className="max-w-7xl mx-auto px-4 py-8 opacity-40 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">DistilleryEvents Professional Operations • v1.3.1</p>
        </footer>
      </div>

      {isGeneratingBriefing && (
        <div className="fixed inset-0 bg-[#1a1a1a]/95 backdrop-blur-xl z-[100] flex items-center justify-center no-print">
          <div className="bg-white p-12 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm border border-amber-900/20 text-center">
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-xl font-black text-gray-900 tracking-tighter uppercase">Analyzing Event Order...</p>
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Generating AI Briefing</p>
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
