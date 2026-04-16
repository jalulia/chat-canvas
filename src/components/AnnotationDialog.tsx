import { useState } from 'react';
import { X } from 'lucide-react';

interface AnnotationDialogProps {
  messageId: string;
  messagePreview: string;
  onSave: (text: string, color: 'yellow' | 'blue' | 'green' | 'red') => void;
  onClose: () => void;
}

const colors: { value: 'yellow' | 'blue' | 'green' | 'red'; label: string; cls: string }[] = [
  { value: 'yellow', label: 'Note', cls: 'bg-signal' },
  { value: 'blue', label: 'Insight', cls: 'bg-ice' },
  { value: 'green', label: 'Agree', cls: 'bg-laminar' },
  { value: 'red', label: 'Disagree', cls: 'bg-heat' },
];

const AnnotationDialog = ({ messagePreview, onSave, onClose }: AnnotationDialogProps) => {
  const [text, setText] = useState('');
  const [color, setColor] = useState<'yellow' | 'blue' | 'green' | 'red'>('yellow');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-paper w-full max-w-md mx-4 rounded-sm border border-line shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line">
          <span className="font-mono-editorial text-[10px] tracking-[0.22em] uppercase text-mute-color">
            Add annotation
          </span>
          <button onClick={onClose} className="text-mute-color-2 hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message preview */}
        <div className="px-4 pt-4">
          <p className="text-sm text-mute-color leading-relaxed line-clamp-2 italic">
            "{messagePreview}"
          </p>
        </div>

        {/* Color selector */}
        <div className="flex gap-2 px-4 pt-4">
          {colors.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-sm border transition-all
                font-mono-editorial text-[9px] tracking-[0.18em] uppercase
                ${color === c.value ? 'border-ink text-ink' : 'border-line text-mute-color-2 hover:border-mute-color'}
              `}
            >
              <span className={`w-2 h-2 rounded-full ${c.cls}`} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your annotation..."
            className="w-full h-24 bg-paper-2 border border-line rounded-sm p-3 text-sm text-ink leading-relaxed placeholder:text-mute-color-2 focus:outline-none focus:border-mute-color resize-none"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-mute-color font-mono-editorial text-[10px] tracking-[0.14em] uppercase hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (text.trim()) onSave(text.trim(), color); }}
            disabled={!text.trim()}
            className="px-4 py-2 bg-ink text-paper rounded-sm font-mono-editorial text-[10px] tracking-[0.14em] uppercase disabled:opacity-30 hover:bg-ink-2 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnotationDialog;
