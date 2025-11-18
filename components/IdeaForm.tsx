
import React, { useState } from 'react';

export const IdeaForm: React.FC = () => {
  const [idea, setIdea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      console.log('User idea submitted:', idea);
      // In a real application, this would trigger an API call.
      alert("Thanks for your idea! I'm ready to get started.");
    } else {
      alert('Please describe your idea first!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g., An app that generates workout plans using AI, tracks progress, and suggests healthy recipes..."
          className="w-full h-40 p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow duration-300 resize-none"
          aria-label="Describe your project idea"
        />
        <button
          type="submit"
          className="w-full md:w-auto self-center px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity transform hover:scale-105 duration-300 shadow-lg shadow-purple-500/20"
        >
          Let's Build It
        </button>
      </div>
    </form>
  );
};
