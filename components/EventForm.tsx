import React, { useState, useEffect, useCallback } from 'react';
import { EventRecord, EventType, BarType, FoodSource, FoodServiceType } from '../types';
import { DEFAULT_EVENT } from '../constants';
import { generateSafeId } from '../services/utils';

interface EventFormProps {
  event?: EventRecord;
  onSave: (event: EventRecord) => void;
  onClose: () => void;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] border-b border-amber-100 pb-2 mb-6 flex items-center gap-2">
    {children}
  </h3>
);

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onClose }) => {
  const [formData, setFormData] = useState<EventRecord>(
    event || { ...DEFAULT_EVENT, id: generateSafeId() } as EventRecord
  );
  
  // Suggestion logic: calculates based on selections but doesn't force it
  const calculateSuggestedTotal = useCallback(() => {
    let total = 1000; // Base Venue Fee
    const guestCount = Number(formData.guests) || 0;
    total += guestCount * 25; 
    if (formData.barType === BarType.OPEN) total += guestCount * 35;
    if (formData.hasFood && formData.foodSource === FoodSource.CATERED) total += guestCount * 45;
    if (formData.addParking) total += 500;
    if (formData.hasTasting) total += guestCount * 20;
    if (formData.hasTour) total += guestCount * 15;
    return total;
  }, [formData.guests, formData.barType, formData.hasFood, formData.foodSource, formData.addParking, formData.hasTasting, formData.hasTour]);

  const handleApplySuggested = () => {
    const suggested = calculateSuggestedTotal();
    setFormData(prev => ({
      ...prev,
      totalAmount: suggested,
      depositAmount: Math.round(suggested * 0.25)
    }));
  };

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
    
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4 z-[60] no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-white/20">
        
        <div className="p-8 border-b flex justify-between items-center bg-[#1a1a1a] text-white rounded-t-3xl sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">
              {event ? 'Modify Manifest' : 'Build New Booking'}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">OPS-PIPELINE-v2.1</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">ID: {formData.id.split('-')[0]}</span>
            </div>
          </div>
          <button onClick={onClose} type="button" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            <div className="space-y-8">
              <section>
                <SectionTitle>01. Client Credentials</SectionTitle>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input required name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="block w-full rounded-xl border-gray-100 border p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                    <input required name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="block w-full rounded-xl border-gray-100 border p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <input required type="email" name="email" placeholder="Client Email" value={formData.email} onChange={handleChange} className="block w-full rounded-xl border-gray-100 border p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                  <input required name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="block w-full rounded-xl border-gray-100 border p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </section>

              <section>
                <SectionTitle>02. Event Timing</SectionTitle>
                <div className="space-y-4">
                  <select name="eventType" value={formData.eventType} onChange={handleChange} className="block w-full rounded-xl border-gray-100 border p-3 text-sm font-bold bg-gray-50">
                    {Object.values(EventType).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="date" name="dateRequested" value={formData.dateRequested} onChange={handleChange} className="block w-full rounded-xl border-gray-100 border p-3 text-sm outline-none" />
                    <input required type="time" name="time" value={formData.time} onChange={handleChange} className="block w-full rounded-xl border-gray-100 border p-3 text-sm outline-none" />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-gray-400">Hours</span>
                    <input type="number" name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-transparent font-black text-right outline-none" />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <SectionTitle>03. Service Profile</SectionTitle>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black uppercase">Guest Count</span>
                      <input type="number" name="guests" value={formData.guests} onChange={handleChange} className="w-20 bg-white border border-gray-200 rounded-lg p-2 text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bar Program</label>
                      <select name="barType" value={formData.barType} onChange={handleChange} className="block w-full rounded-xl border-gray-200 border p-3 text-xs font-bold">
                        {Object.values(BarType).map(bt => <option key={bt} value={bt}>{bt}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <label className="text-[10px] font-black uppercase">Food Provision</label>
                      <input type="checkbox" name="hasFood" checked={formData.hasFood} onChange={handleChange} className="w-5 h-5 accent-amber-600" />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <SectionTitle>04. Add-ons</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'addParking', label: 'Valet/Parking' },
                    { key: 'hasTasting', label: 'Spirits Tasting' },
                    { key: 'hasTour', label: 'Distillery Tour' },
                    { key: 'beerWineOffered', label: 'Beer & Wine' },
                  ].map(addon => (
                    <label key={addon.key} className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${formData[addon.key as keyof EventRecord] ? 'bg-amber-50 border-amber-600' : 'bg-white border-gray-100 hover:border-amber-200'}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase leading-tight">{addon.label}</span>
                        <input type="checkbox" name={addon.key} checked={!!formData[addon.key as keyof EventRecord]} onChange={handleChange} className="w-4 h-4 accent-amber-600" />
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8 bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <section>
                <SectionTitle>05. Financial Outlook</SectionTitle>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quote Total</label>
                      <button type="button" onClick={handleApplySuggested} className="text-[8px] font-black text-amber-600 uppercase tracking-widest hover:underline">Apply Suggested (${calculateSuggestedTotal().toLocaleString()})</button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                      <input required type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className="w-full bg-white border-2 border-amber-100 rounded-2xl p-4 pl-8 text-2xl font-black text-right focus:border-amber-500 outline-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Required Deposit</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                        <input required type="number" name="depositAmount" value={formData.depositAmount} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-7 text-lg font-black text-right outline-none" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`flex items-center justify-between p-3 rounded-xl border ${formData.depositPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        <span className="text-[9px] font-black uppercase">Dep Paid</span>
                        <input type="checkbox" name="depositPaid" checked={formData.depositPaid} onChange={handleChange} className="w-4 h-4 accent-green-600" />
                      </label>
                      <label className={`flex items-center justify-between p-3 rounded-xl border ${formData.balancePaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        <span className="text-[9px] font-black uppercase">Bal Paid</span>
                        <input type="checkbox" name="balancePaid" checked={formData.balancePaid} onChange={handleChange} className="w-4 h-4 accent-green-600" />
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" className="w-full bg-[#1a1a1a] text-amber-500 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-black transition-all">
                  {event ? 'Update Record' : 'Initialize Booking'}
                </button>
                <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-gray-400 py-2">Discard</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;