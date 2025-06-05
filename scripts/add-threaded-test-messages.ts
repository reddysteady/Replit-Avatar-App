
import { db } from "../server/db";
import { messages } from "../shared/schema";
import { eq } from "drizzle-orm";

async function addThreadedTestMessages() {
  try {
    console.log("Adding threaded test messages...");
    
    // First, let's find an existing thread or create messages in thread 1
    const threadId = 1;
    
    // Clear any existing messages in thread 1 for clean testing
    await db.delete(messages).where(eq(messages.threadId, threadId));
    
    // Create the parent message (initial question)
    const [parentMessage] = await db
      .insert(messages)
      .values({
        threadId,
        content: "Hi! I'm really interested in your photography services. Could you tell me more about your pricing for wedding photography?",
        source: "instagram",
        status: "new",
        isHighIntent: true,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        senderName: "Sarah Johnson",
        senderId: "sarah.johnson.photos",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786",
        isOutbound: false,
        externalId: `parent-msg-${Date.now()}`,
        metadata: {},
        userId: 1,
        parentMessageId: null // This is the root message
      })
      .returning();
    
    console.log(`Created parent message with ID: ${parentMessage.id}`);
    
    // Create a reply from the creator
    const [reply1] = await db
      .insert(messages)
      .values({
        threadId,
        content: "Hi Sarah! Thanks for your interest in my wedding photography services. My packages start at $2,500 for basic coverage and go up to $5,000 for premium all-day coverage. Would you like me to send you a detailed breakdown?",
        source: "instagram",
        status: "replied",
        timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
        senderName: "You",
        senderId: "creator-id",
        isOutbound: true,
        externalId: `reply-${Date.now()}-1`,
        metadata: {},
        userId: 1,
        parentMessageId: parentMessage.id // Reply to parent
      })
      .returning();
    
    console.log(`Created reply 1 with ID: ${reply1.id}, parent: ${parentMessage.id}`);
    
    // Create another reply from Sarah
    const [reply2] = await db
      .insert(messages)
      .values({
        threadId,
        content: "Yes, that would be great! Also, do you include engagement photos in any of your packages?",
        source: "instagram",
        status: "new",
        timestamp: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
        senderName: "Sarah Johnson",
        senderId: "sarah.johnson.photos",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786",
        isOutbound: false,
        externalId: `reply-${Date.now()}-2`,
        metadata: {},
        userId: 1,
        parentMessageId: reply1.id // Reply to the creator's response
      })
      .returning();
    
    console.log(`Created reply 2 with ID: ${reply2.id}, parent: ${reply1.id}`);
    
    // Create another reply from the creator
    const [reply3] = await db
      .insert(messages)
      .values({
        threadId,
        content: "Absolutely! My premium package includes a complimentary engagement session. For the basic package, I can add an engagement session for an additional $500. The engagement photos are a great way to get comfortable with each other before the big day!",
        source: "instagram",
        status: "replied",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        senderName: "You",
        senderId: "creator-id",
        isOutbound: true,
        externalId: `reply-${Date.now()}-3`,
        metadata: {},
        userId: 1,
        parentMessageId: reply2.id // Reply to Sarah's question
      })
      .returning();
    
    console.log(`Created reply 3 with ID: ${reply3.id}, parent: ${reply2.id}`);
    
    console.log("\nThreaded conversation structure:");
    console.log(`Parent: ${parentMessage.id} - "${parentMessage.content?.substring(0, 50)}..."`);
    console.log(`  └─ Reply: ${reply1.id} - "${reply1.content?.substring(0, 50)}..."`);
    console.log(`      └─ Reply: ${reply2.id} - "${reply2.content?.substring(0, 50)}..."`);
    console.log(`          └─ Reply: ${reply3.id} - "${reply3.content?.substring(0, 50)}..."`);
    
    console.log("\nTest threaded messages created successfully!");
    
  } catch (error) {
    console.error("Error creating threaded test messages:", error);
  }
}

addThreadedTestMessages();
