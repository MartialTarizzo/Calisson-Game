/**
 * service-wotker.js
 * 
 * # Auteur : Martial Tarizzo
 *
 * Licence : CC BY-NC-SA 4.0 DEED
 * https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr
*/

// Le n° de version de l'appication PWA
// Mettre à jour pour forcer l'actualisation du cache du navigateur
const VERSION_SC = "2.4.1"

// Based off of https://github.com/pwa-builder/PWABuilder/blob/main/docs/sw.js

/*
  Welcome to our basic Service Worker! This Service Worker offers a basic offline experience
  while also being easily customizeable. You can add in your own code to implement the capabilities
  listed below, or change anything else you would like.


  Need an introduction to Service Workers? Check our docs here: https://docs.pwabuilder.com/#/home/sw-intro
  Want to learn more about how our Service Worker generation works? Check our docs here: https://docs.pwabuilder.com/#/studio/existing-app?id=add-a-service-worker

  Did you know that Service Workers offer many more capabilities than just offline? 
    - Background Sync: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/06
    - Periodic Background Sync: https://web.dev/periodic-background-sync/
    - Push Notifications: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/07?id=push-notifications-on-the-web
    - Badges: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/07?id=application-badges
*/

const HOSTNAME_WHITELIST = [
    self.location.hostname,
    'fonts.gstatic.com',
    'fonts.googleapis.com',
    'cdn.jsdelivr.net'
]

// The Util Function to hack URLs of intercepted requests
const getFixedUrl = (req) => {
    var now = Date.now()
    var url = new URL(req.url)

    // 1. fixed http URL
    // Just keep syncing with location.protocol
    // fetch(httpURL) belongs to active mixed content.
    // And fetch(httpRequest) is not supported yet.
    url.protocol = self.location.protocol

    // 2. add query for caching-busting.
    // Github Pages served with Cache-Control: max-age=600
    // max-age on mutable content is error-prone, with SW life of bugs can even extend.
    // Until cache mode of Fetch API landed, we have to workaround cache-busting with query string.
    // Cache-Control-Bug: https://bugs.chromium.org/p/chromium/issues/detail?id=453190
    if (url.hostname === self.location.hostname) {
        url.search += (url.search ? '&' : '?') + 'cache-bust=' + now
    }
    return url.href
}

/**
 *  @Lifecycle Activate
 *  New one activated when old isnt being used.
 *
 *  waitUntil(): activating ====> activated
 */
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim())
})

/**
 *  @Functional Fetch
 *  All network requests are being intercepted here.
 *
 *  void respondWith(Promise<Response> r)
 */
self.addEventListener('fetch', event => {
    // Skip some of cross-origin requests, like those for Google Analytics.
    if (HOSTNAME_WHITELIST.indexOf(new URL(event.request.url).hostname) > -1) {
        // Stale-while-revalidate
        // similar to HTTP's stale-while-revalidate: https://www.mnot.net/blog/2007/12/12/stale
        // Upgrade from Jake's to Surma's: https://gist.github.com/surma/eb441223daaedf880801ad80006389f1
        const cached = caches.match(event.request)
        const fixedUrl = getFixedUrl(event.request)
        const fetched = fetch(fixedUrl, { cache: 'no-store' })
        const fetchedCopy = fetched.then(resp => resp.clone())

        // Call respondWith() with whatever we get first.
        // If the fetch fails (e.g disconnected), wait for the cache.
        // If there’s nothing in cache, wait for the fetch.
        // If neither yields a response, return offline pages.
        event.respondWith(
            Promise.race([fetched.catch(_ => cached), cached])
                .then(resp => resp || fetched)
                .catch(_ => { /* eat any errors */ })
        )

        // Update the cache with the version we fetched (only for ok status)
        event.waitUntil(
            Promise.all([fetchedCopy, caches.open("pwa-cache")])
                .then(([response, cache]) => response.ok && cache.put(event.request, response))
                .catch(_ => { /* eat any errors */ })
        )
    }
})

// from https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/core-concepts/05
// install event handler (note async operation)
// opens named cache, pre-caches identified resources above
const CACHE_NAME = 'pwa-cache'
const INITIAL_CACHED_RESOURCES = [

    // html
    './',
    './index.html',
    './index.en.html',
    './speedy.html',
    './training.html',

    // styles
    './css/popup.css',
    './css/style.css',

    // scripts
    './scripts/gamePlay_speedy.js',
    './scripts/gamePlay_training.js',
    './scripts/jquery-3.7.1.js',
    './scripts/playCalisson.js',

    // images
    './pictures/240px-388-clapping-hands-2.svg.png',
    './pictures/C2-frontieres.png',
    './pictures/icons8-home-fixed.gif',
    './pictures/C2-aretes.png',
    './pictures/calissons.png',
    './pictures/icons8-home.gif',
    './pictures/C2-calissons.png',
    './pictures/favicon.ico',
    './pictures/spinningWait.gif',

    // grilles
    './grids-training/enigmes_3_1.js',
    './grids-training/enigmes_3_3.js',
    './grids-training/enigmes_4_2.js',
    './grids-training/enigmes_5_1.js',
    './grids-training/enigmes_5_3.js',
    './grids-training/enigmes_6_2.js',
    './grids-training/enigmes_3_2.js',
    './grids-training/enigmes_4_1.js',
    './grids-training/enigmes_4_3.js',
    './grids-training/enigmes_5_2.js',
    './grids-training/enigmes_6_1.js',
    './grids-training/enigmes_6_3.js',
    './grids-speedy/enigmes_3_1.js',
    './grids-speedy/enigmes_3_3.js',
    './grids-speedy/enigmes_4_2.js',
    './grids-speedy/enigmes_5_1.js',
    './grids-speedy/enigmes_5_3.js',
    './grids-speedy/enigmes_6_2.js',
    './grids-speedy/enigmes_3_2.js',
    './grids-speedy/enigmes_4_1.js',
    './grids-speedy/enigmes_4_3.js',
    './grids-speedy/enigmes_5_2.js',
    './grids-speedy/enigmes_6_1.js',
    './grids-speedy/enigmes_6_3.js',

    // video
    './video/calisson_screencast.mp4'
];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        cache.addAll(INITIAL_CACHED_RESOURCES);
    })());
});