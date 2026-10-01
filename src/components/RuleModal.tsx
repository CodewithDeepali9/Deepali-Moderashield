import React, { useState } from 'react';
import { 
  ModerationRule, 
  RuleCategory, 
  SeverityLevel, 
  EnforcementAction, 
  RuleEngineType 
} from '../types/moderation';
import { X, Plus, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: ModerationRule) => void;
  initialRule?: ModerationRule | null;
}

export const RuleModal: React.FC<RuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [category, setCategory] = useState<RuleCategory>(initialRule?.category || 'custom');
  const [severity, setSeverity] = useState<SeverityLevel>(initialRule?.severity || 'medium');
  const [action, setAction] = useState<EnforcementAction>(initialRule?.action || 'flag');
  const [type, setType] = useState<RuleEngineType>(initialRule?.type || 'hybrid');
  const [patterns, setPatterns] = useState<string[]>(initialRule?.patterns || ['']);
  const [guideline, setGuideline] = useState(initialRule?.guideline || '');
  const [patternInput, setPatternInput] = useState('');
  const [regexError, setRegexError] = useState<string | null>(null);

  const handleAddPattern = () => {
    if (!patternInput.trim()) return;

    if (type === 'regex') {
      try {
        new RegExp(patternInput.trim());
      } catch (err: any) {
        setRegexError(`Invalid regular expression: ${err.message}`);
        return;
      }
    }

    setRegexError(null);
    setPatterns([...patterns.filter(p => p.trim()), patternInput.trim()]);
    setPatternInput('');
  };

  const handleRemovePattern = (index: number) => {
    setPatterns(patterns.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !guideline.trim()) return;

    // Check all regex patterns if regex type
    if (type === 'regex') {
      for (const p of patterns) {
        try {
          new RegExp(p);
        } catch (err: any) {
          setRegexError(`Pattern "${p}" is invalid regex: ${err.message}`);
          return;
        }
      }
    }

    const rule: ModerationRule = {
      id: initialRule?.id || `rule_custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      severity,
      action,
      enabled: initialRule ? initialRule.enabled : true,
      type,
      patterns: patterns.filter(p => p.trim().length > 0),
      guideline: guideline.trim(),
      isDefault: initialRule?.isDefault ?? false,
    };

    onSave(rule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {initialRule ? 'Edit Moderation Rule' : 'Create New Moderation Rule'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define explicit guidelines, severity tier, and deterministic patterns.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto flex-1 pr-1">
          {/* Rule Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Competitor Brand Defamation / Unverified Medical Claims"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Summary Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short explanation for moderators and audit logs"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Category & Engine Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RuleCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="hate_speech">Hate Speech & Identity</option>
                <option value="harassment">Harassment & Hostility</option>
                <option value="pii">PII & Confidentiality</option>
                <option value="spam">Spam & Commercial Scams</option>
                <option value="profanity">Severe Profanity</option>
                <option value="violence">Violence & Physical Threats</option>
                <option value="impersonation">Staff Impersonation</option>
                <option value="custom">Custom Organizational Rule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Engine Evaluation Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RuleEngineType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="hybrid">Hybrid (Deterministic Patterns + Semantic AI)</option>
                <option value="semantic">Semantic AI (Context & Nuance Analysis)</option>
                <option value="regex">Regular Expression (Exact Pattern Match)</option>
                <option value="keyword">Keyword List (Exact Word Match)</option>
              </select>
            </div>
          </div>

          {/* Severity & Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Severity Level
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setSeverity(lvl)}
                    className={`py-1.5 text-xs font-semibold rounded capitalize transition-all ${
                      severity === lvl
                        ? lvl === 'critical' ? 'bg-rose-600 text-white' :
                          lvl === 'high' ? 'bg-orange-600 text-white' :
                          lvl === 'medium' ? 'bg-amber-600 text-white' :
                          'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Enforcement Action
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['flag', 'redact', 'block'] as const).map((act) => (
                  <button
                    type="button"
                    key={act}
                    onClick={() => setAction(act)}
                    className={`py-1.5 text-xs font-semibold rounded capitalize transition-all ${
                      action === act
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Policy Guideline Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Policy Guideline & Instructions *</span>
              <span className="text-[11px] text-slate-500 font-normal">Passed to AI Semantic Model</span>
            </label>
            <textarea
              required
              rows={3}
              value={guideline}
              onChange={(e) => setGuideline(e.target.value)}
              placeholder="Describe clearly what constitutes a violation, acceptable edge cases, and nuances to account for..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Pattern / Keyword inputs (if not purely semantic) */}
          {type !== 'semantic' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>{type === 'regex' ? 'Regex Patterns' : 'Keywords & Phrases'}</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {type === 'regex' ? 'Standard RegExp syntax' : 'Exact or boundary words'}
                </span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPattern();
                    }
                  }}
                  placeholder={type === 'regex' ? '\\b(?:promo|giveaway)\\b' : 'add word or phrase...'}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddPattern}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {regexError && (
                <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{regexError}</span>
                </div>
              )}

              {/* Pattern list */}
              {patterns.filter(p => p.trim().length > 0).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {patterns.filter(p => p.trim().length > 0).map((pat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono text-xs"
                    >
                      <span>{pat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePattern(idx)}
                        className="text-slate-500 hover:text-rose-400 ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              {initialRule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
