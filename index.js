process.on('uncaughtException', (err) => {
  console.error(err);
  console.log('Node NOT Exiting...');
});

const express     = require('express');       // simplifies http server development
const cors        = require('cors');          // allow cross-origin requests
const path        = require('path');          // to get the current path

const app         = express();

app.use(cors());

app.use(express.json())
app.use(express.urlencoded({ extended: true}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(express.static(path.join(__dirname, 'public')));  // make the public folder available

const ccncalc = require('./cc-ncalc');

app.get('/surface', ccncalc.surface);

app.listen(80);

console.log('Running!');
