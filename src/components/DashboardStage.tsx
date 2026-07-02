import React, { useState } from 'react';
import { 
  WorkflowSummary, 
  CrackAnalysis, 
  AgentLog 
} from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Shield, Scaling, Ruler, Activity, FileText, CheckCircle, AlertTriangle, 
  XCircle, ArrowLeft, Download, Info, Layers, Eye, BarChart3, Database, ChevronRight, Clock
} from 'lucide-react';

interface DashboardStageProps {
  summary: WorkflowSummary;
  onReset: () => void;
}

export default function DashboardStage({ summary, onReset }: DashboardStageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'inspect' | 'charts'>('inspect');
  const [selectedAgentTab, setSelectedAgentTab] = useState<string>('detect');
  
  const currentImage = summary.images[selectedImageIndex] || null;

  // Formatting helper for agent logs
  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'detect': return Shield;
      case 'area': return Scaling;
      case 'measure': return Ruler;
      case 'threshold': return Activity;
      case 'report': return FileText;
      default: return Info;
    }
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return 'text-emerald-800 bg-emerald-100 border-tech-dark';
      case 'warning': return 'text-amber-800 bg-amber-100 border-tech-dark';
      case 'error': return 'text-rose-800 bg-rose-100 border-tech-dark';
      default: return 'text-tech-dark bg-tech-accent border-tech-dark';
    }
  };

  const getSeverityBadgeColor = (severity: 'High risk' | 'Medium risk' | 'Low risk') => {
    switch (severity) {
      case 'High risk': return 'text-red-600 bg-red-100/80 border border-red-600';
      case 'Medium risk': return 'text-orange-600 bg-orange-100/80 border border-orange-500';
      case 'Low risk': return 'text-green-700 bg-green-100/80 border border-green-600';
      default: return 'text-tech-dark bg-tech-accent border border-tech-dark';
    }
  };

  // Chart Data Preparation
  const severityChartData = [
    { name: 'High Risk', value: summary.highRiskCount, color: '#dc2626' },
    { name: 'Medium Risk', value: summary.mediumRiskCount, color: '#f97316' },
    { name: 'Low Risk', value: summary.lowRiskCount, color: '#16a34a' },
  ].filter(d => d.value > 0);

  const widthDistributionData = summary.images.map(img => ({
    name: img.fileName.substring(0, 15) + (img.fileName.length > 15 ? '...' : ''),
    widthMm: img.crackWidthMm,
    lengthMm: img.crackLengthMm,
    areaMm2: img.crackAreaMm2
  }));

  // Trigger Print Mode for physical PDF exports
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in text-tech-dark" id="dashboard-stage-root">
      
      {/* Upper Navigation & Export Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print border-b border-tech-dark pb-5">
        <div className="flex items-center gap-3">
          <button
            id="go-back-to-upload"
            onClick={onReset}
            className="p-2.5 bg-white hover:bg-tech-dark text-tech-dark hover:text-tech-bg border border-tech-dark rounded-none transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display uppercase tracking-wider text-tech-dark">Batch Inspection Console</h1>
            <p className="text-xs text-tech-dark/70 font-mono">Pipeline execution complete in {summary.executionTimeMs} ms // SYSTEM ACTIVE</p>
          </div>
        </div>

        {/* Tab Controls and Export Action */}
        <div className="flex items-center gap-3">
          <div className="bg-tech-accent border border-tech-dark rounded-none p-1 flex">
            <button
              onClick={() => setActiveTab('inspect')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'inspect' 
                  ? 'bg-tech-dark text-tech-bg shadow-none' 
                  : 'text-tech-dark hover:bg-tech-neutral/40'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspection View</span>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'charts' 
                  ? 'bg-tech-dark text-tech-bg shadow-none' 
                  : 'text-tech-dark hover:bg-tech-neutral/40'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Batch Charts</span>
            </button>
          </div>

          <button
            id="generate-pdf-report-btn"
            onClick={handlePrint}
            className="bg-tech-dark hover:bg-tech-dark/90 text-tech-bg text-[10px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-none flex items-center gap-1.5 transition-all border border-tech-dark cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="batch-metrics-row">
        <div className="bg-white border border-tech-dark rounded-none p-4 flex flex-col justify-between">
          <span className="text-[10px] text-tech-dark/60 font-bold uppercase tracking-wider font-mono">Total Scanned</span>
          <span className="text-2xl font-bold font-mono text-tech-dark mt-1">{summary.totalImages} FILES</span>
        </div>
        <div className="bg-tech-dark border border-tech-dark rounded-none p-4 flex flex-col justify-between text-tech-bg">
          <span className="text-[10px] text-tech-bg/60 font-bold uppercase tracking-wider font-mono">High Risk Alert</span>
          <span className="text-2xl font-bold font-mono text-red-500 mt-1">{summary.highRiskCount} HIGH</span>
        </div>
        <div className="bg-white border border-tech-dark rounded-none p-4 flex flex-col justify-between">
          <span className="text-[10px] text-tech-dark/60 font-bold uppercase tracking-wider font-mono">Avg Crack Width</span>
          <span className="text-2xl font-bold font-mono text-tech-dark mt-1">{summary.avgWidthMm} mm</span>
        </div>
        <div className="bg-white border border-tech-dark rounded-none p-4 flex flex-col justify-between">
          <span className="text-[10px] text-tech-dark/60 font-bold uppercase tracking-wider font-mono">Avg Cum. Length</span>
          <span className="text-2xl font-bold font-mono text-tech-dark mt-1">{summary.avgLengthMm} mm</span>
        </div>
        <div className="bg-white border border-tech-dark rounded-none p-4 col-span-2 md:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] text-tech-dark/60 font-bold uppercase tracking-wider font-mono">Total Area (MM²)</span>
          <span className="text-2xl font-bold font-mono text-tech-dark mt-1">{summary.totalAreaMm2} mm²</span>
        </div>
      </div>

      {/* Main Container tabs */}
      {activeTab === 'inspect' ? (
        <div className="grid md:grid-cols-12 gap-6 items-stretch" id="inspection-view-grid">
          
          {/* File Selector Sidebar */}
          <div className="md:col-span-3 bg-white border border-tech-dark rounded-none p-4 flex flex-col h-[600px] overflow-hidden">
            <h3 className="text-[10px] font-bold text-tech-dark uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-tech-dark pb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Inspection Batch ({summary.images.length})</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-tech-accent">
              {summary.images.map((img, index) => {
                const isSelected = selectedImageIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-full text-left p-3 rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-tech-dark text-tech-bg border-tech-dark' 
                        : 'bg-tech-neutral/10 border-tech-dark/30 hover:bg-tech-dark hover:text-tech-bg hover:border-tech-dark'
                    }`}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <h4 className={`text-xs font-bold font-mono truncate ${isSelected ? 'text-tech-bg' : 'text-tech-dark'}`}>{img.fileName}</h4>
                      <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-tech-bg/70' : 'text-tech-dark/60'}`}>
                        W: {img.crackWidthMm}mm // L: {img.crackLengthMm}mm
                      </p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 shrink-0 font-bold uppercase tracking-wide rounded-none ${isSelected ? 'bg-tech-bg text-tech-dark' : getSeverityBadgeColor(img.severityLevel)}`}>
                      {img.severityLevel.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canvas Viewer Pane */}
          {currentImage && (
            <div className="md:col-span-5 bg-white border border-tech-dark rounded-none p-4 flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-3 border-b border-tech-dark pb-2.5">
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-tech-dark/60 font-bold tracking-wider uppercase">Active Segment Scan</span>
                  <h3 className="text-xs font-bold text-tech-dark font-mono truncate">{currentImage.fileName}</h3>
                </div>
                <div className="flex gap-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-none font-mono font-bold flex items-center gap-1 ${getSeverityBadgeColor(currentImage.severityLevel)}`}>
                    {currentImage.severityLevel === 'High risk' && <AlertTriangle className="w-3 h-3 text-red-600" />}
                    {currentImage.severityLevel.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Responsive SVG overlay viewport */}
              <div className="flex-1 bg-tech-highlight/40 rounded-none relative overflow-hidden border border-tech-dark flex items-center justify-center p-2">
                <img 
                  src={currentImage.imageData} 
                  alt={currentImage.fileName}
                  className="max-w-full max-h-full object-contain pointer-events-none border border-tech-dark/20"
                />
                
                {/* Responsive overlay SVG drawing crack centerline paths */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  {currentImage.cracks.map((crack, idx) => {
                    if (crack.points.length === 0) return null;
                    
                    // Generate string for path line SVG
                    const dPath = `M ${crack.points[0].x} ${crack.points[0].y} ` + 
                                  crack.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
 
                    const strokeWidthVal = Math.max(0.6, Math.min(3.5, crack.width / 6));

                    return (
                      <g key={idx}>
                        {/* Underlay glow path */}
                        <path 
                          d={dPath} 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth={strokeWidthVal * 2.5} 
                          strokeOpacity="0.55"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="animate-pulse-ring"
                        />
                        {/* Main overlay path */}
                        <path 
                          d={dPath} 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth={strokeWidthVal} 
                          strokeOpacity="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    );
                  })}
                </svg>

                {currentImage.cracks.length === 0 && (
                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center text-tech-dark/50">
                    <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-xs uppercase font-bold tracking-wider font-mono">No Structural Cracks Detected</span>
                  </div>
                )}
              </div>

              {/* Image Summary Statement */}
              <div className="mt-3.5 bg-tech-accent/40 border border-tech-dark p-3 flex gap-2.5 items-start">
                <Info className="w-4 h-4 text-tech-dark shrink-0 mt-0.5" />
                <p className="text-xs text-tech-dark font-medium leading-relaxed font-sans">
                  {currentImage.summary}
                </p>
              </div>
            </div>
          )}

          {/* Agent Workflow Execution Trace */}
          {currentImage && (
            <div className="md:col-span-4 bg-white border border-tech-dark rounded-none p-4 flex flex-col h-[600px] overflow-hidden">
              <h3 className="text-[10px] font-bold text-tech-dark uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-tech-dark pb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Multi-Agent Execution Log</span>
              </h3>

              {/* Mini Horizontal tab selection for the 5 agents */}
              <div className="flex bg-tech-accent border border-tech-dark p-1 rounded-none gap-1 mb-4 shrink-0 font-mono">
                {currentImage.agentLogs.map((log) => {
                  const isActive = selectedAgentTab === log.agent;
                  return (
                    <button
                      key={log.agent}
                      onClick={() => setSelectedAgentTab(log.agent)}
                      className={`flex-1 py-1 rounded-none text-[9px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
                        isActive 
                          ? 'bg-tech-dark text-tech-bg border border-tech-dark' 
                          : 'text-tech-dark/60 hover:text-tech-dark'
                      }`}
                    >
                      {log.agent}
                    </button>
                  );
                })}
              </div>

              {/* Active Agent Log Details Card */}
              {(() => {
                const activeLog = currentImage.agentLogs.find(l => l.agent === selectedAgentTab);
                if (!activeLog) return null;
                const Icon = getAgentIcon(activeLog.agent);

                return (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden" id="active-agent-detail">
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-tech-accent">
                      
                      {/* Name Card */}
                      <div className="flex items-start gap-3">
                        <div className={`p-2 border border-tech-dark ${getStatusColor(activeLog.status)} shrink-0`}>
                          <Icon className="w-5 h-5 text-tech-dark" />
                        </div>
                        <div>
                          <h4 className="font-bold text-tech-dark uppercase tracking-wider text-xs font-display">{activeLog.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-tech-dark/60 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activeLog.durationMs}ms
                            </span>
                            <span className="text-tech-dark/30 font-mono text-[9px]">•</span>
                            <span className="text-[10px] text-tech-dark/60 font-mono">{new Date(activeLog.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Log text description */}
                      <div className="bg-tech-neutral/30 border border-tech-dark p-3.5">
                        <span className="text-[9px] font-mono text-tech-dark/60 font-bold block mb-1">EXECUTION STATE STATEMENT</span>
                        <p className="text-xs text-tech-dark font-medium leading-relaxed font-sans">{activeLog.message}</p>
                      </div>

                      {/* Agent Output Raw Frame JSON view */}
                      <div className="bg-tech-dark border border-tech-dark p-3.5 flex-1 flex flex-col min-h-[180px]">
                        <span className="text-[9px] font-mono text-tech-bg/50 font-bold block mb-1.5 uppercase">Agent Output Data Frame</span>
                        <pre className="flex-1 overflow-auto bg-tech-dark text-tech-bg/85 p-2 font-mono text-[10px] border border-tech-bg/10 rounded-none scrollbar-thin scrollbar-thumb-tech-accent">
                          {JSON.stringify(activeLog.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        /* Analytical Batch Charts View */
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in" id="dashboard-charts-view">
          
          {/* Severity Pie Chart Card */}
          <div className="bg-white border border-tech-dark rounded-none p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-tech-dark text-xs font-mono uppercase tracking-wider mb-1 border-b border-tech-dark pb-2">Batch Risk Index Allocation</h3>
              <p className="text-xs text-tech-dark/60 mt-1 mb-4">Distribution of severity indexes assessed by Threshold Agent.</p>
            </div>
            <div className="h-64">
              {severityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#141414', borderColor: '#141414', color: '#E4E3E0' }}
                      itemStyle={{ color: '#E4E3E0' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-tech-dark/50 text-xs font-mono">No analytical data loaded</div>
              )}
            </div>
          </div>

          {/* Width Profile Histograms */}
          <div className="bg-white border border-tech-dark rounded-none p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-tech-dark text-xs font-mono uppercase tracking-wider mb-1 border-b border-tech-dark pb-2">Physical Width Profiles (mm)</h3>
              <p className="text-xs text-tech-dark/60 mt-1 mb-4">Dimensional width metrics mapped across uploaded assets.</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={widthDistributionData}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#D1D0CC" />
                  <XAxis dataKey="name" stroke="#141414" fontSize={10} tickLine={false} />
                  <YAxis stroke="#141414" fontSize={10} tickLine={false} unit=" mm" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', borderColor: '#141414', color: '#E4E3E0' }}
                    itemStyle={{ color: '#E4E3E0' }}
                  />
                  <Bar dataKey="widthMm" fill="#141414" name="Avg Width (mm)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fracture Density / Crack Area Plot */}
          <div className="bg-white border border-tech-dark rounded-none p-5 flex flex-col justify-between md:col-span-2">
            <div>
              <h3 className="font-bold text-tech-dark text-xs font-mono uppercase tracking-wider mb-1 border-b border-tech-dark pb-2">Calibrated Defect Area Trend (mm²)</h3>
              <p className="text-xs text-tech-dark/60 mt-1 mb-4">Fracture densities compared across batch file listings.</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={widthDistributionData}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#D1D0CC" />
                  <XAxis dataKey="name" stroke="#141414" fontSize={10} tickLine={false} />
                  <YAxis stroke="#141414" fontSize={10} tickLine={false} unit=" mm²" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', borderColor: '#141414', color: '#E4E3E0' }}
                    itemStyle={{ color: '#E4E3E0' }}
                  />
                  <Area type="monotone" dataKey="areaMm2" stroke="#141414" fillOpacity={0.25} fill="#D1D0CC" name="Area (mm²)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* 
        PRINT PREVIEW LAYOUT (Only visible during system printing/PDF exports)
      */}
      <div className="hidden print:block print-only p-8 text-black bg-white font-sans max-w-4xl mx-auto space-y-8" id="print-report-layout">
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-950">Structural Inspection Report</h1>
            <p className="text-xs text-slate-500 mt-0.5">Asset Ingestion ID: BATCH-{summary.images[0]?.agentLogs[4]?.output?.reportId || '948210'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Generated Date</p>
            <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Print Summary Metrics */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1">1. Batch Ingestion Summary</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="py-2 px-3 font-semibold text-slate-700">Total Scanned</th>
                <th className="py-2 px-3 font-semibold text-slate-700">High Severity Anomalies</th>
                <th className="py-2 px-3 font-semibold text-slate-700">Average Defect Width</th>
                <th className="py-2 px-3 font-semibold text-slate-700">Average Cumulative Length</th>
                <th className="py-2 px-3 font-semibold text-slate-700">Total Calibrated Area</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2.5 px-3">{summary.totalImages} files</td>
                <td className="py-2.5 px-3 font-bold text-rose-600">{summary.highRiskCount} critical</td>
                <td className="py-2.5 px-3">{summary.avgWidthMm} mm</td>
                <td className="py-2.5 px-3">{summary.avgLengthMm} mm</td>
                <td className="py-2.5 px-3 font-semibold">{summary.totalAreaMm2} mm²</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detailed file table listing */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1">2. Detailed File Log Summary</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="py-2 px-3 font-semibold text-slate-700">File Name</th>
                <th className="py-2 px-3 font-semibold text-slate-700">Risk Assessment</th>
                <th className="py-2 px-3 font-semibold text-slate-700">Segment Width (mm)</th>
                <th className="py-2 px-3 font-semibold text-slate-700">Segment Length (mm)</th>
                <th className="py-2 px-3 font-semibold text-slate-700">Segment Area (mm²)</th>
                <th className="py-2 px-3 font-semibold text-slate-700">Analytic Summary</th>
              </tr>
            </thead>
            <tbody>
              {summary.images.map((img, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-2.5 px-3 font-mono">{img.fileName}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{img.severityLevel}</td>
                  <td className="py-2.5 px-3">{img.crackWidthMm} mm</td>
                  <td className="py-2.5 px-3">{img.crackLengthMm} mm</td>
                  <td className="py-2.5 px-3">{img.crackAreaMm2} mm²</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs">{img.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inspection Certification Footer */}
        <div className="pt-12 flex justify-between text-xs">
          <div>
            <p className="font-semibold">Workflow Engine</p>
            <p className="text-slate-500">Gemini-Vision / LangGraph Orchestrator</p>
          </div>
          <div className="text-right border-t border-slate-400 pt-1 w-48">
            <p className="font-semibold">Lead Inspector Signature</p>
            <p className="text-slate-500 mt-6 font-mono text-[10px]">[ CERTIFIED ]</p>
          </div>
        </div>
      </div>

    </div>
  );
}
