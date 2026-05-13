
import React, { useState } from 'react';

interface HelpTipProps {
  tip: string;
  label?: string;
}

const HelpTip: React.FC<HelpTipProps> = ({
  tip,
  label = 'Need help with voice input?',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1 mb-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="text-[0.6rem] leading-none">{open ? '▾' : '▸'}</span>
        <span>{label}</span>
      </button>
      {open && (
        <p className="mt-1.5 text-xs text-gray-600 bg-gray-50 border-l-2 border-gray-300 pl-3 pr-2 py-2 rounded-r">
          {tip}
        </p>
      )}
    </div>
  );
};

export default HelpTip;
