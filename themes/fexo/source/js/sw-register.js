loadScript('https://cdn.jsdelivr.net/npm/@glacierjs/core/dist/index.min.js', () =>
  loadScript('https://cdn.jsdelivr.net/npm/@glacierjs/window/dist/index.min.js', () => {
    const { GlacierWindow } = window['@glacierjs/window'];
    const glacier = new GlacierWindow('./sw.js');
    glacier.register().then((registration) => {
        console.log('Register service-worker succeed', registration);
    }).catch((error) => {
        console.error('Register service-worker fail', err);
    });
  })
)