// See CHANGELOG.md for 2025-06-10 [Added]
import { ThreadType } from '@shared/schema';

export const sampleConversations: ThreadType[] = [
  {
    id: 1,
    externalParticipantId: 'user1',
    participantName: 'Sarah Williams',
    participantAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    source: 'instagram',
    lastMessageAt: new Date().toISOString(),
    lastMessageContent: 'Hello hello',
    status: 'active',
    unreadCount: 0,
    isHighIntent: false,
  },
  {
    id: 2,
    externalParticipantId: 'test1',
    participantName: 'Thread 1 - Testing',
    participantAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    source: 'instagram',
    lastMessageAt: new Date().toISOString(),
    lastMessageContent: 'Test high intent',
    status: 'active',
    unreadCount: 0,
    isHighIntent: true,
  },
  {
    id: 3,
    externalParticipantId: 'user3',
    participantName: 'Michael Scott',
    participantAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    source: 'youtube',
    lastMessageAt: new Date().toISOString(),
    lastMessageContent: 'Hello',
    status: 'active',
    unreadCount: 0,
    isHighIntent: false,
  },
];
