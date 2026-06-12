const { execSync } = require('child_process');
const fs = require('fs');

try {
  if (process.env.DATABASE_URL) {
    console.log('Running database migrations...');
    try {
      execSync('pnpm --filter backend migrate', { stdio: 'inherit', env: process.env });
    } catch (migError) {
      console.warn('Database migration failed, but continuing build:', migError.message || migError);
    }
  } else {
    console.warn('DATABASE_URL not set — skipping migrations (preview build).');
  }

  console.log('Building backend...');
  execSync('pnpm --filter backend build', { stdio: 'inherit' });

  console.log('Building frontend...');
  execSync('pnpm --filter frontend build', { stdio: 'inherit' });

  console.log('Copying frontend build output to root dist...');
  fs.rmSync('dist', { recursive: true, force: true });
  fs.cpSync('frontend/dist', 'dist', { recursive: true });

  console.log('Production build complete.');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
