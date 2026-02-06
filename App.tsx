
import React, { useState, useMemo, useEffect, ReactNode, ErrorInfo } from 'react';
import { EventRecord } from './types';
import EventForm from './components/EventForm';
import DashboardStats from './components/DashboardStats';
import EventSheet from './components/EventSheet';
import MonthlyRevenueChart from './components/MonthlyRevenueChart';
import PublicEventForm from './components/PublicEventForm';
import EmbedModal from './components/EmbedModal';
import { supabase, isSupabaseConfigured, MISSING_VARS_ERROR } from './services/supabaseClient';
import { formatTimeWindow } from './services/utils';
import { pushEventToCalendar } from './services/calendarService';

interface EBProps { children?: ReactNode; }
interface EBState { hasError: boolean; error: Error | null; }

/**
 * Robust Error Boundary to catch render-time failures.
 * Fixed: Explicitly extends React.Component to ensure 'props' is accessible in TypeScript.
 */
class ErrorBoundary extends React.Component<EBProps, EBState> {
  public state: EBState = { hasError: false, error: null };

  constructor(props: EBProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Pipeline Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-12">
          <div className="max-w-xl w-full text-center">
            <h1 className="text-3xl font-black text-red-600 uppercase mb-4">Pipeline Halted</h1>
            <div className="bg-gray-900 p-6 rounded-2xl text-[12px] font-mono text-amber-400 mb-8 text-left overflow-auto max-h-64 shadow-2xl">
              {this.state.error?.message || "Render Context Failure"}
            </div>
            <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-4 rounded-xl font-bold uppercase text-xs hover:bg-amber-700 transition-colors">Reboot System</button>
          </div>
        </div>
      );
    }
    // Correctly accessing children from this.props
    return this.props.children;
  }
}

/**
 * Calendar Sync Interaction Component
 */
const CalendarSyncButton: React.FC<{ event: EventRecord; onUpdate: (e: EventRecord) => void }> = ({ event, onUpdate }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(event.pushedToCalendar ? 'success' : 'idle');

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'loading' || status === 'success') return;
    
    setStatus('loading');
    const result = await pushEventToCalendar(event);
    
    if (result.success) {
      setStatus('success');
      onUpdate({
        ...event,
        pushedToCalendar: true,
        calendarPushedAt: new Date().toISOString(),
        googleEventId: result.googleEventId
      });
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button 
      onClick={handleSync}
      title={status === 'success' ? `Synced on ${new Date(event.calendarPushedAt!).toLocaleDateString()}` : "Sync to G-Cal"}
      className={`p-2.5 rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center ${
        status === 'success' ? 'bg-green-100 text-green-700' : 
        status === 'error' ? 'bg-red-100 text-red-600' :
        'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-700'
      }`}
    >
      {status === 'loading' ? (
        <div className="w-5 h-5 border-2 border-amber-600/20 border-t-amber-600 rounded-full animate-spin"></div>
      ) : status === 'success' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
      ) : status === 'error' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      )}
    </button>
  );
};

