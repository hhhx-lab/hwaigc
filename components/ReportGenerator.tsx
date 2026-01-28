import React, { useState } from 'react';
import { ProtocolNode, ExcelSheet, ChapterMapping, ReportContent } from '../types';
import { generateReportSection } from '../services/geminiService';
import { RefreshCw, BrainCircuit, Table, MessageSquare, Maximize2, Minimize2, Check, AlertTriangle } from 'lucide-react';

interface Props {
  protocol: ProtocolNode[];
  excelData: ExcelSheet[];
  mappings: ChapterMapping[];
  styleGuide: string;
  onFinish: () => void;
}

export const ReportGenerator: React.FC<Props> = ({ protocol, excelData, mappings, styleGuide, onFinish }) => {
  const [activeProtocolId, setActiveProtocolId] = useState<string>(protocol[0]?.id);
  const [reports, setReports] = useState<Record<string, ReportContent>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Flatten protocol for the sidebar
  const flatProtocol: ProtocolNode[] = [];
  const traverse = (nodes: ProtocolNode[]) => {
    nodes.forEach(n => {
      flatProtocol.push(n);
      if(n.children) traverse(n.children);
    });
  };
  traverse(protocol);

  const activeNode = flatProtocol.find(n => n.id === activeProtocolId);
  const activeMapping = mappings.find(m => m.protocolId === activeProtocolId);
  
  // Resolve mapped tables
  const activeTables = activeMapping?.tableIds.map(tid => {
      for (const sheet of excelData) {
          const found = sheet.tables.find(t => t.id === tid);
          if (found) return found;
      }
      return null;
  }).filter(t => t !== null) as any[] || [];

  const handleGenerate = async () => {
    if (!activeNode) return;
    
    setIsGenerating(true);
    
    // Pass explicit instructions to the AI service
    const text = await generateReportSection(activeNode, activeTables, styleGuide);
    
    setReports(prev => ({
        ...prev,
        [activeNode.id]: {
            protocolId: activeNode.id,
            generatedText: text,
            lastUpdated: Date.now(),
            isLocked: false
        }
    }));
    setIsGenerating(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const currentReport = reports[activeProtocolId];

  return (
    <div className={`flex flex-col w-full bg-gray-100 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white min-h-screen overflow-auto' : 'min-h-screen'}`}>
        
        {/* Top Bar - Sticky */}
        {!isFullscreen && (
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-30 sticky top-16">
                <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 p-1.5 rounded-lg"><BrainCircuit size={18} /></span>
                    <span className="font-semibold text-gray-700">Generation Phase</span>
                </div>
                <button 
                    onClick={onFinish}
                    className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition flex items-center gap-2"
                >
                    Finalize & Export <Check size={14} />
                </button>
            </div>
        )}

        <div className="flex items-start">
            {/* Sidebar - Sticky */}
            {!isFullscreen && (
                <div className="w-64 bg-white border-r border-gray-200 sticky top-32 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin flex-shrink-0">
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sections</h3>
                        {flatProtocol.map(node => {
                            const hasReport = !!reports[node.id];
                            const hasData = mappings.some(m => m.protocolId === node.id && m.tableIds.length > 0);
                            
                            return (
                                <div 
                                    key={node.id}
                                    onClick={() => setActiveProtocolId(node.id)}
                                    className={`group flex items-center justify-between p-2.5 rounded-md mb-1 cursor-pointer text-sm transition-all
                                        ${activeProtocolId === node.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                    style={{ paddingLeft: `${Math.min(node.level * 12, 48)}px` }}
                                >
                                    <span className="truncate">{node.number} {node.title}</span>
                                    <div className="flex gap-1">
                                        {hasData && <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Data Mapped" />}
                                        {hasReport && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Draft Generated" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Main Workspace */}
            <div className="flex-1 flex items-start gap-6 p-6">
                
                {/* Data Reference Panel (Left) - Sticky */}
                {!isFullscreen && (
                    <div className="w-2/5 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col sticky top-32 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">
                        <div className="p-3 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
                             <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <Table size={16} />
                                <span>Mapped Data</span>
                             </div>
                             <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{activeTables.length} Tables</span>
                        </div>
                        
                        <div className="p-4">
                            {activeTables.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-gray-400 text-center p-6 min-h-[200px]">
                                    <AlertTriangle size={32} className="mb-2 opacity-50 text-amber-500" />
                                    <p className="font-medium text-gray-600">No Data Mapped</p>
                                    <p className="text-xs mt-1">Go back to the <strong>Mapping</strong> step to link Excel tables to this chapter.</p>
                                </div>
                            ) : (
                                activeTables.map(table => (
                                    <div key={table.id} className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                         <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 font-bold text-xs text-gray-700">
                                            {table.name}
                                         </div>
                                         <div className="overflow-x-auto p-2">
                                            <table className="min-w-full text-xs">
                                                <thead className="bg-gray-50">
                                                    <tr>{table.headers.slice(0, 5).map((h: string, i: number) => <th key={i} className="px-2 py-1 text-left font-medium text-gray-500 border-b">{h}</th>)}</tr>
                                                </thead>
                                                <tbody>
                                                    {table.rows.slice(0, 5).map((row: string[], i: number) => (
                                                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                                            {row.slice(0, 5).map((c: string, ci: number) => <td key={ci} className="px-2 py-1 text-gray-700 whitespace-nowrap">{c}</td>)}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="text-[10px] text-gray-400 mt-1 text-center italic">
                                                (Displaying first 5 rows/cols for reference)
                                            </div>
                                         </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Editor Panel (Right) - Flows */}
                <div className={`${isFullscreen ? 'w-full max-w-5xl mx-auto' : 'w-3/5'} bg-white flex flex-col relative rounded-lg border border-gray-200 shadow-sm`}>
                    
                    {/* Editor Toolbar - Sticky relative to Editor */}
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white z-20 rounded-t-lg sticky top-0">
                        <div className="flex items-center gap-2 text-purple-700 font-bold">
                            <MessageSquare size={16} />
                            <span>{activeNode?.title || "Editor"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all
                                    ${isGenerating 
                                        ? 'bg-purple-100 text-purple-400 cursor-wait' 
                                        : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md active:scale-95'}`}
                            >
                                {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                                {currentReport ? 'Regenerate Draft' : 'Generate Draft'}
                            </button>
                            <div className="h-6 w-px bg-gray-200 mx-1"></div>
                            <button 
                                onClick={toggleFullscreen}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="bg-gray-50 relative min-h-[800px]">
                        
                        {/* Loading Overlay */}
                        {isGenerating && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6"></div>
                                <h3 className="text-xl font-bold text-gray-800 animate-pulse">Consulting Senior Study Director...</h3>
                                <p className="text-gray-500 mt-2">Analyzing {activeTables.length} data tables against strict GLP requirements.</p>
                            </div>
                        )}

                        {!currentReport && !isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center select-none pt-32">
                                <div className="bg-white p-6 rounded-full shadow-sm mb-6 border border-gray-100">
                                    <BrainCircuit size={48} className="text-purple-200" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Ready to Draft</h3>
                                <p className="max-w-md text-gray-500 mb-6">
                                    {activeTables.length > 0 
                                        ? `The AI is ready to analyze the ${activeTables.length} linked tables for this section.` 
                                        : "No data mapped. The AI will generate a generic template structure."}
                                </p>
                                {activeTables.length === 0 && (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm border border-amber-100">
                                        <AlertTriangle size={16} />
                                        Warning: Quality will be low without mapped data.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-12 flex justify-center">
                                <textarea 
                                    className="w-full max-w-3xl min-h-[800px] p-12 bg-white shadow-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none font-serif text-lg leading-relaxed text-gray-800 resize-none rounded-sm"
                                    value={currentReport?.generatedText || ''}
                                    onChange={(e) => setReports({...reports, [activeProtocolId]: {...currentReport!, generatedText: e.target.value}})}
                                    placeholder="Report generation failed or returned empty text."
                                    spellCheck={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
