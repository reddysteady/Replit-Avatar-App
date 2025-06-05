import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Starting database migration for thread-based messaging...');
    
    // Create message_threads table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS message_threads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        external_participant_id TEXT NOT NULL,
        participant_name TEXT NOT NULL,
        participant_avatar TEXT,
        source TEXT NOT NULL,
        last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_message_content TEXT,
        status TEXT DEFAULT 'active',
        unread_count INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `);
    console.log('✅ Created message_threads table');
    
    // Add thread-related columns to messages table
    await db.execute(sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS thread_id INTEGER REFERENCES message_threads(id),
      ADD COLUMN IF NOT EXISTS is_outbound BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS parent_message_id INTEGER;
    `);
    console.log('✅ Added thread-related columns to messages table');
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();