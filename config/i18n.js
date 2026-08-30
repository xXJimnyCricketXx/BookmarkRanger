const path = require('path');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
        backend: { loadPath: path.join(__dirname, '..', 'locales', '{{lng}}', 'translation.json') },
        fallbackLng: 'de',
        preload: ['de', 'en'],
        detection: { order: ['cookie'], caches: ['cookie'] }
    });

module.exports = i18next;
