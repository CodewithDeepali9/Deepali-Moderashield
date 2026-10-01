import React, { useState } from 'react';
import { 
  ModerationRule, 
  ModerationResult, 
  FlaggedSegment 
} from '../types/moderation';
import { SAMPLE_PRESETS, SamplePreset } from '../utils/sampleData';
import { HighlightedText } from './HighlightedText';
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  FileText, 
  Eye, 
  Columns, 
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Info
} from 'lucide-react';

interface LiveInspectorProps {
  rules: ModerationRule[];
  onModerate: (text: string) => Promise<ModerationResult>;
  lastResult: ModerationResult | null;
  isLoading: boolean;
}

export const LiveInspector: React.FC<LiveInspectorProps> = ({
  rules,
  onModerate,
  lastResult,
  isLoading
}) => {
  const [inputText, setInputText] = useState<string>(SAMPLE_PRESETS[1].text);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SAMPLE_PRESETS[1].id);
  const [viewMode, setViewMode] = useState<'highlighted' | 'redacted' | 'diff'>('highlighted');
  const [selectedSegment, setSelectedSegment] = useState<FlaggedSegment | null>(null);
  const [copied, setCopied] = useState(false);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  const handleSelectPreset = (preset: SamplePreset) => {
    setSelectedPresetId(preset.id);
    setInputText(preset.text);
    setSelectedSegment(null);
  };

  const handleRunAnalysis = async () => {
    if (!inputText.trim()) return;
    await onModerate(inputText);
  };

  const handleCopySanitized = () => {
    if (!lastResult?.sanitizedText) return;
    navigator.clipboard.writeText(lastResult.sanitizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Verdict styling helper
  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
          icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
          label: 'Content Approved',
          description: 'Safe for publication. Complies with active moderation rules.'
        };
      case 'FLAGGED':
        return {
          bg: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
          icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
          label: 'Flagged for Review',
          description: 'Contains sensitive or borderline segments requiring attention.'
        };
      case 'REJECTED':
        return {
          bg: 'bg-orange-950/70 border-orange-500/50 text-orange-300',
          icon: <ShieldX className="h-5 w-5 text-orange-400" />,
          label: 'Content Rejected',
          description: 'Violates core community guidelines. Direct rejection enforced.'
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
          icon: <ShieldAlert className="h-5 w-5 text-rose-400" />,
          label: 'Critical Violation',
          description: 'Severe violation detected. Immediate block and audit required.'
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          icon: <Info className="h-5 w-5 text-slate-400" />,
          label: 'Ready for Analysis',
          description: 'Enter text above or select a preset to analyze violations.'
        };
    }
  };

  const verdictMeta = getVerdictBadge(lastResult?.verdict);

  return (
    <div className="space-y-6">
      {/* Preset bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            Quick Presets / Realistic Test Scenarios:
          </span>
          <span className="text-[11px] text-slate-500">Click to load realistic sample text</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-semibold truncate text-slate-100">{preset.title}</div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-slate-400">{preset.category}</span>
                  <span className={`font-mono text-[10px] ${
                    preset.expectedOutcome === 'Approved' ? 'text-emerald-400' :
                    preset.expectedOutcome === 'Redacted' ? 'text-sky-400' :
                    preset.expectedOutcome === 'Flagged' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {preset.expectedOutcome}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Inspection views */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="user-text-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                User-Generated Text Input
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{wordCount} words</span>
                <span aria-hidden="true">·</span>
                <span>{charCount} chars</span>
                {inputText && (
                  <button
                    onClick={() => {
                      setInputText('');
                      setSelectedPresetId('');
                    }}
                    className="ml-2 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Clear text"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="user-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste user-submitted content to analyze against moderation rules..."
              rows={6}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-sans leading-relaxed resize-y"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Enforcing {rules.filter(r => r.enabled).length} active policies</span>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={isLoading || !inputText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Policies...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Analyze Content</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Viewport Tabs */}
          {lastResult && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setViewMode('highlighted')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                      viewMode === 'highlighted'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inline Violations ({lastResult.flaggedSegments.length})</span>
                  </button>

                  <button
                    onClick={() => setViewMode('redacted')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                      viewMode === 'redacted'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Sanitized Output</span>
                  </button>

                  <button
                    onClick={() => setViewMode('diff')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                      viewMode === 'diff'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Columns className="h-3.5 w-3.5" />
                    <span>Side-by-Side</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span>{lastResult.executionTimeMs} ms</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize font-mono text-[11px] text-indigo-400">
                    {lastResult.engineUsed === 'ai_gemini' ? 'Gemini 3.8 Flash' : 'Pattern Engine'}
                  </span>
                </div>
              </div>

              {/* Viewport Content */}
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/80 min-h-[140px]">
                {viewMode === 'highlighted' && (
                  <HighlightedText
                    text={lastResult.inputText}
                    segments={lastResult.flaggedSegments}
                    onSelectSegment={setSelectedSegment}
                    selectedSegmentId={selectedSegment?.id}
                  />
                )}

                {viewMode === 'redacted' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                      <span>Redacted & Masked Content:</span>
                      <button
                        onClick={handleCopySanitized}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied!' : 'Copy Sanitized Text'}</span>
                      </button>
                    </div>
                    <p className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
                      {lastResult.sanitizedText}
                    </p>
                  </div>
                )}

                {viewMode === 'diff' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                    <div className="p-3 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-semibold uppercase text-slate-400 mb-2">Original Text</div>
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{lastResult.inputText}</p>
                    </div>
                    <div className="p-3 rounded bg-slate-900 border border-emerald-900/40">
                      <div className="text-[11px] font-semibold uppercase text-emerald-400 mb-2">Enforced Sanitization</div>
                      <p className="text-emerald-100 whitespace-pre-wrap leading-relaxed">{lastResult.sanitizedText}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Remediation Advice Banner */}
              {lastResult.remediationAdvice && (
                <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs space-y-1">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Suggested Remediation for User:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {lastResult.remediationAdvice}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Safety Verdict & Policy Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          {/* Overall Verdict Card */}
          <div className={`rounded-xl border p-5 shadow-sm space-y-4 ${verdictMeta.bg}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-white/10">
                  {verdictMeta.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white tracking-tight">
                    {verdictMeta.label}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {verdictMeta.description}
                  </p>
                </div>
              </div>

              {lastResult && (
                <div className="text-right">
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {lastResult.overallRiskScore}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-300">
                    Risk Score
                  </span>
                </div>
              )}
            </div>

            {/* Recommended Action Pill */}
            {lastResult && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300">Enforcement Action:</span>
                <span className="font-mono uppercase font-bold text-white px-2 py-0.5 rounded bg-black/40 border border-white/15">
                  {lastResult.actionRecommended.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Category Safety Grid */}
          {lastResult && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider">
                  Category Risk Breakdown
                </span>
                <span className="text-slate-500 text-[11px]">Safety calibration</span>
              </div>

              <div className="space-y-2.5">
                {lastResult.categories.map((cat) => {
                  const percentage = Math.round(cat.score * 100);
                  const isViolation = cat.status === 'violation';
                  const isWarning = cat.status === 'warning';

                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                          {cat.label}
                          {cat.violationsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                              {cat.violationsCount} flag{cat.violationsCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </span>
                        <span className={`font-mono text-[11px] ${
                          isViolation ? 'text-rose-400 font-bold' :
                          isWarning ? 'text-amber-400 font-medium' : 'text-slate-400'
                        }`}>
                          {percentage}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isViolation ? 'bg-rose-500' :
                            isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(4, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Flagged Segments List */}
          {lastResult && lastResult.flaggedSegments.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider">
                  Policy Violations ({lastResult.flaggedSegments.length})
                </span>
                <span className="text-[11px] text-slate-500">Click to inspect</span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {lastResult.flaggedSegments.map((seg) => {
                  const isSelected = selectedSegment?.id === seg.id;
                  return (
                    <div
                      key={seg.id}
                      onClick={() => setSelectedSegment(seg)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-200 truncate">
                          {seg.ruleName}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          seg.severity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          seg.severity === 'high' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                          'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {seg.severity}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-baseline gap-1 text-slate-400">
                        <span className="text-slate-500 text-[11px]">Matched:</span>
                        <code className="px-1.5 py-0.5 rounded bg-slate-900 text-rose-300 font-mono text-[11px] border border-slate-800 max-w-[200px] truncate">
                          "{seg.text}"
                        </code>
                      </div>

                      <p className="mt-1.5 text-slate-400 leading-snug">
                        {seg.reason}
                      </p>

                      {seg.suggestedReplacement && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Enforced replacement:</span>
                          <code className="text-emerald-400 font-mono">
                            {seg.suggestedReplacement}
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
