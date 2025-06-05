import { db } from "../server/db";
import { messages, type InsertMessage } from "../shared/schema";

// A collection of realistic Instagram usernames
const usernames = [
  "travel_with_amy", "tech_jake", "fitness_maria", "cooking_dad",
  "photo_julia", "hiking_adventures", "digital_nomad_life", "music_lover_22",
  "plant_parent", "coffee_enthusiast", "yoga_life_balance", "design_thinking",
  "book_worm_reads", "cat_lady_vibes", "sneaker_collector", "sunrise_chaser",
  "urban_explorer", "minimalist_living", "foodie_finds", "surf_the_waves",
  "art_daily_practice", "vintage_collector", "eco_friendly_tips", "night_sky_photos",
  "diy_home_projects", "fashion_forward_style", "daily_meditation", "small_business_owner",
  "crypto_investor", "podcast_listener", "film_photography", "street_art_lover",
  "vegan_recipes", "marathon_runner", "craft_beer_taster", "makeup_artist",
  "guitar_player", "tattoo_enthusiast", "mountain_climber", "language_learner",
  "chess_master", "board_game_geek", "wildlife_photographer", "history_buff",
  "star_gazer", "tea_connoisseur", "bike_commuter", "sketch_artist",
  "travel_blogger", "comedy_writer"
];

// Generate random avatar URLs
const generateAvatarUrl = (username: string) => {
  return `https://api.dicebear.com/7.x/micah/svg?seed=${username}`;
};

// A collection of realistic Instagram DMs that might be sent to a creator
// Include a mix of questions, comments, feedback, and high-intent messages
const messageTemplates = [
  "Hey! I love your content, especially your recent posts about {topic}. Keep it up!",
  "Quick question - what {equipment} do you use for your {content_type}?",
  "I've been following you for months now and your content has really inspired me to start my own {activity}!",
  "Do you offer any coaching or 1:1 sessions? I'd love to learn more about {topic} from you.",
  "Can you recommend some resources for someone just getting started with {topic}?",
  "Your last post about {topic} really resonated with me. I've been thinking about it all day.",
  "I tried your {recommendation} and it worked perfectly! Thank you so much for sharing.",
  "How long have you been doing {activity}? Your skills are amazing!",
  "Do you have any tips for someone struggling with {problem}?",
  "I'm visiting {location} next month - any recommendations on places to check out?",
  "Would you ever consider collaborating on a project together? I think our styles would complement each other.",
  "What's your best advice for someone wanting to grow their presence on Instagram?",
  "I'm looking to purchase {product} soon, do you have any affiliate links I could use to support you?",
  "Thank you for being so open about {sensitive_topic}. It's helped me deal with similar issues.",
  "I noticed you use {tool/app}. Is it worth the investment? I'm considering getting it.",
  "Your aesthetic is exactly what I'm trying to achieve. Do you edit your photos with a specific preset?",
  "I've shared your account with all my friends who are into {topic}. You deserve more followers!",
  "How do you balance {activity} with your full-time job? I'm struggling to find time.",
  "Would you be interested in being a guest on my podcast? We focus on {topic} and I think you'd be perfect.",
  "I'm launching a new {product/service} and would love your feedback or possibly a shoutout if you like it.",
  "Have you tried {new_trend} yet? I'd love to see your take on it.",
  "Your {content_type} inspired me to book a trip to {location}! Any tips before I go?",
  "What camera settings do you use for {specific_condition} photography?",
  "I've been dealing with {challenge} and your content has been a bright spot in my day. Thank you.",
  "Do you have a YouTube channel or other platforms where I can follow your work?",
  "I've been trying to improve my {skill} but hitting a plateau. Any advice?",
  "Could you do a tutorial on how you {specific_technique}? I've been trying to figure it out.",
  "Your journey with {topic} is so inspiring. How did you get started?",
  "I'm planning a {event} and would love to hire you if you do that sort of thing!",
  "What's your favorite {category} right now? I always trust your recommendations.",
  "Just wanted to say your content has helped me through a tough time. Keep doing what you're doing.",
  "I'm building a community around {topic} and would love for you to join as a featured creator.",
  "How do you come up with fresh content ideas? I'm feeling stuck lately.",
  "Do you have any discount codes for {brand} or other products you recommend?",
  "Your {specific_post} changed my perspective on {topic}. I never thought about it that way before.",
  "What's one book/resource that has had the biggest impact on your {skill/career}?",
  "I'm struggling with {technical_problem}. Have you faced this and found a solution?",
  "The way you talk about {topic} makes complex ideas so accessible. You should write a book!",
  "I'm launching a similar {project} and would value your input or mentorship.",
  "Your content on {topic} has helped me make some big decisions recently. Thank you for sharing your knowledge.",
  "Do you have a newsletter or email list? I don't want to miss any of your updates.",
  "How do you handle criticism or negative comments on your content?",
  "I've been following your {specific_series} and implementing your tips with great results!",
  "Would you be open to reviewing my {work/product} and giving some feedback?",
  "Your authenticity sets you apart from other creators in this space. Never change!",
  "Do you plan on creating any courses or educational content about {topic}?",
  "I'm torn between {option_A} and {option_B} - which would you recommend based on your experience?",
  "Your growth on this platform is inspiring! How long did it take you to reach this point?",
  "I've been using your {method/approach} for a week now and already seeing improvements. Thank you!"
];

