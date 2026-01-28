import React, { useState, useRef, useEffect } from 'react';
import { ProtocolNode } from '../types';
import { ChevronRight, ChevronDown, FileText, Plus, Trash2, Edit2, ZoomIn, ZoomOut, Printer, ArrowRight, Sparkles, Check, X, AlertCircle } from 'lucide-react';

interface Props {
  nodes: ProtocolNode[];
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
  const [editCriteria, setEditCriteria] = useState(node.acceptanceCriteria || '');

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(node.id, { 
        title: editTitle, 
        description: editDesc, 
        acceptanceCriteria: editCriteria 
    });
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(node.title);
    setEditDesc(node.description || '');
    setEditCriteria(node.acceptanceCriteria || '');
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
        style={{ marginLeft: `${depth * 24}px` }}
      >
        
        {/* Node Header Row */}
        <div 
            onClick={handleSelect}
            className={`group flex items-center gap-2 cursor-pointer
                ${isSelected ? 'mb-2' : 'hover:bg-gray-50 rounded-lg py-1 px-2'}
            `}
        >
            <button 
                className={`p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors ${!hasChildren && 'invisible'}`} 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {isSelected ? (
                 <div className="w-2.5 h-2.5 rounded-full bg-[#135bec] ring-4 ring-blue-50 flex-shrink-0"></div>
            ) : (
                 <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-gray-400 ml-0.5 flex-shrink-0"></div>
            )}

            <span className={`font-mono text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-500 font-medium'}`}>{node.number}</span>
            <span className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700 font-medium'}`}>{node.title}</span>
            
