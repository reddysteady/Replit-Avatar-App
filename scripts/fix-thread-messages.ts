import { db } from '../server/db';
import { messages } from '../shared/schema';
import { eq } from 'drizzle-orm';

// This script updates all messages in thread 4 to create a 
// proper parent-child relationship for testing
async function fixThreadMessages() {
  // Get all messages in thread 4
  const threadMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, 4));
  
  console.log("Found messages:", threadMessages.map(m => 
    ({ id: m.id, content: m.content?.substring(0, 20) })));
  
  if (threadMessages.length < 2) {
    console.log("Not enough messages to create a parent-child relationship");
    return;
  }
  
  // Sort by timestamp to ensure oldest is first
  threadMessages.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Make the first message the parent
  const parentMessage = threadMessages[0];
  
  // Update all other messages to have this parent
  for (let i = 1; i < threadMessages.length; i++) {
    const childMessage = threadMessages[i];
    
    try {
      await db
        .update(messages)
        .set({ 
          parentMessageId: parentMessage.id,
          isOutbound: i % 2 === 0 // Alternate between inbound/outbound for visual distinction
        })
        .where(eq(messages.id, childMessage.id));
      
      console.log(`Updated message ${childMessage.id} to have parent ${parentMessage.id}`);
    } catch (error) {
      console.error(`Error updating message ${childMessage.id}:`, error);
    }
  }
  
  console.log("Thread message relationships updated successfully");
  console.log(`Parent message ID: ${parentMessage.id}`);
  console.log(`Child message IDs: ${threadMessages.slice(1).map(m => m.id).join(', ')}`);
}

fixThreadMessages()
  .catch(error => console.error("Error in script:", error))
  .finally(() => process.exit(0));