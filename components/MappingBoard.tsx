import React, { useState, useMemo, useEffect } from 'react';
import { ProtocolNode, ExcelSheet, ChapterMapping, ExcelTable } from '../types';
import { ArrowRight, Check, FileSpreadsheet, Columns, AlertCircle, ChevronRight, ChevronDown, Plus, X, LayoutList, Sparkles, Eye, Menu, RefreshCw, Upload, Table } from 'lucide-react';

interface Props {
  protocol: ProtocolNode[];
  excelData: ExcelSheet[];
  initialMappings: ChapterMapping[];
  onConfirm: (mappings: ChapterMapping[]) => void;
}

export const MappingBoard: React.FC<Props> = ({ protocol, excelData, initialMappings, onConfirm }) => {
  const [mappings, setMappings] = useState<ChapterMapping[]>(initialMappings);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);

  // Auto-select first node
  useEffect(() => {
    if (!selectedProtocolId && protocol.length > 0) setSelectedProtocolId(protocol[0].id);
  }, [protocol]);

  // Flattened list for the sidebar
  const visibleTreeItems = useMemo(() => {
    const list: { node: ProtocolNode; depth: number }[] = [];
    const traverse = (nodes: ProtocolNode[], depth: number) => {
        nodes.forEach(node => {
            list.push({ node, depth });
            if (node.children) traverse(node.children, depth + 1);
        });
    };
    traverse(protocol, 0);
    return list;
  }, [protocol]);

  const selectedNode = useMemo(() => {
      const find = (nodes: ProtocolNode[]): ProtocolNode | null => {
          for (const node of nodes) {
              if (node.id === selectedProtocolId) return node;
              if (node.children) { const found = find(node.children); if (found) return found; }
          }
          return null;
      };
      return selectedProtocolId ? find(protocol) : null;
  }, [selectedProtocolId, protocol]);

  const currentMapping = mappings.find(m => m.protocolId === selectedProtocolId);
  const mappedTableIds = currentMapping?.tableIds || [];
  
  // Helpers to get table objects
  const getTable = (id: string) => {
      for (const sheet of excelData) {
          const t = sheet.tables.find(t => t.id === id);
          if (t) return { table: t, sheetName: sheet.name };
      }
      return null;
  };

  const handleLink = (tid: string) => {
      if(!selectedProtocolId) return;
      setMappings(prev => {
          const idx = prev.findIndex(m => m.protocolId === selectedProtocolId);
          if(idx >= 0) {
              const copy = [...prev];
              if(!copy[idx].tableIds.includes(tid)) copy[idx].tableIds.push(tid);
              return copy;
          }
          return [...prev, { protocolId: selectedProtocolId, tableIds: [tid], isVerified: false }];
      });
  }

  const handleUnlink = (tid: string) => {
      if(!selectedProtocolId) return;
      setMappings(prev => prev.map(m => m.protocolId === selectedProtocolId ? {...m, tableIds: m.tableIds.filter(id => id !== tid)} : m));
  }

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto p-6 gap-6">
        {/* Header */}
        <div className="shrink-0">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <p className="text-[#135bec] text-sm font-bold uppercase tracking-wider mb-1">Step 3 / 5</p>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Intelligent Data Mapping</h1>
                    <p className="text-gray-500 mt-1">Connecting Protocol Chapters to Excel Data Assets using AI Semantic Analysis.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <p className="text-gray-900 text-sm font-bold">Mapping Completion: 75%</p>
                    <div className="w-64 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-[#135bec]" style={{width: '75%'}}></div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 h-9 px-4 bg-[#135bec]/10 text-[#135bec] text-sm font-bold rounded-lg hover:bg-[#135bec]/20 transition">
                        <RefreshCw size={16} /> Re-analyze with AI
                    </button>
                    <button className="flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition">
                        <Upload size={16} /> Upload More Data
                    </button>
                </div>
                <div className="flex gap-8">
                    <button className="text-[#135bec] font-bold text-sm border-b-[3px] border-[#135bec] pb-2">All Sections ({visibleTreeItems.length})</button>
                    <button className="text-gray-500 font-bold text-sm border-b-[3px] border-transparent pb-2 hover:text-gray-700">Needs Review (3)</button>
                    <button className="text-gray-500 font-bold text-sm border-b-[3px] border-transparent pb-2 hover:text-gray-700">Matched (9)</button>
                </div>
            </div>
        </div>

        {/* Content Columns - Flow naturally */}
        <div className="flex gap-6 items-start">
            
            {/* LEFT COLUMN: Protocol Sections */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
                 <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between shrink-0 rounded-t-xl sticky top-[64px] z-10 backdrop-blur-sm">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-gray-900">
                        <Menu size={16} className="text-gray-400" /> Protocol Chapters
                    </h3>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Protocol v4.2</span>
                </div>
                
                <div className="p-4 space-y-3">
                    {visibleTreeItems.map(({node}) => {
                        const isSelected = selectedProtocolId === node.id;
                        const mapCount = mappings.find(m => m.protocolId === node.id)?.tableIds.length || 0;
                        
                        return (
                            <div 
                                key={node.id} 
                                onClick={() => setSelectedProtocolId(node.id)}
                                className={`rounded-xl p-4 border transition-all cursor-pointer relative group
                                    ${isSelected ? 'bg-white border-[#135bec] ring-2 ring-[#135bec]/5 shadow-md z-10' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                                `}
                            >
                                {isSelected && (
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#135bec] rounded-full flex items-center justify-center text-white z-10 shadow-sm">
                                        <Sparkles size={10} />
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'text-[#135bec] bg-[#135bec]/10' : 'text-gray-500 bg-gray-100'}`}>
                                        Section {node.number}
                                    </span>
                                    {mapCount > 0 ? (
                                        <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold uppercase">
                                            <Check size={12} /> Ready
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-amber-500 text-[10px] font-bold uppercase">
                                            <AlertCircle size={12} /> Unmapped
                                        </span>
                                    )}
                                </div>

                                <h4 className="text-sm font-bold text-gray-900 mb-2 leading-tight">{node.title}</h4>
                                
                                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-2">
                                    {node.description || "Analyze this section for key data points and compliance checks."}
                                </p>

                                {node.acceptanceCriteria && (
                                    <div className="inline-block text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100">
                                        Criteria: {node.acceptanceCriteria}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* RIGHT COLUMN: Matched Data */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between shrink-0 rounded-t-xl sticky top-[64px] z-10 backdrop-blur-sm">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-gray-900">
                        <Table size={16} className="text-gray-400" /> Matched Assets
                    </h3>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                        {mappedTableIds.length} Assets Linked
                    </span>
                </div>

                <div className="p-4 min-h-[400px]">
                    <div className="space-y-4">
                        {/* List Mapped Tables */}
                        {mappedTableIds.map(tid => {
                            const data = getTable(tid);
                            if(!data) return null;
                            const { table, sheetName } = data;

                            return (
                                <div key={tid} className="bg-white border-2 border-[#135bec] rounded-xl p-4 shadow-sm relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center text-green-600">
                                                <FileSpreadsheet size={16} />
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold text-gray-900">{sheetName}</h5>
                                                <p className="text-[10px] text-gray-500">{table.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-1">Match 98%</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleUnlink(tid)} className="text-red-400 text-[10px] font-bold uppercase hover:underline">Unlink</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Data Preview Mini */}
                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 overflow-x-auto">
                                        <table className="w-full bg-white text-[10px]">
                                            <thead className="bg-gray-100 text-gray-500">
                                                <tr>
                                                    {table.headers.slice(0, 4).map((h, i) => <th key={i} className="px-2 py-1 text-left whitespace-nowrap">{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-600">
                                                {table.rows.slice(0, 3).map((r, i) => (
                                                    <tr key={i}>
                                                        {r.slice(0, 4).map((c, ci) => <td key={ci} className="px-2 py-1 border-b border-gray-100 whitespace-nowrap">{c}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })}

                        {/* List Available Tables (Unmapped) */}
                        {mappedTableIds.length === 0 && (
                            <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                                <p className="text-gray-400 font-bold text-sm">No assets linked to this section yet.</p>
                                <p className="text-xs text-gray-300 mt-1">Select an asset from the pool below to link it manually.</p>
                            </div>
                        )}
                    </div>

                    {/* Available Assets Pool */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Available Assets Pool</h4>
                        <div className="space-y-3">
                            {excelData.flatMap(s => s.tables).filter(t => !mappedTableIds.includes(t.id)).slice(0, 5).map(t => (
                                <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-gray-400 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500">
                                            <Table size={16} />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-900 group-hover:text-blue-700">{t.name}</h5>
                                            <p className="text-[10px] text-gray-500">Available</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleLink(t.id)} className="opacity-0 group-hover:opacity-100 text-[#135bec] bg-blue-50 px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-blue-100 transition-all">
                                        Link
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>

        {/* Footer Actions - At page bottom */}
        <div className="shrink-0 flex justify-between items-center p-4 bg-white border border-gray-200 rounded-xl shadow-lg mt-4">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">+2</div>
                </div>
                <p className="text-xs text-gray-500 font-medium">Auto-saved 2 mins ago by Dr. Zhang</p>
            </div>
            <div className="flex gap-3">
                <button className="px-4 py-2 rounded-lg border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Save Draft
                </button>
                <button onClick={() => onConfirm(mappings)} className="px-6 py-2 rounded-lg bg-[#135bec] text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2 transition-all">
                    <span>Confirm & Next</span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    </div>
  );
};
