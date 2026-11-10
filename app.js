const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const seo = require('./controllers/seoController');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.isProd
      ? { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:', 'blob:', 'https:'], connectSrc: ["'self'"], frameSrc: ['https://www.google.com'], objectSrc: ["'none'"] } }
      : false,
  })
);
app.use(cors({ origin: (o, cb) => (!o || env.clientUrls.includes(o) ? cb(null, true) : cb(new Error('Not allowed by CORS'))), credentials: true }));
app.use(compression());
if (!env.isProd) app.use(morgan('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . operators from input (NoSQL injection)
app.use(xss()); // sanitises HTML in input

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '30d', immutable: true }));
app.get('/robots.txt', seo.robots);
app.get('/sitemap.xml', seo.sitemap);
app.use('/api', apiLimiter, routes);
app.use('/api', notFound);

// In production the built React app is served by Express, with SEO tags injected per URL
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist, { index: false, maxAge: '7d' }));
  app.get('*', seo.renderPage(dist));
}
app.use(errorHandler);
module.exports = app;
