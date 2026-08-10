// Run with: npx tsx test/smoke-test.ts
// Proves media-core works standalone — no React, no RN, just Node.
import 'dotenv/config';
import { PexelsClient } from '../src';

async function main() {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('Set PEXELS_API_KEY in a .env file first (see .env.example)');
  }

  const client = new PexelsClient({ apiKey });

  console.log('\n--- searchPhotos ---');
  const results = await client.searchPhotos({ query: 'mountains', per_page: 3 });
  console.log(`Found ${results.total_results} total, showing ${results.photos.length}`);
  results.photos.forEach((p) => console.log(`  #${p.id} by ${p.photographer}`));

  console.log('\n--- cache de-dupe check (same call again, should be instant) ---');
  console.time('cached call');
  await client.searchPhotos({ query: 'mountains', per_page: 3 });
  console.timeEnd('cached call');

  console.log('\n--- getPhoto (should emit a "view" event, logged automatically) ---');
  const first = results.photos[0];
  await client.getPhoto(first.id);

  console.log('\n--- trackDownload (should emit a "download" event) ---');
  client.trackDownload(first);

  console.log('\n--- independent subscriber, separate from default logger ---');
  const unsubscribe = client.events.on('view', (payload) => {
    console.log('  [app-level listener] saw a view event for item', (payload.item as { id: number }).id);
  });
  await client.getPhoto(results.photos[1].id);
  unsubscribe();

  console.log('\nAll good — media-core works standalone.');
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
