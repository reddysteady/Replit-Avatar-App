import createInitialThreads from './create-initial-threads';

async function runMigration() {
  console.log("Starting thread migration...");
  
  try {
    const results = await createInitialThreads();
    console.log(`Migration completed successfully. Created ${results.length} threads.`);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log("Thread migration script completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });