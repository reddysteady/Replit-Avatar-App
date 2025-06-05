import { db } from '../server/db';
import { eq } from 'drizzle-orm';
import { messages } from '../shared/schema';

// This script analyzes thread #4 to debug message threading issues
async function debugThreads() {
  try {
    // Get all messages in thread 4
    const thread4Messages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, 4));
    
    console.log(`\n----- THREAD #4 ANALYSIS -----`);
    console.log(`Found ${thread4Messages.length} messages in thread 4\n`);
    
    // Analyze parent-child relationships
    const parentChildMap = new Map<number, number[]>();
    const topLevelMsgs: number[] = [];
    const replyMsgs: number[] = [];
    
    // First pass - identify relationships
    thread4Messages.forEach(msg => {
      console.log(`Message ID: ${msg.id}
  Parent: ${msg.parentMessageId || 'None'}
  Content: "${msg.content?.substring(0, 30)}${msg.content && msg.content.length > 30 ? '...' : ''}"
  Timestamp: ${msg.timestamp}
  Is Outbound: ${msg.isOutbound ? 'Yes' : 'No'}\n`);
      
      if (msg.parentMessageId) {
        // This is a reply
        replyMsgs.push(msg.id);
        
        // Add to parent's child list
        if (!parentChildMap.has(msg.parentMessageId)) {
          parentChildMap.set(msg.parentMessageId, []);
        }
        parentChildMap.get(msg.parentMessageId)!.push(msg.id);
      } else {
        // Top-level message
        topLevelMsgs.push(msg.id);
      }
    });
    
    // Summary section
    console.log(`\n----- SUMMARY -----`);
    console.log(`Total messages: ${thread4Messages.length}`);
    console.log(`Top-level messages: ${topLevelMsgs.length}`);
    console.log(`Top-level IDs: ${topLevelMsgs.join(', ')}`);
    console.log(`Reply messages: ${replyMsgs.length}`);
    console.log(`Reply IDs: ${replyMsgs.join(', ')}`);
    
    // Parent-child relationships
    console.log(`\n----- PARENT-CHILD RELATIONSHIPS -----`);
    if (parentChildMap.size === 0) {
      console.log(`No parent-child relationships found!`);
    } else {
      for (const [parentId, childIds] of parentChildMap.entries()) {
        console.log(`Parent ${parentId} has ${childIds.length} replies: ${childIds.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error("Error in debug-threads script:", error);
  }
}

debugThreads()
  .catch(console.error)
  .finally(() => process.exit(0));