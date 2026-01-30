
import React from 'react';
import { EventRecord } from '../types';

interface EventSheetProps {
  event: EventRecord;
  aiBriefing?: string;
}

const format12hWindow = (startTime: string, duration: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
  
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return `${fmt(start)} — ${fmt(end)} (${duration}h)`;
};

const EventSheet: React.FC<EventSheetProps> = ({ event, aiBriefing }) => {
  return (
    <div className="bg-white p-12 max-w-4xl mx-auto min-h-screen text-black print:p-0">
      <div className="flex justify-between items-end border-b-4 border-black pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Event Order</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">DistilleryEvents Professional</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{new Date(event.dateRequested).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p className="text-gray-600 font-medium">{format12hWindow(event.time, event.duration)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-10">
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest border-b-2 border-gray-100 mb-4 pb-1 text-gray-400">Guest Credentials</h2>
          <div className="space-y-1">
            <p className="text-lg font-bold">{event.firstName} {event.lastName}</p>
            <p className="text-sm text-gray-600">{event.email}</p>
            <p className="text-sm text-gray-600">{event.phone}</p>
          </div>
        </section>
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest border-b-2 border-gray-100 mb-4 pb-1 text-gray-400">Engagement Profile</h2>
          <div className="space-y-1">
            <p className="text-sm"><strong>Event Type:</strong> {event.eventType}</p>
            <p className="text-sm"><strong>Manifest:</strong> {event.guests} Guests</p>
            <p className="text-sm"><strong>Bar Service:</strong> {event.barType} ({event.beerWineOffered ? 'Svc Fee' : 'Uncork Fee'})</p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-10">
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest border-b-2 border-gray-100 mb-4 pb-1 text-gray-400">Food & Provisioning</h2>
          <div className="space-y-1">
            <p className="text-sm"><strong>Food Service:</strong> {event.hasFood ? 'YES' : 'NO'}</p>
            {event.hasFood && (
              <>
                <p className="text-sm"><strong>Source:</strong> {event.foodSource}</p>
                <p className="text-sm"><strong>Style:</strong> {event.foodServiceType}</p>
              </>
            )}
            <p className="text-sm"><strong>Facility Usage:</strong> {event.hasTour ? 'TOUR' : ''} {event.hasTasting ? 'TASTING' : ''}</p>
          </div>
        </section>
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest border-b-2 border-gray-100 mb-4 pb-1 text-gray-400">Logistics & Account</h2>
          <div className="space-y-1">
            <p className="text-sm"><strong>Parking Upgrade:</strong> {event.addParking ? 'YES ($500)' : 'NO'}</p>
            <p className="text-sm"><strong>Deposit:</strong> {event.depositPaid ? '✓ SETTLED' : '⚠ OUTSTANDING'}</p>
            <p className="text-sm"><strong>Final Balance:</strong> {event.balancePaid ? '✓ SETTLED' : '⚠ OUTSTANDING'}</p>
          </div>
        </section>
      </div>

      {aiBriefing && (
        <section className="mb-10 bg-gray-50 p-6 rounded-lg border-2 border-black/5">
          <h2 className="text-xs font-black uppercase tracking-widest mb-4 text-amber-800">Front of House Intelligence Briefing</h2>
          <div className="whitespace-pre-line text-[13px] text-gray-800 leading-relaxed font-medium">
            {aiBriefing}
          </div>
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-xs font-black uppercase tracking-widest border-b-2 border-gray-100 mb-4 pb-1 text-gray-400">Service Directives</h2>
        <p className="text-sm text-gray-700 italic bg-white p-4 border border-dashed rounded">
          {event.notes || 'No custom directives filed for this booking.'}
        </p>
      </section>

      <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        <span>Authorization Copy</span>
        <span>Generated: {new Date().toLocaleString()}</span>
        <span>System ID: {event.id.split('-')[0]}</span>
      </div>
    </div>
  );
};

export default EventSheet;
