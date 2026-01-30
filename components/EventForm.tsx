
import React, { useState } from 'react';
import { EventRecord, EventType, BarType, FoodSource, FoodServiceType } from '../types';
import { DEFAULT_EVENT } from '../constants';

// Safe UUID generation for both secure and non-secure contexts
const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {}
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface EventFormProps {
  event?: EventRecord;
  onSave: (event: EventRecord) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onClose }) => {
  const [formData, setFormData] = useState<EventRecord>(
    event || { ...DEFAULT_EVENT, id: generateId() } as EventRecord
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      val = value === '' ? 0 : parseFloat(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/75 backdrop-blur-md flex items-center justify-center p-4 z-50 no-print">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-amber-900/10">
        <div className="p-6 border-b flex justify-between items-center bg-[#1a1a1a] text-white rounded-t-xl sticky top-0 z-10 shadow-lg">
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase leading-none">
              {event ? 'Update Manifest' : 'Initialize Booking'}
            </h2>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1">DistilleryEvents Operations Control</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          <div className="flex items-center justify-between bg-amber-50 p-5 rounded-xl border border-amber-200">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                id="contacted"
                name="contacted"
                checked={formData.contacted}
                onChange={handleChange}
                className="w-6 h-6 text-amber-600 border-amber-300 rounded focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="contacted" className="font-black text-amber-900 cursor-pointer uppercase text-[11px] tracking-widest">
                Outreach & Coordination Confirmed
              </label>
            </div>
            {!formData.contacted && (
              <span className="text-[9px] uppercase font-black text-amber-600 animate-pulse tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm border border-amber-100">
                Action Required
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <h3 className="text-[12px] font-black text-amber-800 uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Primary Client Record
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                  <input required name="firstName" value={formData.firstName} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 focus:border-amber-500 outline-none font-medium transition-all bg-gray-50/50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                  <input required name="lastName" value={formData.lastName} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 focus:border-amber-500 outline-none font-medium transition-all bg-gray-50/50 focus:bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 focus:border-amber-500 outline-none font-medium transition-all bg-gray-50/50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 focus:border-amber-500 outline-none font-medium transition-all bg-gray-50/50 focus:bg-white" />
                </div>
              </div>

              <h3 className="text-[12px] font-black text-amber-800 uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2 pt-4">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Event Manifest
              </h3>
              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Service Type</label>
                  <select name="eventType" value={formData.eventType} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 focus:border-amber-500 outline-none font-bold bg-gray-50/50">
                    {Object.values(EventType).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Guest Manifest</label>
                  <input type="number" name="guests" value={formData.guests} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 font-black text-center outline-none bg-gray-50/50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Engagement Date</label>
                  <input required type="date" name="dateRequested" value={formData.dateRequested} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 font-bold outline-none bg-gray-50/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Call Time</label>
                  <input required type="time" name="time" value={formData.time} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 font-bold outline-none bg-gray-50/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Service Hours</label>
                  <input required type="number" step="0.5" name="duration" value={formData.duration} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 font-black text-center outline-none bg-gray-50/50" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-[12px] font-black text-amber-800 uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Provisioning & Logistics
              </h3>
              
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 space-y-6 shadow-inner">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Spirit & Beverage Strategy</label>
                  <div className="flex justify-center gap-2">
                    {Object.values(BarType).map(bt => (
                      <label key={bt} className={`flex-1 flex items-center justify-center cursor-pointer px-2 py-3 rounded-lg border-2 transition-all ${formData.barType === bt ? 'bg-amber-700 border-amber-700 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-amber-300'}`}>
                        <input type="radio" name="barType" value={bt} checked={formData.barType === bt} onChange={handleChange} className="hidden" />
                        <span className="text-[9px] font-black uppercase text-center leading-tight">{bt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">Support Selection</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="beerWineOffered" checked={formData.beerWineOffered === true} onChange={() => setFormData(p => ({...p, beerWineOffered: true}))} className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] font-black text-gray-700 uppercase group-hover:text-amber-700 transition-colors">House Selection</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="beerWineOffered" checked={formData.beerWineOffered === false} onChange={() => setFormData(p => ({...p, beerWineOffered: false}))} className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] font-black text-gray-700 uppercase group-hover:text-amber-700 transition-colors">Uncorking Fee</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 space-y-5 shadow-inner">
                <div className="flex items-center justify-between">
                  <label htmlFor="hasFood" className="text-[11px] font-black text-gray-800 uppercase tracking-widest cursor-pointer flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    Include Catering
                  </label>
                  <input type="checkbox" id="hasFood" name="hasFood" checked={formData.hasFood} onChange={handleChange} className="w-6 h-6 text-amber-600 rounded cursor-pointer" />
                </div>

                {formData.hasFood && (
                  <div className="space-y-5 pt-5 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Provider Source</label>
                      <select name="foodSource" value={formData.foodSource} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 text-[11px] font-black bg-white uppercase">
                        <option value="">Select...</option>
                        {Object.values(FoodSource).map(fs => <option key={fs} value={fs}>{fs}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Service Methodology</label>
                      <select name="foodServiceType" value={formData.foodServiceType} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3 text-[11px] font-black bg-white uppercase">
                        <option value="">Select...</option>
                        {Object.values(FoodServiceType).map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 bg-amber-900/5 rounded-xl border border-amber-900/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-700/10 rounded-full flex items-center justify-center text-amber-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <label htmlFor="addParking" className="text-[11px] font-black text-amber-900 uppercase tracking-widest cursor-pointer block">Priority 20-Car Lot</label>
                    <p className="text-[9px] text-amber-700/70 font-black uppercase mt-0.5">$500 Flat Fee Applied</p>
                  </div>
                </div>
                <input type="checkbox" id="addParking" name="addParking" checked={formData.addParking} onChange={handleChange} className="w-7 h-7 text-amber-600 rounded cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="space-y-8 pt-10 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <h3 className="text-[12px] font-black text-amber-800 uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                    Account Summary
                 </h3>
                 <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gross Total ($)</label>
                    <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-4 font-black text-xl bg-gray-50/50 shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Retainer ($)</label>
                    <input type="number" name="depositAmount" value={formData.depositAmount} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-4 font-black text-xl bg-gray-50/50 shadow-inner" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5 pt-2">
                  <label className={`flex items-center justify-center cursor-pointer px-4 py-3 rounded-xl border-2 text-[10px] font-black transition-all shadow-sm ${formData.depositPaid ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-rose-100 text-rose-600 hover:border-rose-300'}`}>
                    <input type="checkbox" name="depositPaid" checked={formData.depositPaid} onChange={handleChange} className="hidden" />
                    RETAINER: {formData.depositPaid ? '✓ SETTLED' : '⚠ PENDING'}
                  </label>
                  <label className={`flex items-center justify-center cursor-pointer px-4 py-3 rounded-xl border-2 text-[10px] font-black transition-all shadow-sm ${formData.balancePaid ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-rose-100 text-rose-600 hover:border-rose-300'}`}>
                    <input type="checkbox" name="balancePaid" checked={formData.balancePaid} onChange={handleChange} className="hidden" />
                    BALANCE: {formData.balancePaid ? '✓ SETTLED' : '⚠ PENDING'}
                  </label>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-[12px] font-black text-amber-800 uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                    Internal Directives
                </h3>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={5} className="block w-full rounded-xl border-gray-200 border p-4 focus:border-amber-500 outline-none font-medium text-sm bg-gray-50/50 shadow-inner resize-none" placeholder="A/V configuration, VIP notes, facility setup..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-6 pt-10 border-t border-gray-100">
            <button type="button" onClick={onClose} className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-rose-600 transition-colors">Discard Draft</button>
            <button type="submit" className="px-12 py-4 bg-[#1a1a1a] text-amber-500 border-2 border-amber-600 rounded-xl hover:bg-black hover:scale-105 transition-all shadow-2xl font-black uppercase tracking-[0.3em] text-[11px] active:scale-95">Commit Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
