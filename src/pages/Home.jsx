import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Rss,
  Database,
  FileText,
  XCircle,
  CheckCircle2,
  Share2,
  RotateCcw,
  Train,
  ShieldCheck
} from 'lucide-react';

/* --- CUSTOM STYLES --- */
const styles = `
  .glass-panel {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .train-gradient {
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  }
`;

/* --------------------------------------------------------
   NORMALIZER (keeps dynamic LLM output clean & consistent)
--------------------------------------------------------- */
function normalizeLLMOutput(raw = {}, inputClaim = '') {
  return {
    claim: inputClaim,
    verdict: raw.verdict || 'unverified',
    confidence: raw.confidence || 0.5,
    category: raw.category || 'general',
    explanation: {
      general: raw.explanation?.general || "No explanation provided.",
      kids: raw.explanation?.kids || null,
      elderly: raw.explanation?.elderly || null
    },
    sources: raw.sources || []
  };
}

/* --------------------------------------------------------
   SIMULATED LLM (Replace this later with your real API)
--------------------------------------------------------- */
function fetchSimulatedLLM(claimText) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        verdict: Math.random() < 0.5 ? "false" : "true",
        confidence: +(0.75 + Math.random() * 0.2).toFixed(2),
        category: "Politics",
        explanation: {
          general: "Cross-checking official sources suggests the claim is inaccurate.",
          kids: "Don't worry buddy! This message looks fake.",
          elderly: "After comparison with official sources, this information appears unreliable."
        },
        sources: [
          { title: "Mumbai Airport RSS", status: "Contradicts Claim", time: "Live" },
          { title: "NDMA Weather", status: "No Active Alerts", time: "Live" }
        ]
      });
    }, 900);
  });
}
export default function Home() {
  const [status, setStatus] = useState('idle'); 
  const [claim, setClaim] = useState('');
  const [resultTab, setResultTab] = useState('general');
  const [currentStep, setCurrentStep] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Verification Pipeline Steps
  const steps = [
    { id: 1, text: 'Extracting keywords (NLP)...', icon: Search },
    { id: 2, text: 'Scanning Mumbai RSS Feeds...', icon: Rss },
    { id: 3, text: 'Comparing with Official Datasets...', icon: Database },
    { id: 4, text: 'Synthesizing Final Verdict...', icon: FileText }
  ];

  /* ---------------------------------------------------------
     PROCESSING PIPELINE + CALLING LLM + NORMALIZATION
  --------------------------------------------------------- */
  useEffect(() => {
    if (status !== 'processing') return;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);

      if (step >= steps.length) {
        clearInterval(interval);

        (async () => {
          const raw = await fetchSimulatedLLM(claim);
          const normalized = normalizeLLMOutput(raw, claim);
          setResultData(normalized);
          setResultTab('general');
          setStatus('complete');
          saveClaimToDB(normalized);
        })();
      }
    }, 900);

    return () => clearInterval(interval);
  }, [status, claim]);

  /* ---------------------------------------------------------
     SAVE RESULT TO JSON-SERVER (db.json)
  --------------------------------------------------------- */
  async function saveClaimToDB(normalized) {
    setSaving(true);
    try {
      await fetch("http://localhost:4000/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...normalized,
          createdAt: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error("DB Save Error:", e);
    }
    setSaving(false);
  }

  /* ---------------------------------------------------------
     COPY FORMATTED VERDICT MESSAGE
  --------------------------------------------------------- */
  const buildFullVerdictMessage = (data, audience = 'general') => {
    return [
      `Claim: "${data.claim}"`,
      `Verdict: ${data.verdict.toUpperCase()} (${Math.round(data.confidence * 100)}% confident)`,
      `Category: ${data.category}`,
      ``,
      `Explanation (${audience}):`,
      data.explanation[audience] || data.explanation.general,
      ``,
      'Verified sources:',
      ...(data.sources.length
        ? data.sources.map(s => `- ${s.title} — ${s.status} (${s.time})`)
        : ['- No sources available']),
      ``,
      `Checked on ${new Date().toLocaleString()}`
    ].join("\n");
  };

  const handleCopyVerdict = async () => {
    if (!resultData) return;
    await navigator.clipboard.writeText(buildFullVerdictMessage(resultData, resultTab));
    alert("Verdict copied to clipboard!");
  };

  const handleReset = () => {
    setStatus('idle');
    setClaim('');
    setCurrentStep(0);
    setResultData(null);
    setResultTab('general');
  };
    return (
    <div className="min-h-screen text-white font-sans selection:bg-red-500/30 overflow-x-hidden relative">
      <style>{styles}</style>

      <div className="relative flex flex-col min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-2xl">

            {/* ------------------------- */}
            {/* IDLE STATE HEADER */}
            {/* ------------------------- */}
            {status === 'idle' && (
              <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className='text-6xl text-cyan-400 font-extrabold pb-8'>TruthPulse</h1>
                <h3 className="text-3xl md:text-5xl font-extrabold font-mono mb-3 text-white tracking-tight">
                  Verify your <span className="text-yellow-500">Claim.</span>
                </h3>
                <p className="text-slate-400 text-lg">AI-powered instant claim verification.</p>
              </div>
            )}

            {/* ------------------------- */}
            {/* MAIN GLASS CARD */}
            {/* ------------------------- */}
            <div className="backdrop-blur-md bg-white/10 border border-white/30 shadow-lg rounded-3xl overflow-hidden transition-all duration-500 relative">

              {/* --------------------------------------------------- */}
              {/* STATE 1 — IDLE (User Input Area) */}
              {/* --------------------------------------------------- */}
              {status === 'idle' && (
                <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-500">

                  {/* Claim Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-yellow-200 uppercase tracking-wider ml-1">
                      Type your Claim
                    </label>

                    <div className="relative group mt-2">
                      <textarea
                        value={claim}
                        onChange={(e) => setClaim(e.target.value)}
                        placeholder="e.g. 'Trains cancelled due to heavy rain…'"
                        className="w-full h-40 bg-slate-900/60 border border-slate-700 rounded-xl p-5 text-lg text-white placeholder-slate-600 
                                   focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none transition-all group-hover:border-slate-600"
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono">
                        {claim.length} chars
                      </div>
                    </div>
                  </div>

                  {/* Verify Button */}
                  <button
                    onClick={() => claim && setStatus('processing')}
                    disabled={!claim}
                    className={`w-full py-4 rounded-xl font-bold text-lg tracking-wider 
                                flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]
                                ${
                                  claim
                                    ? 'train-gradient text-white shadow-xl shadow-red-900/30 hover:brightness-110'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                }`}
                  >
                    <Train className="w-5 h-5" />
                    {claim ? 'VERIFY NOW' : 'ENTER CLAIM'}
                  </button>
                </div>
              )}


              {/* --------------------------------------------------- */}
              {/* STATE 2 — PROCESSING */}
              {/* --------------------------------------------------- */}
              {status === 'processing' && (
                <div className="p-8 md:p-12 min-h-[500px] flex flex-col justify-center items-center animate-in fade-in zoom-in-95 duration-500">

                  <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
                    <Activity className="w-16 h-16 text-red-500 animate-bounce relative z-10" />
                  </div>

                  <h3 className="text-2xl font-bold text-center mb-10 text-white">
                    Processing Pipeline...
                  </h3>

                  <div className="space-y-6 w-full max-w-sm">
                    {steps.map((step, index) => {
                      const isCompleted = index < currentStep;
                      const isActive = index === currentStep;

                      return (
                        <div key={step.id}
                          className={`flex items-center gap-4 transition-all duration-500 
                            ${isActive || isCompleted ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-4'}`}
                        >
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-300
                            ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                              isActive ? 'bg-transparent border-red-500 text-red-500 animate-spin' :
                                'border-slate-700 text-slate-700'}
                          `}>
                            {isCompleted ? <CheckCircle2 size={16} /> : <step.icon size={14} />}
                          </div>

                          <span className={`font-medium 
                            ${isActive ? 'text-red-400' : isCompleted ? 'text-green-400' : 'text-slate-600'}`}>
                            {step.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* --------------------------------------------------- */}
              {/* STATE 3 — VERDICT (Your original UI restored) */}
              {/* --------------------------------------------------- */}
              {status === 'complete' && resultData && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-900/80">

                  {/* VERDICT HEADER */}
                  <div
                    className={`${
                      resultData.verdict === "true"
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    } border-b p-8 text-center relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

                    {/* ICON */}
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-2xl ring-4 scale-110
                        ${
                          resultData.verdict === "true"
                            ? "bg-green-600 text-white shadow-green-600/30 ring-green-500/20"
                            : "bg-red-600 text-white shadow-red-600/30 ring-red-500/20"
                        }`}
                    >
                      {resultData.verdict === "true" ? (
                        <CheckCircle2 size={44} />
                      ) : (
                        <XCircle size={44} />
                      )}
                    </div>

                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                      {String(resultData.verdict).toUpperCase()} CLAIM
                    </h2>

                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          resultData.verdict === "true" ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>

                      <p
                        className={`font-medium text-sm tracking-wide ${
                          resultData.verdict === "true" ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        CONFIDENCE SCORE: {Math.round(resultData.confidence * 100)}%
                      </p>
                    </div>
                  </div>



                  {/* EXPLANATION TABS (YOUR ORIGINAL STYLE) */}
                  <div className="p-6 md:p-8 space-y-6">

                    <div className="bg-slate-950/50 rounded-2xl p-1 border border-white/5 flex gap-1">
                      {['kids', 'general', 'elderly'].map(t => (
                        <button key={t}
                          onClick={() => setResultTab(t)}
                          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all
                            ${resultTab === t ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* EXPLANATION BOX */}
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 relative">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 min-w-[24px]">
                          <ShieldCheck className="text-green-500" size={24} />
                        </div>

                        <p className="text-lg leading-relaxed text-slate-200">
                          "{resultData.explanation[resultTab] || resultData.explanation.general}"
                        </p>
                      </div>
                    </div>


                    {/* SOURCES */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                        Sources Verified
                      </h4>

                      <div className="grid gap-2">
                        {resultData.sources.map((s, i) => (
                          <SourceCard key={i}
                            title={s.title}
                            status={s.status}
                            time={s.time}
                            color={s.status?.toLowerCase().includes("contradict") ? "red" : "blue"}
                          />
                        ))}
                      </div>
                    </div>


                    {/* ACTION BUTTONS */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <button
                        onClick={handleReset}
                        className="py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 
                                   flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        <RotateCcw size={16} /> Check Another
                      </button>

                      <button
                        onClick={handleCopyVerdict}
                        className="py-3.5 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white 
                                   flex items-center justify-center gap-2 transition-colors shadow-lg 
                                   shadow-green-900/20 text-sm"
                      >
                        <Share2 size={16} /> Copy Full Verdict
                      </button>
                    </div>

                    {saving && (
                      <div className="text-xs text-slate-400 text-right">
                        Saving verdict to database...
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------ */
/* SOURCE CARD COMPONENT */
/* ------------------------------------------ */
function SourceCard({ title, status, time, color }) {
  return (
    <div className={`p-3 rounded-r-lg border-l-[3px] 
      ${color === "red" ? "border-l-red-500" : "border-l-blue-500"} 
      bg-white/5 flex justify-between items-center`}>
      <div>
        <h4 className="font-semibold text-slate-200 text-sm">{title}</h4>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{time}</p>
      </div>
      <div className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 
        ${color === "red" ? "text-red-400" : "text-blue-400"}`}>
        {status}
      </div>
    </div>
  );
}
