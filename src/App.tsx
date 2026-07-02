/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkflowSummary } from './types';
import UploadStage from './components/UploadStage';
import AnalysisConsole from './components/AnalysisConsole';
import DashboardStage from './components/DashboardStage';
import { Activity, ShieldAlert, Layers } from 'lucide-react';

export default function App() {
  const [stage, setStage] = useState<'upload' | 'analyzing' | 'dashboard'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [zipFileName, setZipFileName] = useState('');
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setZipFileName(file.name);
    setStage('analyzing');
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Pipeline execution failed.');
      }

      const result: WorkflowSummary = await response.json();
      
      // Keep loader active briefly so user can read the agent logs rolling by on the console!
      setTimeout(() => {
        setSummary(result);
        setStage('dashboard');
        setIsAnalyzing(false);
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred during analysis.');
      setStage('upload');
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSummary(null);
    setZipFileName('');
    setStage('upload');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-tech-bg text-tech-dark flex flex-col font-sans selection:bg-tech-dark selection:text-tech-bg" id="app-root">
      
      {/* Header bar (Hidden when printing reports) */}
      <header className="border-b border-tech-dark bg-tech-bg sticky top-0 z-50 no-print" id="app-header-nav">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-tech-dark flex items-center justify-center text-tech-bg font-bold italic text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="text-[10px] text-tech-dark/60 font-mono tracking-wider block uppercase font-bold">Crack-AI Analysis Terminal // Ver. 4.02</span>
              <h1 className="text-xs font-bold uppercase tracking-widest text-tech-dark font-display">
                Structural Inspection System
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] opacity-60 uppercase font-mono font-bold">SESSION ID</span>
              <span className="font-mono text-xs font-bold text-tech-dark">#AZ-99812-B</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-tech-dark font-mono bg-tech-accent/40 border border-tech-dark px-3.5 py-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>SQL & BLOB CONNECTED</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        
        {/* Global Error Banner */}
        {errorMsg && (
          <div className="max-w-xl mx-auto mb-6 bg-rose-500/15 border-2 border-rose-500 rounded-none p-4 flex gap-3 text-sm text-rose-950 animate-fade-in" id="error-alert-banner">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-800" />
            <div>
              <h4 className="font-bold font-display uppercase tracking-wider text-rose-900 text-xs">Workflow Interrupted</h4>
              <p className="mt-1 text-xs font-mono text-rose-950/90 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Dynamic Ingestion Stages */}
        {stage === 'upload' && (
          <UploadStage onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        )}

        {stage === 'analyzing' && (
          <AnalysisConsole fileName={zipFileName} />
        )}

        {stage === 'dashboard' && summary && (
          <DashboardStage summary={summary} onReset={handleReset} />
        )}

      </main>

      {/* Footer bar */}
      <footer className="border-t border-tech-dark py-4 text-center text-[10px] text-tech-dark/60 font-mono uppercase font-bold no-print bg-tech-accent/20" id="app-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SYSTEM STATUS: READY // CLOUD SYNCHRONIZATION: SECURE</span>
          <span>© 2026 Structural Intelligence Systems • Powered by Gemini Vision & LangGraph logic</span>
        </div>
      </footer>
    </div>
  );
}
