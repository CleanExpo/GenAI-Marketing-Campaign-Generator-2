import React from 'react';

interface AnalysisCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-slate-800/50 rounded-lg p-6 shadow-md border border-slate-700 ${className || ''}`}>
      <h3 className="text-xl font-bold text-cyan-400 mb-4">{title}</h3>
      <div className="text-slate-300 space-y-3">
        {children}
      </div>
    </div>
  );
};
