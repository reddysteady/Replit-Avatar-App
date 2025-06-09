
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

  const lastMessageAt = lastMsg?.timestamp ?? thread.lastMessageAt;
  const lastContent = lastMsg?.content ?? thread.lastMessageContent ?? '';

  const senderPrefix = lastMsg
    ? (lastMsg.sender?.id === creatorId || lastMsg.isOutbound
        ? 'You:'
        : (lastMsg.sender?.name.split(' ')[0] || thread.participantName.split(' ')[0]) + ':')
    : '';


  return (
    <div
      className={`flex items-center rounded-lg border border-gray-300 px-3 py-2 mb-2 ${
        isSelected ? 'bg-gray-300' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
        <img
          src={thread.participantAvatar ?? fallbackUrl}
          className={`w-10 h-10 rounded-full mr-3 ring-2 ${
            thread.isHighIntent ? 'ring-orange-500' : 'ring-gray-300'
          }`}
        />
      <div className="flex-1">
        <div className="flex items-center">
          <span className="font-semibold text-gray-900">{thread.participantName}</span>
          {thread.isHighIntent && (
            <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-md">
              High Intent
            </span>
          )}
          <span className="ml-auto text-xs text-gray-600">
            {formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true })}
          </span>
          {thread.unreadCount > 0 && (
            <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
        <div
          className="text-gray-700 text-sm truncate w-full"
          title={`${lastMsg ? senderPrefix + ' ' : ''}${lastContent}`}
        >
          {lastMsg && <span className="font-medium">{senderPrefix}</span>}{' '}
          {lastContent}
        </div>
      </div>
    </div>
  );
};

export default ThreadRow;
