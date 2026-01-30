
import React, { useState } from 'react';
import { EventRecord, EventType, BarType, FoodSource, FoodServiceType } from '../types';
import { DEFAULT_EVENT } from '../constants';
import { generateSafeId } from '../services/utils';

interface PublicEventFormProps {
  onSubmit: (event: EventRecord) => void;
}

const PublicEventForm: React.FC<PublicEventFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<EventRecord>({
    ...DEFAULT_EVENT,
    id: generateSafeId(),
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateRequested: '',
    time: '',
    notes: '',
    contacted: false,
    depositPaid: false,
    balancePaid: false,
  } as EventRecord);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (err) {
      alert("Submission failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center">
        <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Request Received</h2>
        <p className="text-gray-500 font-medium leading-relaxed max-w-md mx-auto">
          Thank you for choosing us for your event. Our team has received your inquiry and will reach out shortly to finalize the details of your distillery experience.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2">Book Your Experience</h1>
        <p className="text-amber-700 font-bold uppercase tracking-widest text-xs">Premium Distillery Events & Private Dining</p>
      </div>

      <form onSubmit={handleFormSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12 space-y-12">
          
          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b border-amber-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">01</span>
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-medium outline-none" placeholder="Enter your first name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-medium outline-none" placeholder="Enter your last name" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-medium outline-none" placeholder="client@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-medium outline-none" placeholder="(555) 000-0000" />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b border-amber-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">02</span>
              The Event
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">What are we celebrating?</label>
                <select name="eventType" value={formData.eventType} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-bold outline-none">
                  {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guest Count</label>
                <input type="number" name="guests" value={formData.guests} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-black text-center outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferred Date</label>
                <input required type="date" name="dateRequested" value={formData.dateRequested} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-bold outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferred Start Time</label>
                <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-bold outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration (Hours)</label>
                <input required type="number" step="0.5" name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 focus:bg-white transition-all font-bold text-center outline-none" />
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b border-amber-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">03</span>
              Service Preferences
            </h3>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Bar Selection</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(BarType).map(bt => (
                  <label key={bt} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all text-center ${formData.barType === bt ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-amber-300'}`}>
                    <input type="radio" name="barType" value={bt} checked={formData.barType === bt} onChange={handleChange} className="hidden" />
                    <span className="text-xs font-black uppercase tracking-widest">{bt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <div className="border-t border-gray-200 pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-900 uppercase">Include Food Service</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="hasFood" checked={formData.hasFood} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] border-b border-amber-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">04</span>
              Directives
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Any specific requests?</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:border-amber-500 focus:bg-white transition-all font-medium outline-none text-sm" placeholder="Tell us more details..." />
            </div>
          </section>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#1a1a1a] hover:bg-black text-amber-500 font-black uppercase tracking-[0.3em] py-5 rounded-2xl shadow-2xl transition-all active:scale-95 text-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Transmitting...' : 'Submit Inquiry'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PublicEventForm;
