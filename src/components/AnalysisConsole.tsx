import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Shield, Scaling, Ruler, Activity, FileText, Loader2 } from 'lucide-react';

interface AnalysisConsoleProps {
  fileName: string;
}

export default function AnalysisConsole({ fileName }: AnalysisConsoleProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeAgent, setActiveAgent] = useState<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const steps = [
    { text: "Reading uploaded ZIP archive...", duration: 600, agent: 0 },
    { text: "Decompressing ZIP content and locating images...", duration: 800, agent: 0 },
    { text: "Initializing multi-agent graph architecture...", duration: 600, agent: 0 },
    { text: "Executing [Detect Agent] on batch files...", duration: 1500, agent: 1 },
    { text: "Localizing crack segments and contour coordinates...", duration: 1000, agent: 1 },
    { text: "Executing [Area Agent] to calculate pixel density...", duration: 1200, agent: 2 },
    { text: "Applying physical calibration scale: 1px = 0.1mm...", duration: 800, agent: 2 },
    { text: "Executing [Measurement Agent] for dimensional details...", duration: 1400, agent: 3 },
    { text: "Measuring cumulative length and average widths...", duration: 1000, agent: 3 },
    { text: "Executing [Threshold Agent] for structural stress levels...", duration: 1200, agent: 4 },
    { text: "Evaluating risk indexes: High, Medium, Low...", duration: 800, agent: 4 },
    { text: "Executing [Report Agent] for database logging...", duration: 1000, agent: 5 },
    { text: "Assembling batch reports and rendering visual charts...", duration: 1000, agent: 5 },
  ];

  useEffect(() => {
    let currentStep = 0;
    let timeoutId: NodeJS.Timeout;

    const runStep = () => {
      if (currentStep >= steps.length) {
        return;
      }

      const step = steps[currentStep];
      const timestamp = new Date().toLocaleTimeString();
      
      setLogs((prev) => [...prev, `[${timestamp}] ${step.text}`]);
      setActiveAgent(step.agent);
      setProgress(Math.round(((currentStep + 1) / steps.length) * 100));

      currentStep++;
      
      timeoutId = setTimeout(runStep, step.duration);
    };

    runStep();

    // Set fallback progress updates to 100% gradually in case upload takes longer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 98) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const agentStates = [
    { name: "Detect", icon: Shield, id: 1 },
    { name: "Area", icon: Scaling, id: 2 },
    { name: "Measure", icon: Ruler, id: 3 },
    { name: "Threshold", icon: Activity, id: 4 },
    { name: "Report", icon: FileText, id: 5 }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in text-tech-dark" id="analysis-console-container">
      <div className="bg-white border-2 border-tech-dark rounded-none shadow-sm overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-tech-dark border-b border-tech-dark px-5 py-3.5 flex items-center justify-between text-tech-bg">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500"></span>
              <span className="w-2.5 h-2.5 bg-yellow-500"></span>
              <span className="w-2.5 h-2.5 bg-green-500"></span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs ml-2 uppercase font-bold tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>pipeline_orchestrator.sh</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-tech-bg/80 font-mono uppercase font-bold">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
            <span>Analyzing {fileName}</span>
          </div>
        </div>

        {/* Console Body */}
        <div className="p-6 space-y-6 bg-[#E4E3E0]">
          {/* Agent Visual pipeline bar */}
          <div className="grid grid-cols-5 gap-3">
            {agentStates.map((agent) => {
              const Icon = agent.icon;
              const isActive = activeAgent === agent.id;
              const isDone = activeAgent > agent.id;
              
              return (
                <div 
                  key={agent.id}
                  className={`border p-3 text-center transition-all duration-300 flex flex-col items-center gap-1.5 rounded-none ${
                    isActive 
                      ? 'border-tech-dark bg-tech-dark text-tech-bg scale-102 font-bold'
                      : isDone
                      ? 'border-tech-dark bg-tech-accent text-tech-dark opacity-90'
                      : 'border-tech-dark/20 bg-tech-neutral/20 text-tech-dark/40'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />
                  <span className="text-[10px] font-bold uppercase font-mono tracking-wider">{agent.name}</span>
                </div>
              );
            })}
          </div>

          {/* Loading Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-tech-dark uppercase font-bold">
              <span>Overall Graph Traversal Progress</span>
              <span className="text-tech-dark font-black">{progress}%</span>
            </div>
            <div className="w-full h-3.5 bg-tech-neutral rounded-none overflow-hidden border border-tech-dark p-[2px]">
              <div 
                className="h-full bg-tech-dark rounded-none transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Console Log Lines */}
          <div 
            ref={logContainerRef}
            className="h-64 bg-tech-dark border border-tech-dark rounded-none p-4 font-mono text-[11px] text-tech-bg overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-tech-accent"
            id="console-terminal-logs"
          >
            {logs.map((log, index) => {
              let colorClass = "text-tech-bg/90";
              if (log.includes("[Detect Agent]")) colorClass = "text-emerald-400 font-bold";
              if (log.includes("[Area Agent]")) colorClass = "text-yellow-400 font-bold";
              if (log.includes("[Measurement Agent]")) colorClass = "text-cyan-400 font-bold";
              if (log.includes("[Threshold Agent]")) colorClass = "text-orange-400 font-bold";
              if (log.includes("[Report Agent]")) colorClass = "text-pink-400 font-bold";

              return (
                <div key={index} className={`${colorClass} leading-relaxed flex items-start gap-1`}>
                  <span className="text-tech-bg/40 shrink-0 select-none">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              );
            })}
            
            {logs.length < steps.length && (
              <div className="flex items-center gap-1.5 text-tech-bg/50 italic mt-1 animate-pulse font-mono">
                <span>&gt;&gt; Listening for incoming agent pipeline broadcasts...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
