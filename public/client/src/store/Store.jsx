// import { current as showCurrent } from '@reduxjs/toolkit';

import { createStore } from 'redux-autosetters';
// eslint-disable-next-line import/no-unresolved
import all from './all.csv?raw';
import PSA from './PSA.txt?raw';

export { set, get } from 'redux-autosetters';

const family = {
  Buckwheat: 'Broadleaf',
  Mustard: 'Broadleaf',
  Radish: 'Broadleaf',
  Rape: 'Broadleaf',
  'Red hemp': 'Broadleaf',
  Sesame: 'Broadleaf',
  Turnip: 'Broadleaf',
  Barley: 'Grass',
  'Black oats': 'Grass',
  'Browntop millet': 'Grass',
  'Cereal rye': 'Grass',
  'German millet': 'Grass',
  'Japanese millet': 'Grass',
  Millet: 'Grass',
  Oats: 'Grass',
  'Oats/Black Oats': 'Grass',
  Ryegrass: 'Grass',
  Sudex: 'Grass',
  Teosinte: 'Grass',
  Triticale: 'Grass',
  Wheat: 'Grass',
  Balansa: 'Legume',
  'Berseem clover': 'Legume',
  'Chinese red pea': 'Legume',
  Clover: 'Legume',
  Cowpea: 'Legume',
  'Crimson clover': 'Legume',
  'Hairy vetch': 'Legume',
  Legume: 'Legume',
  Lupine: 'Legume',
  'Persian clover': 'Legume',
  'Red clover': 'Legume',
  'Sunn hemp': 'Legume',
  Vetch: 'Legume',
  'White clover': 'Legume',
  'Winter pea': 'Legume',
};

let d = all.trim().replace(/^,+$/mg, '').split(/[\n\r]+/).map((s) => s.split(','));

const headers = d[0];

d = d.slice(1).map((row) => (
  Object.fromEntries(row.map((col, i) => [headers[i], col]))
));

d.forEach((row) => {
  if (!row.NFC && +row.NDF && +row.CP && +row.Fat && +row.Ash) {
    row.NFC = (100 - ((row.NDF * 0.93) + +row.CP + +row.Fat + +row.Ash)).toFixed(2);
  }

  if (!row.carb && +row.CP && +row.Fat && +row.NFC) {
    row.carb = (+row.CP + +row.Fat + +row.NFC).toFixed(2);
  }

  if (!row.cellulose && +row.lignin && +row.ADF) {
    row.cellulose = (row.NDF - (+row.lignin + +row.Ash)).toFixed(2);
  }

  // normalize
  const total = +row.carb + +row.cellulose;
  if (+total) {
    const remaining = 100 - row.lignin; // The portion of 100 allocated to carb and cellulose
    const carbRatio = row.carb / (+row.carb + +row.cellulose);
    const celluloseRatio = row.cellulose / (+row.carb + +row.cellulose);

    row.carb = (carbRatio * remaining).toFixed(2);
    row.cellulose = (celluloseRatio * remaining).toFixed(2);
  }
});

const unknown = new Set();
d.forEach((row) => {
  row.Family = family[row.Species] || '';
  row.Category = '';

  if (row.Zadoks >= 20 && row.Zadoks < 30) row.Category = '1. Tillering';
  else if (row.Zadoks >= 30 && row.Zadoks < 40) row.Category = '2. Stem elongation';
  else if (row.Zadoks >= 40 && row.Zadoks < 50) row.Category = '3. Booting';
  else if (row.Zadoks >= 50 && row.Zadoks < 80) row.Category = '4. Heading/flowering';

  else if (/Tillering/i.test(row['Growth Stage'])) row.Category = '1. Tillering';
  else if (/Stem/.test(row['Growth Stage'])) row.Category = '2. Stem elongation';
  else if (/Flowering|bloom/i.test(row['Growth Stage'])) row.Category = '4. Heading/flowering';

  else if (/Feekes/.test(row['Growth Stage'])) {
    const stage = parseFloat(row['Growth Stage'].replace('Feekes ', ''));
    if (stage >= 2 && stage < 6) row.Category = '1. Tillering';
    else if (stage >= 6 && stage < 9) row.Category = '2. Stem elongation';
    else if (stage >= 9 && stage < 10) row.Category = '3. Booting';
    else if (stage >= 10 && stage <= 10.5) row.Category = '4. Heading/flowering';
    else unknown.add(row['Growth Stage']);
  } else {
    unknown.add(row['Growth Stage']);
  }
});

console.log('Unknown stage:', [...unknown].sort());

d = d.filter((row) => +row.lignin);

console.log(d);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

const sites = {};
PSA.trim().split(/[\n\r]+/).slice(1).forEach((site) => {
  const [
    farm, lat, lon, coverCrop, cashCrop, station, date, interval, lwc, biomass, biomassstd, n, nstd,
    fon, fonstd, carb, carbstd, cell, cellstd, lign, lignstd,
  ] = site.split('\t');

  sites[farm] = sites[farm] || [];
  sites[farm].push({
    farm,
    lat: +lat,
    lon: +lon,
    coverCrop,
    cashCrop,
    station,
    date: formatDate(new Date(date)),
    interval: +interval,
    lwc: +lwc,
    biomass: +biomass,
    biomassstd: +biomassstd,
    n: +n,
    nstd: +nstd,
    fon: +fon,
    fonstd: +fonstd,
    carb: +carb,
    carbstd: +carbstd,
    cell: +cell,
    cellstd: +cellstd,
    lign: +lign,
    lignstd: +lignstd,
  });
});

console.log(sites);

const initialState = {
  ndata: [],
  changing: false,
  updated: 1,
  filters: {
    State: [],
  },
  weather: [],
  temp: [],
  rain: [],
  RH: [],
  n: 0.6,
  carb: 33.45,
  biomass: 5604,
  cell: 57.81,
  lign: 8.74,
  OM: 0.75,
  BD: 1.62,
  in: 10,
  PMN: 7,
  lwc: 4,
  lat: 32.8653,
  lon: -82.2583,
  start: '2019-03-21',
  end: '2019-07-20',
  sites,
};

const afterChange = {};

const reducers = {};

export const store = createStore(initialState, { afterChange, reducers });

export const mobile = !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 800;
export const data = d;
