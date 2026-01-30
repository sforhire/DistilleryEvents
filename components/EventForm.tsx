
import React, { useState } from 'react';
import { EventRecord, EventType, BarType, FoodSource, FoodServiceType } from '../types';
import { DEFAULT_EVENT } from '../constants';

interface EventFormProps {
  event?: EventRecord;
  onSave: (event: EventRecord) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onClose }) => {
  const [formData, setFormData] = useState<EventRecord>(
    event || { ...DEFAULT_EVENT, id: crypto.randomUUID() } as EventRecord
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
    <div className="fixed inset-0 bg-[#1a1a1a]/70 backdrop-blur-md flex items-center justify-center p-4 z-50 no-print">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-amber-900/10">
        <div className="p-6 border-b flex justify-between items-center bg-[#1a1a1a] text-white rounded-t-xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase leading-none">
              {event ? 'Update Manifest' : 'Initialize Booking'}
            </h2>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1">DistilleryEvents Record System</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Header Actions */}
          <div className="flex items-center justify-between bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="contacted"
                name="contacted"
                checked={formData.contacted}
                onChange={handleChange}
                className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
              />
              <label htmlFor="contacted" className="font-bold text-amber-900 cursor-pointer uppercase text-xs tracking-widest">
                Outreach Confirmed
              </label>
            </div>
            {!formData.contacted && <span className="text-[9px] uppercase font-black text-amber-600 animate-pulse tracking-[0.2em] bg-white px-3 py-1 rounded shadow-sm border border-amber-100">Action Required</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Client & Basic Info */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b pb-2">Client Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">First Name</label>
                  <input required name="firstName" value={formData.firstName} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 focus:ring-amber-500 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Last Name</label>
                  <input required name="lastName" value={formData.lastName} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 focus:ring-amber-500 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 focus:ring-amber-500 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 focus:ring-amber-500 font-medium" />
                </div>
              </div>

              <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b pb-2 pt-4">Schedule & Manifest</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Event Type</label>
                  <select name="eventType" value={formData.eventType} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 focus:ring-amber-500 font-bold">
                    {Object.values(EventType).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Guests</label>
                  <input type="number" name="guests" value={formData.guests} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 font-bold text-center" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                  <input required type="date" name="dateRequested" value={formData.dateRequested} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Time</label>
                  <input required type="time" name="time" value={formData.time} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Hours</label>
                  <input required type="number" step="0.5" name="duration" value={formData.duration} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2.5 font-bold text-center" />
                </div>
              </div>
            </div>

            {/* Right Column: Service Logistics */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b pb-2">Service Logistics</h3>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Bar Strategy</label>
                  <div className="flex justify-center gap-2">
                    {Object.values(BarType).map(bt => (
                      <label key={bt} className={`flex-1 flex items-center justify-center cursor-pointer px-2 py-2 rounded border-2 transition-all ${formData.barType === bt ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>
                        <input type="radio" name="barType" value={bt} checked={formData.barType === bt} onChange={handleChange} className="hidden" />
                        <span className="text-[9px] font-black uppercase text-center">{bt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Beer/Wine Selection</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="beerWineOffered" checked={formData.beerWineOffered === true} onChange={() => setFormData(p => ({...p, beerWineOffered: true}))} />
                      <span className="text-[10px] font-bold text-gray-700">Fee for Service</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="beerWineOffered" checked={formData.beerWineOffered === false} onChange={() => setFormData(p => ({...p, beerWineOffered: false}))} />
                      <span className="text-[10px] font-bold text-gray-700">Uncorking Fee</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="hasFood" className="text-[10px] font-black text-gray-700 uppercase tracking-widest cursor-pointer">Include Food Service</label>
                  <input type="checkbox" id="hasFood" name="hasFood" checked={formData.hasFood} onChange={handleChange} className="w-5 h-5 text-amber-600 rounded" />
                </div>

                {formData.hasFood && (
                  <div className="space-y-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Food Source</label>
                      <select name="foodSource" value={formData.foodSource} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2 text-xs font-bold">
                        <option value="">Select Source...</option>
                        {Object.values(FoodSource).map(fs => <option key={fs} value={fs}>{fs}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Service Style</label>
                      <select name="foodServiceType" value={formData.foodServiceType} onChange={handleChange} className="block w-full rounded-md border-gray-300 border p-2 text-xs font-bold">
                        <option value="">Select Style...</option>
                        {Object.values(FoodServiceType).map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-amber-900/5 rounded-lg border border-amber-900/10 flex items-center justify-between">
                <div>
                  <label htmlFor="addParking" className="text-[10px] font-black text-amber-900 uppercase tracking-widest cursor-pointer">Additional 20 Car Parking</label>
                  <p className="text-[9px] text-amber-700 font-bold uppercase mt-0.5">$500 Flat Fee Applied</p>
                </div>
                <input type="checkbox" id="addParking" name="addParking" checked={formData.addParking} onChange={handleChange} className="w-6 h-6 text-amber-600 rounded" />
              </div>
            </div>
          </div>

          {/* Financials & Notes Footer */}
          <div className="space-y-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b pb-2">Financial Summary</h3>
                 <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1">Total Amount ($)</label>
                    <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className="block w-full rounded-md border-gray-200 border p-2.5 font-black text-lg bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1">Deposit ($)</label>
                    <input type="number" name="depositAmount" value={formData.depositAmount} onChange={handleChange} className="block w-full rounded-md border-gray-200 border p-2.5 font-black text-lg bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center justify-center cursor-pointer px-3 py-2 rounded border text-[10px] font-black transition-all ${formData.depositPaid ? 'bg-green-600 border-green-700 text-white' : 'bg-white border-red-200 text-red-600'}`}>
                    <input type="checkbox" name="depositPaid" checked={formData.depositPaid} onChange={handleChange} className="hidden" />
                    DEPOSIT: {formData.depositPaid ? 'PAID' : 'PENDING'}
                  </label>
                  <label className={`flex items-center justify-center cursor-pointer px-3 py-2 rounded border text-[10px] font-black transition-all ${formData.balancePaid ? 'bg-green-600 border-green-700 text-white' : 'bg-white border-red-200 text-red-600'}`}>
                    <input type="checkbox" name="balancePaid" checked={formData.balancePaid} onChange={handleChange} className="hidden" />
                    BALANCE: {formData.balancePaid ? 'PAID' : 'PENDING'}
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b pb-2">Directives & Special Requests</h3>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="block w-full rounded-md border-gray-300 border p-3 focus:ring-amber-500 font-medium text-sm" placeholder="A/V needs, music, lighting, special occasions..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-8 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-8 py-3 text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] hover:text-red-600 transition-colors">Discard</button>
            <button type="submit" className="px-10 py-3 bg-[#1a1a1a] text-amber-500 border-2 border-amber-600 rounded-md hover:bg-black transition-all shadow-xl font-black uppercase tracking-[0.2em] text-[10px]">Commit Manifest</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
