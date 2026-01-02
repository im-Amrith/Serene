import React from 'react';
import { ShieldCheck, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react';

interface TrustIndicatorProps {
  confidence: number; // 0 to 100
  citation?: string;
  sourceUrl?: string;
  journalName?: string;
  publicationDate?: string;
  abstractSummary?: string;
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({ 
  confidence, 
  citation, 
  sourceUrl,
  journalName = "PubMed Central",
  publicationDate = "2024",
  abstractSummary 
}) => {
  // Determine color based on confidence
  const getColor = (score: number) => {
    if (score >= 90) return 'text-green-700 border-green-200 bg-green-50';
    if (score >= 70) return 'text-amber-700 border-amber-200 bg-amber-50';
    return 'text-red-700 border-red-200 bg-red-50';
  };

  const colorClass = getColor(confidence);
  const barColor = confidence >= 90 ? 'bg-green-500' : confidence >= 70 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="mt-3 space-y-2">
      {/* Confidence Meter */}
      <div className={`flex items-center space-x-3 p-3 rounded-xl border ${colorClass}`}>
        <ShieldCheck className="w-4 h-4" />
        <div className="flex-1">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span>AI Confidence Score</span>
            <span>{confidence}%</span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-black/5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Citation Card */}
      {citation && (
        <div className="group relative overflow-hidden p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
            VERIFIED SOURCE
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-bold text-slate-800">{journalName}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{publicationDate}</span>
              </div>
              <p className="text-xs text-blue-700 font-medium line-clamp-2 hover:line-clamp-none transition-all">
                "{citation}"
              </p>
              {abstractSummary && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Summary:</span> {abstractSummary}
                </p>
              )}
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2 font-medium">
                  <span>Read Full Paper</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Low Confidence Warning */}
      {confidence < 70 && (
        <div className="flex items-center space-x-2 text-xs text-red-600 font-medium px-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Confidence below threshold. Please consult a medical professional.</span>
        </div>
      )}
    </div>
  );
};
