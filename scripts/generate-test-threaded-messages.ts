import { db } from '../server/db';
import { InsertMessage, messages } from '../shared/schema';

// Function to generate timestamps with a specific offset in minutes
function generateTimestamp(minutesOffset: number = 0): Date {
  const baseDate = new Date();
  baseDate.setMinutes(baseDate.getMinutes() - minutesOffset);
  return baseDate;
}

// Generate a parent message
async function createParentMessage(threadId: number): Promise<number> {
  const parentMessage: InsertMessage = {
    threadId,
    source: 'youtube',
    content: 'Hello! This is a parent message with ID specified in console.log.',
    status: 'new',
    isHighIntent: false,
    timestamp: generateTimestamp(30),
    senderName: 'Test User',
    senderId: 'test-user-id',
    isOutbound: false,
    externalId: `test-message-${Date.now()}`, // Adding required external_id
    metadata: {}
  };

  try {
    const [result] = await db.insert(messages).values(parentMessage).returning();
    console.log(`Created parent message with ID: ${result.id}`);
    return result.id;
  } catch (error) {
    console.error('Error creating parent message:', error);
    throw error;
  }
}

// Generate child messages that reply to the parent
async function createChildMessages(threadId: number, parentId: number, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const childMessage: InsertMessage = {
      threadId,
      source: 'youtube',
      content: `This is reply #${i+1} to the parent message with ID ${parentId}`,
      status: 'replied',
      isHighIntent: false,
      timestamp: generateTimestamp(25 - i * 5), // Each reply is 5 minutes after the previous one
      senderName: i % 2 === 0 ? 'Creator' : 'Test User',
      senderId: i % 2 === 0 ? 'creator-id' : 'test-user-id',
      parentMessageId: parentId,
      isOutbound: i % 2 === 0, // Every other message is from the creator (outbound)
      externalId: `test-reply-${Date.now()}-${i}`,
      metadata: {}
    };

    try {
      const [result] = await db.insert(messages).values(childMessage).returning();
      console.log(`Created child message ${i+1} with ID: ${result.id}, replying to parent ID: ${parentId}`);
    } catch (error) {
      console.error(`Error creating child message ${i+1}:`, error);
    }
  }
}

// Main function to generate a threaded conversation
async function generateThreadedConversation(threadId: number, replyCount: number = 3) {
  try {
    console.log(`Generating threaded conversation for thread ID: ${threadId}`);
    
    // Step 1: Create parent message
    const parentId = await createParentMessage(threadId);
    
    // Step 2: Create replies to the parent message
    await createChildMessages(threadId, parentId, replyCount);
    
    console.log(`Successfully created threaded conversation in thread ${threadId} with ${replyCount} replies.`);
    console.log(`Parent ID: ${parentId}`);
    
  } catch (error) {
    console.error('Error generating threaded conversation:', error);
  } finally {
    process.exit(0);
  }
}

// Call with thread ID and number of replies
// Assuming thread ID 4 already exists
generateThreadedConversation(4, 3);