import { useRef } from 'react';
import type { ChatMessage } from '@/lib/parseTranscript';

interface ChatTurnProps {
  message: ChatMessage;
}

const ChatTurn = ({ message }: ChatTurnProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isMir = !message.isUser;

  return (
    <div
      ref={ref}
      className={`turn ${isMir ? 'mir' : 'you'}`}
      style={{
        position: 'relative',
        margin: '34px 0',
        opacity: 0,
        transform: 'translateY(14px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
        maxWidth: isMir ? '32rem' : '26rem',
        marginRight: isMir ? 'auto' : undefined,
        marginLeft: isMir ? undefined : 'auto',
        textAlign: isMir ? 'left' : 'right',
      }}
    >
      {/* Meta label */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          fontWeight: 500,
          color: 'var(--ink)',
          marginBottom: '10px',
          textAlign: isMir ? 'left' : 'right',
        }}
      >
        <span>{message.speaker}</span>
        {message.timestamp && (
          <span
            style={{
              color: 'var(--mute-2)',
              marginLeft: '10px',
              fontWeight: 400,
            }}
          >
            {message.timestamp}
          </span>
        )}
      </div>

      {/* Message text */}
      <div
        style={{
          fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: '18px',
          lineHeight: '1.6',
          fontWeight: 400,
          color: 'var(--ink)',
        }}
      >
        {message.text.split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ChatTurn;
