import { exec } from 'child_process';

console.log('Running test DM generation script...');

// The number of test messages to generate (default: 50)
const count = process.argv[2] || 50;

// Execute the generation script with tsx
exec(`npx tsx scripts/generate-test-dms.ts ${count}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing script: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Script errors: ${stderr}`);
    return;
  }
  
  console.log(stdout);
  console.log('Test DM generation completed successfully!');
});