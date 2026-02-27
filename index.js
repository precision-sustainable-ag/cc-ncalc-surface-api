require('dotenv').config();

const path = require('node:path');
const fs = require('node:fs');

const fastify = require('fastify')({
  logger: true,
  bodyLimit: 50 * 1024 * 1024, // 50mb
});

const cors = require('@fastify/cors');
const formbody = require('@fastify/formbody');
const statik = require('@fastify/static');

const ccncalc = require('./cc-ncalc');

// Plugins
fastify.register(cors, { origin: true });
fastify.register(formbody);

// Static folders
fastify.register(statik, {
  root: path.join(__dirname, 'build'),
  prefix: '/',
  decorateReply: true,
});

fastify.register(statik, {
  root: path.join(__dirname, 'public'),
  prefix: '/public/',
  decorateReply: false,
});

// Error handler
fastify.setErrorHandler((err, _req, reply) => {
  fastify.log.error(err);
  reply.code(500).send('Something broke!');
});

// Routes
fastify.get('/', async (req, reply) => {
  const fileContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

  const currentHostname = `${req.protocol}://${req.headers.host}`;
  const modifiedContent = fileContent.replace(/HOSTNAME/g, currentHostname);

  reply.type('text/html').send(modifiedContent);
});

fastify.all('/surface', (req, reply) => ccncalc.surface(req, reply));

fastify.get('/mit', (req, reply) => ccncalc.mit(req, reply));
fastify.get('/modelInputs', (req, reply) => ccncalc.modelInputs(req, reply));
fastify.all('/status', (req, reply) => ccncalc.status(req, reply));

fastify.get('/models', (_req, reply) => {
  return reply.sendFile('index.html');
});

fastify.get('/sourceold', async (_req, reply) => {
  const fileContent = fs.readFileSync(path.join(__dirname, 'surface.js'), 'utf-8');
  const match = fileContent.match(/const surfaceModel.+?[\n\r]\};/ms);
  reply.type('text/javascript').send(match ? match[0] : '');
});

fastify.get('/sourcenew', async (_req, reply) => {
  const fileContent = fs.readFileSync(path.join(__dirname, 'new2.js'), 'utf-8');
  const match = fileContent.match(/const surfaceModelNew.+?[\n\r]\};/ms);
  reply.type('text/javascript').send(match ? match[0] : '');
});

// Start server
const port = Number(process.env.PORT || 80);

fastify
  .listen({ port, host: '0.0.0.0' })
  .then(() => {
    fastify.log.info(`Running on port ${port}`);
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
