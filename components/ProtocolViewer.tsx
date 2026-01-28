import React, { useState, useRef, useEffect } from 'react';
import { ProtocolNode } from '../types';
import { ChevronRight, ChevronDown, FileText, Plus, Trash2, Edit2, ArrowRight, Sparkles, AlertCircle, FileType, CheckCircle, Search, BookOpen, ScrollText } from 'lucide-react';
import mammoth from 'mammoth';

interface Props {
  nodes: ProtocolNode[];
  protocolFile: File | null;
  onUpdate: (newNodes: ProtocolNode[]) => void;
  onConfirm: () => void;
}

interface TreeNodeProps {
  node: ProtocolNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string, updates: Partial<ProtocolNode>) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, selectedId, onSelect, onEdit, onAddChild, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Temporary state for editing
  const [editTitle, setEditTitle] = useState(node.title);
  const [editDesc, setEditDesc] = useState(node.description || '');

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(node.id, { 
        title: editTitle, 
        description: editDesc
    });
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(node.title);
    setEditDesc(node.description || '');
    setIsEditing(false);
  };

  const handleAddClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded(true); 
      onAddChild(node.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(`Delete section ${node.number} and all its contents?`)) {
          onDelete(node.id);
      }
  };

  // Selection handler
  const handleSelect = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.id);
  };

  return (
    <div className="flex flex-col relative">
      <div 
        className={`flex flex-col relative transition-all duration-200
            ${isSelected ? 'my-3' : 'my-1'}
        `}
        style={{ marginLeft: `${depth * 28}px` }}
      >
        
        {/* Node Header Row */}
        <div 
            onClick={handleSelect}
            className={`group flex items-center gap-3 cursor-pointer p-2 rounded-lg border
                ${isSelected 
                    ? 'bg-white border-[#135bec] shadow-md z-10' 
                    : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
                }
            `}
        >
            <button 
                className={`p-1 rounded text-gray-400 hover:text-gray-600 transition-colors ${!hasChildren && 'invisible'}`} 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            <span className={`font-mono text-sm font-bold ${isSelected ? 'text-[#135bec]' : 'text-gray-500'}`}>{node.number}</span>
            <span className={`text-sm font-medium flex-1 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{node.title}</span>
            
            {!isEditing && isSelected && (
                <div className="flex ml-auto gap-1 opacity-100">
                     <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-[#135bec] rounded bg-gray-50 hover:bg-blue-50" title="Edit"><Edit2 size={14}/></button>
                     {depth < 3 && <button onClick={handleAddClick} className="p-1.5 text-gray-400 hover:text-green-600 rounded bg-gray-50 hover:bg-green-50" title="Add Sub-section"><Plus size={14}/></button>}
                     <button onClick={handleDeleteClick} className="p-1.5 text-gray-400 hover:text-red-500 rounded bg-gray-50 hover:bg-red-50" title="Delete"><Trash2 size={14}/></button>
                </div>
            )}
        </div>

        {/* Selected Card View (Expanded Details) */}
        {isSelected && (
            <div className="ml-9 mt-2 bg-slate-50 rounded-lg border border-slate-200 p-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
                {isEditing ? (
                    <div className="flex flex-col gap-3">
                         <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Section Title</label>
                            <input 
                                type="text" 
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-bold focus:border-[#135bec] focus:ring-2 focus:ring-blue-50 outline-none"
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Description / Content Summary</label>
                            <textarea
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 focus:border-[#135bec] focus:ring-2 focus:ring-blue-50 outline-none resize-none"
                                rows={3}
                            />
                         </div>
                        <div className="flex justify-end gap-2 mt-1">
                             <button onClick={handleCancel} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                             <button onClick={handleSave} className="px-3 py-1.5 text-xs bg-[#135bec] text-white rounded font-bold hover:bg-blue-700">Save Changes</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {/* AI Section Header */}
                        <div className="flex items-center gap-2 text-[#135bec] mb-1">
                            <Sparkles size={14} />
                            <span className="text-xs font-bold uppercase tracking-wide">Generated Content Summary</span>
                        </div>

                        <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded border border-slate-100 shadow-sm">
                            {node.description || <span className="text-gray-400 italic">No description provided.</span>}
                        </p>
                        
                        <div className="flex gap-2">
                             <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium">Auto-generated from Protocol</span>
                             {node.acceptanceCriteria && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">Has Criteria</span>}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="flex flex-col relative">
           {/* Connector Line (Hierarchy) */}
           <div 
                className="absolute w-px bg-gray-200" 
                style={{ left: `${(depth * 28) + 16}px`, top: '0', bottom: '0' }}
           ></div>
           
           {node.children!.map(child => (
             <TreeNode 
                key={child.id} 
                node={child} 
                depth={depth + 1} 
                selectedId={selectedId}
                onSelect={onSelect}
                onEdit={onEdit} 
                onAddChild={onAddChild} 
                onDelete={onDelete} 
            />
           ))}
        </div>
      )}
    </div>
  );
};

export const ProtocolViewer: React.FC<Props> = ({ nodes, protocolFile, onUpdate, onConfirm }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id || null);
  const [protocolHtml, setProtocolHtml] = useState<string>('');
  const [isDocLoading, setIsDocLoading] = useState(false);

  // Load Protocol File
  useEffect(() => {
    const loadDoc = async () => {
        if (!protocolFile) return;
        setIsDocLoading(true);
        try {
            const arrayBuffer = await protocolFile.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setProtocolHtml(result.value);
        } catch (e) {
            console.error("Failed to load doc preview", e);
            setProtocolHtml('<p class="text-red-500">Failed to load document preview.</p>');
        } finally {
            setIsDocLoading(false);
        }
    };
    loadDoc();
  }, [protocolFile]);

  useEffect(() => {
    if (justAdded && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
        setJustAdded(false);
    }
  }, [nodes, justAdded]);

  // Recursion helpers
  const updateNodeRecursively = (currentNodes: ProtocolNode[], targetId: string, updates: Partial<ProtocolNode>): ProtocolNode[] => {
      return currentNodes.map(node => {
          if (node.id === targetId) return { ...node, ...updates };
          if (node.children) return { ...node, children: updateNodeRecursively(node.children, targetId, updates) };
          return node;
      });
  };
  const deleteNodeRecursively = (currentNodes: ProtocolNode[], targetId: string): ProtocolNode[] => {
      return currentNodes.filter(n => n.id !== targetId).map(n => ({...n, children: n.children ? deleteNodeRecursively(n.children, targetId) : []}));
  };
  const addChildRecursively = (currentNodes: ProtocolNode[], parentId: string): ProtocolNode[] => {
      return currentNodes.map(node => {
          if (node.id === parentId) {
              const children = node.children || [];
              const lastNum = children.length > 0 ? parseInt(children[children.length-1].number.split('.').pop() || '0') : 0;
              const newChild: ProtocolNode = {
                  id: `new-${Date.now()}`,
                  number: `${node.number}.${lastNum + 1}`,
                  title: 'New Sub-section',
                  description: 'Description placeholder...', level: node.level + 1, children: [], acceptanceCriteria: ''
              };
              return { ...node, children: [...children, newChild] };
          }
          if (node.children) return { ...node, children: addChildRecursively(node.children, parentId) };
          return node;
      });
  };

  const handleEdit = (id: string, updates: Partial<ProtocolNode>) => onUpdate(updateNodeRecursively(nodes, id, updates));
  const handleDelete = (id: string) => onUpdate(deleteNodeRecursively(nodes, id));
  const handleAddChild = (parentId: string) => onUpdate(addChildRecursively(nodes, parentId));
  const handleAddRoot = () => {
     let nextNum = nodes.length + 1;
     const newRoot: ProtocolNode = {
        id: `root-${Date.now()}`, number: nextNum.toString(), title: 'New Chapter', description: 'Chapter summary', level: 1, children: []
     };
     onUpdate([...nodes, newRoot]);
     setJustAdded(true);
  };

  return (
    <div className="flex flex-col w-full max-w-[1800px] mx-auto p-6 gap-4 h-[calc(100vh-4rem)]">
       
       {/* Header / Stats Panel */}
       <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-4 shrink-0">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#135bec]/10 rounded-lg text-[#135bec]">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Step 2: Structure Verification</h1>
                        <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
                            <span>Compare Original Protocol</span>
                            <ArrowRight size={12} />
                            <span>Target Report Directory</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <CheckCircle size={14} className="text-green-600"/> 
                        <span>Template: <strong>Standard GLP</strong></span>
                     </div>
                     <div className="w-px h-8 bg-gray-200"></div>
                     <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Completion</p>
                        <p className="text-gray-900 font-bold text-sm">40%</p>
                     </div>
                </div>
            </div>
       </div>

       {/* Main Content Split View */}
       <div className="flex gap-6 flex-1 overflow-hidden">
           
           {/* LEFT PANEL: Original Protocol Document */}
           <div className="w-1/2 flex flex-col bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
               <div className="p-3 bg-gray-50/80 border-b border-[#dbdfe6] flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
                   <div className="flex items-center gap-2">
                       <ScrollText className="text-gray-500" size={16} />
                       <span className="text-sm font-bold text-gray-800">Reference: Verification Protocol</span>
                   </div>
                   <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">
                       {protocolFile?.name || 'No file loaded'}
                   </span>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa] scrollbar-thin">
                   {isDocLoading ? (
                       <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                           <div className="w-6 h-6 border-2 border-gray-200 border-t-[#135bec] rounded-full animate-spin"></div>
                           <p className="text-xs font-medium">Rendering Document...</p>
                       </div>
                   ) : protocolHtml ? (
                       <div 
                           className="prose prose-sm max-w-none text-gray-800 [&>p]:mb-2 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:text-black [&>h2]:text-base [&>h2]:font-bold [&>h3]:text-sm [&>h3]:font-bold [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-gray-300 [&>table]:mb-4 [&>table]:text-xs [&>td]:border [&>td]:border-gray-300 [&>td]:p-1"
                           dangerouslySetInnerHTML={{ __html: protocolHtml }} 
                       />
                   ) : (
                       <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                           No preview available.
                       </div>
                   )}
               </div>
           </div>

           {/* RIGHT PANEL: Generated Tree Structure */}
           <div className="w-1/2 flex flex-col bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden relative">
                <div className="p-3 bg-gray-50 border-b border-[#dbdfe6] flex justify-between items-center sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <FileType className="text-[#135bec]" size={16} />
                        <h3 className="font-bold text-sm text-gray-900">Generated Report Directory</h3>
                    </div>
                    <button onClick={handleAddRoot} className="text-[#135bec] text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors border border-transparent hover:border-blue-100">
                        <Plus size={14} /> Add Chapter
                    </button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto bg-white scrollbar-thin">
                    {nodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-50">
                            <Sparkles size={32} className="text-gray-400 mb-2" />
                            <p className="text-gray-500 font-medium">Generating Report Structure...</p>
                        </div>
                    ) : (
                        <div className="pb-12">
                            {nodes.map(node => (
                                <TreeNode 
                                    key={node.id} 
                                    node={node} 
                                    depth={0} 
                                    selectedId={selectedNodeId}
                                    onSelect={setSelectedNodeId}
                                    onEdit={handleEdit} 
                                    onAddChild={handleAddChild} 
                                    onDelete={handleDelete}
                                />
                            ))}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* Footer Actions (Sticky inside Right Panel) */}
                <div className="p-4 border-t border-[#dbdfe6] bg-gray-50/90 backdrop-blur flex justify-between items-center absolute bottom-0 w-full z-30">
                     <button className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-xs text-gray-600 hover:bg-white transition-colors bg-white">
                        Save Draft
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-6 py-2 bg-[#135bec] text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                        <span>Confirm Structure & Next</span>
                        <ArrowRight size={14} />
                    </button>
                </div>
           </div>

       </div>
    </div>
  );
};