const PrintPreviewModal: React.FC<{ event: EventRecord; onClose: () => void }> = ({ event, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
      <div className="sticky top-0 right-0 p-6 flex justify-end z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="bg-amber-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-amber-500">Print Manifest</button>
          <button onClick={onClose} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-2xl">&times;</button>
        </div>
      </div>
      <EventSheet event={event} />
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const isPublicView = new URLSearchParams(window.location.search).get('view') === 'public';
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingEvent, setEditingEvent] = useState<EventRecord | undefined>();
  const [printingEvent, setPrintingEvent] = useState<EventRecord | null>(null);

  useEffect(() => {
    const hydratePipeline = async () => {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      setLoading(true);
      try {
        const { data, error } = await supabase.from('events').select('*').order('dateRequested', { ascending: true });
        if (error) throw error;
        setEvents(data || []);
      } catch (err: any) {
        console.error("❌ Cloud fetch failed:", err.message);
        setEvents([]);
      } finally { setLoading(false); }
    };
    hydratePipeline();
  }, [isPublicView]);

  const handleUpdateLocalEvent = (updatedEvent: EventRecord) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleSaveEvent = async (event: EventRecord) => {
    try {
      if (!isSupabaseConfigured) throw new Error(MISSING_VARS_ERROR);
      
      const { error } = await supabase.from('events').upsert(event);
      
      if (error) {
        throw new Error(`Database Error: ${error.message}`);
      }
      
      setEvents(prev => {
        const exists = prev.some(e => e.id === event.id);
        return exists ? prev.map(e => e.id === event.id ? event : e) : [...prev, event];
      });
      setShowForm(false);
      setEditingEvent(undefined);
    } catch (err: any) {
      console.error("Save failure:", err);
      let friendlyMessage = err.message;
      if (err.message?.includes('Failed to fetch')) {
        friendlyMessage = "Network Connection Error: Unable to reach the server. Please check your internet connection or verify your Supabase URL/CORS settings.";
      }
      alert(friendlyMessage);
      // Rethrow so the caller (like PublicEventForm) knows it failed
      throw err;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Confirm permanent removal from cloud store?")) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
      setShowForm(false);
      setEditingEvent(undefined);
    } catch (err: any) {
      console.error("Delete failure:", err);
      alert("Removal failed. Check your connection.");
    }
  };

  const stats = useMemo(() => {
    return events.reduce((acc, curr) => ({
      totalEvents: acc.totalEvents + 1,
      totalRevenue: acc.totalRevenue + (Number(curr.totalAmount) || 0),
      newRequests: acc.newRequests + (curr.contacted ? 0 : 1),
      pendingDeposits: acc.pendingDeposits + (!curr.depositPaid || !curr.balancePaid ? 1 : 0)
    }), { totalEvents: 0, totalRevenue: 0, newRequests: 0, pendingDeposits: 0 });
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = [...events].filter(Boolean);
    if (activeFilter === 'new') result = result.filter(e => !e.contacted);
    else if (activeFilter === 'pending_deposit') result = result.filter(e => !e.depositPaid || !e.balancePaid);
    return result;
  }, [events, activeFilter]);

  if (isPublicView) return <PublicEventForm onSubmit={handleSaveEvent} />;
  
  if (loading) return (
    <div className="h-screen bg-[#faf9f6] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-[6px] border-amber-700/20 border-t-amber-700 rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/60">Synchronizing Manifest</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {!isSupabaseConfigured && (
        <div className="bg-amber-600 text-white p-2 text-center text-[10px] font-black uppercase tracking-widest no-print">
          Warning: Offline Mode (Env Vars Missing)
        </div>
      )}
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
            <button onClick={() => setShowEmbedModal(true)} title="Embed Form" className="text-gray-400 hover:text-white transition-colors p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg></button>
            <button onClick={() => { setEditingEvent(undefined); setShowForm(true); }} className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-black shadow-xl text-[10px] uppercase tracking-widest transition-all">Add Booking</button>
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
                    <th className="px-6 py-5 text-center">Guests</th>
                    <th className="px-8 py-5">Financial</th>
                    <th className="px-8 py-5">Strategic Notes</th>
                    <th className="px-8 py-5 text-right">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEvents.length > 0 ? filteredEvents.map(event => (
                    <tr key={event.id} onClick={() => { setEditingEvent(event); setShowForm(true); }} className="group hover:bg-amber-50/10 transition-all cursor-pointer">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-black uppercase shrink-0">{event.firstName?.[0]}{event.lastName?.[0]}</div>
                          <div className="min-w-0">
                            <div className="font-black text-gray-900 leading-none flex items-center gap-2 truncate">{event.firstName} {event.lastName} {!event.contacted && <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-ping shrink-0"></span>}</div>
                            <div className="text-[9px] text-amber-700 font-black uppercase mt-1.5 tracking-widest truncate">{event.eventType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[13px] text-gray-900 font-black whitespace-nowrap">{event.dateRequested ? new Date(event.dateRequested).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'DATE TBD'}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-tighter whitespace-nowrap">{formatTimeWindow(event.time, event.endTime)}</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                           <span className="text-base font-black text-gray-900 leading-none">{event.guests || 0}</span>
                           <span className="text-[8px] text-gray-400 font-black uppercase tracking-tighter mt-1">PAX</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-base font-black text-gray-900 tracking-tighter mb-1.5 whitespace-nowrap">${Number(event.totalAmount || 0).toLocaleString()}</div>
                        <div className="flex gap-1.5"><span className={`text-[8px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap ${event.depositPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>D: {event.depositPaid ? 'SETTLED' : 'PENDING'}</span></div>
                      </td>
                      <td className="px-8 py-6 min-w-[200px]">
                        <p className="text-[11px] text-gray-500 italic line-clamp-2 leading-relaxed">
                          {event.notes || <span className="text-gray-300 uppercase font-black text-[9px] tracking-widest not-italic">No Directives</span>}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <CalendarSyncButton event={event} onUpdate={handleUpdateLocalEvent} />
                          <button onClick={(e) => { e.stopPropagation(); setPrintingEvent(event); }} className="p-2.5 rounded-lg bg-gray-100 hover:bg-amber-600 text-gray-500 hover:text-white transition-all shadow-sm active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan={6} className="px-8 py-32 text-center text-gray-300 uppercase font-black tracking-[0.3em] text-xs">No entries found</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </main>
        {showForm && <EventForm event={editingEvent} onSave={handleSaveEvent} onDelete={handleDeleteEvent} onClose={() => setShowForm(false)} />}
        {showChart && <MonthlyRevenueChart events={events} onClose={() => setShowChart(false)} />}
        {showEmbedModal && <EmbedModal onClose={() => setShowEmbedModal(false)} />}
      </div>
      <div className="print-only">{printingEvent && <EventSheet event={printingEvent} />}</div>
      {printingEvent && <PrintPreviewModal event={printingEvent} onClose={() => setPrintingEvent(null)} />}
    </div>
  );
};

const App: React.FC = () => (<ErrorBoundary><AppContent /></ErrorBoundary>);
export default App;
