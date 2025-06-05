import { db } from "../server/db";
import { messages, messageThreads } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createInitialThreads() {
  console.log("Creating initial message threads...");

  try {
    // First, get all messages that don't have a thread assigned
    const messagesWithoutThreads = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, null));

    console.log(`Found ${messagesWithoutThreads.length} messages without threads`);

    // Group messages by senderId to create threads
    const messagesBySender: Record<string, typeof messagesWithoutThreads> = {};
    
    for (const message of messagesWithoutThreads) {
      const key = `${message.senderId}-${message.source}`;
      if (!messagesBySender[key]) {
        messagesBySender[key] = [];
      }
      messagesBySender[key].push(message);
    }

    console.log(`Grouped into ${Object.keys(messagesBySender).length} potential threads`);

    // Create threads for each sender
    const threadResults = [];
    
    for (const [key, senderMessages] of Object.entries(messagesBySender)) {
      if (senderMessages.length === 0) continue;
      
      // Sort messages by timestamp to get the most recent
      senderMessages.sort((a, b) => 
        new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
      );
      
      const latestMessage = senderMessages[0];
      const oldestMessage = senderMessages[senderMessages.length - 1];
      
      // Create a thread for this sender
      const [thread] = await db
        .insert(messageThreads)
        .values({
          externalParticipantId: latestMessage.senderId,
          participantName: latestMessage.senderName,
          participantAvatar: latestMessage.senderAvatar,
          source: latestMessage.source,
          lastMessageAt: latestMessage.timestamp || new Date(),
          lastMessageContent: latestMessage.content,
          status: 'active',
          unreadCount: senderMessages.filter(m => m.status === 'new').length,
          userId: 1, // Default user ID for MVP
        })
        .returning();
      
      console.log(`Created thread ${thread.id} for ${latestMessage.senderName}`);
      threadResults.push(thread);
      
      // Update all messages to link to this thread
      for (const message of senderMessages) {
        await db
          .update(messages)
          .set({ threadId: thread.id })
          .where(eq(messages.id, message.id));
      }
      
      console.log(`Updated ${senderMessages.length} messages to link to thread ${thread.id}`);
    }

    console.log(`Successfully created ${threadResults.length} threads`);
    return threadResults;
  } catch (error) {
    console.error("Error creating initial threads:", error);
    throw error;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  createInitialThreads()
    .then(() => {
      console.log("Initial threads creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export default createInitialThreads;