// ===== client/src/hooks/useMessageThreading.ts =====
import { useMemo } from 'react';
import { MessageType } from '@shared/schema';

export interface ThreadedMessageType extends MessageType {
  childMessages: ThreadedMessageType[];
  depth: number;
}

export function useMessageThreading(messages?: MessageType[]) {
  return useMemo(() => {
    if (!messages || !Array.isArray(messages)) {
      return { threadedMessages: [] as ThreadedMessageType[] };
    }



    // 1. Create a map of all messages by ID, initializing threading fields
    const map = new Map<number, ThreadedMessageType>();
    messages.forEach(msg => {
      map.set(msg.id, { ...msg, childMessages: [], depth: 0 });
    });

    // Build a parent → children map for debugging
    const parentChildMap: Record<number, number[]> = {};
    messages.forEach(msg => {
      if (msg.parentMessageId) {
        const parentId = Number(msg.parentMessageId);
        if (!parentChildMap[parentId]) {
          parentChildMap[parentId] = [];
        }
        parentChildMap[parentId].push(msg.id);
      }
    });

    const roots: ThreadedMessageType[] = [];
    const messageIdsWithParents = new Set<number>();

    // 2. Attach replies to their parents
    map.forEach(msg => {
      // Handle parentMessageId conversion more carefully
      let parentId: number | null = null;
      
      if (msg.parentMessageId !== undefined && msg.parentMessageId !== null) {
        if (typeof msg.parentMessageId === 'string') {
          parentId = parseInt(msg.parentMessageId, 10);
          if (isNaN(parentId)) {
            parentId = null;
          }
        } else if (typeof msg.parentMessageId === 'number') {
          parentId = msg.parentMessageId;
        }
      }
      
      // debug info for threading
      
      // Check if the parent exists in our message map
      if (parentId && parentId > 0 && map.has(parentId)) {
        const parent = map.get(parentId)!;
        msg.depth = parent.depth + 1;
        parent.childMessages.push(msg);
        messageIdsWithParents.add(msg.id);
      } else {
        if (!parentId) {
          // top-level message
        }
        roots.push(msg);
      }
    });



    // 3. Sort messages chronologically at each level
    const sortRecursively = (items: ThreadedMessageType[]) => {
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      items.forEach(child => sortRecursively(child.childMessages));
    };
    sortRecursively(roots);

    // Debugging helper can be added here if needed

    return { threadedMessages: roots };
  }, [messages]);
}
