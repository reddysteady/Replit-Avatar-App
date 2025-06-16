import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

let storage: any
let pool: any
let serverClose: (() => void) | undefined

vi.mock('../db', async () => {
  const { newDb } = await import('pg-mem')
  const { drizzle } = await import('drizzle-orm/node-postgres')
  const schema = await import('@shared/schema')
  const { Pool } = await import('pg')

  const mem = newDb({ autoCreateForeignKeyIndices: true })
  mem.public.none(`
    CREATE TABLE messages (
      id serial PRIMARY KEY NOT NULL,
      thread_id integer,
      source text NOT NULL,
      external_id text NOT NULL,
      sender_id text NOT NULL,
      sender_name text NOT NULL,
      sender_avatar text,
      content text NOT NULL,
      timestamp timestamp DEFAULT now() NOT NULL,
      status text DEFAULT 'new' NOT NULL,
      is_high_intent boolean DEFAULT false,
      intent_category text,
      intent_confidence integer,
      is_sensitive boolean DEFAULT false,
      sensitive_category text,
      reply text,
      reply_timestamp timestamp,
      is_ai_generated boolean DEFAULT false,
      is_outbound boolean DEFAULT false,
      parent_message_id integer,
      metadata jsonb,
      user_id integer
    );
  `)
  const server = await mem.adapters.bindServer()
  serverClose = server.close
  pool = new Pool({ connectionString: server.postgresConnectionString })
  const db = drizzle(pool, { schema })
  return { db, pool }
})

beforeAll(async () => {
  const mod = await import('../database-storage')
  storage = new mod.DatabaseStorage()
})

afterAll(async () => {
  await pool.end()
  serverClose?.()
})

describe('DatabaseStorage message constraints', () => {
  // Skipped in CI environments lacking pg-server
  it.skip('rejects duplicate IDs and allows new inserts', async () => {
    const first = await storage.createMessage({
      source: 'instagram',
      externalId: 'e1',
      senderId: 's1',
      senderName: 'user',
      content: 'one',
      metadata: {},
    })

    let error: any
    try {
      await storage.createMessage({
        ...first,
        id: first.id,
        externalId: 'dup',
      } as any)
    } catch (e) {
      error = e
    }
    expect(error).toBeTruthy()

    const after = await storage.createMessage({
      source: 'instagram',
      externalId: 'e2',
      senderId: 's2',
      senderName: 'user',
      content: 'two',
      metadata: {},
    })
    expect(after.id).not.toBe(first.id)
  })
})
