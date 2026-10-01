import React, { useState } from 'react';
import { ModerationRule, ModerationResult } from '../types/moderation';
import { 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  Play, 
  Server, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';

interface ApiIntegrationProps {
  rules: ModerationRule[];
  onModerateSingle: (text: string) => Promise<ModerationResult>;
}

export const ApiIntegration: React.FC<ApiIntegrationProps> = ({
  rules,
  onModerateSingle
}) => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [testPayload, setTestPayload] = useState('Hey check out this crypto giveaway: bit.ly/free-tokens');
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sampleCurl = `curl -X POST "${window.location.origin}/api/moderate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "${testPayload.replace(/"/g, '\\"')}",
    "strictness": "standard"
  }'`;

  const sampleJs = `// Node.js or Browser fetch
const response = await fetch('${window.location.origin}/api/moderate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "${testPayload.replace(/"/g, '\\"')}",
    strictness: "standard"
  })
});

const moderationResult = await response.json();
console.log(moderationResult.verdict, moderationResult.sanitizedText);`;

  const samplePython = `import requests

url = "${window.location.origin}/api/moderate"
payload = {
    "text": """${testPayload}""",
    "strictness": "standard"
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Verdict:", data["verdict"])
print("Sanitized:", data["sanitizedText"])`;

  const jsonSchema = `{
  "id": "string",
  "verdict": "APPROVED" | "FLAGGED" | "REJECTED" | "CRITICAL",
  "overallRiskScore": "number (0-100)",
  "actionRecommended": "allow" | "manual_review" | "auto_redact" | "block_and_notify",
  "flaggedSegments": [
    {
      "startIndex": "number",
      "endIndex": "number",
      "text": "string",
      "ruleName": "string",
      "category": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "reason": "string",
      "suggestedReplacement": "string"
    }
  ],
  "categories": [
    {
      "category": "string",
      "score": "number (0.0 to 1.0)",
      "status": "safe" | "warning" | "violation"
    }
  ],
  "sanitizedText": "string",
  "remediationAdvice": "string"
}`;

  const handleTestApi = async () => {
    setIsLoading(true);
    try {
      const res = await onModerateSingle(testPayload);
      setLiveResponse(res);
    } catch (err: any) {
      setLiveResponse({ error: err.message || 'API request failed' });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, type: 'curl' | 'js' | 'schema') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'js') {
      setCopiedJs(true);
      setTimeout(() => setCopiedJs(false), 2000);
    } else {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Code2 className="h-5 w-5 text-indigo-400" />
          <span>Developer API & Integration Sandbox</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Integrate ModeraShield into user signup forms, live chat websockets, product review endpoints, and forum post webhooks.
        </p>
      </div>

      {/* Grid: Snippets & Interactive Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Snippets */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
            {/* Header Tabs */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">API Request Snippets</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                {(['curl', 'js', 'python'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSnippetTab(tab)}
                    className={`px-2.5 py-1 rounded font-medium uppercase font-mono text-[11px] transition-colors ${
                      activeSnippetTab === tab
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 relative bg-slate-950/90 font-mono text-xs overflow-x-auto text-slate-200 leading-relaxed">
              <button
                onClick={() => copyToClipboard(
                  activeSnippetTab === 'curl' ? sampleCurl : activeSnippetTab === 'js' ? sampleJs : samplePython,
                  activeSnippetTab === 'curl' ? 'curl' : 'js'
                )}
                className="absolute right-3 top-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy snippet"
              >
                {copiedCurl || copiedJs ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              <pre className="pr-10">
                {activeSnippetTab === 'curl' && sampleCurl}
                {activeSnippetTab === 'js' && sampleJs}
                {activeSnippetTab === 'python' && samplePython}
              </pre>
            </div>
          </div>

          {/* JSON Schema */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Moderation Response Schema</span>
              </div>
              <button
                onClick={() => copyToClipboard(jsonSchema, 'schema')}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center gap-1"
              >
                {copiedSchema ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span className="text-[11px]">{copiedSchema ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950/90 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed max-h-64">
              <pre>{jsonSchema}</pre>
            </div>
          </div>
        </div>

        {/* Right Column: Live Endpoint Tester */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                Live API Sandbox
              </span>
              <span className="text-[11px] font-mono text-emerald-400">POST /api/moderate</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                JSON Request Body Payload:
              </label>
              <textarea
                rows={3}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                placeholder="Enter string to test API response..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <button
              onClick={handleTestApi}
              disabled={isLoading || !testPayload.trim()}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing POST request...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Send Request to /api/moderate</span>
                </>
              )}
            </button>

            {liveResponse && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Live JSON Response:</span>
                  <span className="font-mono text-emerald-400">HTTP 200 OK</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-300">
                  <pre>{JSON.stringify(liveResponse, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
