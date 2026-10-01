import React, { useState } from 'react';
import { 
  BatchItem, 
  ModerationRule, 
  ModerationResult 
} from '../types/moderation';
import { INITIAL_BATCH_ITEMS } from '../utils/sampleData';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  Plus, 
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Clock,
  User,
  Filter
} from 'lucide-react';

interface BatchQueueProps {
  rules: ModerationRule[];
  onModerateSingle: (text: string) => Promise<ModerationResult>;
  onInspectItem: (text: string, result?: ModerationResult) => void;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  rules,
  onModerateSingle,
  onInspectItem
}) => {
  const [items, setItems] = useState<BatchItem[]>(INITIAL_BATCH_ITEMS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newItemText, setNewItemText] = useState('');
  const [newItemAuthor, setNewItemAuthor] = useState('');
  const [newItemContext, setNewItemContext] = useState<BatchItem['context']>('forum_comment');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Run batch analysis sequentially with animation
  const handleRunBatch = async () => {
    setIsProcessing(true);
    setProgress(0);

    const pendingIndices = items
      .map((item, idx) => (item.status === 'pending' || !item.result ? idx : -1))
      .filter(idx => idx !== -1);

    if (pendingIndices.length === 0) {
      setIsProcessing(false);
      return;
    }

    const updated = [...items];

    for (let i = 0; i < pendingIndices.length; i++) {
      const idx = pendingIndices[i];
      updated[idx].status = 'analyzing';
      setItems([...updated]);

      try {
        const result = await onModerateSingle(updated[idx].text);
        updated[idx].result = result;
        if (result.verdict === 'APPROVED') {
          updated[idx].status = 'approved';
        } else if (result.verdict === 'FLAGGED') {
          updated[idx].status = 'flagged';
        } else {
          updated[idx].status = 'rejected';
        }
      } catch (err) {
        console.error('Batch item error:', err);
      }

      setProgress(Math.round(((i + 1) / pendingIndices.length) * 100));
      setItems([...updated]);
    }

    setIsProcessing(false);
  };

  // Moderator manual actions
  const handleItemAction = (id: string, action: 'approved' | 'rejected') => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: action } : item));
  };

  // Bulk action: approve all safe
  const handleBulkApproveSafe = () => {
    setItems(prev => prev.map(item => {
      if (item.result && item.result.verdict === 'APPROVED') {
        return { ...item, status: 'approved' };
      }
      return item;
    }));
  };

  // Bulk action: reject all violations
  const handleBulkRejectViolations = () => {
    setItems(prev => prev.map(item => {
      if (item.result && (item.result.verdict === 'REJECTED' || item.result.verdict === 'CRITICAL')) {
        return { ...item, status: 'rejected' };
      }
      return item;
    }));
  };

  // Export audit report
  const handleExportAudit = () => {
    const csvRows = [
      ['ID', 'Author', 'Context', 'Timestamp', 'Status', 'RiskScore', 'Verdict', 'ViolationsCount', 'TextSnippet'].join(',')
    ];

    for (const item of items) {
      const row = [
        item.id,
        `"${item.author}"`,
        item.context,
        `"${item.timestamp}"`,
        item.status,
        item.result?.overallRiskScore ?? 'N/A',
        item.result?.verdict ?? 'PENDING',
        item.result?.flaggedSegments.length ?? 0,
        `"${item.text.replace(/"/g, '""').substring(0, 80)}"`
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moderation_queue_audit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add custom queue item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: BatchItem = {
      id: `batch_${Date.now()}`,
      author: newItemAuthor.trim() || 'anonymous_user',
      timestamp: 'just now',
      context: newItemContext,
      text: newItemText.trim(),
      status: 'pending'
    };

    setItems([newItem, ...items]);
    setNewItemText('');
    setNewItemAuthor('');
    setIsAddOpen(false);
  };

  const filteredItems = items.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <span>High-Volume Moderation Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real-time user comment feeds, support tickets, and batch moderation workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            <span>Add Post</span>
          </button>

          <button
            onClick={handleExportAudit}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRunBatch}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing ({progress}%)...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Process All Pending</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Item Drawer */}
      {isAddOpen && (
        <form onSubmit={handleAddItem} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3 animate-in fade-in duration-150">
          <div className="text-xs font-semibold text-indigo-300">
            Enqueue New User-Generated Text
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newItemAuthor}
              onChange={(e) => setNewItemAuthor(e.target.value)}
              placeholder="Author username (e.g. gamer_99)"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={newItemContext}
              onChange={(e) => setNewItemContext(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="forum_comment">Forum Comment</option>
              <option value="chat_message">Chat Message</option>
              <option value="product_review">Product Review</option>
              <option value="support_ticket">Support Ticket</option>
              <option value="user_bio">User Bio Profile</option>
            </select>
          </div>
          <textarea
            required
            rows={2}
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="User text content to enqueue..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
          />
          <div className="flex justify-end gap-2">
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
              Enqueue
            </button>
          </div>
        </form>
      )}

      {/* Filter and Bulk controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-500" />
            Filter:
          </span>
          {(['all', 'pending', 'approved', 'flagged', 'rejected'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleBulkApproveSafe}
            className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 text-[11px] font-medium transition-colors"
          >
            Approve Safe Items
          </button>
          <button
            onClick={handleBulkRejectViolations}
            className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-[11px] font-medium transition-colors"
          >
            Reject Flagged Items
          </button>
        </div>
      </div>

      {/* Queue items list */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const res = item.result;
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-all ${
                item.status === 'approved' ? 'bg-slate-900/80 border-slate-800/80' :
                item.status === 'rejected' ? 'bg-rose-950/20 border-rose-900/40' :
                item.status === 'flagged' ? 'bg-amber-950/20 border-amber-900/40' :
                'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                {/* User & Context metadata */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.author} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-xs">{item.author}</span>
                      <span className="text-[11px] text-slate-500 font-mono">· {item.timestamp}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] uppercase font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        {item.context.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-200 text-xs md:text-sm mt-1 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>

                {/* Status & Verdict Metrics */}
                <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                  {res && (
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          res.verdict === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          res.verdict === 'FLAGGED' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {res.verdict}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-300">
                          {res.overallRiskScore}%
                        </span>
                      </div>

                      {res.flaggedSegments.length > 0 && (
                        <span className="text-[10px] text-rose-400 block mt-0.5">
                          {res.flaggedSegments.length} violation{res.flaggedSegments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onInspectItem(item.text, item.result)}
                      className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                      title="Inspect with Full Analysis"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleItemAction(item.id, 'approved')}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        item.status === 'approved'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'border-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-400'
                      }`}
                      title="Approve Post"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleItemAction(item.id, 'rejected')}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        item.status === 'rejected'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'border-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400'
                      }`}
                      title="Reject Post"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* If violations found, show small pills */}
              {res && res.flaggedSegments.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500">Flags:</span>
                  {res.flaggedSegments.map((seg, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-rose-300 border border-rose-900/60 font-mono text-[10px]">
                      {seg.ruleName}: "{seg.text.length > 20 ? seg.text.substring(0, 20) + '...' : seg.text}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <p className="text-slate-400 text-sm">No items in the queue match the current filter.</p>
        </div>
      )}
    </div>
  );
};
