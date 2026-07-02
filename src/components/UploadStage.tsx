import React, { useRef, useState } from 'react';
import { Upload, FileArchive, ArrowRight, Shield, Activity, Scaling, Ruler, FileText, CheckCircle } from 'lucide-react';

interface UploadStageProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
}

export default function UploadStage({ onAnalyze, isAnalyzing }: UploadStageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid ZIP folder containing crack images.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid ZIP folder containing crack images.');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  const pipelineAgents = [
    {
      id: 'detect',
      name: 'Detect Agent',
      desc: 'Uses YOLO / Gemini Vision to segment crack contours and localize anomalies.',
      icon: Shield,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    },
    {
      id: 'area',
      name: 'Area Agent',
      desc: 'Applies scale calibration of 1px = 0.1mm to compute physical area in mm².',
      icon: Scaling,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'measure',
      name: 'Measurement Agent',
      desc: 'Calculates physical width profiling and cumulative length of fractures.',
      icon: Ruler,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    {
      id: 'threshold',
      name: 'Threshold Agent',
      desc: 'Assesses risk severity level (High, Medium, Low) against structural tolerances.',
      icon: Activity,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    },
    {
      id: 'report',
      name: 'Report Agent',
      desc: 'Compiles inspection certificates, logs database transactions, and prepares exports.',
      icon: FileText,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in text-tech-dark" id="upload-stage-container">
      {/* Banner / Headline */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-tech-accent text-tech-dark border border-tech-dark px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider mb-4">
          <Activity className="w-3.5 h-3.5 text-tech-dark animate-pulse" />
          <span>Multi-Agent LangGraph Framework</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-display text-tech-dark tracking-tight uppercase mb-3">
          Crack Detection & Measurement Terminal
        </h1>
        <p className="text-tech-dark/80 text-sm max-w-2xl mx-auto font-sans leading-relaxed">
          Upload an inspection archive ZIP folder. Our vision intelligence network isolates, profiles, and logs defects directly to transaction ledgers.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Left Hand: Upload Widget */}
        <div className="md:col-span-3 space-y-6">
          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`relative border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
              dragActive 
                ? 'border-tech-dark bg-tech-accent' 
                : 'border-tech-dark hover:border-tech-dark bg-tech-neutral/40 hover:bg-tech-neutral/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="w-16 h-16 mx-auto mb-4 bg-tech-dark flex items-center justify-center border border-tech-dark text-tech-bg transition-transform">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-tech-dark uppercase tracking-wider mb-1">
              Drag & drop ZIP archive
            </h3>
            <p className="text-tech-dark/60 text-xs mb-4 font-mono">
              or click to browse local folders
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tech-accent border border-tech-dark text-xs text-tech-dark font-mono font-bold">
              <FileArchive className="w-3.5 h-3.5" />
              <span>Zip Folders Only</span>
            </div>
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="bg-white border border-tech-dark p-4 flex items-center justify-between animate-fade-in" id="file-details-container">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-tech-accent text-tech-dark border border-tech-dark">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-tech-dark text-xs font-mono truncate max-w-xs md:max-w-md">
                    {selectedFile.name}
                  </h4>
                  <p className="text-[10px] text-tech-dark/60 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB // Active Batch Ingested
                  </p>
                </div>
              </div>
              <button
                id="analyze-trigger-btn"
                onClick={handleSubmit}
                disabled={isAnalyzing}
                className="bg-tech-dark hover:bg-tech-dark/95 text-tech-bg text-xs font-bold py-2.5 px-5 flex items-center gap-1.5 transition-all cursor-pointer font-mono uppercase tracking-wider border border-tech-dark"
              >
                <span>Analyze Batch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Hand: Multi-Agent Explanation */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-tech-dark uppercase tracking-widest italic border-b border-tech-dark pb-1.5">
            Agent Pipeline Configuration
          </h3>
          <div className="space-y-3" id="agent-workflow-list">
            {pipelineAgents.map((agent, index) => {
              const IconComp = agent.icon;
              return (
                <div 
                  key={agent.id} 
                  className="p-3 border border-tech-dark bg-white hover:bg-tech-neutral/30 transition-all flex items-start gap-3"
                >
                  <div className="p-2 bg-tech-accent text-tech-dark border border-tech-dark shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-tech-dark/50 font-bold">0{index + 1}</span>
                      <h4 className="font-bold text-tech-dark text-xs uppercase tracking-wider font-display">{agent.name}</h4>
                    </div>
                    <p className="text-[11px] text-tech-dark/70 mt-1 leading-relaxed">
                      {agent.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
