'use client';

import { useState } from 'react';

interface RoomCodeProps {
  code: string;
}

export default function RoomCode({ code }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-lg font-semibold text-white">Room Code</h2>
      <div className="flex items-center space-x-2">
        <code className="px-4 py-2 bg-gray-700 rounded text-xl font-mono text-white">
          {code}
        </code>
        <button
          onClick={copyToClipboard}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
        >
          {copied ? (
            <span className="text-green-500">Copied!</span>
          ) : (
            <span className="text-white">Copy</span>
          )}
        </button>
      </div>
    </div>
  );
} 