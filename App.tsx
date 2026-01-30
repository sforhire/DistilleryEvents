
import React, { useState, useMemo, useEffect } from 'react';
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

const App: React.FC = () => {
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

  // Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase?.auth) {
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
      if (!isSupabaseConfigured || !supabase) {
        setEvents(MOCK_EVENTS);
        setLoading(false);
        return;
      }

      if (!session && !isPublicView) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('dateRequested', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setEvents(MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [session, isPublicView]);

  const stats = useMemo(() => {
    return events.reduce((acc, curr) => ({
      totalEvents: acc.totalEvents + 1,
      totalRevenue: acc.totalRevenue + (curr.totalAmount || 0),
      newRequests: acc.newRequests + (curr.contacted ? 0 : 1),
      pendingDeposits: acc.pendingDeposits + (!curr.depositPaid || !curr.balancePaid ? 1 : 0)
    }), { totalEvents: 0, totalRevenue: 0, newRequests: 0, pendingDeposits: 0 });
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (activeFilter === 'new') {
      result = result.filter(e => !e.contacted);
    } else if (activeFilter === 'pending_deposit') {
      result = result.filter(e => !e.depositPaid || !e.balancePaid);
    }
    return result.sort((a, b) => new Date(a.dateRequested).getTime() - new Date(b.dateRequested).getTime());
  }, [events, activeFilter]);

  const handleSaveEvent = async (event: EventRecord) => {
    if (!isSupabaseConfigured || !supabase) {
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
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Local save successful. Cloud sync failed - check connection.');
      setEvents(prev => {
        const exists = prev.find(e => e.id === event.id);
        if (exists) return prev.map(e => e.id === event.id ? event : e);
        return [...prev, event];
      });
    }
    setShowForm(false);
    setEditingEvent(undefined);
  };

  const handlePublicSubmit = async (event: EventRecord) => {
    if (!isSupabaseConfigured || !supabase) {
      console.info("Demo Submission Recorded:", event);
      return;
    }
    try {
      const { error } = await supabase.from('events').insert(event);
      if (error) throw error;
    } catch (err) {
      console.error('Error submitting public inquiry:', err);
      throw err; // Re-throw so form can handle UI error state if needed
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Permanently remove this booking record?')) {
      if (!isSupabaseConfigured || !supabase) {
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
    if (isSupabaseConfigured && supabase?.auth) {
      await supabase.auth.signOut();
    }
    setSession(null);
  };

  const format12hWindow = (startTime: string, duration: number) => {
    if (!startTime) return "TBD";
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + (duration || 0) * 60 * 60 * 1000);
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
      
      // Delay to ensure the briefing is rendered before print dialog opens
      setTimeout(() => {
        window.print();
        setIsGeneratingBriefing(false);
      }, 1500);
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

  // Admin login if keys are present but no session
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                Embed Form
              </button>
              <button
                onClick={() => {
                  setEditingEvent(undefined);
                  setShowForm(true);
                }}
                className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2.5 rounded-md font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 border border-amber-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Booking
              </button>
              {session && (
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-gray-500 hover:text-white transition-colors"
                  title="Log Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-10">
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
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">
                      {activeFilter === 'all' && 'Total Pipeline'}
                      {activeFilter === 'new' && 'Pending Inquiries'}
                      {activeFilter === 'pending_deposit' && 'Outstanding Balances'}
                    </h2>
                    {activeFilter !== 'all' && (
                      <button 
                        onClick={() => setActiveFilter('all')}
                        className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors uppercase tracking-widest"
                      >
                        View All
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-tighter">
                    {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fcfbf7] text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">Client Information</th>
                        <th className="px-6 py-4">Schedule</th>
                        <th className="px-6 py-4">Financials</th>
                        <th className="px-6 py-4">Provisioning</th>
                        <th className="px-6 py-4">Logistics</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredEvents.length > 0 ? filteredEvents.map(event => (
                        <tr 
                          key={event.id} 
                          onClick={() => {
                            setEditingEvent(event);
                            setShowForm(true);
                          }}
                          className="group hover:bg-amber-50/10 transition-all cursor-pointer"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-1 h-10 rounded-full ${event.contacted ? 'bg-gray-200' : 'bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.3)]'}`} />
                              <div>
                                <div className="font-bold text-gray-900 group-hover:text-amber-900 leading-none">{event.firstName} {event.lastName}</div>
                                <div className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">{event.eventType}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-900 font-bold">{event.dateRequested ? new Date(event.dateRequested).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</div>
                            <div className="text-[11px] text-amber-700 font-black uppercase tracking-tighter">{format12hWindow(event.time, event.duration)}</div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{event.guests} Guests</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-black text-gray-900 mb-1.5 tracking-tight">${(event.totalAmount || 0).toLocaleString()}</div>
                            <div className="flex flex-col gap-1">
                              <div className={`text-[9px] font-black px-1.5 py-0.5 rounded w-fit uppercase tracking-tighter border ${event.depositPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                Dep: {event.depositPaid ? 'PAID' : 'PENDING'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-[10px] text-gray-400 font-black uppercase mb-1">{event.barType}</div>
                            <div className="flex gap-1 flex-wrap">
                              {event.hasFood && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-black border border-blue-100">FOOD</span>}
                              {event.hasTasting && <span className="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-[9px] text-amber-500 font-black">TASTING</span>}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              {event.addParking && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-black border border-amber-200 uppercase w-fit">PRKNG FEE</span>}
                              {!event.beerWineOffered && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px] font-black border border-gray-200 uppercase w-fit">UNCORKING</span>}
                              {!event.contacted && <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase w-fit animate-pulse">NEW</span>}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => handlePrint(e, event)} className="p-2 text-amber-700 hover:bg-amber-100 rounded-md transition-colors" title="Generate Briefing"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
                              <button onClick={(e) => handleDeleteEvent(e, event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No records found for this filter.</p>
                          </td>
                        </tr>
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

        <footer className="max-w-7xl mx-auto px-4 py-6 border-t flex justify-between items-center opacity-70">
           <div className="flex items-center gap-2">
             <div className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
               {isSupabaseConfigured ? 'Live Pipeline Active' : 'Offline Preview Mode'}
             </span>
           </div>
           {!isSupabaseConfigured && (
             <div className="bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100 flex items-center gap-2">
               <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Database keys missing from environment. Cloud Sync inactive.</span>
             </div>
           )}
           <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">DistilleryEvents Ops • v1.3.0</p>
        </footer>
      </div>

      {isGeneratingBriefing && (
        <div className="fixed inset-0 bg-[#1a1a1a]/95 backdrop-blur-xl z-[100] flex items-center justify-center no-print">
          <div className="bg-white p-12 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm border border-amber-900/20 text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 border-8 border-amber-100 rounded-full"></div>
              <div className="w-20 h-20 border-8 border-amber-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Distilling Strategy...</p>
            <p className="text-xs text-gray-500 mt-4 font-bold leading-relaxed uppercase tracking-widest">Synthesizing Logistics & Staff Directives</p>
          </div>
        </div>
      )}

      <div className="print-only">{printingEvent && <EventSheet event={printingEvent} aiBriefing={aiBriefing} />}</div>
    </div>
  );
};

export default App;
