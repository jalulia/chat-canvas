# Chat Canvas — Critical Fixes & GitHub Pages Deploy

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the three critical bugs (XSS, broken PDF upload, parser fragility), strip dead code, and deploy to GitHub Pages via jalulia/chat-canvas.

**Architecture:** Single-page React/Vite app. Upload → parse → render → export pipeline. No backend. Deployed as static site via `vite build` + GitHub Pages.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, jsPDF, pdfjs-dist (new)

---

### Task 1: Strip Dead Code — App.tsx, NavLink, unused shadcn

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/NavLink.tsx`
- Delete: `src/components/ui/` (entire directory EXCEPT keep `src/components/ui/sonner.tsx`, `src/components/ui/toaster.tsx`, `src/components/ui/toast.tsx`, `src/components/ui/use-toast.ts` — actually none of these are used either. Delete all of `ui/`)
- Modify: `src/hooks/use-toast.ts` — delete
- Modify: `src/hooks/use-mobile.tsx` — delete
- Modify: `package.json` — remove unused @radix-ui deps

**Step 1: Rewrite App.tsx to remove unused providers**

Replace `src/App.tsx` with:

```tsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
```

**Step 2: Delete dead files**

```bash
rm -rf src/components/ui/
rm src/components/NavLink.tsx
rm src/hooks/use-toast.ts
rm src/hooks/use-mobile.tsx
```

**Step 3: Remove unused deps from package.json**

Remove these from `dependencies`:
- `@tanstack/react-query` (no longer imported)
- `@radix-ui/react-accordion` through all @radix-ui packages
- `cmdk`, `input-otp`, `vaul`, `embla-carousel-react`
- `react-day-picker`, `react-resizable-panels`, `recharts`
- `sonner`, `next-themes`

Keep: `react`, `react-dom`, `react-router-dom`, `lucide-react`, `jspdf`, `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`

**Step 4: Reinstall and verify build**

```bash
rm -rf node_modules package-lock.json
npm install
npx vite build
```

Expected: Build succeeds with significantly smaller bundle.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: strip 44 unused shadcn components, dead providers, unused deps"
```

---

### Task 2: Fix XSS in HTML Export

**Files:**
- Modify: `src/lib/exportUtils.ts`

**Step 1: Add escapeHtml utility at top of file**

Add before the existing imports:

```typescript
function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, c => map[c] || c);
}
```

**Step 2: Escape all user content in exportAsHTML template**

In the `transcript.messages.map()` block (around line 180-186), wrap every interpolation:

```typescript
return `<div class="turn ${msg.isUser ? 'you' : 'mir'}">
<div class="meta">${escapeHtml(msg.speaker)}${msg.timestamp ? `<span class="time">${escapeHtml(msg.timestamp)}</span>` : ''}</div>
<div class="text">${escapeHtml(msg.text).replace(/\n/g, '<br>')}</div>
${msgAnns.map(a => `<div style="margin-top:8px;font-family:var(--mono);font-size:10px;color:var(--signal);display:flex;align-items:start;gap:6px"><span>↳</span><span style="color:var(--mute);font-size:13px;font-family:var(--sans);text-transform:none;letter-spacing:normal">${escapeHtml(a.text)}</span></div>`).join('')}
</div>`;
```

Also escape the title tag: `<title>${escapeHtml(transcript.speakers.join(' & '))} — Transcript</title>`

And the hero heading: `<h1>${escapeHtml(transcript.speakers.join(' & '))}</h1>`

**Step 3: Verify build**

```bash
npx vite build
```

**Step 4: Commit**

```bash
git add src/lib/exportUtils.ts
git commit -m "fix: escape HTML in export to prevent XSS from malicious transcripts"
```

---

### Task 3: Implement PDF Upload with pdfjs-dist

**Files:**
- Modify: `package.json` (add pdfjs-dist)
- Modify: `src/components/UploadView.tsx`

**Step 1: Install pdfjs-dist**

```bash
npm install pdfjs-dist@4.9.155
```

**Step 2: Rewrite handleFile in UploadView.tsx**

Replace the `handleFile` callback with:

```typescript
const handleFile = useCallback(async (file: File) => {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
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
      if (fullText.trim()) onTranscriptLoaded(fullText, subtitle);
    } catch (err) {
      console.error('PDF parse error:', err);
    }
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) onTranscriptLoaded(text, subtitle);
    };
    reader.readAsText(file);
  }
}, [onTranscriptLoaded, subtitle]);
```

**Step 3: Verify build**

```bash
npx vite build
```

**Step 4: Commit**

```bash
git add package.json package-lock.json src/components/UploadView.tsx
git commit -m "feat: implement actual PDF text extraction via pdfjs-dist"
```

