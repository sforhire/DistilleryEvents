import React from 'react';
import { EventRecord, BarType } from '../types';

interface EventSheetProps {
  event: EventRecord;
}

const format12hWindow = (startTime: string, duration: number) => {
  if (!startTime || typeof startTime !== 'string' || !startTime.includes(':')) return "TBD";
  try {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + (Number(duration) || 0) * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${fmt(start)} — ${fmt(end)} (${duration}h)`;
  } catch (e) {
    return startTime || "TBD";
  }
};

const EventSheet: React.FC<EventSheetProps> = ({ event }) => {
  return (
    <div className="bg-white p-12 max-w-4xl mx-auto min-h-screen text-black print:p-0 print:m-0">
      {/* HEADER BLOCK */}
      <div className="border-b-8 border-black pb-6 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Event Order</h1>
          <div className="flex items-center gap-4">
            <span className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">Operational Manifest</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pipeline ID: {event.id.split('-')[0]}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black uppercase">{event.dateRequested ? new Date(event.dateRequested).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'DATE TBD'}</p>
          <p className="text-xl font-bold text-gray-700">{format12hWindow(event.time, event.duration)}</p>
        </div>
      </div>

      {/* CORE DATA GRID */}
      <div className="grid grid-cols-3 gap-0 border-2 border-black mb-8">
        <div className="p-4 border-r-2 border-black">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Client Details</h2>
          <p className="text-lg font-black uppercase leading-tight">{event.firstName} {event.lastName}</p>
          <p className="text-sm font-medium">{event.email}</p>
          <p className="text-sm font-medium">{event.phone}</p>
        </div>
        <div className="p-4 border-r-2 border-black">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Event Specs</h2>
          <p className="text-lg font-black uppercase leading-tight">{event.eventType}</p>
          <p className="text-sm font-bold mt-1 uppercase tracking-tighter">Manifest: {event.guests} Guests</p>
        </div>
        <div className="p-4 bg-gray-50">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Accounting</h2>
          <p className="text-lg font-black leading-tight">${Number(event.totalAmount || 0).toLocaleString()}</p>
          <div className="flex gap-2 mt-1">
            <span className={`text-[8px] font-black px-1.5 py-0.5 border ${event.depositPaid ? 'border-black' : 'border-gray-300 text-gray-300'}`}>DEP: PAID</span>
            <span className={`text-[8px] font-black px-1.5 py-0.5 border ${event.balancePaid ? 'border-black' : 'border-gray-300 text-gray-300'}`}>BAL: PAID</span>
          </div>
        </div>
      </div>

      {/* SERVICE MATRIX */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <section className="border-l-4 border-black pl-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            Bar Program
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold uppercase text-gray-500">Service Type</span>
              <span className="text-sm font-black uppercase">{event.barType}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold uppercase text-gray-500">Beer/Wine Options</span>
              <span className="text-sm font-black uppercase">{event.beerWineOffered ? "Standard Suite" : "Uncorking Fee Applied"}</span>
            </div>
            {event.hasTasting && (
              <div className="p-2 bg-gray-900 text-white rounded mt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-center">Guided Tasting Included</p>
              </div>
            )}
          </div>
        </section>

        <section className="border-l-4 border-black pl-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            Culinary Ops
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold uppercase text-gray-500">Provisioning</span>
              <span className="text-sm font-black uppercase">{event.hasFood ? "ENABLED" : "NONE"}</span>
            </div>
            {event.hasFood && (
              <>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Source</span>
                  <span className="text-sm font-black uppercase">{event.foodSource}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Service Style</span>
                  <span className="text-sm font-black uppercase">{event.foodServiceType}</span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* SPECIAL DIRECTIVES */}
      <section className="mb-10">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          FOH Directives & Load-in Notes
        </h3>
        <div className="border-2 border-black p-6 font-medium text-sm leading-relaxed min-h-[150px] whitespace-pre-line">
          {event.notes || 'NO SPECIAL DIRECTIVES FILED.'}
        </div>
      </section>

      {/* LOGISTICS CHECKLIST */}
      <section className="mb-12">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4">Operational Readiness Checklist</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-black p-3 flex flex-col items-center justify-center text-center">
            <div className="w-6 h-6 border-2 border-black mb-2"></div>
            <span className="text-[8px] font-black uppercase">Venue Ready</span>
          </div>
          <div className="border border-black p-3 flex flex-col items-center justify-center text-center">
            <div className="w-6 h-6 border-2 border-black mb-2"></div>
            <span className="text-[8px] font-black uppercase">Bar Stocked</span>
          </div>
          <div className="border border-black p-3 flex flex-col items-center justify-center text-center">
            <div className="w-6 h-6 border-2 border-black mb-2"></div>
            <span className="text-[8px] font-black uppercase">Staff Prepped</span>
          </div>
          <div className="border border-black p-3 flex flex-col items-center justify-center text-center">
            <div className="w-6 h-6 border-2 border-black mb-2"></div>
            <span className="text-[8px] font-black uppercase">Check-out Done</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div className="mt-auto pt-8 border-t-4 border-black flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
        <div>
          <p>AUTHORIZED SYSTEM COPY</p>
          <p className="text-gray-400">Generated: {new Date().toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p>DistilleryEvents Management Suite</p>
          <p className="text-gray-400">Copyright Operations v2.5</p>
        </div>
      </div>
    </div>
  );
};

export default EventSheet;