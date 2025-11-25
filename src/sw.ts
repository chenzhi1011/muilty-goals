// Minimal service worker for injectManifest
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);
(self as any).skipWaiting();
clientsClaim();
