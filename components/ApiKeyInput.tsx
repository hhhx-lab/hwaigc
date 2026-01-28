import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

export const ApiKeyInput: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (!storedKey) {
      setIsOpen(true);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
      setIsOpen(false);
      window.location.reload(); // Simple reload to ensure services pick it up
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4 text-blue-600">
          <Key className="w-6 h-6" />
          <h2 className="text-xl font-bold">Enter Gemini API Key</h2>
        </div>
        <p className="text-gray-600 mb-4 text-sm">
          To generate clinical reports, this application requires a Google Gemini API Key. 
          Your key is stored locally in your browser.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
};
