import React, { useState } from 'react';
import { FlaggedSegment, SeverityLevel } from '../types/moderation';
import { AlertTriangle, AlertCircle, Info, ShieldAlert, Sparkles } from 'lucide-react';

interface HighlightedTextProps {
  text: string;
  segments: FlaggedSegment[];
  onSelectSegment?: (segment: FlaggedSegment | null) => void;
  selectedSegmentId?: string | null;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  segments,
  onSelectSegment,
  selectedSegmentId
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<FlaggedSegment | null>(null);

  if (!text) {
    return <span className="text-slate-500 italic">No text provided for analysis</span>;
  }

  if (segments.length === 0) {
    return <span className="text-slate-200 leading-relaxed whitespace-pre-wrap">{text}</span>;
  }

  // Slice text into segments and non-flagged text blocks
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;

  // Filter and sort valid segments
  const validSegments = [...segments]
    .filter(s => s.startIndex >= 0 && s.endIndex <= text.length && s.startIndex < s.endIndex)
    .sort((a, b) => a.startIndex - b.startIndex);

  validSegments.forEach((seg, idx) => {
    // Text before the segment
    if (seg.startIndex > currentIndex) {
      elements.push(
        <span key={`text_${idx}_${currentIndex}`} className="text-slate-200">
          {text.slice(currentIndex, seg.startIndex)}
        </span>
      );
    }

    const isSelected = selectedSegmentId === seg.id;
    const isHovered = hoveredSegment?.id === seg.id;

    // Severity styling
    let highlightClasses = 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400';
    let icon = <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-400" />;

    if (seg.severity === 'critical') {
      highlightClasses = 'bg-rose-500/30 text-rose-200 border-b-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
      icon = <ShieldAlert className="h-3 w-3 inline mr-1 text-rose-400" />;
    } else if (seg.severity === 'high') {
      highlightClasses = 'bg-orange-500/25 text-orange-200 border-b-2 border-orange-500';
      icon = <AlertCircle className="h-3 w-3 inline mr-1 text-orange-400" />;
    } else if (seg.severity === 'low') {
      highlightClasses = 'bg-sky-500/20 text-sky-200 border-b-2 border-sky-400';
      icon = <Info className="h-3 w-3 inline mr-1 text-sky-400" />;
    }

    const matchedSubstring = text.slice(seg.startIndex, seg.endIndex);

    elements.push(
      <span
        key={`seg_${seg.id || idx}`}
        onMouseEnter={() => setHoveredSegment(seg)}
        onMouseLeave={() => setHoveredSegment(null)}
        onClick={() => onSelectSegment?.(seg)}
        className={`relative inline-block px-1 rounded-sm cursor-pointer transition-all duration-150 ${highlightClasses} ${
          isSelected ? 'ring-2 ring-indigo-400 scale-[1.02]' : ''
        }`}
        title={`${seg.ruleName}: ${seg.reason}`}
      >
        <span className="font-medium underline decoration-current underline-offset-4">
          {matchedSubstring}
        </span>
      </span>
    );

    currentIndex = Math.max(currentIndex, seg.endIndex);
  });

  // Remaining tail text
  if (currentIndex < text.length) {
    elements.push(
      <span key="text_tail" className="text-slate-200">
        {text.slice(currentIndex)}
      </span>
    );
  }

  const activePopover = hoveredSegment;

  return (
    <div className="relative">
      <div className="leading-relaxed text-sm md:text-base font-normal whitespace-pre-wrap break-words">
        {elements}
      </div>

      {/* Floating detail tooltip on hover */}
      {activePopover && (
        <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <span className="capitalize">{activePopover.ruleName}</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              activePopover.severity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
              activePopover.severity === 'high' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
              'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {activePopover.severity} severity · {activePopover.action}
            </span>
          </div>

          <p className="text-slate-300 leading-snug">
            {activePopover.reason}
          </p>

          {activePopover.suggestedReplacement && (
            <div className="flex items-center gap-1.5 text-slate-400 pt-1 border-t border-slate-800/80">
              <span className="text-slate-500">Sanitized as:</span>
              <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[11px]">
                {activePopover.suggestedReplacement}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