// Topics to substitute into templates
const substitutions = {
  topic: [
    "travel photography", "content creation", "morning routines", "productivity hacks", 
    "sustainable living", "mindfulness", "fitness journey", "cooking techniques",
    "personal branding", "social media growth", "creative process", "investment strategies",
    "language learning", "digital nomad lifestyle", "home organization", "mental health"
  ],
  equipment: [
    "camera", "microphone", "lighting setup", "editing software", "drone", "gimbal",
    "tripod", "lens", "smartphone", "audio recorder", "fitness tracker", "standing desk"
  ],
  content_type: [
    "photos", "videos", "stories", "reels", "tutorials", "reviews", "vlogs",
    "interviews", "behind-the-scenes content", "time-lapses", "day-in-the-life posts"
  ],
  activity: [
    "photography", "blogging", "vlogging", "podcasting", "painting", "cooking",
    "yoga practice", "meditation", "running", "hiking", "coding", "investing",
    "gardening", "home decorating", "writing", "public speaking"
  ],
  recommendation: [
    "morning routine", "productivity app", "camera settings", "editing technique",
    "recipe", "workout plan", "book recommendation", "travel hack", "study method",
    "budgeting approach", "meditation practice", "note-taking system"
  ],
  problem: [
    "impostor syndrome", "creative blocks", "time management", "consistency",
    "work-life balance", "motivation", "social media algorithm changes", "burnout",
    "equipment limitations", "financial constraints", "self-doubt", "criticism"
  ],
  location: [
    "Bali", "Japan", "New York City", "Portugal", "Iceland", "Mexico City",
    "Barcelona", "Thailand", "Costa Rica", "South Africa", "Australia", "Croatia"
  ],
  sensitive_topic: [
    "mental health", "career changes", "financial struggles", "personal loss",
    "health challenges", "relationship difficulties", "creative insecurities"
  ],
  "tool/app": [
    "Lightroom", "Final Cut Pro", "Notion", "Canva", "Adobe Creative Suite",
    "VSCO", "Planoly", "Asana", "Grammarly", "ClickUp", "DaVinci Resolve"
  ],
  new_trend: [
    "film photography", "vertical video", "text overlays", "voice notes",
    "AI tools", "sustainable fashion", "slow living", "no-code development"
  ],
  specific_condition: [
    "low light", "golden hour", "indoor", "action shots", "night sky",
    "rainy weather", "bright sunlight", "underwater", "aerial", "portrait"
  ],
  challenge: [
    "anxiety", "creative blocks", "negative self-talk", "comparing myself to others",
    "feeling overwhelmed", "finding my unique voice", "technical difficulties"
  ],
  skill: [
    "photography", "video editing", "writing", "public speaking", "graphic design",
    "social media strategy", "time management", "networking", "SEO", "coding"
  ],
  specific_technique: [
    "achieve that film look", "create seamless transitions", "batch content",
    "color grade your photos", "grow engagement", "find your style", "manage your time"
  ],
  event: [
    "wedding", "corporate retreat", "product launch", "conference", "workshop",
    "team building event", "birthday celebration", "promotional photoshoot"
  ],
  category: [
    "book", "podcast", "documentary", "editing app", "camera accessory",
    "productivity tool", "online course", "travel destination", "coffee shop"
  ],
  specific_post: [
    "story highlight", "recent reel", "blog post", "podcast episode",
    "tutorial", "behind-the-scenes post", "Q&A session", "collaboration"
  ],
  technical_problem: [
    "export settings", "color calibration", "file organization", "backing up work",
    "slow editing software", "storage solutions", "workflow optimization"
  ],
  specific_series: [
    "editing tutorials", "photography tips", "travel guides", "behind-the-scenes",
    "day-in-the-life", "review series", "interviews", "monthly favorites"
  ],
  "work/product": [
    "portfolio", "website", "Instagram feed", "YouTube channel", "podcast",
    "photography", "writing", "product design", "business idea"
  ],
  "method/approach": [
    "editing workflow", "content calendar", "brainstorming technique", "morning routine",
    "productivity system", "networking strategy", "creative process", "marketing plan"
  ],
  option_A: [
    "Canon", "Sony", "iPhone", "Adobe", "Mac", "PC", "self-hosted", "managed service",
    "premium option", "budget option", "digital", "analog", "Nikon", "Fujifilm"
  ],
  option_B: [
    "Sony", "Nikon", "Android", "Final Cut", "PC", "Mac", "managed service", "self-hosted",
    "budget option", "premium option", "analog", "digital", "Canon", "Olympus"
  ]
};

