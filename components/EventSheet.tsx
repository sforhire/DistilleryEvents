
import React from 'react';
import { EventRecord } from '../types';
import { formatTimeWindow } from '../services/utils';

interface EventSheetProps {
  event: EventRecord;
}

const EventSheet: React.FC<EventSheetProps> = ({ event }) => {
  return (
    <div className="bg-white p-12 text-black font-sans leading-tight print:p-8">
      {/* HEADER */}
      <div className="border-b-8 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">FOH Summary</h1>
          <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-gray-500 mt-2">Operational Intelligence Manifest</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black">{event.dateRequested ? new Date(event.dateRequested).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'DATE TBD'}</p>
          <p className="text-lg font-bold text-gray-600 uppercase tracking-tight">{formatTimeWindow(event.time, event.endTime)}</p>
        </div>
      </div>

      {/* CORE INFO GRID */}
      <div className="grid grid-cols-2 border-4 border-black mb-8">
        <div className="p-6 border-r-4 border-black bg-gray-50/30">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Primary Guest Profile</h2>
          <p className="text-2xl font-black uppercase leading-none">{event.firstName} {event.lastName}</p>
          <div className="mt-3 space-y-1">
            <p className="text-sm font-bold">{event.email}</p>
            <p className="text-sm font-bold">{event.phone}</p>
          </div>
        </div>
        <div className="p-6 bg-gray-50/50">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Operational Details</h2>
          <p className="text-2xl font-black uppercase leading-none">{event.eventType}</p>
          <div className="mt-3">
            <p className="text-lg font-black uppercase tracking-tighter">Manifest: {event.guests} Guests</p>
            <p className="text-sm font-bold text-gray-500 uppercase">Operational Window: {event.time} - {event.endTime}</p>
          </div>
        </div>
      </div>

      {/* OPERATIONAL SECTIONS */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <section className="border-l-8 border-black pl-6">
          <h3 className="text-[12px] font-black uppercase tracking-widest mb-4 border-b border-gray-100 pb-1">Bar Program</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Type</span>
              <span className="font-black uppercase">{event.barType}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Beer/Wine Off.</span>
              <span className="font-black uppercase">{event.beerWineOffered ? "INCLUDED" : "UN-CORKING FEE"}</span>
            </div>
            {event.hasTasting && (
              <div className="bg-black text-white px-3 py-2 text-[10px] font-black uppercase text-center mt-4">Required: Guided Tasting Program</div>
            )}
          </div>
        </section>

        <section className="border-l-8 border-black pl-6">
          <h3 className="text-[12px] font-black uppercase tracking-widest mb-4 border-b border-gray-100 pb-1">Culinary Service</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Catering Status</span>
              <span className="font-black uppercase">{event.hasFood ? "ACTIVE" : "NO SERVICE"}</span>
            </div>
            {event.hasFood && (
              <>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Provider</span>
                  <span className="font-black uppercase">{event.foodSource}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Style</span>
                  <span className="font-black uppercase">{event.foodServiceType}</span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* LOGISTICS & NOTES */}
      <section className="mb-10">
        <h3 className="text-[12px] font-black uppercase tracking-widest mb-4 border-b-2 border-black pb-2">Specific Directives & Logistics</h3>
        <div className="border-4 border-black p-6 min-h-[180px] text-lg font-medium whitespace-pre-line leading-relaxed italic bg-gray-50/30">
          {event.notes || 'No custom operational directives filed for this session.'}
        </div>
      </section>

      {/* FOH CHECKLIST */}
      <section className="mb-12">
        <h3 className="text-[12px] font-black uppercase tracking-widest mb-6">Service Readiness Checklist</h3>
        <div className="grid grid-cols-4 gap-6">
          {['Venue Prepped', 'Bar Inventory', 'Catering Sync', 'Briefing Done'].map(step => (
            <div key={step} className="border-2 border-black p-4 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-black mb-3"></div>
              <span className="text-[10px] font-black uppercase leading-tight">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <div className="mt-auto pt-6 border-t-4 border-black flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span>Master Copy • Operational Document</span>
        <span>Stamp: {new Date().toLocaleString()}</span>
        <span>Manifest ID: {event.id.split('-')[0]}</span>
      </div>
    </div>
  );
};

export default EventSheet;