---

### Task 4: Harden Parser — Wider Patterns, Safer Matching

**Files:**
- Modify: `src/lib/parseTranscript.ts`

**Step 1: Expand speaker name limit and add patterns**

Replace regex block (lines 15-19) with:

```typescript
// Speaker name: up to 40 chars (handles "Dr. Jane Researcher-Smith")
const SPEAKER_RE = /^([A-Za-z0-9_.\-]{1,40})\s*:\s*(.+)$/;
const SPEAKER_SPACE_RE = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*:\s*(.+)$/;
const TS_SPEAKER_RE = /^\[([^\]]+)\]\s*([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;
const MD_SPEAKER_RE = /^\*\*([^*]{1,40})\*\*\s*:\s*(.+)$/;
// Bare timestamp: "00:12:34 Speaker: text" or "(12:34) Speaker: text"
const BARE_TS_RE = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;
const PAREN_TS_RE = /^\(([^)]+)\)\s*([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;
```

**Step 2: Add the new timestamp patterns to the parsing loop**

After the existing `tsMatch` block, add before the markdown match:

```typescript
if (!matched) {
  const bareTs = line.match(BARE_TS_RE);
  if (bareTs) {
    flush();
    currentTimestamp = bareTs[1];
    currentSpeaker = bareTs[2];
    isUser = USER_ALIASES.has(currentSpeaker.toLowerCase());
    currentText = bareTs[3] + '\n';
    matched = true;
  }
}

if (!matched) {
  const parenTs = line.match(PAREN_TS_RE);
  if (parenTs) {
    flush();
    currentTimestamp = parenTs[1];
    currentSpeaker = parenTs[2];
    isUser = USER_ALIASES.has(currentSpeaker.toLowerCase());
    currentText = parenTs[3] + '\n';
    matched = true;
  }
}
```

**Step 3: Add more user aliases**

```typescript
const USER_ALIASES = new Set(['you', 'me', 'user', 'human', 'chris', 'person', 'questioner', 'interviewer']);
```

**Step 4: Improve title generation**

Replace lines 106-109 with:

```typescript
const firstAI = messages.find(m => !m.isUser);
let title = 'Conversation';
if (firstAI) {
  // Use first sentence or first 80 chars, whichever is shorter
  const firstSentence = firstAI.text.split(/[.!?]\s/)[0];
  title = (firstSentence.length > 80 ? firstSentence.slice(0, 77) + '…' : firstSentence).replace(/\n/g, ' ').trim();
}
```

**Step 5: Verify build**

```bash
npx vite build
```

**Step 6: Commit**

```bash
git add src/lib/parseTranscript.ts
git commit -m "fix: harden parser — wider speaker names, bare timestamps, better title gen"
```

---

### Task 5: Configure GitHub Pages Deploy

**Files:**
- Modify: `vite.config.ts` (add base path)
- Create: `.github/workflows/deploy.yml` (optional — or manual deploy)
- Modify: `package.json` (add deploy script)

**Step 1: Set Vite base path for GitHub Pages**

In `vite.config.ts`, add `base` to the config:

```typescript
export default defineConfig(({ mode }) => ({
  base: '/chat-canvas/',
  server: { ... },
  // rest unchanged
}));
```

**Step 2: Add deploy script to package.json**

```json
"scripts": {
  "deploy": "npm run build && npx gh-pages -d dist"
}
```

**Step 3: Install gh-pages**

```bash
npm install --save-dev gh-pages
```

**Step 4: Build and deploy**

```bash
npm run build
```

Then push the repo to GitHub and deploy:

```bash
git add -A
git commit -m "feat: configure GitHub Pages deployment with /chat-canvas/ base"
git remote add origin https://github.com/jalulia/chat-canvas.git
git push -u origin master
npx gh-pages -d dist
```

**Step 5: Verify deployment**

URL: `https://jalulia.github.io/chat-canvas/`

---

### Task 6: Final Verification Pass

**Step 1: Run full build**

```bash
npm run build
```

Expected: No errors, bundle under 600KB gzipped.

**Step 2: Test locally**

```bash
npx vite preview
```

- Upload a .txt transcript → renders correctly
- Upload a .pdf → extracts text and renders
- Paste text → renders
- Try sample → renders
- Export as HTML → download works, opens in browser with mir-article styling
- Export as PDF → download works

**Step 3: Check for XSS**

Create test transcript:
```
<script>alert('xss')</script>: Hello
User: <img src=x onerror=alert('xss')>
```

Upload → should render as escaped text, not execute.
Export as HTML → open in browser → should show escaped text.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final verification pass"
```
