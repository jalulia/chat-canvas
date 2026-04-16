import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/parseTranscript';

interface ChatTurnProps {
  message: ChatMessage;
}

const ChatTurn = ({ message }: ChatTurnProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`
        group relative my-8 transition-all duration-700 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3.5'}
      `}
    >
      <div className="flex items-start gap-0">
        {/* Main content area */}
        <div className={`
          flex-1 relative
          ${message.isUser ? 'max-w-md ml-auto text-right' : 'max-w-lg mr-auto'}
        `}>
          {/* Meta */}
          <div className={`font-mono-editorial text-[11px] tracking-[0.14em] uppercase font-medium text-ink mb-2.5 ${message.isUser ? 'text-right' : ''}`}>
            <span>{message.speaker}</span>
            {message.timestamp && (
              <span className="text-mute-color-2 ml-2.5 font-normal">{message.timestamp}</span>
            )}
          </div>

          {/* Text */}
          <div className="text-[18px] leading-[1.6] text-ink">
            {message.text.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < message.text.split('\n').length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>

        {/* Empty margin for layout consistency */}
        <div className="w-48 shrink-0 pl-6 hidden lg:block" />
      </div>
    </div>
  );
};

export default ChatTurn;