const axios = require('axios');

let lats;
let lons;
let cols;
let minLat;
let maxLat;
let minLon;
let maxLon;
let rect;
let location;
let options;
let output;

const init = (req) => {
  output = req.query.explain ? 'json' : req.query.output || 'json';

  lats = lons = cols = minLat = maxLat = minLon = maxLon = null;
  location = req.query.location;
  options = (req.query.options || '').toLowerCase().split(',');
  rect = options.includes('rect') && (location || (req.query.lat || '').split(',').length == 2);
} // init

const ssurgo = (req, res) => {
  const doFilter = query => {
    if (filter.length) {
      let crit = [];
      Object.keys(parms).forEach(category => {
        if (query.includes(category)) {
          filter.forEach(c => {
            if (parms[category].includes(c.split(/[^a-z_]/)[0])) {
              crit.push(c.replace('mukey', 'mu.mukey'));
            }
          });
        }
      });
      
      if (crit.length) {
        query += ' and ' + crit.join(' and ');
      }
    }

    return query;
  } // doFilter

  const ssurgo1 = () => {
    let attr = lat ? `${lat} as lat, ${lon} as lon` : 'mukey';

    if (test('sacatalog')) {
      attr += ', sc.areasymbol';
    }

    if (test('legend')) {
      attr += ', lg.lkey';
    }

    if (test('mapunit')) {
      attr += ', mu.mukey';
    }

    if (test('component|restrictions|horizon')) {
      attr += ', co.cokey';
    }

    if (test('horizon|pores|structure|textureclass')) {
      attr += ', ch.chkey';
    }

    if (test('textureclass')) {
      attr += ', ctg.chtgkey';
    }

    if (test('sacatalog')) {
      attr += ', sc.areaname, saverest, mbrminx, mbrminy, mbrmaxx, mbrmaxy';
    }

    if (test('legend')) {
      attr += ', areaacres, projectscale';
    }

    if (test('mapunit')) {
      attr += ', musym, muname, mukind, muacres, farmlndcl, iacornsr';  
    }

    if (test('component')) {
      attr += ', comppct_l, comppct_r, comppct_h, compname, compkind, majcompflag, slope_l, slope_r, slope_h, slopelenusle_l, slopelenusle_r, slopelenusle_h, runoff, erocl, hydricrating, hydricon, drainagecl, elev_l, elev_r, elev_h, geomdesc, map_l, map_r, map_h, ffd_l, ffd_r, ffd_h, frostact, hydgrp, taxclname, taxorder, taxsuborder, taxgrtgroup, taxsubgrp, taxpartsize, taxpartsizemod, taxceactcl, taxreaction, taxtempcl, taxmoistscl, taxtempregime, soiltaxedition';
    }

    if (test('horizon')) {
      attr += ', hzname, desgndisc, desgnmaster, desgnmasterprime, desgnvert, hzdept_l, hzdept_r, hzdept_h, hzdepb_l, hzdepb_r, hzdepb_h, hzthk_l, hzthk_r, hzthk_h, fraggt10_l, fraggt10_r, fraggt10_h, frag3to10_l, frag3to10_r, frag3to10_h, sieveno4_l, sieveno4_r, sieveno4_h, sieveno10_l, sieveno10_r, sieveno10_h, sieveno40_l, sieveno40_r, sieveno40_h, sieveno200_l, sieveno200_r, sieveno200_h, sandtotal_l, sandtotal_r, sandtotal_h, sandvc_l, sandvc_r, sandvc_h, sandco_l, sandco_r, sandco_h, sandmed_l, sandmed_r, sandmed_h, sandfine_l, sandfine_r, sandfine_h, sandvf_l, sandvf_r, sandvf_h, silttotal_l, silttotal_r, silttotal_h, siltco_l, siltco_r, siltco_h, siltfine_l, siltfine_r, siltfine_h, claytotal_l, claytotal_r, claytotal_h, claysizedcarb_l, claysizedcarb_r, claysizedcarb_h, om_l, om_r, om_h, dbtenthbar_r, dbtenthbar_h, dbthirdbar_l, dbthirdbar_r, dbthirdbar_h, dbfifteenbar_l, dbfifteenbar_r, dbfifteenbar_h, dbovendry_l, dbovendry_r, dbovendry_h, partdensity, ksat_l, ksat_r, ksat_h, awc_l, awc_r, awc_h, wtenthbar_l, wtenthbar_r, wtenthbar_h, wthirdbar_l, wthirdbar_r, wthirdbar_h, wfifteenbar_l, wfifteenbar_r, wfifteenbar_h, wsatiated_l, wsatiated_r, wsatiated_h, ll_l, ll_r, ll_h, pi_l, pi_r, pi_h, kwfact, kffact, caco3_l, caco3_r, caco3_h, gypsum_l, gypsum_r, gypsum_h, sar_l, sar_r, sar_h, ec_l, ec_r, ec_h, cec7_l, cec7_r, cec7_h, ecec_l, ecec_r, ecec_h, sumbases_l, sumbases_r, sumbases_h, ph1to1h2o_l, ph1to1h2o_r, ph1to1h2o_h, ph01mcacl2_l, ph01mcacl2_r, ph01mcacl2_h, pbray1_l, pbray1_r, pbray1_h, poxalate_l, poxalate_r, poxalate_h, ph2osoluble_l, ph2osoluble_r, ph2osoluble_h, ptotal_l, ptotal_r, ptotal_h';
    }

    if (test('textureclass')) {
      attr += ', texture, stratextsflag, ctg.rvindicator, texdesc, texcl';
    }

    if (test('pores')) {
      attr += ', poreqty_l, poreqty_r, poreqty_h, poresize, porecont, poreshp, cp.rvindicator';
    }

    if (test('structure')) {
      attr += ', structgrpname, csg.rvindicator';
    }

    if (test('parentmaterial')) {
      attr += ', pmgroupname, pmg.rvindicator';
    }

    if (test('restrictions')) {
      attr += ', reskind, resdept_l, resdept_r, resdept_h, resdepb_l, resdepb_r, resdepb_h, resthk_l, resthk_r, resthk_h';
    }

    query1 = `SELECT DISTINCT ${attr}
              FROM sacatalog sc
              FULL OUTER JOIN legend         lg  ON sc.areasymbol = lg.areasymbol
              FULL OUTER JOIN mapunit        mu  ON lg.lkey       = mu.lkey
              ${test('component|parentmaterial|restrictions|horizon|pores|structure|textureclass')  ? 'FULL OUTER JOIN component      co  ON mu.mukey      = co.mukey' : ''}
              ${test('horizon|pores|structure|textureclass')                                        ? 'FULL OUTER JOIN chorizon       ch  ON co.cokey      = ch.cokey'       : ''}
              ${test('pores')                                                                       ? 'FULL OUTER JOIN chpores        cp  ON ch.chkey      = cp.chkey'       : ''}
              ${test('structure')                                                                   ? 'FULL OUTER JOIN chstructgrp    csg ON ch.chkey      = csg.chkey'      : ''}
              ${test('textureclass')                                                                ? 'FULL OUTER JOIN chtexturegrp   ctg ON ch.chkey      = ctg.chkey'      : ''}
              ${test('textureclass')                                                                ? 'FULL OUTER JOIN chtexture      ct  ON ctg.chtgkey   = ct.chtgkey'     : ''}
              ${test('parentmaterial')                                                              ? 'FULL OUTER JOIN copmgrp        pmg ON co.cokey      = pmg.cokey'      : ''}
              ${test('restrictions')                                                                ? 'FULL OUTER JOIN corestrictions rt  ON co.cokey      = rt.cokey'       : ''}
              WHERE mu.mukey IN (
                ${mukey ? mukey : `SELECT * from SDA_Get_Mukey_from_intersection_with_WktWgs84('point(${lon} ${lat})')`}
              )
              ${req.query.showseriesonly == 'false' ? '' : test('component|parentmaterial|restrictions|horizon|pores|structure|textureclass') ? `AND compkind='Series' ` : ''}
             `;

    if (/^\s*(major|max)\s*$/.test(req.query.component)) {
      query1 += ` and majcompflag='Yes'`;
    }

    query1 = doFilter(query1);

    if (output != 'query') {
      axios
        .post(`https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest`, {
          query : query1,
          format: 'JSON+COLUMNNAME',
          encode: 'form'
        })
        .then(data => {
          data1 = data.data.Table || [];
          if (data2) {
            outputData();
          }
        })
        .catch(error => {
          res.status(400).send(error);
        }
      );
    }
  } // ssurgo1

  const ssurgo2 = () => {
    let attr = lat ? `${lat} as lat, ${lon} as lon` : 'mukey';

    if (test('sacatalog')) {
      attr += ', sc.areasymbol';
    }

    if (test('legend')) {
      attr += ', lg.lkey';
    }

    if (test('mapunit')) {
      attr += ', mu.mukey';
    }

    if (test('component|canopycover|cropyield|monthlystats')) {
      attr += ', co.cokey';
    }

    if (test('monthlystats')) {
      attr += ', mo.comonthkey';
    }

    if (test('canopycover')) {
      attr += ', plantcov, plantsym, plantsciname, plantcomname';
    }

    if (test('cropyield')) {
      attr += ', cropname, yldunits, nonirryield_l, nonirryield_r, nonirryield_h, irryield_l, irryield_r, irryield_h, yld.cropprodindex, vasoiprdgrp';
    }

    if (test('monthlystats')) {
      attr += ', monthseq, month, flodfreqcl, floddurcl, pondfreqcl, ponddurcl, ponddep_l, ponddep_r, ponddep_h, dlyavgprecip_l, dlyavgprecip_r, dlyavgprecip_h, dlyavgpotet_l, dlyavgpotet_r, dlyavgpotet_h, soimoistdept_l, soimoistdept_r, soimoistdept_h, soimoistdepb_l, soimoistdepb_r, soimoistdepb_h, soimoiststat, soitempmm, soitempdept_l, soitempdept_r, soitempdept_h, soitempdepb_l, soitempdepb_r, soitempdepb_h';
    }

    query2 = `SELECT DISTINCT ${attr}
              FROM sacatalog sc
              FULL OUTER JOIN legend         lg    ON sc.areasymbol  = lg.areasymbol
              FULL OUTER JOIN mapunit        mu    ON lg.lkey        = mu.lkey
              ${test('component|canopycover|cropyield|monthlystats')  ? 'FULL OUTER JOIN component      co    ON mu.mukey       = co.mukey' : ''}
              ${test('canopycover')                                   ? 'FULL OUTER JOIN cocanopycover  cov   ON co.cokey       = cov.cokey'        : ''}
              ${test('cropyield')                                     ? 'FULL OUTER JOIN cocropyld      yld   ON co.cokey       = yld.cokey'        : ''}
              ${test('monthlystats')                                  ? 'FULL OUTER JOIN comonth        mo    ON co.cokey       = mo.cokey'         : ''}
              ${test('monthlystats')                                  ? 'FULL OUTER JOIN cosoilmoist    moist ON mo.comonthkey  = moist.comonthkey' : ''}
              ${test('monthlystats')                                  ? 'FULL OUTER JOIN cosoiltemp     temp  ON mo.comonthkey  = temp.comonthkey'  : ''}
              WHERE mu.mukey IN (
                ${mukey ? mukey : `SELECT * from SDA_Get_Mukey_from_intersection_with_WktWgs84('point(${lon} ${lat})')`}
              )
              

            `;

    query2 = doFilter(query2);

    if (output == 'query') {
      res.status(200).send(query1 + '\n' + '_'.repeat(80) + '\n' + query2);
    } else {
      axios
        .post(`https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest`, {
          query: query2,
          format: 'JSON+COLUMNNAME',
          encode: 'form'
        })
        .then(data => {
          data2 = data.data.Table || [];
          if (data1) {
            outputData();
          }
        })
        .catch(error => {
          res.status(400).send(error);
        }
      );
    }
  } // ssurgo2

  const test = (category) => category.split('|').some(t => cats.includes('+' + t));

  const doOutput = (data) => {
    if (output == 'json') {
      if (req.callback) {
        req.callback(jdata);
      } else {
        res.status(200).send(jdata);
      }
    } else if (output == 'csv') {
      const result = data.map(d => 
                       d.map(d => (d || '').replace(/^.*,.*$/g, s => `"${s}"`))
                       .join(',')
                     )
                     .join('\n');
      
      res.status(200).send(result);
    } else if (output == 'html') {
      const s = `
        <link rel="stylesheet" href="css/weather.css">
        <table id="Data">
          <thead>
            <tr><th>${data[0].join('<th>')}
          </thead>
          <tbody>
            <tr>${data.slice(1).map(r => '<td>' + r.join('<td>')).join('<tr>')}</tr>
          </tbody>
        </table>
      `;

      res.status(200).send(s);
    }
  } // doOutput

  const outputData = () => {
    const data = [];

    if (!data1.length || !data2.length) {
      if (req.callback) {
        req.callback([]);
      } else {
        res.status(400).send({ERROR: 'No data found'});
      }
    } else {
      let i = -1;
      do {
        i++;
      } while (data1[0][i] && data1[0][i] == data2[0][i]);

      if (req.query.component == 'max') {
        const col = data1[0].indexOf('comppct_r');
        const mcol = data1[0].indexOf('mukey');

        let max = req.query.mukey ? {} : -Infinity;

        if (req.query.mukey) {
          req.query.mukey.split(',').forEach(key => max[key] = -Infinity);
        }

        data1.slice(1).forEach(row => {
          const key = row[mcol];
          if (req.query.mukey) {
            max[key] = Math.max(max[key], +row[col]);
          } else {
            max = Math.max(max, +row[col]);
          }
        });
        
        data1 = data1.slice().filter((row, i) => {
          const key = row[mcol];
          return i == 0 || row[col] == max[key] || row[col] == max;
        });
      }

      data1.slice(1).forEach(d1 => {
        data2.slice(1).forEach(d2 => {
          const o = {};
          data1[0].forEach((p, n) => o[p] = d1[n]);
          data2[0].forEach((p, n) => o[p] = d2[n]);
          jdata.push(o);
        });
      });

      data1.forEach(d1 => {
        data2.forEach(d2 => {
          if (
              (i == 2 && d1[0] == d2[0] && d1[1] == d2[1]) ||
              (i == 3 && d1[0] == d2[0] && d1[1] == d2[1] && d1[2] == d2[2]) ||
              (i == 4 && d1[0] == d2[0] && d1[1] == d2[1] && d1[2] == d2[2] && d1[3] == d2[3]) ||
              (i == 5 && d1[0] == d2[0] && d1[1] == d2[1] && d1[2] == d2[2] && d1[3] == d2[3] && d1[4] == d2[4]) ||
              (i == 6 && d1[0] == d2[0] && d1[1] == d2[1] && d1[2] == d2[2] && d1[3] == d2[3] && d1[4] == d2[4] && d1[5] == d2[5])
             ) {
            
            data.push([...d1, ...d2.slice(4)]);
          }
        });
      });

      doOutput(data);
    }
  } // outputData

  if (!req.query.lat && !req.query.mukey) {
    res.redirect('/');
    return;
  }

  let data1;
  let data2;
  let query1;
  let query2;
  const jdata = [];

  const lat       = req.query.lat ? (+req.query.lat).toFixed(4) : 'NULL';
  const lon       = req.query.lon ? (+req.query.lon).toFixed(4) : 'NULL';
  const mukey     = req.query.mukey ? req.query.mukey.split(',').map(m => `'${m}'`).join(',') : null;
  const output    = req.query.output || 'json';
  const filter    = (req.query.filter || '').split(',');
  const parms = {
    sacatalog       : ['areasymbol', 'areaname', 'saverest', 'mbrminx', 'mbrminy', 'mbrmaxx', 'mbrmaxy'],
    legend          : ['areasymbol', 'areaacres', 'projectscale', 'lkey'],
    mapunit         : ['lkey', 'musym', 'muname', 'mukind', 'muacres', 'farmlndcl', 'iacornsr', 'mukey'],
    component       : ['mukey', 'comppct_l', 'comppct_r', 'comppct_h', 'compname', 'compkind', 'majcompflag', 'slope_l', 'slope_r', 'slope_h', 'slopelenusle_l', 'slopelenusle_r', 'slopelenusle_h', 'runoff', 'erocl', 'hydricrating', 'hydricon', 'drainagecl', 'elev_l', 'elev_r', 'elev_h', 'geomdesc', 'map_l', 'map_r', 'map_h', 'ffd_l', 'ffd_r', 'ffd_h', 'frostact', 'hydgrp', 'taxclname', 'taxorder', 'taxsuborder', 'taxgrtgroup', 'taxsubgrp', 'taxpartsize', 'taxpartsizemod', 'taxceactcl', 'taxreaction', 'taxtempcl', 'taxmoistscl', 'taxtempregime', 'soiltaxedition', 'cokey'],
    chorizon        : ['cokey', 'hzname', 'desgndisc', 'desgnmaster', 'desgnmasterprime', 'desgnvert', 'hzdept_l', 'hzdept_r', 'hzdept_h', 'hzdepb_l', 'hzdepb_r', 'hzdepb_h', 'hzthk_l', 'hzthk_r', 'hzthk_h', 'fraggt10_l', 'fraggt10_r', 'fraggt10_h', 'frag3to10_l', 'frag3to10_r', 'frag3to10_h', 'sieveno4_l', 'sieveno4_r', 'sieveno4_h', 'sieveno10_l', 'sieveno10_r', 'sieveno10_h', 'sieveno40_l', 'sieveno40_r', 'sieveno40_h', 'sieveno200_l', 'sieveno200_r', 'sieveno200_h', 'sandtotal_l', 'sandtotal_r', 'sandtotal_h', 'sandvc_l', 'sandvc_r', 'sandvc_h', 'sandco_l', 'sandco_r', 'sandco_h', 'sandmed_l', 'sandmed_r', 'sandmed_h', 'sandfine_l', 'sandfine_r', 'sandfine_h', 'sandvf_l', 'sandvf_r', 'sandvf_h', 'silttotal_l', 'silttotal_r', 'silttotal_h', 'siltco_l', 'siltco_r', 'siltco_h', 'siltfine_l', 'siltfine_r', 'siltfine_h', 'claytotal_l', 'claytotal_r', 'claytotal_h', 'claysizedcarb_l', 'claysizedcarb_r', 'claysizedcarb_h', 'om_l', 'om_r', 'om_h', 'dbtenthbar_l', 'dbtenthbar_r', 'dbtenthbar_h', 'dbthirdbar_l', 'dbthirdbar_r', 'dbthirdbar_h', 'dbfifteenbar_l', 'dbfifteenbar_r', 'dbfifteenbar_h', 'dbovendry_l', 'dbovendry_r', 'dbovendry_h', 'partdensity', 'ksat_l', 'ksat_r', 'ksat_h', 'awc_l', 'awc_r', 'awc_h', 'wtenthbar_l', 'wtenthbar_r', 'wtenthbar_h', 'wthirdbar_l', 'wthirdbar_r', 'wthirdbar_h', 'wfifteenbar_l', 'wfifteenbar_r', 'wfifteenbar_h', 'wsatiated_l', 'wsatiated_r', 'wsatiated_h', 'll_l', 'll_r', 'll_h', 'pi_l', 'pi_r', 'pi_h', 'kwfact', 'kffact', 'caco3_l', 'caco3_r', 'caco3_h', 'gypsum_l', 'gypsum_r', 'gypsum_h', 'sar_l', 'sar_r', 'sar_h', 'ec_l', 'ec_r', 'ec_h', 'cec7_l', 'cec7_r', 'cec7_h', 'ecec_l', 'ecec_r', 'ecec_h', 'sumbases_l', 'sumbases_r', 'sumbases_h', 'ph1to1h2o_l', 'ph1to1h2o_r', 'ph1to1h2o_h', 'ph01mcacl2_l', 'ph01mcacl2_r', 'ph01mcacl2_h', 'pbray1_l', 'pbray1_r', 'pbray1_h', 'poxalate_l', 'poxalate_r', 'poxalate_h', 'ph2osoluble_l', 'ph2osoluble_r', 'ph2osoluble_h', 'ptotal_l', 'ptotal_r', 'ptotal_h', 'chkey'],
    chpores         : ['chkey', 'poreqty_l', 'poreqty_r', 'poreqty_h', 'poresize', 'porecont', 'poreshp', 'cp.rvindicator'],
    chstructgrp     : ['chkey', 'structgrpname', 'csg.rvindicator'],
    texture         : ['chkey', 'texture', 'stratextsflag', 'ctg.rvindicator', 'texdesc', 'chtgkey', 'chtgkey', 'texcl'],
    copmgrp         : ['cokey', 'pmgroupname', 'pmg.rvindicator'],
    corestrictions  : ['cokey', 'reskind', 'resdept_l', 'resdept_r', 'resdept_h', 'resdepb_l', 'resdepb_r', 'resdepb_h', 'resthk_l', 'resthk_r', 'resthk_h'],
    cocanopycover   : ['cokey', 'plantcov', 'plantsym', 'plantsciname', 'plantcomname'],
    cocropyld       : ['cokey', 'cropname', 'yldunits', 'nonirryield_l', 'nonirryield_r', 'nonirryield_h', 'irryield_l', 'irryield_r', 'irryield_h', 'cropprodindex', 'vasoiprdgrp'],
    comonth         : ['cokey', 'monthseq', 'month', 'flodfreqcl', 'floddurcl', 'pondfreqcl', 'ponddurcl', 'ponddep_l', 'ponddep_r', 'ponddep_h', 'dlyavgprecip_l', 'dlyavgprecip_r', 'dlyavgprecip_h', 'dlyavgpotet_l', 'dlyavgpotet_r', 'dlyavgpotet_h', 'comonthkey', 'comonthkey', 'soimoistdept_l', 'soimoistdept_r', 'soimoistdept_h', 'soimoistdepb_l', 'soimoistdepb_r', 'soimoistdepb_h', 'soimoiststat', 'comonthkey', 'soitempmm', 'soitempdept_l', 'soitempdept_r', 'soitempdept_h', 'soitempdepb_l', 'soitempdepb_r', 'soitempdepb_h']
  };

  init(req);

  if ((!+lat || !+lon) && !mukey) {
    res.status(200).send('lat and lon required');
    return;
  }
  
  let cats = '+legend,+mapunit,+component,+horizon,+textureclass,+parentmaterial,+restrictions,-sacatalog,-pores,-structure,-canopycover,-cropyield,-monthlystats'.split(',');

  if ((req.query.categories || '').includes('clear')) {
    req.query.categories = req.query.categories.replace(/clear/g, '');
    cats = '-legend,-mapunit,-component,-horizon,-textureclass,-parentmaterial,-restrictions,-sacatalog,-pores,-structure,-canopycover,-cropyield,-monthlystats'.split(',');
  }

  ((req.query.categories || '').match(/[ -][a-z]+/g) || [])
    .forEach(cat => {
      const t = cat.slice(1);
      let idx = cats.indexOf('+' + t);

      if (idx > -1) cats[idx] = cat.replace(' ', '+');

      idx = cats.indexOf('-' + t);
      if (idx > -1) cats[idx] = cat.replace(' ', '+');
    }
  );

  ssurgo1();
  ssurgo2();
} // ssurgo

module.exports = {
  ssurgo,
}
