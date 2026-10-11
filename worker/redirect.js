/*
 * line-calc.stoatworks-labs.com — retired.
 *
 * Line Calc moved into Pixel Peeker on 2026-10-11 as its "Line calc" view, running on
 * Pixel Peeker's own capacity model and library instead of a copy and a snapshot. This
 * Worker is all that is left of the site: every request is permanently redirected to
 * that view, whose `#line` hash Pixel Peeker keeps for exactly this purpose.
 *
 * The one exception is /sw.js. Anyone who used Line Calc has its service worker
 * installed, and the browser re-fetches /sw.js to update it. A redirect there fails the
 * update — service worker scripts may not redirect — so the old worker, and its cached
 * copy of the old app, would stay and keep answering offline. What is served instead
 * deletes those caches, unregisters itself and reloads any open tab, which then gets the
 * redirect like everyone else.
 */

const TARGET = 'https://pixel-peeker.stoatworks-labs.com/#line';

const RETIRE_SERVICE_WORKER = `// Line Calc moved into Pixel Peeker (${TARGET}). This retires the old offline copy.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
`;

export default {
  fetch(request) {
    if (new URL(request.url).pathname === '/sw.js') {
      return new Response(RETIRE_SERVICE_WORKER, {
        headers: {
          'content-type': 'text/javascript; charset=utf-8',
          'cache-control': 'no-cache',
        },
      });
    }
    return Response.redirect(TARGET, 301);
  },
};
