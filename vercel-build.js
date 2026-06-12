const { execSync } = require('child_process');
const fs = require('fs');

function runStep(name, command, options = {}) {
  console.log(`\n>>> STARTING STEP: ${name} ...`);
  try {
    execSync(command, { stdio: 'inherit', ...options });
    console.log(`>>> SUCCESSFUL STEP: ${name}\n`);
  } catch (error) {
    console.error(`\n>>> FAILED STEP: ${name}`);
    console.error(`Error message: ${error.message}`);
    if (error.stdout) console.error(`Stdout: ${error.stdout.toString()}`);
    if (error.stderr) console.error(`Stderr: ${error.stderr.toString()}`);
    throw error;
  }
}

try {
  if (process.env.DATABASE_URL) {
    console.log('Running database migrations...');
    try {
      execSync('pnpm --filter backend migrate', { stdio: 'inherit', env: process.env });
      console.log('Database migrations completed successfully.');
    } catch (migError) {
      console.warn('Database migration failed, but continuing build:', migError.message || migError);
    }
  } else {
    console.warn('DATABASE_URL not set — skipping migrations (preview build).');
  }

  runStep('Building Backend', 'pnpm --filter backend build');
  runStep('Building Frontend', 'pnpm --filter frontend build');

  console.log('\n>>> Copying frontend build output to root dist...');
  try {
    fs.rmSync('dist', { recursive: true, force: true });
    fs.cpSync('frontend/dist', 'dist', { recursive: true });
    console.log('>>> Copying complete.');
  } catch (copyError) {
    console.error('Failed to copy build output:', copyError);
    throw copyError;
  }

  console.log('\nProduction build complete.');
} catch (error) {
  console.error('\n================ BUNDLE BUILD FAILED ================');
  console.error(error.stack || error);
  console.error('=====================================================');
  process.exit(1);
}
