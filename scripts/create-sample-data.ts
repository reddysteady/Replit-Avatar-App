import { db } from '../server/db'
import { messages, users, settings } from '../shared/schema'

async function createSampleData() {
  console.log('Creating sample data...')

  // Create default user if it doesn't exist
  const existingUsers = await db.select().from(users)

  if (existingUsers.length === 0) {
    console.log('Creating default user...')
    await db.insert(users).values({
      username: 'demo_user',
      password: 'password123', // In a real app, this would be hashed
      email: 'demo@example.com',
      createdAt: new Date(),
    })
  }

  // Check if we already have messages
  const existingMessages = await db.select().from(messages)

  if (existingMessages.length === 0) {
    console.log('Creating sample messages...')

    // Create sample Instagram messages
    await db.insert(messages).values([
      {
        source: 'instagram',
        externalId: 'ig-123456',
        senderId: 'user1',
        senderName: 'Michael Scott',
        senderAvatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256',
        content:
          "Hey, I love your content about productivity systems! I've been struggling with managing my time. Do you offer coaching or any personalized advice?",
        timestamp: new Date(),
        status: 'new',
        isHighIntent: true,
        intentCategory: 'service_inquiry',
        intentConfidence: 80,
        userId: 1,
      },
      {
        source: 'instagram',
        externalId: 'ig-123457',
        senderId: 'user2',
        senderName: 'Jane Cooper',
        senderAvatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256',
        content:
          'I just watched your latest video and I have a question about the app you mentioned. What was the name again? Thanks!',
        timestamp: new Date(),
        status: 'new',
        isHighIntent: false,
        userId: 1,
      },
      {
        source: 'instagram',
        externalId: 'ig-123458',
        senderId: 'user3',
        senderName: 'Tom Wilson',
        senderAvatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256',
        content: 'Love your content! What camera do you use for your videos?',
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        status: 'auto-replied',
        reply:
          'Thanks for the kind words! I use a Sony A7III for most of my videos with a 24-70mm lens. I have all my gear linked in the description of my latest video if you want to check it out. Let me know if you have any other questions!',
        isAiGenerated: true,
        userId: 1,
      },
      {
        source: 'instagram',
        externalId: 'ig-123459',
        senderId: 'user4',
        senderName: 'Alex Morgan',
        senderAvatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256',
        content:
          'Could you do a tutorial on how to set up that productivity dashboard you showed last week?',
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        status: 'replied',
        reply:
          "Hey Alex! I'm actually planning to release a tutorial next week. I'll send you the link when it's ready!",
        isAiGenerated: false,
        userId: 1,
      },
      {
        source: 'instagram',
        externalId: 'ig-123460',
        senderId: 'user5',
        senderName: 'Chris Johnson',
        senderAvatar:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256',
        content:
          "I'm looking to hire someone with your expertise for my company's next project. Can we discuss potential collaboration opportunities?",
        timestamp: new Date(),
        status: 'new',
        isHighIntent: true,
        intentCategory: 'business_opportunity',
        intentConfidence: 90,
        userId: 1,
      },
    ])

    // Create sample YouTube comments
    await db.insert(messages).values([
      {
        source: 'youtube',
        externalId: 'yt-123456',
        senderId: 'ytuser1',
        senderName: 'Sarah Williams',
        senderAvatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256',
        content:
          'Great video! Do you have any tips for beginners in this field?',
        timestamp: new Date(),
        status: 'new',
        userId: 1,
      },
      {
        source: 'youtube',
        externalId: 'yt-123457',
        senderId: 'ytuser2',
        senderName: 'Mark Thompson',
        senderAvatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256',
        content:
          "I've been following your channel for months and I've learned so much. Would you consider doing a collaboration?",
        timestamp: new Date(),
        status: 'new',
        isHighIntent: true,
        intentCategory: 'collaboration',
        intentConfidence: 85,
        userId: 1,
      },
    ])
  }

  // Check if we have default settings
  const existingSettings = await db.select().from(settings)

  if (existingSettings.length === 0) {
    console.log('Creating default settings...')
    await db.insert(settings).values({
      userId: 1,
      aiAutoRepliesInstagram: false,
      aiAutoRepliesYoutube: false,
      instagramToken: '',
      youtubeToken: '',
      openaiToken: process.env.OPENAI_API_KEY || '',
      airtableToken: '',
      airtableBaseId: '',
      airtableTableName: 'Leads',
      aiTemperature: 70, // 0.7
      aiModel: 'gpt-4o',
      maxResponseLength: 500,
      notificationEmail: 'demo@example.com',
      notifyOnHighIntent: true,
      notifyOnSensitiveTopics: true,
    })
  }

  console.log('Sample data creation completed!')
}

createSampleData()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error creating sample data:', err)
    process.exit(1)
  })
