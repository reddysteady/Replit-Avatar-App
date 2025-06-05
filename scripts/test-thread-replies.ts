import { db } from '../server/db';
import { messages } from '../shared/schema';
import { eq } from 'drizzle-orm';

// This script creates a proper threaded conversation for testing
async function createThreadedTestConversation() {
  const threadId = 1; // Using thread 1 for testing
  
  console.log(`Creating a threaded conversation test in thread ID: ${threadId}`);
  
  try {
    // Clear previous parent-child relationships for clean testing
    await db
      .update(messages)
      .set({ 
        parentMessageId: null
      })
      .where(eq(messages.threadId, threadId));
    
    // Step 1: Create the parent message (initial question)
    const [parentMessage] = await db
      .insert(messages)
      .values({
        threadId,
        content: "Hi there! I'm interested in your services. Could you tell me more about your pricing?",
        source: "instagram",
        status: "new",
        isHighIntent: true,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        senderName: "Alex Johnson",
        senderId: "alex.johnson",
        isOutbound: false,
        externalId: `parent-${Date.now()}`,
        metadata: {}
      })
      .returning();
    
    console.log(`Created parent message with ID: ${parentMessage.id}`);
    
    // Step 2: Creator's response to the initial question
    const [reply1] = await db
      .insert(messages)
      .values({
        threadId,
        content: "Hello Alex! Thanks for your interest. Our basic package starts at $99/month, and our premium service is $199/month. Would you like me to send you more details?",
        source: "instagram",
        status: "replied",
        isHighIntent: false,
        timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
        senderName: "Creator",
        senderId: "creator-id",
        parentMessageId: parentMessage.id, // This is the key relationship
        isOutbound: true,
        externalId: `reply-${Date.now()}-1`,
        metadata: {}
      })
      .returning();
    
    console.log(`Created first reply message with ID: ${reply1.id}`);
    
    // Step 3: User's follow-up question
    const [reply2] = await db
      .insert(messages)
      .values({
        threadId,
        content: "That sounds interesting. Could you tell me what's included in the premium package? And do you offer any discounts for quarterly payments?",
        source: "instagram",
        status: "new",
        isHighIntent: true,
        timestamp: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
        senderName: "Alex Johnson",
        senderId: "alex.johnson",
        parentMessageId: reply1.id, // Replying to the creator's message
        isOutbound: false,
        externalId: `reply-${Date.now()}-2`,
        metadata: {}
      })
      .returning();
    
    console.log(`Created second reply message with ID: ${reply2.id}`);
    
    // Step 4: Creator's answer to the follow-up
    const [reply3] = await db
      .insert(messages)
      .values({
        threadId,
        content: "The premium package includes priority support, advanced analytics, and custom integrations. And yes, we offer a 10% discount for quarterly payments! Would you like to schedule a demo call to discuss your specific needs?",
        source: "instagram",
        status: "replied",
        isHighIntent: false,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        senderName: "Creator",
        senderId: "creator-id",
        parentMessageId: reply2.id, // Replying to the user's follow-up
        isOutbound: true,
        externalId: `reply-${Date.now()}-3`,
        metadata: {}
      })
      .returning();
    
    console.log(`Created third reply message with ID: ${reply3.id}`);
    
    // Step 5: User confirms interest
    const [reply4] = await db
      .insert(messages)
      .values({
        threadId,
        content: "A demo would be great! I'm available next Tuesday or Wednesday afternoon. Would either of those work for you?",
        source: "instagram",
        status: "new",
        isHighIntent: true,
        timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        senderName: "Alex Johnson",
        senderId: "alex.johnson",
        parentMessageId: reply3.id, // Replying to the creator's previous response
        isOutbound: false,
        externalId: `reply-${Date.now()}-4`,
        metadata: {}
      })
      .returning();
    
    console.log(`Created fourth reply message with ID: ${reply4.id}`);
    
    // Step 6: Creator confirms the meeting
    const [reply5] = await db
      .insert(messages)
      .values({
        threadId,
        content: "Perfect! Tuesday at 2 PM works for me. I'll send you a calendar invite with the meeting link. Looking forward to our call!",
        source: "instagram",
        status: "replied",
        isHighIntent: false,
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        senderName: "Creator",
        senderId: "creator-id",
        parentMessageId: reply4.id, // Replying to the user's scheduling request
        isOutbound: true,
        externalId: `reply-${Date.now()}-5`,
        metadata: {}
      })
      .returning();
    
    console.log(`Created fifth reply message with ID: ${reply5.id}`);
    
    console.log("Thread conversation created successfully");
    console.log(`Thread ID: ${threadId}`);
    console.log(`Initial message ID: ${parentMessage.id}`);
    console.log(`Reply chain: ${reply1.id} -> ${reply2.id} -> ${reply3.id} -> ${reply4.id} -> ${reply5.id}`);
    
  } catch (error) {
    console.error("Error creating thread conversation:", error);
  }
}

createThreadedTestConversation()
  .catch(error => console.error("Error in script:", error))
  .finally(() => process.exit(0));