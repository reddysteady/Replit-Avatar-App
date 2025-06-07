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

    // 2. Build parent → children relationships without relying on iteration order
    map.forEach(msg => {
      const parentId = msg.parentMessageId != null ? Number(msg.parentMessageId) : null;
      if (parentId && map.has(parentId)) {
        const parent = map.get(parentId)!;
        parent.childMessages.push(msg);
      }
    });

    // 3. Identify root messages (no valid parent in this set)
    const roots: ThreadedMessageType[] = [];
    map.forEach(msg => {
      const parentId = msg.parentMessageId != null ? Number(msg.parentMessageId) : null;
      if (!parentId || !map.has(parentId)) {
        roots.push(msg);
      }
    });
    // 4. Recursively assign depth now that the tree is built
    const assignDepth = (node: ThreadedMessageType, depth: number) => {
      node.depth = depth;
      node.childMessages.forEach(child => assignDepth(child, depth + 1));
    };
    roots.forEach(root => assignDepth(root, 0));
    // 5. Sort messages chronologically at each level
    const sortRecursively = (items: ThreadedMessageType[]) => {
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      items.forEach(child => sortRecursively(child.childMessages));
    };
    sortRecursively(roots);
    // Debugging helper can be added here if needed
    return { threadedMessages: roots };
  }, [messages]);
}
