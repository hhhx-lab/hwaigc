import React from 'react';
import { AppStep } from '../types';
import { LayoutDashboard, FileText, Database, GitMerge, FileCheck, Settings, Search, Bell } from 'lucide-react';

interface LayoutProps {
  currentStep: AppStep;
  children: React.ReactNode;
}

const STEPS = [
  { id: AppStep.SETUP, label: 'Project Setup' },
  { id: AppStep.PROTOCOL_REVIEW, label: 'Protocol' },
  { id: AppStep.EXCEL_REVIEW, label: 'Data Processing' },
  { id: AppStep.MAPPING, label: 'Mapping' },
  { id: AppStep.REPORT_GENERATION, label: 'Generation' },
];

export const Layout: React.FC<LayoutProps> = ({ currentStep, children }) => {
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f8] text-[#111318]">
      {/* Header */}
      <header className="bg-white border-b border-[#dbdfe6] h-16 flex items-center px-8 justify-between flex-shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
                <div className="size-8 bg-[#135bec] rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <LayoutDashboard size={18} />
                </div>
                <h1 className="text-lg font-bold tracking-tight">SciReport AI</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
                <a href="#" className="text-sm font-medium text-gray-900 border-b-2 border-[#135bec] pb-5 mt-5">Project</a>
                <a href="#" className="text-sm font-medium text-gray-500 hover:text-[#135bec] transition-colors pb-5 mt-5 border-b-2 border-transparent">Templates</a>
                <a href="#" className="text-sm font-medium text-gray-500 hover:text-[#135bec] transition-colors pb-5 mt-5 border-b-2 border-transparent">Assets</a>
                <a href="#" className="text-sm font-medium text-gray-500 hover:text-[#135bec] transition-colors pb-5 mt-5 border-b-2 border-transparent">Settings</a>
            </nav>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
                <Search size={16} className="text-gray-400 mr-2" />
                <input 
                    type="text" 
                    placeholder="Search project..." 
                    className="bg-transparent border-none text-sm w-full outline-none text-gray-700 placeholder-gray-400"
                />
            </div>
            <div className="relative cursor-pointer">
                <Bell size={20} className="text-gray-500 hover:text-[#135bec]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200"></div>
        </div>
      </header>

      {/* Breadcrumb / Progress Header (If not in Setup) */}
      {currentStep !== AppStep.SETUP && (
          <div className="bg-white border-b border-[#dbdfe6] px-8 py-3 flex items-center justify-center sticky top-16 z-40">
             <div className="flex items-center gap-1 w-full max-w-4xl">
                {STEPS.map((step, idx) => {
                    const isActive = idx === currentStepIndex;
                    const isCompleted = idx < currentStepIndex;

                    return (
                        <div key={step.id} className="flex-1 flex items-center">
                            <div className={`flex flex-col items-center gap-1 w-full relative`}>
                                <div className={`w-full h-1 rounded-full mb-2 ${isCompleted ? 'bg-[#135bec]' : isActive ? 'bg-[#135bec]' : 'bg-gray-200'}`}></div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-[#135bec]' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    )
                })}
             </div>
          </div>
      )}

      {/* Main Content Area - Layout changed to flow naturally */}
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
};
