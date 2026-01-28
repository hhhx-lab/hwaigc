import React, { useState } from 'react';
import { ExcelSheet, ExcelTable } from '../types';
import { Check, AlertCircle, Table as TableIcon, RefreshCw, History, ArrowRight, Save, FileSpreadsheet, FolderOpen, ChevronRight, ChevronDown, FileText } from 'lucide-react';

interface Props {
  sheets: ExcelSheet[];
  onConfirm: () => void;
}

export const ExcelViewer: React.FC<Props> = ({ sheets, onConfirm }) => {
  const [activeSheetId, setActiveSheetId] = useState(sheets[0]?.id);
  const activeSheet = sheets.find(s => s.id === activeSheetId);

  // Mock Quality Stats based on active sheet
  const activeTable = activeSheet?.tables[0];
  const rowCount = activeTable?.rows.length || 0;
  const missingRate = "1.2%"; // Dummy
  const complianceScore = "99.5%"; // Dummy

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto p-6 gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="hover:text-[#135bec] cursor-pointer">Assets Center</span>
                    <span>/</span>
                    <span className="text-gray-900 font-medium uppercase tracking-wider">Excel Intelligent Parsing</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Step 2: Data Processing & Deep Analysis</h1>
            </div>
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 min-w-[320px]">
                 <div className="flex-1 px-2">
                    <div className="flex justify-between mb-1">
                        <p className="text-[#135bec] text-xs font-bold uppercase">Overall Progress</p>
                        <p className="text-gray-900 text-xs font-bold">2 / 5</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                         <div className="w-[40%] h-full bg-[#135bec]"></div>
                    </div>
                 </div>
            </div>
        </div>

        {/* Main Content Area - Split View */}
        <div className="flex items-start gap-6">
             
             {/* Left: Main Content (Flows with Page) */}
             <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
                {/* Panel Header */}
                <div className="p-4 border-b border-[#dbdfe6] flex justify-between items-center bg-gray-50/50 rounded-t-xl sticky top-[64px] z-10">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-[#135bec]/10 rounded-lg flex items-center justify-center text-[#135bec]">
                            <TableIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm tracking-tight text-gray-900">AI Parsing Details</h3>
                            <p className="text-[10px] text-gray-500">Active: {activeSheet?.name || 'None'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#dbdfe6] rounded text-xs font-bold text-gray-600 hover:bg-gray-50">
                            <RefreshCw size={14} /> Re-parse
                         </button>
                         <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#dbdfe6] rounded text-xs font-bold text-gray-600 hover:bg-gray-50">
                            <History size={14} /> History
                         </button>
                    </div>
                </div>

                <div className="p-8 space-y-10">
                    {/* Section 1: AI Summary */}
                    <section>
                         <div className="flex items-center gap-2 mb-3">
                             <FileText className="text-[#135bec]" size={20} />
                             <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Data Deep Summary</span>
                         </div>
                         <div className="bg-[#135bec]/5 rounded-xl p-6 border border-[#135bec]/10 relative">
                             <p className="text-base text-gray-700 leading-relaxed">
                                 The AI has analyzed <span className="font-bold text-[#135bec]">{activeSheet?.name}</span> containing <span className="font-bold text-[#135bec]">{rowCount} rows</span> of data. 
                                 It identified headers: {activeTable?.headers.slice(0, 3).join(", ")}... 
                                 The structure suggests a standard time-series or group comparison layout. 
                                 {activeTable?.unstructuredData.length ? ` Detected ${activeTable.unstructuredData.length} unstructured comments at the footer.` : ''}
                             </p>
                         </div>
                    </section>

                    {/* Section 2: Quality Analysis Cards */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                             <AlertCircle className="text-gray-500" size={20} />
                             <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Data Quality Analysis</span>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                             <div className="border border-[#dbdfe6] rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white shadow-sm">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2">Missing Rate</span>
                                <span className="text-3xl font-bold text-gray-900">{missingRate}</span>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4">
                                    <div className="bg-green-500 h-full rounded-full" style={{width: '98%'}}></div>
                                </div>
                             </div>
                             <div className="border border-[#dbdfe6] rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white shadow-sm">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2">Outliers</span>
                                <span className="text-3xl font-bold text-orange-500">0</span>
                                <p className="text-xs text-gray-400 mt-2">Deviation > 3σ</p>
                             </div>
                             <div className="border border-[#dbdfe6] rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white shadow-sm">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2">Compliance</span>
                                <span className="text-3xl font-bold text-green-600">{complianceScore}</span>
                                <p className="text-xs text-gray-400 mt-2">ALCOA+ Standard</p>
                             </div>
                        </div>
                    </section>

                    {/* Section 3: Data Preview */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TableIcon className="text-gray-500" size={20} />
                                <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Table Preview</span>
                            </div>
                            <span className="text-xs text-gray-400">Showing first 20 rows</span>
                        </div>
                        <div className="border border-[#dbdfe6] rounded-lg overflow-x-auto">
                             {activeTable && (
                                 <table className="min-w-full divide-y divide-gray-200 text-xs">
                                     <thead className="bg-gray-50">
                                         <tr>
                                             {activeTable.headers.map((h, i) => (
                                                 <th key={i} className="px-4 py-3 text-left font-bold text-gray-500 uppercase border-r border-gray-100 last:border-0">{h}</th>
                                             ))}
                                         </tr>
                                     </thead>
                                     <tbody className="bg-white divide-y divide-gray-100">
                                         {activeTable.rows.slice(0, 20).map((row, rIdx) => (
                                             <tr key={rIdx}>
                                                 {row.map((cell, cIdx) => (
                                                     <td key={cIdx} className="px-4 py-3 text-gray-700 whitespace-nowrap border-r border-gray-100 last:border-0">{cell}</td>
                                                 ))}
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             )}
                        </div>
                    </section>
                </div>

                <div className="p-6 border-t border-[#dbdfe6] bg-white flex justify-between items-center rounded-b-xl">
                    <div className="flex gap-4">
                         <button className="px-6 py-3 border border-[#dbdfe6] rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-50">Previous</button>
                         <button className="px-6 py-3 text-[#135bec] font-bold text-sm flex items-center gap-2 hover:bg-blue-50 rounded-lg"><Save size={16}/> Save Draft</button>
                    </div>
                    <button onClick={onConfirm} className="px-8 py-3 bg-[#135bec] text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                        <span>Confirm & Continue</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
             </div>

             {/* Right Sidebar: File Tree (Sticky) */}
             <div className="w-80 flex flex-col bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden sticky top-28 self-start">
                <div className="p-4 border-b border-[#dbdfe6] bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FolderOpen className="text-green-600" size={18} />
                        <span className="font-bold text-sm text-gray-900">File Tree</span>
                    </div>
                    <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded font-bold">{sheets.length} Sheets</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[calc(100vh-12rem)]">
                     {sheets.map(sheet => (
                         <div 
                            key={sheet.id}
                            onClick={() => setActiveSheetId(sheet.id)} 
                            className={`flex flex-col gap-1 p-2 rounded-lg cursor-pointer transition-colors group
                                ${activeSheetId === sheet.id ? 'bg-[#135bec]/5 border border-[#135bec]/10' : 'hover:bg-gray-50 border border-transparent'}
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="text-green-600" size={16} />
                                <span className={`text-xs font-bold truncate ${activeSheetId === sheet.id ? 'text-[#135bec]' : 'text-gray-700'}`}>
                                    {sheet.name}
                                </span>
                            </div>
                            {/* Sub-tables visualization */}
                            <div className="ml-6 space-y-1">
                                {sheet.tables.map(t => (
                                    <div key={t.id} className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        <span>{t.name}</span>
                                    </div>
                                ))}
                            </div>
                         </div>
                     ))}
                </div>
             </div>
        </div>
    </div>
  );
};
