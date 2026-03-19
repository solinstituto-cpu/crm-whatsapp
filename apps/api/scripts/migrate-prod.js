/**
 * Render-safe Prisma migration runner.
 *
 * - Prefer `prisma migrate deploy` (uses committed migrations)
 * - If deploy fails (common when DB drift happened), fallback to `prisma db push`
 *
 * This avoids breaking production deploys due to interactive prompts.
 */
const { execSync } = require('child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

try {
  run('npx prisma migrate deploy');
  run('npx prisma generate');
  process.exit(0);
} catch (err) {
  console.error('[migrate-prod] migrate deploy failed, falling back to db push...');
  try {
    run('npx prisma db push');
    run('npx prisma generate');
    process.exit(0);
  } catch (err2) {
    console.error('[migrate-prod] db push also failed.');
    process.exit(1);
  }
}

