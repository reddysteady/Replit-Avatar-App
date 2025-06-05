import { db } from '../server/db';
import { eq } from 'drizzle-orm';
import { messages } from '../shared/schema';

// Create a new parent message and replies in thread 4 for testing
async function createThreadTest() {
  const threadId = 4;
  
  try {
    // Create parent message
    const [parentMessage] = await db
      .insert(messages)
      .values({
        threadId,
        content: "This is a test parent message for threading",
        source: "youtube",
        status: "new",
        isHighIntent: false,
        timestamp: new Date(),
        senderName: "Test User",
        senderId: "test-user-id",
        isOutbound: false,
        externalId: `parent-${Date.now()}`,
        metadata: {}
      })
      .returning();
    
    console.log(`Created parent message with ID: ${parentMessage.id}`);
    
    // Create 3 replies to the parent message
    for (let i = 0; i < 3; i++) {
      const isOutbound = i % 2 === 0;
      
      const [reply] = await db
        .insert(messages)
        .values({
          threadId,
          content: `This is reply #${i+1} to the parent message`,
          source: "youtube",
          status: "replied",
          isHighIntent: false,
          timestamp: new Date(Date.now() + (i+1) * 60000), // Each reply 1 minute apart
          senderName: isOutbound ? "Creator" : "Test User",
          senderId: isOutbound ? "creator-id" : "test-user-id",
          parentMessageId: parentMessage.id, // This is the key relationship
          isOutbound: isOutbound,
          externalId: `reply-${Date.now()}-${i}`,
          metadata: {}
        })
        .returning();
      
      console.log(`Created reply #${i+1} with ID: ${reply.id} to parent ID: ${parentMessage.id}`);
    }
    
    console.log("Thread test messages created successfully");
    
  } catch (error) {
    console.error("Error creating test thread:", error);
  }
}

createThreadTest()
  .catch(console.error)
  .finally(() => process.exit(0));