import React, { useState } from 'react';
import { Layout } from './components/Layout';
// ApiKeyInput removed - Using process.env.API_KEY exclusively
import { ProtocolViewer } from './components/ProtocolViewer';
import { ExcelViewer } from './components/ExcelViewer';
import { MappingBoard } from './components/MappingBoard';
import { ReportGenerator } from './components/ReportGenerator';
import { AppStep, ProjectState } from './types';
import { parseExcelFile, generateReportStructure, analyzeTemplateStyle } from './services/fileProcessing';
import { autoMapTables } from './services/geminiService';
import { generateWordDocument } from './services/reportExporter';
import { FileUp, Loader2, Play, Files, FileDown, CheckCircle, Sparkles, UploadCloud, FileText, Table } from 'lucide-react';
import saveAs from 'file-saver';
import { DEMO_PROTOCOL_TREE, DEMO_EXCEL_DATA } from './constants';

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>({
    name: '',
    protocolFile: null,
    templateFile: null,
    dataFiles: [],
    protocolTree: [],
    excelData: [],
    mappings: [],
    styleGuide: '',
    reportContents: {},
    currentStep: AppStep.SETUP
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSingleFileChange = (key: 'protocolFile' | 'templateFile', file: File) => {
    setProject(prev => ({ ...prev, [key]: file }));
  };

  const handleDataFilesChange = (files: File[]) => {
      setProject(prev => ({ ...prev, dataFiles: files }));
  };

  const handleStartProcessing = async () => {
    if (!project.protocolFile || project.dataFiles.length === 0) {
        alert("Please upload the Protocol and at least one Excel Data file.");
        return;
    }

    setIsProcessing(true);
    setStatusMessage("Initializing parallel analysis pipeline...");

    try {
        // 1. First, parse Excel files to get the headers/metadata
        setStatusMessage("Parsing Data Assets...");
        const excelSheets = (await Promise.all(project.dataFiles.map(file => parseExcelFile(file)))).flat();

        // 2. Analyze Template Style
        setStatusMessage("Analyzing Template Style & Voice...");
        const styleGuide = project.templateFile 
            ? await analyzeTemplateStyle(project.templateFile)
            : "Style Guide: Standard GLP Reporting format (Formal, Passive voice, Past tense).";

        // 3. Generate Report Structure (The Core Task)
        // This combines Protocol Content + Template Structure + Excel Availability
        setStatusMessage("Synthesizing Final Report Directory Structure...");
        const protocolTree = await generateReportStructure(
            project.protocolFile!,
            project.templateFile,
            excelSheets
        );

        setStatusMessage("Finalizing project...");
        setProject(prev => ({
            ...prev,
            protocolTree, // This is now the Synthesized Report Structure
            excelData: excelSheets,
            styleGuide,
            name: project.protocolFile?.name.split('.')[0] || 'New Project',
            currentStep: AppStep.EXCEL_REVIEW // Go to Data Processing first
        }));

    } catch (e) {
        console.error(e);
        alert("Error parsing files. Please check console.");
    } finally {
        setIsProcessing(false);
        setStatusMessage("");
    }
  };

  // Renamed from handleConfirmExcel to generic mapping handler
  const handleTriggerAutoMapping = async () => {
      setIsProcessing(true);
      setStatusMessage("AI is automatically mapping tables to protocol chapters...");
      try {
          const mappings = await autoMapTables(project.protocolTree, project.excelData);
          setProject(prev => ({ ...prev, mappings, currentStep: AppStep.MAPPING }));
      } catch (e) {
          console.error(e);
          setProject(prev => ({ ...prev, currentStep: AppStep.MAPPING }));
      } finally {
          setIsProcessing(false);
          setStatusMessage("");
      }
  };

  const handleExport = async () => {
      setIsProcessing(true);
      setStatusMessage("Compiling final Word document...");
      try {
          const blob = await generateWordDocument(
              project.protocolTree,
              project.reportContents,
              project.name
          );
          saveAs(blob, `${project.name}_FinalReport.docx`);
      } catch (e) {
          console.error(e);
          alert("Failed to generate document.");
      } finally {
          setIsProcessing(false);
          setStatusMessage("");
      }
  };

  const loadDemo = () => {
      setProject(prev => ({
          ...prev,
          name: 'DEMO-GLP-2024',
          protocolTree: DEMO_PROTOCOL_TREE,
          excelData: DEMO_EXCEL_DATA,
          styleGuide: "Style Guide: Detailed, Passive Voice, Standard Scientific Notation.",
          currentStep: AppStep.EXCEL_REVIEW // CHANGED: Go to Data Processing first
      }))
  }

  return (
    <>
      <Layout currentStep={project.currentStep}>
        
        {isProcessing && (
            <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full border border-blue-100">
                    <Loader2 className="w-12 h-12 text-[#135bec] animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 animate-pulse text-center">{statusMessage}</h3>
                    <p className="text-gray-500 mt-2 text-sm text-center">AI Agents are reading your documents...</p>
                </div>
            </div>
        )}

        {project.currentStep === AppStep.SETUP && (
          <div className="flex-1 overflow-y-auto bg-[#f6f6f8] p-8 flex justify-center">
            <div className="w-full max-w-[1200px] flex flex-col gap-6">
                
                {/* Header Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbdfe6]">
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-6 justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">File Upload & Configuration</h1>
                            <p className="text-[#135bec] text-xs font-bold bg-[#135bec]/10 px-3 py-1 rounded-full">Step 0 / 5</p>
                        </div>
                        <div className="relative h-2 w-full bg-gray-100 rounded-full mt-2">
                            <div className="absolute h-2 rounded-full bg-[#135bec]" style={{width: '5%'}}></div>
                        </div>
                        <div className="flex justify-between mt-1">
                            <p className="text-[#135bec] text-xs font-bold uppercase tracking-wider">Phase: Initialization</p>
                            <p className="text-gray-500 text-xs">Next: AI Data Parsing</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Uploads */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        
                        {/* Protocol Upload */}
                        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#dbdfe6]">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="text-[#135bec]" size={20} />
                                <h2 className="text-lg font-bold text-gray-900">1. Verification Protocol</h2>
                            </div>
                            <FileUploadCard 
                                accept=".docx"
                                subtitle="Supports Word (.docx) format"
                                file={project.protocolFile}
                                onSingleChange={(f) => handleSingleFileChange('protocolFile', f)}
                            />
                        </section>

                        {/* Data Upload */}
                        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#dbdfe6]">
                            <div className="flex items-center gap-2 mb-4">
                                <Table className="text-[#135bec]" size={20} />
                                <h2 className="text-lg font-bold text-gray-900">2. Data Assets</h2>
                            </div>
                            <FileUploadCard 
                                accept=".xlsx"
                                subtitle="Upload raw Excel data files"
                                multiple={true}
                                files={project.dataFiles}
                                onMultipleChange={handleDataFilesChange}
                            />
                            
                            {/* File List Preview */}
                            {project.dataFiles.length > 0 && (
                                <div className="mt-4 flex flex-col gap-2">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-tight mb-1">Ready Files ({project.dataFiles.length})</p>
                                    {project.dataFiles.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-100 p-1.5 rounded text-green-600"><Table size={16}/></div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-800">{f.name}</span>
                                                    <span className="text-[10px] text-gray-400">{(f.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Template & Actions */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#dbdfe6] flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="text-[#135bec]" size={20} />
                                    <h2 className="text-lg font-bold text-gray-900">3. Template Config</h2>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Built-in Standard Templates</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`cursor-pointer rounded-lg border-2 p-1 transition-all ${!project.templateFile ? 'border-[#135bec] bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-50'}`}
                                        onClick={() => handleSingleFileChange('templateFile', null as any)}
                                    >
                                        <div className="aspect-[4/3] bg-white rounded border border-gray-200 p-2 flex flex-col gap-2 mb-2 relative overflow-hidden">
                                             <div className="w-full h-2 bg-gray-100 rounded"></div>
                                             <div className="w-2/3 h-2 bg-gray-100 rounded"></div>
                                             <div className="mt-2 grid grid-cols-2 gap-1">
                                                <div className="h-6 bg-gray-50 rounded"></div>
                                                <div className="h-6 bg-gray-50 rounded"></div>
                                             </div>
                                             {!project.templateFile && (
                                                <div className="absolute inset-0 bg-[#135bec]/10 flex items-center justify-center">
                                                    <div className="bg-[#135bec] text-white p-1 rounded-full"><CheckCircle size={16} /></div>
                                                </div>
                                             )}
                                        </div>
                                        <p className="text-xs font-bold text-center text-gray-700">Standard GLP</p>
                                    </div>
                                    {/* Placeholder for custom template upload visualization */}
                                    <div className="relative">
                                         <FileUploadCard 
                                            accept=".docx"
                                            subtitle="Custom .docx"
                                            file={project.templateFile}
                                            onSingleChange={(f) => handleSingleFileChange('templateFile', f)}
                                            compact
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-lg mt-auto">
                            <div className="flex justify-between items-center gap-4">
                                 <button 
                                    onClick={loadDemo}
                                    className="text-gray-400 text-sm font-bold hover:text-gray-600"
                                >
                                    Load Demo Data
                                </button>
                                <button 
                                    onClick={handleStartProcessing}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-8 py-3 rounded-lg bg-[#135bec] text-white font-bold text-base shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>Start Analysis</span>
                                    <Sparkles size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Step 1: Excel Review (Swapped) */}
        {project.currentStep === AppStep.EXCEL_REVIEW && (
          <ExcelViewer 
            sheets={project.excelData} 
            onConfirm={() => setProject(p => ({...p, currentStep: AppStep.PROTOCOL_REVIEW}))}
          />
        )}

        {/* Step 2: Protocol Review (Swapped) */}
        {project.currentStep === AppStep.PROTOCOL_REVIEW && (
          <ProtocolViewer 
            nodes={project.protocolTree} 
            onUpdate={(newNodes) => setProject(p => ({...p, protocolTree: newNodes}))}
            onConfirm={handleTriggerAutoMapping}
          />
        )}

        {project.currentStep === AppStep.MAPPING && (
          <MappingBoard 
            protocol={project.protocolTree} 
            excelData={project.excelData}
            initialMappings={project.mappings}
            onConfirm={(newMappings) => {
                setProject(prev => ({ ...prev, mappings: newMappings, currentStep: AppStep.REPORT_GENERATION }));
            }}
          />
        )}

        {project.currentStep === AppStep.REPORT_GENERATION && (
          <ReportGenerator 
            protocol={project.protocolTree}
            excelData={project.excelData}
            mappings={project.mappings}
            styleGuide={project.styleGuide}
            onFinish={() => setProject(prev => ({...prev, currentStep: AppStep.EXPORT}))}
          />
        )}
        
        {project.currentStep === AppStep.EXPORT && (
            <div className="flex flex-col items-center justify-center h-full p-10 bg-[#f6f6f8]">
                <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-2xl border border-gray-100">
                    <div className="mb-6 flex justify-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">Report Compilation Complete</h2>
                    <p className="text-gray-500 mb-8 text-lg">
                        Your data has been successfully mapped, verified, and formatted into a GLP-compliant Word document.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleExport}
                            className="bg-[#135bec] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-3"
                        >
                            <FileDown size={24} />
                            Download Final Report (.docx)
                        </button>
                        <p className="text-xs text-gray-400 mt-2">
                            Formatted using Styles: Normal (Times New Roman, 12pt), Headings (Bold).
                        </p>
                    </div>
                </div>
            </div>
        )}

      </Layout>
    </>
  );
};

interface FileUploadCardProps {
    accept: string;
    subtitle: string;
    multiple?: boolean;
    file?: File | null;
    files?: File[];
    onSingleChange?: (f: File) => void;
    onMultipleChange?: (f: File[]) => void;
    compact?: boolean;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({ 
    subtitle, accept, multiple, file, files, onSingleChange, onMultipleChange, compact 
}) => {
    const hasFile = multiple ? (files && files.length > 0) : !!file;
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        if (multiple && onMultipleChange) {
            onMultipleChange(Array.from(e.target.files));
        } else if (!multiple && onSingleChange && e.target.files[0]) {
            onSingleChange(e.target.files[0]);
        }
    };

    return (
        <label className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-[#dbdfe6] hover:border-[#135bec]/50 transition-colors px-6 bg-[#f6f6f8]/30 cursor-pointer justify-center
            ${compact ? 'py-4' : 'py-10'}
            ${hasFile ? 'border-green-500 bg-green-50/20' : ''}
        `}>
            <input type="file" accept={accept} className="hidden" multiple={multiple} onChange={handleInput} />
            
            {!compact && (
                <div className={`flex items-center justify-center size-14 rounded-full ${hasFile ? 'bg-green-100 text-green-600' : 'bg-[#135bec]/10 text-[#135bec]'}`}>
                    {hasFile ? <CheckCircle size={28} /> : <UploadCloud size={28} />}
                </div>
            )}
            
            <div className="flex flex-col items-center gap-1">
                {hasFile ? (
                    <p className="text-[#135bec] text-sm font-bold text-center">
                        {multiple ? `${files?.length} files selected` : file?.name}
                    </p>
                ) : (
                    <p className="text-gray-900 text-base font-bold text-center">Click or Drag to Upload</p>
                )}
                <p className="text-gray-500 text-sm text-center">{subtitle}</p>
            </div>
            
            {!hasFile && (
                <div className="flex min-w-[120px] items-center justify-center rounded-lg h-9 px-6 bg-[#135bec] text-white text-sm font-bold shadow-sm">
                    Select File
                </div>
            )}
        </label>
    )
}

export default App;
