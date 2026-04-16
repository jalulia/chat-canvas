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

const SPEAKER_RE = /^([A-Za-z0-9_.\-]{1,40})\s*:\s*(.+)$/;
const SPEAKER_SPACE_RE = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*:\s*(.+)$/;
const TS_SPEAKER_RE = /^\[([^\]]+)\]\s*([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;
const MD_SPEAKER_RE = /^\*\*([^*]{1,40})\*\*\s*:\s*(.+)$/;
const BARE_TS_RE = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;
const PAREN_TS_RE = /^\(([^)]+)\)\s*([A-Za-z0-9_.\- ]{1,40})\s*:\s*(.+)$/;

const USER_ALIASES = new Set(['you', 'me', 'user', 'human', 'chris', 'person', 'questioner', 'interviewer']);

export function parseTranscript(raw: string): ParsedTranscript {
  const lines = raw.trim().split('\n');
  const messages: ChatMessage[] = [];
  let currentSpeaker = '';
  let currentText = '';
  let currentTimestamp = '';
  let isUser = false;

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

    // Try timestamped pattern first
    const tsMatch = line.match(TS_SPEAKER_RE);
    if (tsMatch) {
      flush();
      currentTimestamp = tsMatch[1];
      currentSpeaker = tsMatch[2];
      isUser = USER_ALIASES.has(currentSpeaker.toLowerCase());
      currentText = tsMatch[3] + '\n';
      matched = true;
    }

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

    if (!matched) {
      const mdMatch = line.match(MD_SPEAKER_RE);
      if (mdMatch) {
        flush();
        currentSpeaker = mdMatch[1];
        isUser = USER_ALIASES.has(currentSpeaker.toLowerCase());
        currentText = mdMatch[2] + '\n';
        matched = true;
      }
    }

    if (!matched) {
      // Try strict no-space speaker first, then "First Last" pattern
      const strictMatch = line.match(SPEAKER_RE) || line.match(SPEAKER_SPACE_RE);
      if (strictMatch) {
        flush();
        currentSpeaker = strictMatch[1];
        isUser = USER_ALIASES.has(currentSpeaker.toLowerCase());
        currentText = strictMatch[2] + '\n';
        matched = true;
      }
    }

    if (!matched) {
      // Continuation line
      if (line.trim() === '' && !currentText.trim()) continue;
      currentText += line + '\n';
    }
  }

  flush();

  // Detect speakers
  const speakerSet = new Set(messages.map(m => m.speaker));
  const speakers = Array.from(speakerSet);

  // If only 2 speakers, mark the less-frequent one as user
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
