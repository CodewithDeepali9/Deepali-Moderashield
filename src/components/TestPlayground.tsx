import React, { useState } from 'react';
import { 
  RuleTestCase, 
  ModerationRule, 
  ModerationResult 
} from '../types/moderation';
import { DEFAULT_TEST_CASES } from '../utils/defaultRules';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Plus, 
  Check, 
  Sparkles, 
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface TestPlaygroundProps {
  rules: ModerationRule[];
  onModerateSingle: (text: string) => Promise<ModerationResult>;
}

interface TestRunResult {
  testId: string;
  actualVerdict: 'VIOLATION' | 'SAFE';
  passed: boolean;
  score: number;
  executionTimeMs: number;
  flaggedRules: string[];
}

export const TestPlayground: React.FC<TestPlaygroundProps> = ({
  rules,
  onModerateSingle
}) => {
  const [testCases, setTestCases] = useState<RuleTestCase[]>(DEFAULT_TEST_CASES);
  const [results, setResults] = useState<Record<string, TestRunResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New test case fields
  const [newRuleId, setNewRuleId] = useState(rules[0]?.id || 'rule_custom');
  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState<'VIOLATION' | 'SAFE'>('VIOLATION');
  const [newNote, setNewNote] = useState('');

  const handleRunAllTests = async () => {
    setIsRunning(true);
    const newResults: Record<string, TestRunResult> = {};

    for (const tc of testCases) {
      const startTime = performance.now();
      try {
        const modResult = await onModerateSingle(tc.input);
        const isViolation = modResult.verdict !== 'APPROVED';
        const actualVerdict: 'VIOLATION' | 'SAFE' = isViolation ? 'VIOLATION' : 'SAFE';
        const passed = actualVerdict === tc.expectedVerdict;

        newResults[tc.id] = {
          testId: tc.id,
          actualVerdict,
          passed,
          score: modResult.overallRiskScore,
          executionTimeMs: Math.round(performance.now() - startTime),
          flaggedRules: modResult.flaggedSegments.map(s => s.ruleName)
        };
      } catch (err) {
        newResults[tc.id] = {
          testId: tc.id,
          actualVerdict: 'SAFE',
          passed: false,
          score: 0,
          executionTimeMs: 0,
          flaggedRules: []
        };
      }
      setResults({ ...newResults });
    }

    setIsRunning(false);
  };

  const handleAddTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInput.trim()) return;

    const matchedRule = rules.find(r => r.id === newRuleId);
    const newCase: RuleTestCase = {
      id: `tc_${Date.now()}`,
      ruleId: newRuleId,
      ruleName: matchedRule ? matchedRule.name : 'Custom Policy',
      input: newInput.trim(),
      expectedVerdict: newExpected,
      note: newNote.trim() || 'Custom test case validation.'
    };

    setTestCases([...testCases, newCase]);
    setNewInput('');
    setNewNote('');
    setIsAddOpen(false);
  };

  const completedCount = Object.keys(results).length;
  const passedCount = Object.values(results).filter(r => r.passed).length;
  const accuracy = completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            <span>Rule Quality & Regression Test Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Validate policy boundaries, prevent false-positives on benign text, and guarantee rule precision.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            <span>Add Test Case</span>
          </button>

          <button
            onClick={handleRunAllTests}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Suite...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Run All Tests ({testCases.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Accuracy & Score Gauge */}
      {completedCount > 0 && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${accuracy! >= 80 ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' : 'bg-amber-950/60 border-amber-800 text-amber-400'}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Test Suite Accuracy</div>
              <div className="text-xl font-bold text-white font-mono">
                {accuracy}% <span className="text-xs text-slate-400 font-normal">({passedCount} / {completedCount} passed)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300">{passedCount} Passed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="text-slate-300">{completedCount - passedCount} Failed</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Test Case Form */}
      {isAddOpen && (
        <form onSubmit={handleAddTestCase} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3 animate-in fade-in duration-150">
          <div className="text-xs font-semibold text-indigo-300">
            Define New Rule Test Assertion
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Target Rule</label>
              <select
                value={newRuleId}
                onChange={(e) => setNewRuleId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {rules.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Expected Outcome</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewExpected('VIOLATION')}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    newExpected === 'VIOLATION'
                      ? 'bg-rose-950 text-rose-300 border-rose-800 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Must Violate
                </button>
                <button
                  type="button"
                  onClick={() => setNewExpected('SAFE')}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    newExpected === 'SAFE'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Must Pass (Safe)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Test Input Text</label>
            <textarea
              required
              rows={2}
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              placeholder="Enter synthetic or real comment to test against policy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Objective / Notes</label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g., Verify benign serial number is not flagged as SSN"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Add Test
            </button>
          </div>
        </form>
      )}

      {/* Test cases list */}
      <div className="space-y-3">
        {testCases.map((tc, index) => {
          const runRes = results[tc.id];
          return (
            <div
              key={tc.id}
              className={`rounded-xl border p-4 transition-all ${
                runRes ? (
                  runRes.passed ? 'bg-slate-900/80 border-emerald-900/40' : 'bg-rose-950/20 border-rose-800/60'
                ) : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{index + 1}</span>
                    <span className="font-semibold text-xs text-slate-200">{tc.ruleName}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${
                      tc.expectedVerdict === 'VIOLATION'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      Expect: {tc.expectedVerdict}
                    </span>
                  </div>

                  <p className="text-slate-200 text-xs font-sans mt-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    "{tc.input}"
                  </p>

                  <p className="text-[11px] text-slate-400 italic">
                    Note: {tc.note}
                  </p>
                </div>

                {/* Outcome Indicator */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {runRes ? (
                    <div className="flex items-center gap-2">
                      {runRes.passed ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>PASSED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800">
                          <XCircle className="h-4 w-4" />
                          <span>FAILED (Got {runRes.actualVerdict})</span>
                        </div>
                      )}

                      <span className="text-[11px] text-slate-400 font-mono">
                        {runRes.executionTimeMs}ms
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">Not executed</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