// Format a date between 1 day and 3 weeks ago
const generatePastDate = () => {
  const now = new Date();
  // Random minutes ago (between 1 day and 3 weeks ago)
  const minutesAgo = Math.floor(Math.random() * (3 * 7 * 24 * 60 - 24 * 60) + 24 * 60);
  now.setMinutes(now.getMinutes() - minutesAgo);
  return now;
};

// Generate a unique Instagram message ID
const generateMessageId = () => {
  return `ig_dm_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
};

// Fill in a template with random substitutions
const fillTemplate = (template: string) => {
  // Find all {placeholder} patterns
  const placeholders = template.match(/\{([^}]+)\}/g) || [];
  
  let filledTemplate = template;
  
  placeholders.forEach(placeholder => {
    // Extract the key from {key}
    const key = placeholder.slice(1, -1);
    
    if (substitutions[key]) {
      // Get a random substitution for this key
      const options = substitutions[key];
      const randomOption = options[Math.floor(Math.random() * options.length)];
      // Replace the placeholder with the random option
      filledTemplate = filledTemplate.replace(placeholder, randomOption);
    }
  });
  
  return filledTemplate;
};

// Generate a single test message
const generateTestMessage = (index: number): InsertMessage => {
  const username = usernames[Math.floor(Math.random() * usernames.length)];
  const messageTemplate = messageTemplates[index % messageTemplates.length];
  const content = fillTemplate(messageTemplate);
  
  return {
    source: "instagram",
    externalId: generateMessageId(),
    senderId: `user_${Math.floor(Math.random() * 100000000)}`,
    senderName: username,
    senderAvatar: generateAvatarUrl(username),
    content: content,
    timestamp: generatePastDate(),
    status: "new",
    isHighIntent: Math.random() > 0.7, // 30% chance of being high intent
    intentCategory: Math.random() > 0.7 ? ["purchase", "collaboration", "question"][Math.floor(Math.random() * 3)] : null,
    intentConfidence: Math.floor(Math.random() * 100), // Random confidence level between 0-100
    isSensitive: Math.random() > 0.9, // 10% chance of being sensitive content
    sensitiveCategory: Math.random() > 0.9 ? "personal" : null,
    reply: null,
    isAiGenerated: false,
    metadata: {},
    userId: 1
  };
};

// Main function to create test DMs
async function createTestDMs(count: number = 50) {
  console.log(`Generating ${count} test Instagram messages...`);
  
  const testMessages: InsertMessage[] = [];
  
  for (let i = 0; i < count; i++) {
    testMessages.push(generateTestMessage(i));
  }
  
  // Insert messages into the database
  try {
    await db.insert(messages).values(testMessages);
    console.log(`Successfully added ${count} test messages to the database!`);
  } catch (error) {
    console.error("Error adding test messages to database:", error);
  }
}

// Run the script with a default of 50 messages
// You can change this number when running the script
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 50;
createTestDMs(count);