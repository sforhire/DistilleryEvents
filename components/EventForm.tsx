
import React, { useState } from 'react';
import { EventRecord, EventType, BarType, FoodSource, FoodServiceType } from '../types';
import { DEFAULT_EVENT } from '../constants';
import { generateSafeId } from '../services/utils';

interface EventFormProps {
  event?: EventRecord;
  onSave: (event: EventRecord) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onClose }) => {
  const [formData, setFormData] = useState<EventRecord>(
    event || { ...DEFAULT_EVENT, id: generateSafeId() } as EventRecord
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <h3 className="text-[12px] font-black text-amber-800 uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                Primary Client Record
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <input required name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3" />
                <input required name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3" />
              </div>
              <input required type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3" />
              
              <h3 className="text-[12px] font-black text-amber-800 uppercase tracking-[0.2em] border-b pb-3">Manifest</h3>
              <div className="grid grid-cols-2 gap-5">
                <select name="eventType" value={formData.eventType} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3">
                  {Object.values(EventType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <input type="number" name="guests" placeholder="Guests" value={formData.guests} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3" />
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-[12px] font-black text-amber-800 uppercase tracking-[0.2em] border-b pb-3">Logistics</h3>
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <select name="barType" value={formData.barType} onChange={handleChange} className="block w-full rounded-lg border-gray-200 border p-3">
                  {Object.values(BarType).map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase">Food Service</span>
                  <input type="checkbox" name="hasFood" checked={formData.hasFood} onChange={handleChange} className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-6">
            <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cancel</button>
            <button type="submit" className="px-10 py-3 bg-[#1a1a1a] text-amber-500 rounded-lg font-black uppercase tracking-widest text-[11px]">Save Manifest</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
