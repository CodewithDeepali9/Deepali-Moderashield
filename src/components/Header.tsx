import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  FileText, 
  ListFilter, 
  CheckCircle2, 
  Code2
} from 'lucide-react';

export type ActiveTab = 'inspector' | 'rules' | 'queue' | 'tests' | 'api';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeRulesCount: number;
  totalRulesCount: number;
  strictness: 'lenient' | 'standard' | 'strict';
  setStrictness: (val: 'lenient' | 'standard' | 'strict') => void;
  geminiConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeRulesCount,
  totalRulesCount,
  strictness,
  setStrictness,
  geminiConnected
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">ModeraShield</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Content Moderation & Rule Enforcement Engine
              </p>
            </div>
          </div>

          {/* Engine Status & Sensitivity Control */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${geminiConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
                <span className="text-slate-300 font-medium">{geminiConnected ? 'Gemini 3.8 Flash' : 'Deterministic Hybrid'}</span>
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>{activeRulesCount} of {totalRulesCount} Rules Active</span>
            </div>

            {/* Strictness selector */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
              <span className="px-2 py-1 text-slate-400 font-medium hidden lg:inline">Sensitivity:</span>
              {(['lenient', 'standard', 'strict'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setStrictness(level)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-all ${
                    strictness === level
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 -mb-px overflow-x-auto no-scrollbar border-t border-slate-800/60 pt-1">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'inspector'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Live Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Rule Studio</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {activeRulesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'queue'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ListFilter className="h-4 w-4" />
            <span>Batch Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'tests'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Rule Test Suite</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'api'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>API & Webhook</span>
          </button>
        </div>
      </div>
    </header>
  );
};
