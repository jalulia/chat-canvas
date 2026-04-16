import { useState } from 'react';
import UploadView from '@/components/UploadView';
import ReaderView from '@/components/ReaderView';
import { parseTranscript, type ParsedTranscript } from '@/lib/parseTranscript';

const Index = () => {
  const [transcript, setTranscript] = useState<ParsedTranscript | null>(null);
  const [subtitle, setSubtitle] = useState('');

  const handleTranscriptLoaded = (raw: string, sub: string) => {
    const parsed = parseTranscript(raw);
    if (parsed.messages.length > 0) {
      setSubtitle(sub);
      setTranscript(parsed);
    }
  };

  if (transcript) {
    return <ReaderView transcript={transcript} subtitle={subtitle} onBack={() => setTranscript(null)} />;
  }

  return <UploadView onTranscriptLoaded={handleTranscriptLoaded} />;
};

export default Index;
