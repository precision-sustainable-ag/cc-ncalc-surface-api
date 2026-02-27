// error 524 (timeout)

// LitterWaterContent:  +lwc
// Changed: utc

// TESTS:
// http://localhost/surface?start=2020-04-26&end=2020-10-22&lat=34.88689&lon=-83.41941&n=5&biomass=3000&lwc=10&bd=1.7&carb=55&cell=40&lign=5&test=true
// http://localhost/surface?start=2020-04-26&end=2020-10-22&lat=34.88689&lon=-83.41941&n=5&biomass=3000&lwc=10&bd=1.45&carb=40&cell=40&lign=20&test=true

// http://localhost/surface?start=2020-04-26&end=2020-10-22&lat=34.88689,35&lon=-83.41941,-84&n=5&biomass=3000&lwc=10&bd=1.45&carb=40&cell=40&lign=20

const weatherURL = 'https://weather.covercrop-data.org';
// const weatherURL = 'http://localhost';

process.on('uncaughtException', (err) => {
  console.trace(err);
  // exit(URL);
});

const MRMSround = (n) => (Math.round((n - 0.005) * 100) / 100 + 0.005).toFixed(3);
const NLDASlat = (n) => -(Math.floor(-n * 8) / 8).toFixed(3);
const NLDASlon = (n) => (Math.floor(n * 8) / 8).toFixed(3);

let URL;
// biome-ignore lint/correctness/noUnusedVariables: testing
const exit = (s) => {
  console.log(s);
  console.log(URL);
  process.exit();
}; // exit

// const Airtable = require('airtable');

const moment = require('moment');
const { pool } = require('./pools');
const { surfaceModel } = require('./surface');
const { surfaceModelNew } = require('./new2');

moment.suppressDeprecationWarnings = true; // https://stackoverflow.com/a/46410816

// const base = new Airtable({ apiKey: 'keySO0dHQzGVaSZp2' }).base('appOEj4Ag9MgTTrMg');

// const airtable = (table, callback, wrapup) => {
//   base(table)
//     .select({
//       view: 'Grid view',
//     })
//     .eachPage(
//       (records, fetchNextPage) => {
//         records.forEach((record) => {
//           callback(record.fields);
//         });

//         fetchNextPage();
//       },
//       (err) => {
//         if (err) {
//           console.error(err);
//         } else if (wrapup) {
//           wrapup();
//         }
//       },
//     );
// }; // airtable

const PSA = {};

// airtable('PSA', (site) => {
//   if (site.Hour === 0) {
//     PSA[site.ID] = {
//       field: site.ID,
//       lat: site.Lat,
//       lon: site.Lon,
//       location: '',
//       BD: site.BD,
//       coverCrop: [site['Cover Crop']],
//       cashCrop: site['Cash Crop'],
//       killDate: new Date(site.Date),
//       lwc: site.LitterWaterContent,
//       biomass: Math.round(site.FOM),
//       unit: 'kg/ha',
//       N: +site.FOMpctN.toFixed(2),
//       carb: +site.Carb.toFixed(2),
//       cell: +site.Cell.toFixed(2),
//       lign: +site.Lign.toFixed(2),
//       targetN: 150,
//       category: site.Category,
//     };
//   } else {
//     PSA[site.ID].plantingDate = new Date(moment(site.Date).add(-111, 'days'));
//   }
//   console.log(PSA[site.ID]);
// });

// ___________________________________________________________________________________________________________________________________________________

