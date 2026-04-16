import { useState, useCallback } from 'react';
import { Upload, FileText, Clipboard, AlertCircle } from 'lucide-react';

interface UploadViewProps {
  onTranscriptLoaded: (text: string) => void;
  error: string;
  onClearError: () => void;
}

const UploadView = ({ onTranscriptLoaded, error, onClearError }: UploadViewProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    onClearError();
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');
          fullText += pageText + '\n';
        }
        if (fullText.trim()) {
          onTranscriptLoaded(fullText);
        }
      } catch (err) {
        console.error('PDF parse error:', err);
      } finally {
        setLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) onTranscriptLoaded(text);
      };
      reader.readAsText(file);
    }
  }, [onTranscriptLoaded, onClearError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePasteSubmit = useCallback(() => {
    if (pasteText.trim()) {
      onClearError();
      onTranscriptLoaded(pasteText);
    }
  }, [pasteText, onTranscriptLoaded, onClearError]);

  return (
    <div style={{ background: 'var(--ink)' }} className="min-h-screen flex flex-col">
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
      <section className="flex-1 relative overflow-hidden flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl w-full text-center">
          <h1
            className="font-display leading-[0.92] tracking-[-0.025em] mb-6"
            style={{ color: '#f6f1e4', fontSize: 'clamp(48px, 8vw, 120px)' }}
          >
            Chat Canvas
          </h1>
          <p
            className="text-lg font-light max-w-md mx-auto leading-relaxed mb-16"
            style={{ color: 'rgba(255,255,255,.6)' }}
          >
            Upload a transcript. Get a designed editorial layout.
          </p>

          {/* Error feedback */}
          {error && (
            <div
              className="max-w-md mx-auto mb-8 flex items-start gap-3 text-left px-4 py-3 rounded-sm border"
              style={{
                background: 'rgba(255,90,31,.08)',
                borderColor: 'rgba(255,90,31,.25)',
                color: 'rgba(255,255,255,.8)',
              }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--heat)' }} />
              <p className="text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="max-w-md mx-auto mb-8 flex items-center justify-center gap-3" style={{ color: 'rgba(255,255,255,.6)' }}>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10.5px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Extracting text from PDF…
              </span>
            </div>
          )}

          {!showPaste ? (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className="relative border border-dashed rounded-sm p-16 cursor-pointer transition-all duration-300"
                style={{
                  borderColor: dragOver ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.15)',
                  background: dragOver ? 'rgba(255,255,255,.05)' : 'transparent',
                }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".txt,.md,.pdf"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Upload className="w-8 h-8 mx-auto mb-4" strokeWidth={1} style={{ color: 'rgba(255,255,255,.3)' }} />
                <p
                  className="mb-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase' as const,
                    color: 'rgba(255,255,255,.4)',
                  }}
                >
                  Drop file or click to browse
                </p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,.25)' }}>
                  .txt, .md, .pdf supported
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 justify-center my-8">
                <div className="h-px flex-1 max-w-8" style={{ background: 'rgba(255,255,255,.1)' }} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase' as const,
                    color: 'rgba(255,255,255,.3)',
                  }}
                >or</span>
                <div className="h-px flex-1 max-w-8" style={{ background: 'rgba(255,255,255,.1)' }} />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => { setShowPaste(true); onClearError(); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border rounded-sm transition-all"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10.5px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    borderColor: 'rgba(255,255,255,.15)',
                    color: 'rgba(255,255,255,.6)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,.6)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
                  }}
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Paste text
                </button>
                <button
                  onClick={() => onTranscriptLoaded(SAMPLE_TRANSCRIPT)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border rounded-sm transition-all"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10.5px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    borderColor: 'rgba(255,255,255,.15)',
                    color: 'rgba(255,255,255,.6)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,.6)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
                  }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Try sample
                </button>
              </div>
            </>
          ) : (
            <div className="text-left">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={'Paste your transcript here…\n\nSupported formats:\n  Speaker: message text\n  SPEAKER — 12:08 PM  (text on next line)\n  [timestamp] Speaker: message text\n  **Speaker**: message text'}
                className="w-full h-64 border rounded-sm p-5 text-sm leading-relaxed focus:outline-none resize-none transition-all"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'rgba(255,255,255,.05)',
                  borderColor: 'rgba(255,255,255,.15)',
                  color: 'rgba(255,255,255,.8)',
                }}
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowPaste(false); setPasteText(''); onClearError(); }}
                  className="px-5 py-2.5 border rounded-sm transition-all"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10.5px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    borderColor: 'rgba(255,255,255,.15)',
                    color: 'rgba(255,255,255,.5)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.5)'; }}
                >
                  Back
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  className="px-5 py-2.5 rounded-sm transition-all"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10.5px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    background: pasteText.trim() ? '#fff' : 'rgba(255,255,255,.3)',
                    color: 'var(--ink)',
                  }}
                >
                  Render
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const SAMPLE_TRANSCRIPT = `MIR — 12:08 PM
Let me pull the recent session strands to reconstruct what happened yesterday.

Okay. I've read through everything. Let me generate both documents for you.

Yesterday was a big day — and it didn't end well for the engine, but it ended well for the project. Let me write it up.

YOU — 12:17 PM
i think we scrub in and enter the operating room

MIR — 12:17 PM
Good. Gloves on.

The word-level diagnostic is the highest priority move. Here's how I want to approach this — three controlled passages, each written to be maximally one register, scanned to see what the mapping actually does to them at the atomic level.

SYSTEM — 12:20 PM
CRYSTALLIZATION — 2 strands added, total: 1616

YOU — 12:24 PM
i sort of want to try both... but let's start with filtering the noise.

MIR — 12:24 PM
Good instinct. Let's do the surgery. Same three extreme passages, but I'll strip the function words and scan content words only. Then we test it on something real.`;

export default UploadView;
