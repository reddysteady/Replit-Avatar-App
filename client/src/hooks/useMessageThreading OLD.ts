import { useMemo } from 'react';
import { MessageType } from '@shared/schema';

// Enhanced message type with threading information
export interface ThreadedMessageType extends MessageType {
  isReply: boolean;
  hasReplies: boolean;
  childMessages: number[];
  depth: number;
  displayInThread: boolean; // To help with visualization
}

// This hook organizes messages into a threaded structure for display
export function useMessageThreading(messages: MessageType[] | undefined) {
  return useMemo(() => {
    if (!messages || !Array.isArray(messages)) {
      return {
        organizedMessages: [],
        parentChildMap: new Map<number, number[]>(),
        topLevelMessages: [],
      };
    }

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Create a map of parent-child relationships
    const parentChildMap = new Map<number, number[]>();
    
    // Track which messages are replies
    const isReply = new Set<number>();
    
    // Track top-level messages (those without a parent)
    const topLevelMessageIds: number[] = [];
    
    // DEBUG: Log the raw messages and their parent IDs
    console.log('RAW MESSAGES WITH PARENT IDs:', 
      sortedMessages.map(m => ({
        id: m.id, 
        content: m.content?.substring(0, 15) || '',
        parentId: m.parentMessageId
      }))
    );
    
    // Build thread structure with proper type handling
    sortedMessages.forEach((message) => {
      // Explicitly handle all possible data types for parentMessageId
      let parentId = null;
      
      if (message.parentMessageId !== undefined && message.parentMessageId !== null) {
        // Convert to number regardless of input type (string or number)
        parentId = Number(message.parentMessageId);
        
        // Ensure it's a valid number
        if (isNaN(parentId)) {
          parentId = null;
        }
      }
      
      console.log(`Message ${message.id} has parentId: ${parentId} (original: ${message.parentMessageId}, type: ${typeof message.parentMessageId})`);
        
      if (parentId && parentId > 0) {
        // This is a reply to another message
        isReply.add(message.id);
        
        // Create/update parent's child list
        if (!parentChildMap.has(parentId)) {
          parentChildMap.set(parentId, []);
        }
        parentChildMap.get(parentId)?.push(message.id);
        
        console.log(`Thread: Message ${message.id} → Parent ${parentId}`);
      } else {
        // Top-level message (no parent or invalid parent)
        topLevelMessageIds.push(message.id);
        console.log(`Root: Message ${message.id} (no valid parent)`);
      }
    });
    
    // Add indentation and grouping info to messages with more detailed threading
    const organizedMessages: ThreadedMessageType[] = sortedMessages.map(message => {
      // Determine the depth - how nested this message is in the thread
      let depth = 0;
      
      let currentId = message.parentMessageId;
      // Traverse up the parent chain to calculate depth
      while (currentId) {
        depth++;
        const parent = sortedMessages.find(m => m.id === Number(currentId));
        currentId = parent?.parentMessageId; 
      }
      
      return {
        ...message,
        isReply: isReply.has(message.id),
        hasReplies: parentChildMap.has(message.id) && parentChildMap.get(message.id)!.length > 0,
        childMessages: parentChildMap.get(message.id) || [],
        depth: depth, // Use calculated depth for better visualization
        displayInThread: true  // Default to showing all messages
      };
    });
    
    // Log the parent-child map for debugging
    console.log('PARENT-CHILD MAP:', Object.fromEntries(parentChildMap));
    
    // Log all organized threads with their relationships
    console.log('ORGANIZED MESSAGES:', 
      organizedMessages.map(m => ({
        id: m.id, 
        content: m.content?.substring(0, 15) || '',
        parentId: m.parentMessageId,
        hasReplies: m.hasReplies,
        isReply: m.isReply,
        childCount: m.childMessages.length,
        childIds: m.childMessages
      }))
    );
    
    // Get the actual top-level message objects (not just IDs)
    const topLevelMessages = organizedMessages.filter(message => !message.isReply);
    
    console.log('TOP-LEVEL MESSAGES:', topLevelMessages.map(m => m.id));

    return {
      organizedMessages,
      parentChildMap,
      topLevelMessages
    };
  }, [messages]);
}