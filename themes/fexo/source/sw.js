importScripts("//cdn.jsdelivr.net/npm/@glacierjs/core/dist/index.min.js");
importScripts('//cdn.jsdelivr.net/npm/@glacierjs/sw/dist/index.min.js');
importScripts('//cdn.jsdelivr.net/npm/@glacierjs/plugin-assets-cache/dist/index.min.js');

const { GlacierSW } = self['@glacierjs/sw'];
const { AssetsCacheSW, Strategy } = self['@glacierjs/plugin-assets-cache'];

const glacierSW = new GlacierSW();

glacierSW.use(new AssetsCacheSW({
  routes: [{
      // capture as RegExp: store all images with cache-first strategy
      capture: /\.(png|jpg)$/,
      strategy: Strategy.CACHE_FIRST
  }, {
      // capture as function: store all stylesheet with cache-first strategy
      capture: ({ request }) => request.destination === 'style',
      strategy: Strategy.CACHE_FIRST
  }],
}));

glacierSW.listen();