// Domain Models based on PRD

export enum AppStep {
  SETUP = 'SETUP',
  PROTOCOL_REVIEW = 'PROTOCOL_REVIEW',
  EXCEL_REVIEW = 'EXCEL_REVIEW',
  MAPPING = 'MAPPING',
  REPORT_GENERATION = 'REPORT_GENERATION',
  EXPORT = 'EXPORT'
}

// 4.1 Protocol Structure
export interface ProtocolNode {
  id: string;
  number: string; // e.g., "1.1"
  title: string;
  description?: string; // One line summary
  acceptanceCriteria?: string; // Extracted criteria (e.g. "Value must be < 0.05")
  children?: ProtocolNode[];
  level: number;
}

// 4.2 Excel Structure
export interface ExcelTable {
  id: string;
  name: string;
  rows: string[][]; // Structured Area
  headers: string[];
  unstructuredData: string[]; // Remarks/Comments/Notes extracted from bottom/side
  isVerified: boolean;
}

export interface ExcelSheet {
  id: string;
  name: string;
  tables: ExcelTable[];
}

// 4.3 Mapping
export interface ChapterMapping {
  protocolId: string;
  tableIds: string[]; 
  // NEW: Granular column mapping
  columnMappings?: {
    tableId: string;
    targetColumnIndices: number[]; // Which columns in Excel correspond to this chapter's data
    usage: 'comparison' | 'reference'; // Are we checking this data or just showing it?
  }[];
  isVerified: boolean;
}

// 4.4 Report Content
export interface ReportContent {
  protocolId: string;
  generatedText: string;
  verificationResult?: 'PASS' | 'FAIL' | 'WARNING';
  lastUpdated: number;
  isLocked: boolean; 
}

export interface ProjectState {
  name: string;
  // Files
  protocolFile: File | null;
  templateFile: File | null;
  dataFiles: File[]; // Changed from single File to File[]
  
  // Parsed Data
  protocolTree: ProtocolNode[];
  excelData: ExcelSheet[];
  styleGuide: string; // NEW: Extracted style rules from Template File
  
  mappings: ChapterMapping[];
  reportContents: Record<string, ReportContent>; 
  currentStep: AppStep;
}
