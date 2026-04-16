export interface ChatMessage {
  id: string;
  speaker: string;
  text: string;
  timestamp?: string;
  isUser: boolean;
}

export interface ParsedTranscript {
  title: string;
  messages: ChatMessage[];
  speakers: string[];
}

// "Speaker: text" on same line
const SPEAKER_RE = /^([A-Za-z0-9_.\-]{1,40})\s*:\s*(.+)$/;
const SPEAKER_SPACE_RE = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*:\s*(.+)$/;
// "[timestamp] Speaker: text"
const TS_SPEAKER_RE = /^\[([^\]]+)\]\s*([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;
// "**Speaker**: text"
const MD_SPEAKER_RE = /^\*\*([^*]{1,40})\*\*\s*:\s*(.+)$/;
// "00:12:34 Speaker: text"
const BARE_TS_RE = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;
// "(12:34) Speaker: text"
const PAREN_TS_RE = /^\(([^)]+)\)\s*([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;
// "SPEAKER — 12:08 PM" or "SPEAKER — 12:08" (text on NEXT line)
const EMDASH_SPEAKER_RE = /^([A-Za-z0-9_.\- ]{1,40})\s*[—–\-]{1,3}\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)$/;
// "SPEAKER — any timestamp-like string" (more permissive)
const EMDASH_SPEAKER_LOOSE_RE = /^([A-Za-z][A-Za-z0-9_.\- ]{0,39})\s*[—–\-]{1,3}\s*(.+)$/;

const USER_ALIASES = new Set([
  'you', 'me', 'user', 'human', 'person', 'questioner', 'interviewer',
]);
const AI_ALIASES = new Set([
  'assistant', 'claude', 'mir', 'ai', 'bot', 'gpt', 'chatgpt', 'system',
]);

export function parseTranscript(raw: string): ParsedTranscript {
  const lines = raw.trim().split('\n');
  const messages: ChatMessage[] = [];
  let currentSpeaker = '';
  let currentText = '';
  let currentTimestamp = '';
  let isUser = false;

  const classifySpeaker = (name: string): boolean => {
    const lower = name.toLowerCase().trim();
    if (USER_ALIASES.has(lower)) return true;
    // AI_ALIASES are explicitly NOT user
    return false;
  };

  const flush = () => {
    if (currentSpeaker && currentText.trim()) {
      messages.push({
        id: `msg-${messages.length}`,
        speaker: currentSpeaker.trim(),
        text: currentText.trim(),
        timestamp: currentTimestamp || undefined,
        isUser,
      });
    }
    currentText = '';
    currentTimestamp = '';
  };

  for (const line of lines) {
    let matched = false;

    // 1. Bracketed timestamp: [12:08] Speaker: text
    if (!matched) {
      const tsMatch = line.match(TS_SPEAKER_RE);
      if (tsMatch) {
        flush();
        currentTimestamp = tsMatch[1];
        currentSpeaker = tsMatch[2];
        isUser = classifySpeaker(currentSpeaker);
        currentText = tsMatch[3] + '\n';
        matched = true;
      }
    }

    // 2. Em-dash header: "MIR — 12:08 PM" (text on next line)
    if (!matched) {
      const emDash = line.match(EMDASH_SPEAKER_RE);
      if (emDash) {
        flush();
        currentSpeaker = emDash[1].trim();
        currentTimestamp = emDash[2].trim();
        isUser = classifySpeaker(currentSpeaker);
        // Text comes on subsequent lines — don't set currentText yet
        matched = true;
      }
    }

    // 2b. Loose em-dash: "SPEAKER — anything" (fallback for non-standard timestamps)
    if (!matched) {
      const emDashLoose = line.match(EMDASH_SPEAKER_LOOSE_RE);
      if (emDashLoose) {
        // Only match if the left side looks like a plausible speaker name (all-caps, or Title Case, short)
        const candidate = emDashLoose[1].trim();
        if (candidate.length <= 20 && (/^[A-Z]+$/.test(candidate) || /^[A-Z][a-z]+$/.test(candidate))) {
          flush();
          currentSpeaker = candidate;
          currentTimestamp = emDashLoose[2].trim();
          isUser = classifySpeaker(currentSpeaker);
          matched = true;
        }
      }
    }

    // 3. Bare timestamp: "00:12:34 Speaker: text"
    if (!matched) {
      const bareTs = line.match(BARE_TS_RE);
      if (bareTs) {
        flush();
        currentTimestamp = bareTs[1];
        currentSpeaker = bareTs[2];
        isUser = classifySpeaker(currentSpeaker);
        currentText = bareTs[3] + '\n';
        matched = true;
      }
    }

    // 4. Parenthesized timestamp: "(12:34) Speaker: text"
    if (!matched) {
      const parenTs = line.match(PAREN_TS_RE);
      if (parenTs) {
        flush();
        currentTimestamp = parenTs[1];
        currentSpeaker = parenTs[2];
        isUser = classifySpeaker(currentSpeaker);
        currentText = parenTs[3] + '\n';
        matched = true;
      }
    }

    // 5. Markdown bold: "**Speaker**: text"
    if (!matched) {
      const mdMatch = line.match(MD_SPEAKER_RE);
      if (mdMatch) {
        flush();
        currentSpeaker = mdMatch[1];
        isUser = classifySpeaker(currentSpeaker);
        currentText = mdMatch[2] + '\n';
        matched = true;
      }
    }

    // 6. Basic: "Speaker: text"
    if (!matched) {
      const strictMatch = line.match(SPEAKER_RE) || line.match(SPEAKER_SPACE_RE);
      if (strictMatch) {
        flush();
        currentSpeaker = strictMatch[1];
        isUser = classifySpeaker(currentSpeaker);
        currentText = strictMatch[2] + '\n';
        matched = true;
      }
    }

    // 7. Continuation line
    if (!matched) {
      if (line.trim() === '' && !currentText.trim()) continue;
      currentText += line + '\n';
    }
  }

  flush();

  // Detect speakers
  const speakerSet = new Set(messages.map(m => m.speaker));
  const speakers = Array.from(speakerSet);

  // Mark AI speakers explicitly
  messages.forEach(m => {
    if (AI_ALIASES.has(m.speaker.toLowerCase().trim())) {
      m.isUser = false;
    }
  });

  // If only 2 speakers and no user detected, mark the less-frequent one as user
  if (speakers.length === 2 && messages.every(m => !m.isUser)) {
    const counts = speakers.map(s => messages.filter(m => m.speaker === s).length);
    const userIdx = counts[0] <= counts[1] ? 0 : 1;
    const userSpeaker = speakers[userIdx];
    messages.forEach(m => {
      if (m.speaker === userSpeaker) m.isUser = true;
    });
  }

  // Generate title from first AI message
  const firstAI = messages.find(m => !m.isUser);
  let title = 'Conversation';
  if (firstAI) {
    const firstSentence = firstAI.text.split(/[.!?]\s/)[0];
    title = (firstSentence.length > 80 ? firstSentence.slice(0, 77) + '…' : firstSentence).replace(/\n/g, ' ').trim();
  }

  return { title, messages, speakers };
}
