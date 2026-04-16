export interface Annotation {
  id: string;
  messageId: string;
  text: string;
  author: string;
  createdAt: number;
  color: 'yellow' | 'blue' | 'green' | 'red';
}

export function createAnnotation(
  messageId: string,
  text: string,
  author: string = 'Anonymous',
  color: Annotation['color'] = 'yellow'
): Annotation {
  return {
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    messageId,
    text,
    author,
    createdAt: Date.now(),
    color,
  };
}
