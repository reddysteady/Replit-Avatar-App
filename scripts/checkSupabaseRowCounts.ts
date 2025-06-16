import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { messageThreads, messages, settings } from '../shared/schema'

const db = drizzle(
  new Pool({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // <- this is the key part for Neon
  })
)

async function run() {
  const [threads, msgs, config] = await Promise.all([
    db.select().from(messageThreads),
    db.select().from(messages),
    db.select().from(settings),
  ])
  console.log('📊 messageThreads:', threads.length)
  console.log('💬 messages:', msgs.length)
  console.log('⚙️ settings:', config.length)
  process.exit(0)
}

run()