const query = async (sq, parms) => {
  try {
    const result = await pool.query(sq, parms);
    return result.rows;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}; // query

const weatherCache = {};
const ssurgoCache = {};

const ccncalc = async (request, reply, type) => {
  let lastFetch = {
    url: null,
    options: null,
  };

  const myFetch = async (url, options) => {
    lastFetch = { url, options };
    const response = await fetch(url, options);
    return response;
  };

  if (request.hostname !== 'localh') {
    console.time = () => {};
    console.timeEnd = () => {};
  }

  const maxCache = 20;
  while (Object.keys(weatherCache).length > maxCache) {
    const keys = Object.keys(weatherCache);
    delete weatherCache[keys[0]];
  }

  while (Object.keys(ssurgoCache).length > maxCache) {
    const keys = Object.keys(ssurgoCache);
    delete ssurgoCache[keys[0]];
  }

  let weather;
  let moisture;

  // const queryData = request.method === 'GET' ? request.query : request.body;
  const queryData = request.body ?? request.query;
  const site = queryData.psa ? PSA[queryData.psa] : null;

  const requiredParams = ['lat', 'lon', 'start', 'n', 'biomass'];
  const missing = requiredParams.filter((param) => !queryData[param]);

  if (missing.length) {
    // reply.status(400).send({ missing });
    reply.code(400).send({ missing });
    return;
  }

  let start = queryData.start.toString().split(',');
  let end = [];

  if (queryData.end) {
    end = queryData.end.toString().split(',');
  } else {
    start.forEach((s) => {
      const date = new Date(s);
      date.setDate(date.getDate() + (queryData.days || 90));
      end.push(date.toISOString().split('T')[0]);
    });
  }

  /**
   * Parse a parameter value from request data.
   *
   * @parm {string} parm - The name of the parameter to parse.
   * @parm {*} def - The default value to use if the parameter is not provided or is invalid.
   * @returns {Array} An array containing the parsed parameter value(s) or the default value.
   * @returns {undefined} if the parameter doesn't have a value and no default is provided.
   */
  const parseParm = (parm, def) => {
    let result = queryData[parm]
      ?.toString()
      .split(',')
      .map((d) => +d);
    if (!result && Number.isFinite(def)) result = [def];
    return result;
  };

  let lat = parseParm('lat');
  let lon = parseParm('lon');
  let N = parseParm('n');
  let biomass = parseParm('biomass');

  let OM = parseParm('om');
  let BD = parseParm('bd');
  let Dul = parseParm('dul');
  let Ad = parseParm('ad');

  let lwc = queryData.lwc?.toString().split(',');
  if (!lwc) lwc = [4];
  else lwc = lwc.map((d) => +d);

  let carb = parseParm('carb', +Math.min(100, Math.max(0, (24.7 + 10.5 * N).toFixed(0))));
  let cell = parseParm('cell', +Math.min(100, Math.max(0, (69 - 10.2 * N).toFixed(0))));
  let lign = parseParm('lign', 100 - (+carb + +cell));

  carb.forEach((_, i) => {
    if (carb[i] + cell[i] + lign[i] !== 100) {
      // normalize data:
      const sum = carb[i] + cell[i] + lign[i];
      carb[i] = (carb[i] / sum) * 100;
      cell[i] = (cell[i] / sum) * 100;
      lign[i] = (lign[i] / sum) * 100;
    }
  });

  const INppm = parseParm('in', 10);
  const PMN = parseParm('pmn', 7); // 10 for surface ???

  // console.log({
  //   lat,
  //   lon,
  //   start,
  //   end,
  //   N,
  //   biomass,
  //   lwc,
  //   carb,
  //   cell,
  //   lign,
  //   OM,
  //   BD,
  //   Dul,
  //   Ad,
  //   INppm,
  //   PMN,
  // });

  const doCSV = queryData.output === 'csv';
  queryData.output = null;
  const models = [];

  const runModel = async ({
    biomass,
    N,
    carb,
    cell,
    lign,
    lwc,
    OM,
    BD,
    PMN,
    INppm,
    weather,
    start,
  }) => {
    let surface;

    const inputs = {
      FOMkg: biomass,
      FOMpctN: N,
      FOMpctCarb: carb,
      FOMpctCell: cell,
      FOMpctLign: lign,
      LitterWaterContent: lwc,
      OM,
      BD,
      PMN,
      INppm,
      hours: weather.length,
      stop: weather.length,
      temp: weather.map((data) => data.air_temperature),
      RH: weather.map((data) => data.relative_humidity * 100),
      rain: weather.map((data) => data.precipitation),
      start,
      nonly: queryData.nonly,
    };

    // console.log(inputs);

    if (queryData.new) {
      surface = surfaceModelNew(inputs);
    } else {
      surface = surfaceModel(inputs);
    }

    const convertToObject = (d) => {
      try {
        return d.FOM.map((_, i) => {
          const o = {};
          Object.keys(d).forEach((key) => {
            o[key] = d[key][i];
          });
          return o;
        });
      } catch (_ee) {
        // console.log('already object');
        return d;
      }
    };

    surface = convertToObject(surface);

    // [
    //   'GRCom1',
    //   'GRCom2',
    //   'GRCom3',
    //   'GRCom',
    //   // '%_lignin',
    //   // 'b',
    //   // 'a',
    //   // 'CarbK',
    //   // 'DeCarb',
    //   // 'Air_MPa',
    //   // 'Carb',
    //   // 'CarbN',
    //   // 'Cell',
    //   // 'CellN',
    //   // 'CNRF',
    //   // 'ContactFactor',
    //   // 'FOM',
    //   // 'FON',
    //   // 'Lign',
    //   // 'LigninN',
    //   // 'LitterMPa',
    //   'MinNfromFOM',
    // ].forEach((key) => {
    //   console.log({ [key]: surface.map((s) => +s[key]).reduce((aa, bb) => aa + bb, 0) });
    // });

    // console.log(surface.slice(0, 100).map((s) => s.GRCom1));

    if (queryData.simple === 'true' || queryData.summary) {
      let selectedProperties;

      if (queryData.simple) {
        selectedProperties = [
          'Date',
          'Air_MPa',
          'Carb',
          'CarbN',
          'Cell',
          'CellN',
          'CNRF',
          'ContactFactor',
          'FOM',
          'FON',
          'Lign',
          'LigninN',
          'LitterMPa',
          'MinNfromFOM',
          'Rain',
          'RH',
          'RMTFAC',
          'Temp',
        ];
      } else {
        selectedProperties = ['Date', 'CarbN', 'CellN', 'LigninN', 'FOM', 'FON', 'MinNfromFOM'];
      }

      surface = surface.map((obj) => {
        const selectedObj = {};
        for (let i = 0; i < selectedProperties.length; i += 1) {
          const prop = selectedProperties[i];
          selectedObj[prop] = obj[prop];
        }
        return selectedObj;
      });
    }

    return { surface };
  }; // runModel

  if (site) {
    lat = site.lat.toString();
    request.query.lat = lat;
    lon = site.lon.toString();
    request.query.lon = lon;
    start = moment(site.killDate).format('YYYY-MM-DD');
    request.query.start = start;
    end = moment(site.killDate).add(120, 'days').format('YYYY-MM-DD');
    request.query.end = end;
    biomass = site.biomass;
    N = site.N;
    carb = site.carb;
    cell = site.cell;
    lign = site.lign;
    lwc = site.lwc;

    // console.log(lat, lon, start, end, biomass, N, carb, cell, lign, lwc);
  }

  const weightedAverage = (d, parm, dec = 2) => {
    let totpct = 0;

    const data = d
      .filter((d2) => d2[parm])
      .map((d2) => {
        totpct += +d2.comppct_r;
        return d2[parm] * d2.comppct_r;
      });

    return +(data.reduce((a, b) => +a + +b) / totpct).toFixed(dec);
  }; // weightedAverage

  const SSURGOCallback = (dat) => {
    if (!dat || dat.ERROR) {
      throw new Error(`No SSURGO data found`);
    }

    let data = dat?.filter((d) => d.desgnmaster !== 'O');

    const minhzdept = Math.min(...data.map((d) => d.hzdept_r));

    data = data.filter((d) => +d.hzdept_r === +minhzdept);

    if (!OM) OM = [weightedAverage(data, 'om_r')];
    if (!BD) BD = [weightedAverage(data, 'dbthirdbar_r')];
    if (!Dul) Dul = [weightedAverage(data, 'wthirdbar_r') / 100];
    if (!Ad) Ad = [weightedAverage(data, 'wfifteenbar_r') / 100];
  }; // SSURGOCallback

  if (type === 'mit') {
    const data = (
      await query(`select * from weather.modelinput where site='mit' and id='${request.query.id}'`)
    )[0];
    type = request.query.model || data.model.toLowerCase();
    start = data.start;
    end = data.end;
    BD = data.bd;
    biomass = data.fomkg;
    N = data.fompctn;
    carb = data.fompctcarb;
    cell = data.fompctcell;
    lign = data.fompctlign;
    OM = 5.2; // from ssurgo
    request.query.pmn = request.query.pmn || 7; // todo
    request.query.in = request.query.in || 10; // todo
    lwc = data.litterwatercontent;

    const tempColumn = data.soiltemperature;
    const moistureColumn = data.soilmoisture;

    const results2 = await query(`
      select "${tempColumn}" as temp, "${moistureColumn}" as moisture
      from weather.othersoil
      where
        site='MIT' and
        date between '${moment(start).format('YYYY-MM-DD')}' and '${moment(end).format('YYYY-MM-DD')}' and
        "${tempColumn}" is not null
      order by date
    `);

    moisture = results2.map((data2) => data2.moisture);

    weather = await query(`
      select *
      from weather.otherweather
      where
        site='MIT' and
        date between '${moment(start).format('YYYY-MM-DD')}' and '${moment(end).format('YYYY-MM-DD')}'
      order by date
    `);

    runModel();
  } else {
    try {
      let largestArray = lat;
      let error = false;
      const parms = {
        lat,
        lon,
        start,
        end,
        N,
        biomass,
        lwc,
        carb,
        cell,
        lign,
        OM,
        BD,
        Dul,
        Ad,
        INppm,
        PMN,
      };

      Object.keys(parms).forEach((parm) => {
        if (parms[parm]?.length > 1 && parms[parm]?.length !== largestArray.length) {
          if (largestArray.length > 1) {
            error = true;
          } else {
            largestArray = parms[parm];
          }
        }
      });

      if (error) {
        // reply.status(400).send({
        reply.code(400).send({
          error: `All arrays must be the same length:
            ${Object.keys(parms)
              .filter((parm) => parms[parm]?.length > 1)
              .map((parm) => `${parm}: ${parms[parm].length} elements`)
              .join('\n')}`,
        });
        return;
      }

      const points = [];
      lat.forEach((lat2, i) => {
        points.push({
          lat: lat2,
          lon: lon[i] || lon[0],
        });
      });

      console.time('mapunits');
      const response = await myFetch('https://ssurgo.covercrop-data.org/mapunits', {
        // const response = await myFetch('http://localhost/mapunits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points }),
      });

      const mapunits = await response.json();
      const mu = new Set();
      mapunits.forEach((rec) => {
        mu.add(rec.mukey);
      });
      console.log(mu);
      console.timeEnd('mapunits');

      console.time('total');
      let wq = 0;
      let sq = 0;

      reply.flush = () => {
        // if (reply.socket?.writable) {
        //   reply.socket.write(' ');
        // }
        if (reply.raw?.writable) reply.raw.write(' ');
      };

      if (queryData.stream) {
        console.log('streaming');
        // reply.setHeader('Content-Type', 'application/json');
        // reply.setHeader('Transfer-Encoding', 'chunked');
        // reply.setHeader('Cache-Control', 'no-cache');
        // reply.set('Content-Encoding', 'identity');

        reply
          .header('Content-Type', 'application/json')
          // .header('Transfer-Encoding', 'chunked')
          .header('Cache-Control', 'no-cache')
          .header('Content-Encoding', 'identity');

        reply.raw.write('[');
      }

      for await (const [i] of largestArray.entries()) {
        console.time(`sm: ${i}`);

        const wkey = `
          NLDASlat=${NLDASlat(lat[i] ?? lat[0])}
          NLDASlon=${NLDASlon(lon[i] ?? lon[0])}
          MRMSlat=${MRMSround(lat[i] ?? lat[0])}
          MRMSlon=${MRMSround(lon[i] ?? lon[0])}
          start=${start[i] ?? start[0]}&end=${end[i] ?? end[0]}
        `.replace(/\s+/g, ' ');

        if (queryData.weather) {
          weather = queryData.weather;
        } else if (weatherCache[wkey]) {
          weather = weatherCache[wkey];
          // console.log(`Cached weather: ${wkey}`);
          // console.log('_'.repeat(30));
        } else {
          const url =
            `${weatherURL}/hourly?email=ncalc@psa.org&` +
            `lat=${lat[i] ?? lat[0]}&lon=${lon[i] ?? lon[0]}&` +
            `start=${start[i] ?? start[0]}&end=${end[i] ?? end[0]}` +
            // + '&attributes=lat,lon,air_temperature,relative_humidity,precipitation&options=predicted,utc,mrms';
            '&attributes=air_temperature,relative_humidity,precipitation&options=predicted,utc,mrms';
          URL = url;
          wq += 1;
          console.log(url);
          console.time();
          weather = await (await myFetch(url)).json();
          weather = weather.slice(0, -1).map((w) => {
            try {
              return {
                ...w,
                air_temperature: +w.air_temperature.toFixed(2),
                relative_humidity: +w.relative_humidity.toFixed(2),
              };
            } catch (_ee) {
              console.log(w);
            }
            return {};
          });
          weatherCache[url] = weather;
          weatherCache[wkey] = weather;
          console.timeEnd();
        }

        if (!queryData.bd || !queryData.om) {
          // if (!queryData.BD || !queryData.OM || !queryData.Dul || !queryData.Ad) {
          const mapunit =
            mapunits?.length &&
            mapunits.find(
              (rec) => +rec.lat === (lat[i] ?? lat[0]) && +rec.lon === (lon[i] ?? lon[0]),
            );

          let sdata;
          if (mapunit?.mukey && ssurgoCache[mapunit?.mukey]) {
            sdata = ssurgoCache[mapunit?.mukey];
            // console.log(`Cached SSURGO: ${mapunit?.mukey}`);
            // console.log('_'.repeat(30));
          } else {
            sq += 1;
            let surl;
            if (mapunit) {
              surl = `https://ssurgo.covercrop-data.org/?mukey=${mapunit.mukey}&component=major`;
            } else {
              surl = `https://ssurgo.covercrop-data.org/?lat=${lat[i] ?? lat[0]}&lon=${lon[i] ?? lon[0]}&component=major`;
            }

            URL = surl;

            console.log(surl);
            console.time();
            sdata = await (await myFetch(surl)).json();
            console.timeEnd();
            ssurgoCache[mapunit?.mukey] = sdata;
            // console.log(`\n${surl}`);
          }

          if (!sdata?.length) {
            console.log(
              `No SSURGO data found for lat=${lat[i] ?? lat[0]} and lon=${lon[i] ?? lon[0]}`,
            );
          }

          SSURGOCallback(sdata);
        }

        let inputs = {};

        Object.keys(queryData).forEach((key) => {
          if (!queryData[key] || /^(n|bd|dul|ad|in|pmn|new)$/.test(key)) return;

          const parseParm2 = (parm) => queryData[parm]?.toString().split(',');

          const data = parseParm2(key);
          inputs[key] = data[i] ?? data[0];
        });

        inputs = {
          ...inputs,
          weather,
          moisture,
          start: start[i] ?? start[0],
          end: end[i] ?? end[0],
          lat: lat[i] ?? lat[0],
          lon: lon[i] ?? lon[0],
          biomass: biomass[i] ?? biomass[0],
          N: N[i] ?? N[0],
          carb: carb[i] ?? carb[0],
          cell: cell[i] ?? cell[0],
          lign: lign[i] ?? lign[0],
          lwc: lwc[i] ?? lwc[0],
          OM: OM[i] ?? OM[0],
          BD: BD[i] ?? BD[0],
          PMN: PMN[i] ?? PMN[0],
          INppm: INppm[i] ?? INppm[0],
          // Dul: Dul[i] ?? Dul[0],
          // Ad: Ad[i] ?? Ad[0],
        };

        const results = await runModel(inputs);

        delete inputs.weather;
        delete inputs.moisture;

        models[i] = {
          inputs,
          results,
        };

        if (queryData.stream) {
          const comma = i < [...largestArray.entries()].length - 1 ? ',' : '';
          if (queryData.summary) {
            models[i].results.surface = models[i].results.surface.slice(-1);
          }
          reply.raw.write(JSON.stringify(models[i]) + comma);
          // reply.flush();
        }
        console.timeEnd(`sm: ${i}`);
      }
      console.timeEnd('total');
      console.log(`
        ${wq} queries to the weather API.
        ${sq} queries to the SSURGO API.
      `);

      if (queryData.stream) {
        reply.raw.write(']');
        reply.raw.end();
        return;
      }

      if (doCSV) {
        const typ = queryData.model || type;
        let s;

        if (queryData.summary) {
          s = `${Object.keys(models[0].inputs)},${Object.keys(models[0].results[typ][0])}\n`;
          models.forEach((model) => {
            s += `${Object.values(model.inputs)},${Object.values(model.results[typ].slice(-1)[0])}\n`;
          });
        } else {
          let data = models[0].results[typ];

          if (queryData.summary) {
            data = data.slice(-1);
          }

          // const s = `${Object.keys(data[0]).sort((a, b) => a.localeCompare(b)).toString()}\n${
          //   data.map((r) => Object.keys(r).sort((a, b) => a.localeCompare(b)).map((v) => r[v])).join('\n')}`;

          s = `${Object.keys(data[0])}\n${data
            .map((r) => Object.keys(r).map((v) => r[v]))
            .join('\n')}`;
        }

        // reply.set('Content-Type', 'application/octet-stream');
        // reply.setHeader(
        //   'Content-disposition',
        //   `attachment; filename=mit${typ}.${queryData.id}.csv`,
        // );
        // reply.send(s);

        reply
          .type('application/octet-stream')
          .header('Content-disposition', `attachment; filename=mit${typ}.${queryData.id}.csv`);

        return s;
      } else {
        if (queryData.summary) {
          models.forEach((model) => {
            if (model.results.surface) {
              model.results.surface = model.results.surface.slice(-1);
            }
          });
        }
        if (queryData.nonly) {
          // reply.json(models.map((model) => model.results.surface.map((obj) => obj.MinNfromFOM)));
          return models.map((model) => model.results.surface.map((obj) => obj.MinNfromFOM));
        } else {
          if (queryData.attributes) {
            const attributes = queryData.attributes.split(/\s*,\s*/);
            models.forEach((model) => {
              model.results.surface = model.results.surface.map((row) =>
                attributes.reduce((obj, attr) => {
                  obj[attr] = row[attr];
                  return obj;
                }, {}),
              );
              // model.results.surface = model.results.surface.map((row) => {
              //   const obj = {};
              //   attributes.forEach((attr) => {
              //     obj[attr] = row[attr];
              //   });
              //   return obj;
              // });
            });
          }
          if (models.length === 1) {
            // reply.json(models[0].results);
            return models[0].results;
          } else {
            // reply.json(models);
            return models;
          }
        }
      }
    } catch (ee) {
      console.error(ee.stack);
      reply.send({
        lastFetch,
        error: ee.message,
      });
    }
  }
}; // ccncalc

const surface = (request, reply) => {
  if (request.method === 'POST') {
    // if (request.get('Content-Type') !== 'text/plain') {
    if (!request.headers['content-type']?.startsWith('text/plain')) {
      return ccncalc(request, reply, 'surface');
    } else {
      let data = '';

      const get = (parm) => {
        let result = (data.match(new RegExp(`\\b${parm}\\b.*`)) || [''])[0].slice(parm.length + 1);
        if (+result) result = +result;
        return result;
      }; // .slice(parm.length);

      request.raw.on('data', (chunk) => {
        data += chunk;
      });

      request.raw.on('end', () => {
        const lat = get('lat');
        const lon = get('lon');
        request.body = {
          lat,
          lon,
          start: get('start'),
          end: get('end'),
          n: get('n'),
          biomass: get('biomass'),
          lwc: get('lwc'),
          carb: get('carb'),
          cell: get('cell'),
          lign: get('lign'),
          om: get('om'),
          bd: get('bd'),
          dul: get('dul'),
          ad: get('ad'),
          in: get('in'),
          pmn: get('pmn'),
          output: get('output') || 'json',
          simple: get('simple'),
        };

        Object.keys(request.body).forEach((key) => {
          if (request.body[key] === '') {
            delete request.body[key];
          }
        });

        const weatherData = data.split(/\bWEATHER\b/)[1];
        if (weatherData) {
          request.body.weather = [];
          weatherData.split(/[\n\r]+/).forEach((r) => {
            const row = r.split(',');
            const date = new Date(row[0]);
            if (!Number.isNaN(date.getTime())) {
              request.body.weather.push({
                lat,
                lon,
                date: row[0],
                air_temperature: +row[1],
                relative_humidity: +row[2] / 100,
                precipitation: +row[3],
              });
            }
          });
        }
        return ccncalc(request, reply, 'surface');
      });
    }
  } else {
    return ccncalc(request, reply, 'surface');
  }
};

const mit = (request, reply) => ccncalc(request, reply, 'mit');

const modelInputs = async (_req, _reply) => {
  const results = await query('select * from modelinput order by id');
  console.log(results);
  // reply.send(results);
  return results;
}; // modelInputs

const status = (_req, reply) => {
  const used = process.memoryUsage();

  reply.send({
    RSS: `${Math.round(used.rss / 1024 / 1024)} MB}`,
    'Heap Total': `${Math.round(used.heapTotal / 1024 / 1024)} MB}`,
    'Heap Used': `${Math.round(used.heapUsed / 1024 / 1024)} MB}`,
    External: `${Math.round(used.external / 1024 / 1024)} MB}`,
    weatherCache: Object.keys(weatherCache),
    ssurgoCache: Object.keys(ssurgoCache),
  });
};

module.exports = {
  surface,
  mit,
  modelInputs,
  status,
};
