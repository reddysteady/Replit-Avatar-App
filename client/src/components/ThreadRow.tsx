
// See CHANGELOG.md for 2025-06-08 [Added]
// See CHANGELOG.md for 2025-06-10 [Changed]
// See CHANGELOG.md for 2025-06-09 [Fixed]



import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThreadType, MessageType } from '@shared/schema';

interface ThreadRowProps {
  thread: ThreadType;
  onClick?: () => void;
  creatorId?: string;
  selected?: boolean;
}

const fallbackUrl = 'https://via.placeholder.com/40';

const ThreadRow: React.FC<ThreadRowProps> = (
  { thread, onClick, creatorId = 'creator-id', selected = false }
) => {
  // keep the new selected flag
  const isSelected = selected;

  // keep the robust timestamp-based logic from main
  const lastMsg: MessageType | undefined = React.useMemo(() => {
    if (!Array.isArray(thread.messages) || thread.messages.length === 0) {
      return undefined;
    }
    return thread.messages.reduce((latest, msg) =>
      new Date(msg.timestamp).getTime() > new Date(latest.timestamp).getTime()
        ? msg
        : latest
    );
  }, [thread.messages]);

  const lastMessageAt = lastMsg?.timestamp ?? thread.lastMessageAt;
  const lastContent   = lastMsg?.content    ?? thread.lastMessageContent ?? '';

  const senderPrefix =
    lastMsg?.sender?.id === creatorId
      ? 'You:'
      : (lastMsg?.sender?.name.split(' ')[0] ?? '') + ':';

  return (
    <div
      className={`flex items-center rounded-lg border border-gray-300 px-3 py-2 mb-2 ${
        isSelected ? 'bg-gray-800 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      {/* …rest of the JSX … */}
    </div>
  );
};

 export default ThreadRow;
