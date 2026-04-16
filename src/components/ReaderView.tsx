import { useState, useCallback, useRef } from 'react';
import { ArrowLeft, FileText, Code } from 'lucide-react';
import type { ParsedTranscript } from '@/lib/parseTranscript';
import ChatTurn from './ChatTurn';
import { exportAsPDF, exportAsHTML } from '@/lib/exportUtils';

interface ReaderViewProps {
  transcript: ParsedTranscript;
  subtitle: string;
  onBack: () => void;
}

const ReaderView = ({ transcript, subtitle, onBack }: ReaderViewProps) => {
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      await exportAsPDF(transcript, []);
    } finally {
      setExporting(false);
    }
  }, [transcript]);

  const handleExportHTML = useCallback(() => {
    exportAsHTML(transcript, []);
  }, [transcript]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Chrome bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-7 py-5 font-mono-editorial text-[10.5px] tracking-[0.16em] uppercase mix-blend-difference text-primary-foreground pointer-events-none">
        <div className="flex items-center gap-4">
          <span>Conversations</span>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-breathe" />
          <span>with Mir</span>
        </div>
        <span>Conversations with Mir</span>
      </div>

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[540px] w-full bg-primary overflow-hidden flex items-center justify-center text-center px-6">
        <div className="relative z-10">
          <div className="font-mono-editorial text-[10.5px] tracking-[0.22em] uppercase text-primary-foreground/50 mb-5 inline-flex items-center gap-3">
            <span className="w-7 h-px bg-primary-foreground/30" />
            <span>{transcript.messages.length} turns &middot; {transcript.speakers.length} speakers</span>
            <span className="w-7 h-px bg-primary-foreground/30" />
          </div>
          <h1 className="font-serif text-primary-foreground text-[clamp(48px,10vw,140px)] leading-[0.92] tracking-[-0.025em]">
            Conversations<br />with Mir
          </h1>
          <p className="mt-7 text-primary-foreground/60 text-lg font-light max-w-[52ch] mx-auto leading-relaxed">
            {subtitle || 'an animated back and forth...'}
          </p>
        </div>
        <div className="absolute left-1/2 bottom-7 -translate-x-1/2 font-mono-editorial text-[9.5px] tracking-[0.22em] uppercase text-primary-foreground/40 flex flex-col items-center gap-2.5 z-10">
          <span>scroll</span>
          <span className="w-px h-9 bg-gradient-to-b from-primary-foreground/50 to-transparent animate-drip" />
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-line">
        <div className="max-w-3xl mx-auto px-7 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-mute-color hover:text-ink transition-colors font-mono-editorial text-[10px] tracking-[0.14em] uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            New transcript
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-sm text-mute-color hover:text-ink hover:border-mute-color transition-all font-mono-editorial text-[10px] tracking-[0.14em] uppercase disabled:opacity-40"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportHTML}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-sm text-mute-color hover:text-ink hover:border-mute-color transition-all font-mono-editorial text-[10px] tracking-[0.14em] uppercase"
            >
              <Code className="w-3.5 h-3.5" />
              HTML
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="py-24 pb-44" ref={contentRef}>
        <section className="relative">
          <div className="max-w-[56rem] mx-auto px-7 relative">
            {/* Center rail */}
            <div className="absolute left-[40%] top-0 bottom-0 w-px bg-rail pointer-events-none" />

            {transcript.messages.map((msg) => (
              <ChatTurn key={msg.id} message={msg} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-7 py-8 border-t border-line flex justify-between font-mono-editorial text-[10px] tracking-[0.18em] uppercase text-mute-color">
        <span>Conversations with Mir</span>
        <span>{transcript.messages.length} messages</span>
      </footer>
    </div>
  );
};

export default ReaderView;