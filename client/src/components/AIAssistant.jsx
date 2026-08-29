import React, { useState } from 'react';
import { Sparkles, Send, Bot, Lightbulb, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const predefinedPrompts = [
    "Analyze Gurdaspur and Batala agent conversion performance",
    "Why are we losing international flight queries?",
    "Which previously active agents went dormant in August?",
    "Show top 10 agents giving queries but 0 bookings"
  ];

  const handleAskAI = async (queryText) => {
    const textToSubmit = queryText || prompt;
    if (!textToSubmit) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSubmit })
      });
      const json = await res.json();
      if (json.success) {
        setResponse(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="text-center border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-sky-950 to-indigo-950 border border-sky-800 text-sky-400 text-xs font-semibold rounded-full mb-3">
          <Sparkles className="w-4 h-4" /> Travelx Intelligence Engine
        </div>
        <h1 className="text-3xl font-extrabold text-white">AI Executive Marketing & Conversion Assistant</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          AI continuously analyzes your 700 agent database to uncover drop-off patterns, price sensitivity, and high-value dormant recovery targets.
        </p>
      </div>

      {/* Pre-built Prompt Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {predefinedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => { setPrompt(p); handleAskAI(p); }}
            className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left text-xs font-medium text-slate-300 transition flex items-center justify-between group"
          >
            <span>💡 "{p}"</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition group-hover:translate-x-1" />
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-2 shadow-2xl">
        <Bot className="w-5 h-5 text-sky-400 ml-2" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
          placeholder="Ask AI anything about agent conversion, lost reasons, territory performance..."
          className="flex-1 bg-transparent text-sm text-slate-100 focus:outline-none px-2"
        />
        <button
          onClick={() => handleAskAI()}
          disabled={loading || !prompt}
          className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center gap-2"
        >
          {loading ? 'Analyzing...' : <>Ask AI <Send className="w-4 h-4" /></>}
        </button>
      </div>

      {/* AI Analysis Response Card */}
      {response && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-800/60 rounded-2xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-sky-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" /> {response.title}
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Live Data Analysis</span>
          </div>

          <div className="space-y-3">
            {response.insights?.map((item, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-sm text-slate-200 leading-relaxed">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automated AI System Highlights */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" /> Automated System Recommendations
        </h3>
        
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-xl text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>15 agents were visited last week but have not generated any query.</strong> 6 of them showed high interest during physical visit and should be called by Pooja Rani today.
            </div>
          </div>

          <div className="p-3.5 bg-sky-950/20 border border-sky-900/40 rounded-xl text-sky-200 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong>International flight queries have the highest volume (84 queries) but lower conversion (38%).</strong> Competitor local wholesale rates account for 72% of lost quotes.
            </div>
          </div>

          <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong>ABC Travels (Gurdaspur) was active in June and July (₹3.8L revenue) but has zero queries in August.</strong> Recommended for personal follow-up by Field Executive Rahul Sharma.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
