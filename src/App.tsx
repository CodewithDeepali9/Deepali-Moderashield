/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ModerationRule, 
  ModerationResult 
} from './types/moderation';
import { DEFAULT_RULES } from './utils/defaultRules';
import { generateHeuristicModerationResult } from './utils/patternMatcher';
import { Header, ActiveTab } from './components/Header';
import { LiveInspector } from './components/LiveInspector';
import { RuleStudio } from './components/RuleStudio';
import { BatchQueue } from './components/BatchQueue';
import { TestPlayground } from './components/TestPlayground';
import { ApiIntegration } from './components/ApiIntegration';
import { RuleModal } from './components/RuleModal';

const STORAGE_KEY_RULES = 'moderashield_custom_rules_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inspector');
  const [strictness, setStrictness] = useState<'lenient' | 'standard' | 'strict'>('standard');
  const [geminiConnected, setGeminiConnected] = useState<boolean>(true);
  const [lastResult, setLastResult] = useState<ModerationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);

  // Initialize rules from localStorage or default
  const [rules, setRules] = useState<ModerationRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load rules from localStorage', e);
    }
    return DEFAULT_RULES;
  });

  // Persist rules
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
    } catch (e) {
      console.warn('Failed to save rules to localStorage', e);
    }
  }, [rules]);

  // Check health of Gemini backend service on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setGeminiConnected(data.geminiEnabled);
        }
      })
      .catch(() => {
        setGeminiConnected(false);
      });
  }, []);

  // Primary moderation function
  const handleModerate = async (text: string): Promise<ModerationResult> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          rules,
          strictness
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result: ModerationResult = await response.json();
      setLastResult(result);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.warn('Backend call failed, using client-side fallback engine:', err);
      // Fallback seamlessly to local deterministic engine
      const fallbackResult = generateHeuristicModerationResult(text, rules);
      setLastResult(fallbackResult);
      setIsLoading(false);
      return fallbackResult;
    }
  };

  // Inspect item from batch queue in inspector tab
  const handleInspectItem = (text: string, result?: ModerationResult) => {
    if (result) {
      setLastResult(result);
    } else {
      handleModerate(text);
    }
    setActiveTab('inspector');
  };

  const activeRulesCount = rules.filter(r => r.enabled).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRulesCount={activeRulesCount}
        totalRulesCount={rules.length}
        strictness={strictness}
        setStrictness={setStrictness}
        geminiConnected={geminiConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inspector' && (
          <LiveInspector
            rules={rules}
            onModerate={handleModerate}
            lastResult={lastResult}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'rules' && (
          <RuleStudio
            rules={rules}
            setRules={setRules}
            onOpenCreateRule={() => {
              setEditingRule(null);
              setIsRuleModalOpen(true);
            }}
            onEditRule={(rule) => {
              setEditingRule(rule);
              setIsRuleModalOpen(true);
            }}
          />
        )}

        {activeTab === 'queue' && (
          <BatchQueue
            rules={rules}
            onModerateSingle={handleModerate}
            onInspectItem={handleInspectItem}
          />
        )}

        {activeTab === 'tests' && (
          <TestPlayground
            rules={rules}
            onModerateSingle={handleModerate}
          />
        )}

        {activeTab === 'api' && (
          <ApiIntegration
            rules={rules}
            onModerateSingle={handleModerate}
          />
        )}
      </main>

      {/* Rule Create/Edit Modal */}
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => {
          setIsRuleModalOpen(false);
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
}
