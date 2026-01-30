
import React, { useState } from 'react';

interface EmbedModalProps {
  onClose: () => void;
}

const EmbedModal: React.FC<EmbedModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}${window.location.pathname}?view=public`;
  const embedCode = `<iframe 
  src="${publicUrl}" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  style="border:1px solid #eee; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);"
></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-amber-900/20">
        <div className="p-8 border-b flex justify-between items-center bg-[#1a1a1a]">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Embed Inquiry Form</h2>
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mt-1">Direct Ingest System</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl">&times;</button>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            Copy this snippet and paste it into your website's HTML to allow clients to submit event inquiries directly to your operations pipeline.
          </p>
          
          <div className="relative group">
            <pre className="bg-gray-900 text-amber-400 p-6 rounded-xl text-[11px] font-mono overflow-x-auto border-2 border-amber-900/10 leading-relaxed group-hover:border-amber-500/30 transition-all">
              {embedCode}
            </pre>
            <button 
              onClick={copyToClipboard}
              className="absolute top-4 right-4 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
            <div className="w-5 h-5 text-amber-600 mt-0.5">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-amber-900 text-xs font-medium leading-relaxed">
              New inquiries submitted through this form will automatically appear as <span className="font-black uppercase tracking-tighter">"New Requests"</span> in your dashboard with the high-priority amber pulse indicator.
            </p>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-md font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-black"
          >
            Finished
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;
