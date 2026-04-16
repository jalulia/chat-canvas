import { useState, useCallback } from 'react';
import UploadView from '@/components/UploadView';
import ReaderView from '@/components/ReaderView';
import { parseTranscript, type ParsedTranscript } from '@/lib/parseTranscript';

const Index = () => {
  const [transcript, setTranscript] = useState<ParsedTranscript | null>(null);
  const [subtitle, setSubtitle] = useState('');
  const [parseError, setParseError] = useState('');

  const handleTranscriptLoaded = useCallback((raw: string) => {
    setParseError('');
    const parsed = parseTranscript(raw);
    if (parsed.messages.length > 0) {
      setTranscript(parsed);
    } else {
      setParseError(
        'No conversation found. Make sure your transcript has speaker labels like "Speaker: text" or "SPEAKER — 12:08 PM" followed by message text.'
      );
    }
  }, []);

  if (transcript) {
    return (
      <ReaderView
        transcript={transcript}
        subtitle={subtitle}
        onSubtitleChange={setSubtitle}
        onBack={() => { setTranscript(null); setParseError(''); }}
      />
    );
  }

  return (
    <UploadView
      onTranscriptLoaded={handleTranscriptLoaded}
      error={parseError}
      onClearError={() => setParseError('')}
    />
  );
};

export default Index;
