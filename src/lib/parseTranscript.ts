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

// Strict speaker name: 1-20 chars, must look like a name/handle (no long phrases)
const SPEAKER_RE = /^([A-Za-z0-9_.\-]{1,20})\s*:\s*(.+)$/;
const SPEAKER_SPACE_RE = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*:\s*(.+)$/; // "First Last: text"
const TS_SPEAKER_RE = /^\[([^\]]+)\]\s*([A-Za-z0-9_.\- ]{1,20})\s*:\s*(.+)$/;
const MD_SPEAKER_RE = /^\*\*([^*]{1,20})\*\*\s*:\s*(.+)$/;

const USER_ALIASES = new Set(['you', 'me', 'user', 'human']);

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
  const title = firstAI
    ? firstAI.text.slice(0, 60).replace(/\n/g, ' ').trim() + '…'
    : 'Conversation';

  return { title, messages, speakers };
}
