/// <reference lib="webworker" />

import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

const version = 2;

registerRoute(
    ({ url }) => url.origin === self.location.origin && url.pathname === '/',
    new StaleWhileRevalidate({
        cacheName: `pages-v${version}`,
    })
);

registerRoute(
    ({ request, url }) => ['script', 'style', 'font'].includes(request.destination)
        // Local images
        || (url.origin === self.location.origin && !url.pathname.startsWith('/submissions') && request.destination === 'image'),
    new StaleWhileRevalidate({
        cacheName: `static-resources-v${version}`,
    })
);

registerRoute(
    ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/.netlify/functions/api'),
    new StaleWhileRevalidate({
        cacheName: `api-v${version}`
    })
);

registerRoute(
    ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/submissions/thumbs'),
    new CacheFirst({
        cacheName: `submission-thumbs-v${version}`
    })
);

console.log(`Yay! Workbox is loaded 🎉`);
