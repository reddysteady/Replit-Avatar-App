// scripts/migrateNeonToSupabase.ts

/**
 * One-time migration from Neon → Supabase using Drizzle ORM
 * 
 * ✅ Make sure these env vars are set (via Replit Secrets or .env):
 * - DATABASE_URL           → your Neon connection string
 * - SUPABASE_DATABASE_URL → your Supabase connection string
 */

import { config } from 'dotenv'
config() // Load env vars from .env or Replit

import { drizzle as drizzleNeon } from 'drizzle-orm/node-postgres'
import { drizzle as drizzleSupabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import {
  users,
  messageThreads,
  messages,
  settings,
} from '../shared/schema'

// 🧱 Migration order matters (respect foreign keys)
const tables = [
  { name: 'users', table: users },
  { name: 'messageThreads', table: messageThreads },
  { name: 'messages', table: messages },
  { name: 'settings', table: settings },
]

async function migrateTable(name: string, table: any, dbFrom: any, dbTo: any) {
  try {
    console.log(`\n🔄 Migrating "${name}"`)
    const rows = await dbFrom.select().from(table)

    if (rows.length === 0) {
      console.log(`⚠️ No rows in "${name}"`)
      return
    }

    console.log(`📦 Found ${rows.length} rows. Inserting into Supabase...`)
    await dbTo.insert(table).values(rows).execute()
    console.log(`✅ Migrated ${rows.length} rows from "${name}"`)
  } catch (err) {
    console.error(`❌ Error migrating "${name}":`, err)
  }
}

async function run() {
  const neonPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const supabasePool = new Pool({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const neonDb = drizzleNeon(neonPool)
  const supabaseDb = drizzleSupabase(supabasePool)

  for (const { name, table } of tables) {
    await migrateTable(name, table, neonDb, supabaseDb)
  }

  await neonPool.end()
  await supabasePool.end()

  console.log('\n🎉 Migration complete.\n')
}

run().catch((err) => {
  console.error('❌ Fatal error during migration:', err)
  process.exit(1)
})

