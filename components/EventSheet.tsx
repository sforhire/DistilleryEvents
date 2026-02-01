import React from 'react';
import { EventRecord } from '../types';

interface EventSheetProps {
  event: EventRecord;
}

const formatTime = (startTime: string, duration: number) => {
  if (!startTime || !startTime.includes(':')) return "TBD";
  try {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + (duration || 0) * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${fmt(start)} — ${fmt(end)} (${duration}h)`;
  } catch (e) {
    return startTime;
  }
};

const EventSheet: React.FC<EventSheetProps> = ({ event }) => {
  return (
    <div className="bg-white p-8 md:p-12 text-black font-sans leading-tight">
      {/* HEADER */}
      <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Event Order</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Distillery Operations Manifest</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black">{event.dateRequested ? new Date(event.dateRequested).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'DATE TBD'}</p>
          <p className="text-sm font-bold text-gray-600 uppercase">{formatTime(event.time, event.duration)}</p>
        </div>
      </div>

      {/* CORE INFO GRID */}
      <div className="grid grid-cols-2 border-2 border-black mb-6">
        <div className="p-4 border-r-2 border-black">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Guest Profile</h2>
          <p className="text-lg font-black uppercase leading-none">{event.firstName} {event.lastName}</p>
          <p className="text-xs mt-1 font-medium">{event.email}</p>
          <p className="text-xs font-medium">{event.phone}</p>
        </div>
        <div className="p-4 bg-gray-50">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Service Matrix</h2>
          <p className="text-lg font-black uppercase leading-none">{event.eventType}</p>
          <p className="text-sm font-bold mt-1">Manifest: {event.guests} Guests</p>
        </div>
      </div>

      {/* OPERATIONAL SECTIONS */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <section className="border-l-4 border-black pl-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-3">Bar Program</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="text-gray-500 font-bold uppercase text-[9px]">Type</span>
              <span className="font-black uppercase">{event.barType}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="text-gray-500 font-bold uppercase text-[9px]">Beer/Wine</span>
              <span className="font-black uppercase">{event.beerWineOffered ? "Included" : "Excl. Uncorking"}</span>
            </div>
            {event.hasTasting && (
              <div className="bg-black text-white px-2 py-1 text-[9px] font-black uppercase text-center mt-2">Guided Tasting Scheduled</div>
            )}
          </div>
        </section>

        <section className="border-l-4 border-black pl-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-3">Culinary Ops</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="text-gray-500 font-bold uppercase text-[9px]">Status</span>
              <span className="font-black uppercase">{event.hasFood ? "ENABLED" : "NONE"}</span>
            </div>
            {event.hasFood && (
              <>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-500 font-bold uppercase text-[9px]">Source</span>
                  <span className="font-black uppercase">{event.foodSource}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-500 font-bold uppercase text-[9px]">Style</span>
                  <span className="font-black uppercase">{event.foodServiceType}</span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* SPECIAL DIRECTIVES */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">Operational Directives</h3>
        <div className="border-2 border-black p-4 min-h-[140px] text-sm font-medium whitespace-pre-line leading-relaxed italic">
          {event.notes || 'No custom directives filed for this manifest.'}
        </div>
      </section>

      {/* FOH CHECKLIST */}
      <section className="mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Readiness Protocol</h3>
        <div className="grid grid-cols-4 gap-4">
          {['Venue Set', 'Bar Stocked', 'Staff Briefed', 'Closing Sign-off'].map(step => (
            <div key={step} className="border border-black p-3 text-center flex flex-col items-center">
              <div className="w-6 h-6 border-2 border-black mb-2"></div>
              <span className="text-[8px] font-black uppercase">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <div className="mt-auto pt-4 border-t-2 border-black flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-gray-400">
        <span>Authorized System Copy</span>
        <span>Generated: {new Date().toLocaleString()}</span>
        <span>ID: {event.id.split('-')[0]}</span>
      </div>
    </div>
  );
};

export default EventSheet;