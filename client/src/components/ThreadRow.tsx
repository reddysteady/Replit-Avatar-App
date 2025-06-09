// See CHANGELOG.md for 2025-06-08 [Added]
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThreadType, MessageType } from '@shared/schema';

interface ThreadRowProps {
  thread: ThreadType;
  onClick?: () => void;
  creatorId?: string;
}

const fallbackUrl = 'https://via.placeholder.com/40';

const ThreadRow: React.FC<ThreadRowProps> = ({ thread, onClick, creatorId = 'creator-id' }) => {
  const lastMsg: MessageType | undefined = thread.messages?.at(-1);
  const lastMessageAt = lastMsg?.timestamp ?? thread.lastMessageAt;
  const lastContent = lastMsg?.content ?? thread.lastMessageContent ?? '';

  const senderPrefix = lastMsg
    ? (lastMsg.sender?.id === creatorId || lastMsg.isOutbound
        ? 'You:'
        : thread.participantName.split(' ')[0] + ':')
    : '';

  const snippet =
    lastContent.length > 60 ? lastContent.slice(0, 57) + '…' : lastContent;

  return (
    <div
      className="flex items-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 mb-2"
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
          <span className="font-semibold text-blue-700">{thread.participantName}</span>
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
        <div className="text-gray-700 text-sm truncate">
          {lastMsg && <span className="font-medium">{senderPrefix}</span>}{' '}
          {snippet}
        </div>
      </div>
    </div>
  );
};

export default ThreadRow;
