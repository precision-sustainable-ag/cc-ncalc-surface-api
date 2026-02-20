// process.on('uncaughtException', (err) => {
//   console.error(err);
//   console.log('Node NOT Exiting...');
// });

const express = require('express'); // simplifies http server development

const dotenv = require('dotenv');

dotenv.config();

const cors = require('cors'); // allow cross-origin requests
const path = require('node:path'); // to get the current path
const fs = require('node:fs');
const ccncalc = require('./cc-ncalc');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(express.static(path.join(__dirname, 'public'))); // make the public folder available

app.get('/', (req, res) => {
  const fileContent = fs.readFileSync('index.html', 'utf-8');

  // Replace HOSTNAME with the current hostname
  const currentHostname = `${req.protocol}://${req.headers.host}`;
  const modifiedContent = fileContent.replace(/HOSTNAME/g, currentHostname);

  res.send(modifiedContent);
});

app.all('/surface', ccncalc.surface);
app.get('/mit', ccncalc.mit);
app.get('/modelInputs', ccncalc.modelInputs);
app.all('/status', ccncalc.status);

app.use(express.static(`${__dirname}/build`));
app.get('/models', (_req, res) => res.sendFile(`${__dirname}/build/index.html`));

app.get('/sourceold', (_req, res) => {
  const fileContent = fs.readFileSync('surface.js', 'utf-8');
  res.set('Content-Type', 'text/javascript');
  res.send(fileContent.match(/const surfaceModel.+?[\n\r]\}/ms)[0]);
});

app.get('/sourcenew', (_req, res) => {
  const fileContent = fs.readFileSync('new2.js', 'utf-8');
  res.set('Content-Type', 'text/javascript');
  res.send(fileContent.match(/const surfaceModelNew.+?[\n\r]\}/ms)[0]);
});

const port = process.env.PORT || 80;
app.listen(port);

console.log(`Running on port ${port}`);