            {!isEditing && isSelected && (
                <div className="flex ml-auto gap-1">
                     <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-[#135bec]" title="Edit"><Edit2 size={12}/></button>
                     {depth < 3 && <button onClick={handleAddClick} className="p-1 text-gray-400 hover:text-green-600" title="Add Sub-section"><Plus size={12}/></button>}
                     <button onClick={handleDeleteClick} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={12}/></button>
                </div>
            )}
        </div>

        {/* Selected Card View (Expanded Details) */}
        {isSelected && (
            <div className="ml-7 bg-white rounded-lg border border-blue-100 shadow-sm p-4 ring-1 ring-blue-50 relative overflow-hidden">
                {/* Visual Decoration */}
                <div className="absolute top-0 left-0 w-1 h-full bg-[#135bec]"></div>

                {isEditing ? (
                    <div className="flex flex-col gap-3">
                         <input 
                            type="text" 
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-bold focus:border-[#135bec] focus:ring-2 focus:ring-blue-50 outline-none"
                            placeholder="Section Title"
                        />
                         <textarea
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-600 focus:border-[#135bec] focus:ring-2 focus:ring-blue-50 outline-none resize-none"
                            rows={3}
                            placeholder="AI Instruction / Description..."
                        />
                         <input 
                            type="text"
                            value={editCriteria}
                            onChange={e => setEditCriteria(e.target.value)}
                            className="w-full border border-amber-200 bg-amber-50 rounded px-2 py-1.5 text-xs text-amber-800 focus:border-amber-500 outline-none"
                            placeholder="Acceptance Criteria..."
                        />
                        <div className="flex justify-end gap-2 mt-1">
                             <button onClick={handleCancel} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                             <button onClick={handleSave} className="px-3 py-1.5 text-xs bg-[#135bec] text-white rounded font-bold hover:bg-blue-700">Save Changes</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {/* AI Section Header */}
                        <div className="flex items-center gap-1.5 text-[#135bec]">
                            <Sparkles size={14} />
                            <span className="text-xs font-bold uppercase tracking-wide">AI Summary & Writing Requirements</span>
                        </div>

                        <div className="bg-slate-50 rounded-md p-3 border border-slate-100">
                             <p className="text-sm text-gray-600 leading-relaxed">
                                {node.description || <span className="text-gray-400 italic">No description provided for this section.</span>}
                             </p>
                        </div>

                        {node.acceptanceCriteria && (
                            <div className="flex items-start gap-2 text-amber-700 bg-amber-50/50 p-2 rounded border border-amber-100">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <p className="text-xs font-medium">{node.acceptanceCriteria}</p>
                            </div>
                        )}
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
                style={{ left: `${(depth * 24) + 11}px`, top: '0', bottom: '0' }}
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

export const ProtocolViewer: React.FC<Props> = ({ nodes, onUpdate, onConfirm }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id || null);

  useEffect(() => {
    if (justAdded && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
        setJustAdded(false);
    }
  }, [nodes, justAdded]);

  // Recursion helpers omitted for brevity, logic identical to previous
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
                  description: '', level: node.level + 1, children: [], acceptanceCriteria: ''
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
    <div className="flex flex-col w-full max-w-[1600px] mx-auto p-6 gap-6">
       {/* Header / Stats */}
       <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="hover:text-[#135bec] cursor-pointer">Project Management</span>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Protocol Analysis</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Step 1: Protocol Parsing & Task Tree</h1>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div>
                    <p className="text-[#135bec] text-xs font-bold uppercase">Progress</p>
                    <p className="text-gray-900 font-bold text-sm">1 / 5</p>
                </div>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="w-1/5 h-full bg-[#135bec]"></div>
                </div>
            </div>
       </div>

       {/* Main Layout: Preview (Sticky) + Tree (Scrolls with page) */}
       <div className="flex items-start gap-6">
            
            {/* Left: Document Preview - Sticky Sidebar */}
            <div className="w-1/2 flex flex-col bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden sticky top-28 h-[calc(100vh-8rem)]">
                <div className="p-3 border-b border-[#dbdfe6] bg-gray-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <FileText size={16} className="text-red-500" />
                        <span>Protocol Preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-gray-200 rounded"><ZoomOut size={16} /></button>
                        <span className="text-xs font-bold">100%</span>
                        <button className="p-1 hover:bg-gray-200 rounded"><ZoomIn size={16} /></button>
                        <div className="h-4 w-px bg-gray-300 mx-1"></div>
                        <button className="p-1 hover:bg-gray-200 rounded"><Printer size={16} /></button>
                    </div>
                </div>
                <div className="flex-1 bg-[#525659] p-8 overflow-y-auto flex justify-center">
                    {/* Simulated Paper */}
                    <div className="bg-white w-full max-w-[600px] shadow-2xl min-h-[800px] p-12 flex flex-col gap-4">
                        <div className="w-1/3 h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="w-full h-8 bg-gray-100 rounded mb-2"></div>
                        <div className="space-y-2">
                             <div className="w-full h-3 bg-gray-50 rounded"></div>
                             <div className="w-full h-3 bg-gray-50 rounded"></div>
                             <div className="w-3/4 h-3 bg-gray-50 rounded"></div>
                        </div>
                         <div className="w-1/2 h-6 bg-gray-100 rounded mt-6 mb-2"></div>
                         <div className="border-l-4 border-[#135bec] pl-4 py-2 bg-blue-50/30">
                             <div className="w-2/3 h-4 bg-[#135bec]/20 rounded mb-2"></div>
                             <div className="w-full h-3 bg-blue-50 rounded"></div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right: Task Tree - Natural Page Flow */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
                <div className="p-4 border-b border-[#dbdfe6] bg-gray-50 flex justify-between items-center shrink-0 rounded-t-xl">
                    <h3 className="font-bold text-sm text-gray-800">Writing Task Tree</h3>
                    <button onClick={handleAddRoot} className="text-[#135bec] text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                        <Plus size={14} /> Add Root Chapter
                    </button>
                </div>
                
                {/* List Area */}
                <div className="p-6 min-h-[500px]">
                    {nodes.length === 0 ? (
                        <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                             <div className="bg-gray-100 p-4 rounded-full mb-3">
                                <Plus size={24} />
                             </div>
                             <p className="text-sm font-medium">No chapters yet.</p>
                             <p className="text-xs">Add a root chapter to begin.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
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

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#dbdfe6] bg-white flex flex-col gap-3 rounded-b-xl">
                     <button 
                        onClick={onConfirm}
                        className="w-full h-11 bg-[#135bec] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                        <span>Next: Material Processing</span>
                        <ArrowRight size={18} />
                    </button>
                    <button className="w-full h-10 border border-gray-200 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        Save Draft
                    </button>
                </div>
            </div>
       </div>
    </div>
  );
};
