#!/bin/bash

set -e

echo "🌱 Ensuring migration tracking is initialized..."
mkdir -p migrations/meta
if [ ! -f migrations/meta/_journal.json ]; then
  echo '{"entries":[]}' > migrations/meta/_journal.json
  echo "✅ Initialized migrations/meta/_journal.json"
fi

echo "📄 Generating migration SQL from schema.ts..."
npx drizzle-kit generate --name full_schema

echo "🚀 Applying schema to Supabase..."
npx drizzle-kit migrate

echo "📦 Running Neon → Supabase data migration..."
npx tsx scripts/migrateNeonToSupabase.ts

echo "🎉 Done! Supabase is now schema-aligned and populated."