export interface CrackPoint {
  x: number;
  y: number;
}

export interface CrackPolygon {
  points: CrackPoint[];
  width: number;
  length: number;
}

export interface AgentLog {
  agent: 'detect' | 'area' | 'measure' | 'threshold' | 'report';
  name: string;
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  durationMs: number;
  output: any;
}

export interface CrackAnalysis {
  fileName: string;
  imageData: string; // Base64 data URL
  crackAreaPx: number;
  crackAreaMm2: number;
  crackLengthMm: number;
  crackWidthMm: number;
  severityLevel: 'High risk' | 'Medium risk' | 'Low risk';
  cracks: CrackPolygon[];
  agentLogs: AgentLog[];
  summary: string;
}

export interface WorkflowSummary {
  totalImages: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  avgWidthMm: number;
  avgLengthMm: number;
  totalAreaMm2: number;
  images: CrackAnalysis[];
  executionTimeMs: number;
}
