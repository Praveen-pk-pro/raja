
import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 text-left transition-all duration-300 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/10">
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-slate-700 text-purple-400">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-100">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
};
