import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, FileText, Code } from 'lucide-react';
import type { ParsedTranscript } from '@/lib/parseTranscript';
import ChatTurn from './ChatTurn';
import { exportAsPDF, exportAsHTML } from '@/lib/exportUtils';

interface ReaderViewProps {
  transcript: ParsedTranscript;
  subtitle: string;
  onSubtitleChange: (s: string) => void;
  onBack: () => void;
}

const ReaderView = ({ transcript, subtitle, onSubtitleChange, onBack }: ReaderViewProps) => {
  const [exporting, setExporting] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Single IntersectionObserver for all turns
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const turns = contentRef.current?.querySelectorAll('.turn');
    turns?.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [transcript]);

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
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-7 py-5 pointer-events-none"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10.5px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
          mixBlendMode: 'difference' as const,
          color: '#fff',
        }}
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
            className="mb-5 inline-flex items-center gap-3"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10.5px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,.5)',
            }}
          >
            <span className="w-7 h-px" style={{ background: 'rgba(255,255,255,.3)' }} />
            <span>{transcript.messages.length} turns · {transcript.speakers.length} speakers</span>
            <span className="w-7 h-px" style={{ background: 'rgba(255,255,255,.3)' }} />
          </div>
          <h1
            className="font-display leading-[0.92] tracking-[-0.025em] mb-7"
            style={{ color: '#f6f1e4', fontSize: 'clamp(48px, 10vw, 140px)' }}
          >
            {transcript.speakers.join(' & ')}
          </h1>

          {/* Editable subtitle */}
          {editingSubtitle ? (
            <input
              type="text"
              value={subtitle}
              onChange={(e) => onSubtitleChange(e.target.value)}
              onBlur={() => setEditingSubtitle(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingSubtitle(false); }}
              className="text-lg font-light max-w-[52ch] mx-auto leading-relaxed bg-transparent border-b focus:outline-none text-center w-full"
              style={{ color: 'rgba(255,255,255,.6)', borderColor: 'rgba(255,255,255,.2)' }}
              placeholder="Add a subtitle…"
              autoFocus
            />
          ) : (
            <p
              className="text-lg font-light max-w-[52ch] mx-auto leading-relaxed cursor-pointer transition-colors"
              style={{ color: 'rgba(255,255,255,.6)' }}
              onClick={() => setEditingSubtitle(true)}
              title="Click to edit subtitle"
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.85)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}
            >
              {subtitle || 'Click to add a subtitle…'}
            </p>
          )}
        </div>
        <div
          className="absolute left-1/2 bottom-7 -translate-x-1/2 flex flex-col items-center gap-2.5 z-10"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9.5px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,.5)',
          }}
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
            className="inline-flex items-center gap-2 transition-colors"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              color: 'var(--mute)',
            }}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-sm transition-all"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-sm transition-all"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
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
        className="max-w-3xl mx-auto px-7 py-8 border-t flex justify-between"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase' as const,
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
