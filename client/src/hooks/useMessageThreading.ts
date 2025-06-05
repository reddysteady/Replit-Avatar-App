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
      console.log("No messages array provided to useMessageThreading");
      return { threadedMessages: [] as ThreadedMessageType[] };
    }

    console.log("Message content check:", messages.map(m => ({ 
      id: m.id, 
      content: (m.content || '').substring(0, 20) + '...',
      parentId: m.parentMessageId
    })));

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
      
      console.log(`Processing message ${msg.id}: parentId=${parentId} (original: ${msg.parentMessageId}, type: ${typeof msg.parentMessageId})`);
      
      // Check if the parent exists in our message map
      if (parentId && parentId > 0 && map.has(parentId)) {
        const parent = map.get(parentId)!;
        msg.depth = parent.depth + 1;
        parent.childMessages.push(msg);
        messageIdsWithParents.add(msg.id);
        console.log(`→ Message ${msg.id} attached to parent ${parentId} at depth ${msg.depth}`);
      } else {
        if (parentId) {
          console.log(`→ Message ${msg.id} has parentId ${parentId} but parent not found in this thread`);
        } else {
          console.log(`→ Top-level: Message ${msg.id}`);
        }
        roots.push(msg);
      }
    });

    // Log all parent-child relationships for debugging
    console.log("All parent-child relationships:");
    console.log("Top-Level Messages:", roots.map(m => m.id));
    console.log("All Message IDs:", Array.from(map.keys()).join(", "));
    console.log("Parent → Child Map:", JSON.stringify(parentChildMap));

    // 3. Sort messages chronologically at each level
    const sortRecursively = (items: ThreadedMessageType[]) => {
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      items.forEach(child => sortRecursively(child.childMessages));
    };
    sortRecursively(roots);

    // Debug the final message hierarchy
    const logMessageHierarchy = (msg: ThreadedMessageType, prefix = "") => {
      console.log(`${prefix}Rendering message ${msg.id} at depth ${msg.depth}, content: "${(msg.content || '').substring(0, 20)}..."`);
      msg.childMessages.forEach(child => logMessageHierarchy(child, prefix + "  "));
    };
    
    roots.forEach(root => logMessageHierarchy(root));

    return { threadedMessages: roots };
  }, [messages]);
}
