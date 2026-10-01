import React, { useState } from 'react';
import { 
  ModerationRule, 
  RuleCategory 
} from '../types/moderation';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Check, 
  Sliders, 
  Cpu, 
  ShieldAlert, 
  ShieldCheck,
  FileCode,
  Tag
} from 'lucide-react';
import { DEFAULT_RULES } from '../utils/defaultRules';
import { RuleModal } from './RuleModal';

interface RuleStudioProps {
  rules: ModerationRule[];
  setRules: React.Dispatch<React.SetStateAction<ModerationRule[]>>;
  onOpenCreateRule: () => void;
  onEditRule: (rule: ModerationRule) => void;
}

export const RuleStudio: React.FC<RuleStudioProps> = ({
  rules,
  setRules,
  onOpenCreateRule,
  onEditRule
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toggle rule enabled/disabled
  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this moderation rule?')) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (confirm('Reset all rules back to standard default policies?')) {
      setRules(DEFAULT_RULES);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `moderashield_rules_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setRules(parsed);
          alert(`Successfully imported ${parsed.length} rules.`);
        }
      } catch (err) {
        alert('Failed to parse rule JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtering
  const filteredRules = rules.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.guideline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patterns.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All Rules' },
    { id: 'hate_speech', label: 'Hate Speech' },
    { id: 'harassment', label: 'Harassment' },
    { id: 'pii', label: 'PII & Security' },
    { id: 'spam', label: 'Spam & Scams' },
    { id: 'profanity', label: 'Profanity' },
    { id: 'violence', label: 'Violence' },
    { id: 'impersonation', label: 'Impersonation' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-400" />
            <span>Policy & Rule Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure automated enforcement thresholds, deterministic patterns, and semantic policy instructions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors">
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Reset to factory rules"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => {
              setEditingRule(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, keywords, regex..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`rounded-xl border transition-all p-5 flex flex-col justify-between ${
                rule.enabled
                  ? 'bg-slate-900/90 border-slate-800 shadow-sm'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Header line: Title & Switch */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-sm tracking-tight">
                        {rule.name}
                      </h3>
                      {rule.isDefault && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          [Standard]
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.enabled ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        rule.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Badges line: Category, Severity, Action, Engine */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium capitalize">
                    {rule.category.replace('_', ' ')}
                  </span>

                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                    rule.severity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    rule.severity === 'high' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                    rule.severity === 'medium' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-sky-950 text-sky-300 border border-sky-800'
                  }`}>
                    {rule.severity}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono uppercase">
                    Action: {rule.action}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 font-mono capitalize">
                    {rule.type}
                  </span>
                </div>

                {/* Policy guideline box */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Guideline Policy:
                  </span>
                  <p className="leading-snug text-slate-400">
                    {rule.guideline}
                  </p>
                </div>

                {/* Patterns or Keywords snippet */}
                {rule.patterns.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Active Patterns ({rule.patterns.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                      {rule.patterns.slice(0, 5).map((p, i) => (
                        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono truncate max-w-[200px]">
                          {p}
                        </code>
                      ))}
                      {rule.patterns.length > 5 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{rule.patterns.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Rule ID: <span className="font-mono">{rule.id}</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                    title="Edit Rule"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <p className="text-slate-400 text-sm">No rules match the current search or category filter.</p>
        </div>
      )}

      {/* Modal */}
      <RuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        initialRule={editingRule}
        onSave={(savedRule) => {
          setRules(prev => {
            const exists = prev.some(r => r.id === savedRule.id);
            if (exists) {
              return prev.map(r => r.id === savedRule.id ? savedRule : r);
            }
            return [savedRule, ...prev];
          });
        }}
      />
    </div>
  );
};
