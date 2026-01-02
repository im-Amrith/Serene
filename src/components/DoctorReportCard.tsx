import React, { useState } from 'react';
import { Copy, Check, X, Stethoscope } from 'lucide-react';
import { SOAPNote } from '../services/soapService';

interface DoctorReportCardProps {
  note: SOAPNote;
  onClose: () => void;
}

export const DoctorReportCard: React.FC<DoctorReportCardProps> = ({ note, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `
CLINICAL SUMMARY (SOAP NOTE)
----------------------------
SUBJECTIVE:
${note.subjective}

OBJECTIVE:
${note.objective}

ASSESSMENT:
${note.assessment}

PLAN:
${note.plan}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Clinical Summary</h3>
              <p className="text-blue-200 text-sm">Auto-Generated SOAP Note</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50">
          <div className="grid gap-4">
            <Section title="S - Subjective" content={note.subjective} color="blue" />
            <Section title="O - Objective" content={note.objective} color="indigo" />
            <Section title="A - Assessment" content={note.assessment} color="amber" />
            <Section title="P - Plan" content={note.plan} color="emerald" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleCopy}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center space-x-2 transition-all shadow-lg shadow-blue-600/20"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy for EMR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, content, color }: { title: string, content: string, color: string }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }[color] || 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className={`p-4 rounded-xl border ${colorClasses}`}>
      <h4 className="font-bold text-sm uppercase tracking-wider mb-2 opacity-80">{title}</h4>
      <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
};
