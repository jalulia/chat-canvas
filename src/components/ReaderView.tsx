import { useState, useCallback, useRef, useEffect } from 'react';
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

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      { threshold: 0.15 }
    );

    contentRef.current?.querySelectorAll('.turn').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

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
    <div style={{ background: 'var(--paper)' }} className="min-h-screen">
      {/* Chrome bar */}
      <div
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-7 py-5 font-mono-editorial text-[10.5px] tracking-[0.16em] uppercase text-white pointer-events-none"
        style={{ mixBlendMode: 'difference' }}
      >
        <span>CHAT CANVAS</span>
        <span>TRANSCRIPT TOOL · MMXXVI</span>
      </div>

      {/* Hero section */}
      <section
        className="relative min-h-[70vh] w-full overflow-hidden flex items-center justify-center text-center px-6 py-24"
        style={{ background: 'var(--ink)' }}
      >
        <div className="relative z-10">
          <div
            className="font-mono-editorial text-[10.5px] tracking-[0.22em] uppercase mb-5 inline-flex items-center gap-3"
            style={{ color: 'rgba(255,255,255,.5)' }}
          >
            <span className="w-7 h-px" style={{ background: 'rgba(255,255,255,.3)' }} />
            <span>{transcript.messages.length} turns · {transcript.speakers.length} speakers</span>
            <span className="w-7 h-px" style={{ background: 'rgba(255,255,255,.3)' }} />
          </div>
          <h1
            className="font-display text-[clamp(48px,10vw,140px)] leading-[0.92] tracking-[-0.025em] mb-7"
            style={{ color: '#f6f1e4' }}
          >
            {transcript.speakers.join(' & ')}
          </h1>
          <p
            className="text-lg font-light max-w-[52ch] mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,.6)' }}
          >
            {subtitle || 'A conversation rendered as editorial artifact.'}
          </p>
        </div>
        <div
          className="absolute left-1/2 bottom-7 -translate-x-1/2 font-mono-editorial text-[9.5px] tracking-[0.22em] uppercase flex flex-col items-center gap-2.5 z-10"
          style={{ color: 'rgba(255,255,255,.5)' }}
        >
          <span>scroll</span>
          <span
            className="w-px h-9 block animate-drip"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,.6), transparent)' }}
          />
        </div>
      </section>

      {/* Toolbar */}
      <div
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{
          background: 'rgba(255,255,255,.9)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="max-w-3xl mx-auto px-7 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 transition-colors font-mono-editorial text-[10px] tracking-[0.14em] uppercase"
            style={{ color: 'var(--mute)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mute)')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            New transcript
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-sm transition-all font-mono-editorial text-[10px] tracking-[0.14em] uppercase"
              style={{
                borderColor: 'var(--line)',
                color: 'var(--mute)',
                opacity: exporting ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--ink)';
                e.currentTarget.style.borderColor = 'var(--mute)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--mute)';
                e.currentTarget.style.borderColor = 'var(--line)';
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportHTML}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-sm transition-all font-mono-editorial text-[10px] tracking-[0.14em] uppercase"
              style={{
                borderColor: 'var(--line)',
                color: 'var(--mute)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--ink)';
                e.currentTarget.style.borderColor = 'var(--mute)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--mute)';
                e.currentTarget.style.borderColor = 'var(--line)';
              }}
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
          <div className="max-w-[40rem] mx-auto px-7 relative">
            {/* Center rail */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none"
              style={{
                background: 'var(--rail)',
                transform: 'translateX(-50%)',
              }}
            />

            {transcript.messages.map((msg) => (
              <ChatTurn key={msg.id} message={msg} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="max-w-3xl mx-auto px-7 py-8 border-t flex justify-between font-mono-editorial text-[10px] tracking-[0.18em] uppercase"
        style={{
          borderColor: 'var(--line)',
          color: 'var(--mute)',
        }}
      >
        <span>Chat Canvas</span>
        <span>{transcript.messages.length} messages</span>
      </footer>
    </div>
  );
};

export default ReaderView;