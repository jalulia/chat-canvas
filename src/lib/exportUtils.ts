import type { ParsedTranscript } from './parseTranscript';
import type { Annotation } from './annotations';

export async function exportAsPDF(transcript: ParsedTranscript, annotations: Annotation[]) {
  // Dynamic import to keep bundle small
  const { default: jsPDF } = await import('jspdf');
  
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkPage = (needed: number) => { if (y + needed > 277) addPage(); };

  // Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(transcript.speakers.join(' & '), margin, y + 10);
  y += 18;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`${transcript.messages.length} messages · ${annotations.length} annotations`, margin, y);
  y += 16;

  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Messages
  for (const msg of transcript.messages) {
    checkPage(30);

    // Speaker label
    doc.setFontSize(8);
    doc.setFont('courier', 'bold');
    doc.setTextColor(60);
    const labelText = msg.speaker.toUpperCase() + (msg.timestamp ? `  ${msg.timestamp}` : '');
    if (msg.isUser) {
      doc.text(labelText, pageW - margin, y, { align: 'right' });
    } else {
      doc.text(labelText, margin, y);
    }
    y += 5;

    // Message text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30);
    const lines = doc.splitTextToSize(msg.text, msg.isUser ? contentW * 0.65 : contentW * 0.8);
    for (const line of lines) {
      checkPage(6);
      if (msg.isUser) {
        doc.text(line, pageW - margin, y, { align: 'right' });
      } else {
        doc.text(line, margin, y);
      }
      y += 5.5;
    }

    // Annotations for this message
    const msgAnns = annotations.filter(a => a.messageId === msg.id);
    for (const ann of msgAnns) {
      checkPage(10);
      y += 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(180, 140, 0);
      const annLines = doc.splitTextToSize(`↳ ${ann.text}`, contentW * 0.7);
      for (const line of annLines) {
        checkPage(5);
        doc.text(line, margin + 8, y);
        y += 4;
      }
    }

    y += 8;
  }

  doc.save(`${transcript.speakers.join('-')}-transcript.pdf`);
}

export function exportAsHTML(transcript: ParsedTranscript, annotations: Annotation[]) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${transcript.speakers.join(' & ')} — Transcript</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--paper:#fff;--ink:#09090b;--ink-2:#1c1c20;--mute:#52525b;--mute-2:#a1a1aa;--line:rgba(9,9,11,.08);--rail:rgba(9,9,11,.05);--ann:#f59e0b;--sans:-apple-system,BlinkMacSystemFont,sans-serif;--display:'Instrument Serif',serif;--mono:'JetBrains Mono',monospace}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
::selection{background:#09090b;color:#fff}
.hero{height:70vh;min-height:500px;background:#09090b;color:#fff;display:grid;place-items:center;text-align:center;padding:0 24px;position:relative;overflow:hidden}
.hero h1{font-family:var(--display);font-size:clamp(48px,10vw,140px);line-height:.92;letter-spacing:-.025em;color:#f6f1e4}
.hero h1 em{font-style:italic}
.hero .deck{margin-top:28px;color:rgba(255,255,255,.6);font-size:18px;font-weight:300;max-width:52ch}
.hero .kicker{font-family:var(--mono);font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:22px}
main{padding:120px 0 180px;background:var(--paper)}
.col{max-width:40rem;margin:0 auto;padding:0 28px;position:relative}
.col::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--rail)}
.turn{position:relative;margin:34px 0;opacity:0;transform:translateY(14px);transition:opacity .9s ease,transform .9s ease}
.turn.in{opacity:1;transform:none}
.turn .meta{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:500;color:var(--ink);margin-bottom:10px}
.turn .meta .time{color:var(--mute-2);margin-left:10px;font-weight:400}
.turn .text{font-size:18px;line-height:1.6;color:var(--ink)}
.turn.ai{max-width:32rem;margin-right:auto}
.turn.user{max-width:26rem;margin-left:auto;text-align:right}
.turn.user .meta{text-align:right}
.ann{margin-top:8px;font-family:var(--mono);font-size:10px;color:var(--ann);display:flex;align-items:start;gap:6px}
.ann .t{color:var(--mute);font-size:13px;font-family:var(--sans);text-transform:none;letter-spacing:normal}
footer{max-width:40rem;margin:0 auto;padding:32px 28px;border-top:1px solid var(--line);font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--mute);display:flex;justify-content:space-between}
</style>
</head>
<body>
<section class="hero">
<div>
<div class="kicker">${transcript.messages.length} turns · ${transcript.speakers.length} speakers</div>
<h1>${transcript.speakers[0]}<br><em>&amp; ${transcript.speakers[1] || 'AI'}.</em></h1>
<p class="deck">A conversation rendered as editorial artifact.</p>
</div>
</section>
<main>
<div class="col">
${transcript.messages.map(msg => {
  const msgAnns = annotations.filter(a => a.messageId === msg.id);
  return `<div class="turn ${msg.isUser ? 'user' : 'ai'}">
<div class="meta">${msg.speaker}${msg.timestamp ? `<span class="time">${msg.timestamp}</span>` : ''}</div>
<div class="text">${msg.text.replace(/\n/g, '<br>')}</div>
${msgAnns.map(a => `<div class="ann"><span>↳</span><span class="t">${a.text}</span></div>`).join('')}
</div>`;
}).join('\n')}
</div>
</main>
<footer>
<span>Transcript Studio</span>
<span>${transcript.messages.length} messages · ${annotations.length} annotations</span>
</footer>
<script>
const obs=new IntersectionObserver(e=>{e.forEach(t=>{if(t.isIntersecting){t.target.classList.add('in');obs.unobserve(t.target)}})},{threshold:.15});
document.querySelectorAll('.turn').forEach(t=>obs.observe(t));
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${transcript.speakers.join('-')}-transcript.html`;
  a.click();
  URL.revokeObjectURL(url);
}
