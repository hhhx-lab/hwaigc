import React, { useState, useEffect } from 'react';
import { ExcelSheet, ExcelTable } from '../types';
import { Check, AlertCircle, Table as TableIcon, RefreshCw, History, ArrowRight, Save, FileSpreadsheet, FolderOpen, ChevronRight, ChevronDown, FileText, Columns, Layout, Eye, Filter } from 'lucide-react';

interface Props {
  sheets: ExcelSheet[];
  onConfirm: () => void;
}

export const ExcelViewer: React.FC<Props> = ({ sheets, onConfirm }) => {
  // Initialize selection state
  const [activeSheetId, setActiveSheetId] = useState<string>(sheets[0]?.id || '');
  const [activeTableId, setActiveTableId] = useState<string>(sheets[0]?.tables[0]?.id || '');
  
  // Track visible columns for each table: { [tableId]: [colIndex1, colIndex2, ...] }
  const [visibleColIndices, setVisibleColIndices] = useState<Record<string, number[]>>({});

  // Helper: Get currently active data objects
  const getActiveObjects = () => {
      const sheet = sheets.find(s => s.id === activeSheetId);
      const table = sheet?.tables.find(t => t.id === activeTableId) || sheet?.tables[0];
      return { sheet, table };
  };

  const { sheet: activeSheet, table: activeTable } = getActiveObjects();

  // Sync sheet selection if table changes programmatically
  useEffect(() => {
      if (activeTable) {
          const parentSheet = sheets.find(s => s.tables.some(t => t.id === activeTable.id));
          if (parentSheet && parentSheet.id !== activeSheetId) {
              setActiveSheetId(parentSheet.id);
          }
      }
  }, [activeTableId, sheets, activeSheetId]);

  // Handle Column Toggling
  const toggleColumn = (tableId: string, colIndex: number, totalCols: number) => {
      setVisibleColIndices(prev => {
          // Default to all visible if not yet tracked
          const currentVisible = prev[tableId] || Array.from({ length: totalCols }, (_, i) => i);
          
          if (currentVisible.includes(colIndex)) {
              // Prevent hiding the last column
              if (currentVisible.length <= 1) return prev;
              return { ...prev, [tableId]: currentVisible.filter(i => i !== colIndex) };
          } else {
              return { 
                  ...prev, 
                  [tableId]: [...currentVisible, colIndex].sort((a, b) => a - b) 
              };
          }
      });
  };

  // Determine which columns to show for the active table
  const currentVisibleIndices = activeTable 
      ? (visibleColIndices[activeTable.id] || activeTable.headers.map((_, i) => i))
      : [];

  // Mock Stats
  const rowCount = activeTable?.rows.length || 0;
  const missingRate = "1.2%"; 
  const complianceScore = "99.5%"; 

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto p-6 gap-6">
        
        {/* Top Header Section */}
        <div className="flex justify-between items-center shrink-0">
            <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="hover:text-[#135bec] cursor-pointer">Assets Center</span>
                    <span>/</span>
                    <span className="text-gray-900 font-medium uppercase tracking-wider">Excel Intelligent Parsing</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Step 1: Data Processing & Deep Analysis</h1>
            </div>
            {/* Progress Widget */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 min-w-[320px]">
                 <div className="flex-1 px-2">
                    <div className="flex justify-between mb-1">
                        <p className="text-[#135bec] text-xs font-bold uppercase">Overall Progress</p>
                        <p className="text-gray-900 text-xs font-bold">1 / 5</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                         <div className="w-[20%] h-full bg-[#135bec]"></div>
                    </div>
                 </div>
            </div>
        </div>

        {/* Two-Column Layout Container */}
        <div className="flex flex-row items-start gap-6">
             
             {/* LEFT COLUMN: Main Content Area */}
             <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#dbdfe6] shadow-sm min-h-[600px]">
                
                {/* Content Header */}
                <div className="p-4 border-b border-[#dbdfe6] flex justify-between items-center bg-gray-50/50 rounded-t-xl sticky top-[64px] z-10 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-[#135bec]/10 rounded-lg flex items-center justify-center text-[#135bec]">
                            <TableIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm tracking-tight text-gray-900">AI Parsing Details</h3>
                            <p className="text-[10px] text-gray-500">
                                Viewing: <span className="font-semibold text-gray-700">{activeSheet?.name || 'No Data'}</span>
                            </p>
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

                {/* Content Body */}
                <div className="p-8 space-y-8">
                    
                    {/* Summary Card */}
                    {activeTable ? (
                        <div className="bg-[#135bec]/5 rounded-xl p-6 border border-[#135bec]/10 relative">
                             <div className="flex items-center gap-2 mb-2">
                                <FileText className="text-[#135bec]" size={18} />
                                <h4 className="text-sm font-bold text-[#135bec] uppercase">Data Deep Summary</h4>
                             </div>
                             <p className="text-sm text-gray-700 leading-relaxed">
                                 The AI has analyzed <span className="font-bold">{activeTable.name}</span> containing <span className="font-bold">{rowCount} rows</span>. 
                                 It suggests a standard time-series comparison layout. 
                                 <br/>
                                 Currently displaying <span className="font-bold bg-white px-1 rounded border border-[#135bec]/20">{currentVisibleIndices.length}</span> of {activeTable.headers.length} available columns.
                             </p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-8 rounded-xl text-center border border-dashed border-gray-300">
                            <p className="text-gray-400">Select a table from the sidebar to view details.</p>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                         <div className="border border-[#dbdfe6] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Missing Values</span>
                            <span className="text-2xl font-bold text-gray-900">{missingRate}</span>
                         </div>
                         <div className="border border-[#dbdfe6] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Outliers</span>
                            <span className="text-2xl font-bold text-orange-500">0</span>
                         </div>
                         <div className="border border-[#dbdfe6] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Compliance</span>
                            <span className="text-2xl font-bold text-green-600">{complianceScore}</span>
                         </div>
                    </div>

                    {/* Data Table */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Layout className="text-gray-500" size={18} />
                                <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Live Data Preview</span>
                            </div>
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">Read-only View</span>
                        </div>
                        
                        <div className="border border-[#dbdfe6] rounded-lg overflow-hidden shadow-sm">
                             {activeTable && (
                                 <div className="overflow-x-auto">
                                     <table className="min-w-full divide-y divide-gray-200 text-xs">
                                         <thead className="bg-gray-50">
                                             <tr>
                                                 {activeTable.headers.map((h, i) => {
                                                     if (!currentVisibleIndices.includes(i)) return null;
                                                     return (
                                                        <th key={i} className="px-4 py-3 text-left font-bold text-gray-600 uppercase border-r border-gray-200 last:border-0 whitespace-nowrap bg-gray-100/50">
                                                            {h}
                                                        </th>
                                                     );
                                                 })}
                                             </tr>
                                         </thead>
                                         <tbody className="bg-white divide-y divide-gray-100">
                                             {activeTable.rows.slice(0, 15).map((row, rIdx) => (
                                                 <tr key={rIdx} className="hover:bg-[#135bec]/5 transition-colors">
                                                     {row.map((cell, cIdx) => {
                                                         if (!currentVisibleIndices.includes(cIdx)) return null;
                                                         return (
                                                            <td key={cIdx} className="px-4 py-3 text-gray-700 whitespace-nowrap border-r border-gray-100 last:border-0 font-medium">
                                                                {cell}
                                                            </td>
                                                         );
                                                     })}
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>

                {/* Content Footer */}
                <div className="p-6 border-t border-[#dbdfe6] bg-white flex justify-between items-center rounded-b-xl mt-auto sticky bottom-0 z-20">
                    <button className="px-6 py-2.5 text-[#135bec] font-bold text-sm flex items-center gap-2 hover:bg-blue-50 rounded-lg transition-colors">
                        <Save size={16}/> Save Progress
                    </button>
                    <button onClick={onConfirm} className="px-8 py-2.5 bg-[#135bec] text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                        <span>Next: Protocol Review</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
             </div>

             {/* RIGHT COLUMN: Sidebar (File Tree & Column Mapping) */}
             <div className="w-80 flex-shrink-0 flex flex-col gap-4 sticky top-28 self-start max-h-[calc(100vh-8rem)]">
                
                {/* Panel: File Tree */}
                <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm flex flex-col overflow-hidden max-h-[50vh]">
                    <div className="p-3 border-b border-[#dbdfe6] bg-gray-50/80 flex items-center justify-between backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="text-green-600" size={16} />
                            <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">Data Assets</span>
                        </div>
                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">{sheets.length}</span>
                    </div>
                    
                    <div className="overflow-y-auto p-2 space-y-1">
                        {sheets.map(sheet => (
                            <div key={sheet.id} className="space-y-1">
                                <div 
                                    onClick={() => { setActiveSheetId(sheet.id); setActiveTableId(sheet.tables[0]?.id); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border
                                        ${activeSheetId === sheet.id ? 'bg-[#135bec]/5 border-[#135bec]/20' : 'bg-transparent border-transparent hover:bg-gray-50'}
                                    `}
                                >
                                    <FileSpreadsheet size={16} className={activeSheetId === sheet.id ? "text-[#135bec]" : "text-gray-400"} />
                                    <span className={`text-xs font-bold truncate flex-1 ${activeSheetId === sheet.id ? "text-[#135bec]" : "text-gray-600"}`}>
                                        {sheet.name}
                                    </span>
                                    {activeSheetId === sheet.id && <ChevronDown size={14} className="text-[#135bec]"/>}
                                </div>

                                {activeSheetId === sheet.id && (
                                    <div className="ml-4 pl-3 border-l-2 border-gray-100 space-y-1 my-1">
                                        {sheet.tables.map(table => (
                                            <div 
                                                key={table.id}
                                                onClick={() => setActiveTableId(table.id)}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                                                    ${activeTableId === table.id ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900'}
                                                `}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${activeTableId === table.id ? 'bg-[#135bec]' : 'bg-gray-300'}`}></div>
                                                <span className="text-xs truncate">{table.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panel: Column Mapping (Dynamic based on selection) */}
                <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm flex flex-col flex-1 overflow-hidden min-h-[200px]">
                    <div className="p-3 border-b border-[#dbdfe6] bg-gray-50/80 flex items-center gap-2">
                        <Columns className="text-purple-600" size={16} />
                        <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">Column Mapping</span>
                    </div>

                    {activeTable ? (
                        <div className="p-2 overflow-y-auto flex-1 space-y-0.5 scrollbar-thin">
                            <div className="px-2 py-1.5 text-[10px] text-gray-400 font-medium flex justify-between">
                                <span>Visible Columns</span>
                                <span>{currentVisibleIndices.length} Selected</span>
                            </div>
                            
                            {activeTable.headers.map((header, idx) => {
                                const isVisible = currentVisibleIndices.includes(idx);
                                return (
                                    <div 
                                        key={idx}
                                        onClick={() => toggleColumn(activeTable.id, idx, activeTable.headers.length)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors group
                                            ${isVisible ? 'hover:bg-gray-50' : 'opacity-60 hover:opacity-100 hover:bg-gray-50'}
                                        `}
                                    >
                                        <div className={`
                                            w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all flex-shrink-0
                                            ${isVisible ? 'bg-[#135bec] border-[#135bec] text-white' : 'bg-white border-gray-300 group-hover:border-gray-400'}
                                        `}>
                                            {isVisible && <Check size={10} strokeWidth={4} />}
                                        </div>
                                        <span className={`text-xs font-medium truncate select-none ${isVisible ? 'text-gray-700' : 'text-gray-400 decoration-slate-400'}`}>
                                            {header}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                            <Filter size={24} className="mb-2 opacity-20" />
                            <p className="text-xs">Select a table to configure columns</p>
                        </div>
                    )}
                </div>

             </div>
        </div>
    </div>
  );
};
