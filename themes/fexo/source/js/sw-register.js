loadScript('https://cdn.jsdelivr.net/npm/@glacierjs/core/dist/index.min.js', () =>
  loadScript('https://cdn.jsdelivr.net/npm/@glacierjs/window/dist/index.min.js', () => {
    loadScript('https://cdn.jsdelivr.net/npm/@glacierjs/plugin-assets-cache/dist/index.min.js', () => {
      loadScript('https://cdn.jsdelivr.net/npm/@glacierjs/plugin-collector/dist/index.min.js', () => {
        const { GlacierWindow } = window['@glacierjs/window'];
        const { CacheFrom } = window['@glacierjs/plugin-assets-cache'];
        const { CollectorWindow, CollectedDataType } = window['@glacierjs/plugin-collector'];

        const glacier = new GlacierWindow('./sw.js');

        glacier.use(new CollectorWindow({
          send(collectDatas) {
            const { type, data } = collectDatas;

            switch (type) {
              case CollectedDataType.SW_REGISTER:
                console.debug('sw-register-count');
                break;

              case CollectedDataType.SW_INSTALLED:
                console.debug('sw-installed-count');
                break;

              case CollectedDataType.SW_CONTROLLED:
                console.debug('sw-controlled-count');
                break;

              case CollectedDataType.SW_FETCH:
                console.debug('sw-fetch-count');
                break;

              case CollectedDataType.CACHE_HIT:
                // hit service worker cache
                if (data?.from === CacheFrom.SW) {
                  console.debug(`sw-assets-count:hit-sw-${data.url}`);
                }

                // hit browser cache or network
                if (data?.from === CacheFrom.Window) {
                  console.debug(`sw-assets-count:hit-window-${data.url}`);
                }
                break;
            }
          }
        }));


        glacier.register().then((registration) => {
          console.log('Register service-worker succeed', registration);
        }).catch((error) => {
          console.error('Register service-worker fail', error);
        });
      })
    })
  })
)