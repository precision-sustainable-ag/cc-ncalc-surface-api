const surfaceModel = ({
  FOMkg,
  FOMpctN,
  FOMpctCarb,
  FOMpctCell,
  FOMpctLign,
  LitterWaterContent,
  BD,
  INppm,
  PMN = 7,
  hours,
  // stop,
  temp,
  RH,
  rain,
  start,
}) => {
  // console.time('surfaceModel');

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formattedDate = `${month}/${day}/${year} ${hour}:${minutes}`;

    return formattedDate;
  };

  let obj;
  const results = [];
  const date = new Date(`${start} 00:00`);
  // res.send({FOMkg, FOMpctN, FOMpctCarb, FOMpctCell, FOMpctLign, LitterWaterContent, BD, INppm, hours, stop, temp, RH, rain}); return;

  const type = FOMpctN >= 2.25 && FOMpctCarb >= 50 ? 'Clover' : 'Rye';

  const depthIn = 8;
  const depthLayerCm = depthIn * 2.54;
  const FAC = BD * depthLayerCm * 0.1;
  const Sat = (1 - BD / 2.65) / BD;
  const Dminr = ((((0.0024 + 0.022 * PMN) * (BD * depthLayerCm)) / 10 / 0.66666 / 0.7) * 2) / 24;
  const InitialFOMN = (FOMkg * FOMpctN) / 100;
  const CarbN = (InitialFOMN * FOMpctCarb) / 100;
  const CellN = (InitialFOMN * FOMpctCell) / 100;
  const LigninN = (InitialFOMN * FOMpctLign) / 100;
  const SOCpct = 1.95;
  const c = 0.01;

  const S = {
    Date: [],
    'FOMkg/ha': +FOMkg,
    FOMpctN,
    FOMpctCarb,
    FOMpctCell,
    FOMpctLign,
    BD,
    INppm,

    Depth_in: depthIn,
    Depth_layer_cm: depthLayerCm,
    FAC,
    Sat,
    PMN,
    Dminr,
    SOCpct,
    c,

    Temp: temp,
    RH,
    Rain: rain,

    Critical_FOM: 1400,
    k3: 0.01,
    LignK: 0.00095,
    NAllocationFactor: 1,
    FractionHumified: 0.55,
    'InitialFOMN_kg/ha': InitialFOMN,

    FOM: [+FOMkg],
    Carb: [(FOMkg * FOMpctCarb) / 100],
    CarbN: [CarbN],
    Cell: [(FOMkg * FOMpctCell) / 100],
    // CellN: [Math.max(-Infinity, (InitialFOMN - ((InitialFOMN * FOMpctLign) / 100)) - CarbN)],
    CellN: [CellN],
    Hum: [Math.max(0, (SOCpct * BD * depthLayerCm * 1000) / 0.58)],
    HumN: [Math.max(0, SOCpct * depthLayerCm * BD * 100)],
    INkg: [INppm * FAC],
    Lign: [(FOMkg * FOMpctLign) / 100],
    LigninN: [LigninN],
    LitterWaterContent: [LitterWaterContent],
    MinNfromFOM: [0],
    MinNfromHum: [0],
    Dew: [0],
    NImmobFromFOM: [0],
    NimmobIntoCarbN: [0],
    PrevLitWC: [LitterWaterContent],
    PrevRH: [RH[0]],
    RHChange: [0],
    k_4: [c * temp[0] * LitterWaterContent],
    WaterLossFromEvap: [0],
    RainToGetCurrentWC: [],
    WCFromRain: [],
    FromRain: [],
    FromDew: [],
    Air_MPa: [],
    '%_lignin': [],
    a: [],
    b: [],
    LitterMPa: [],
    Litter_MPa_Gradient: [],
    k1: [],
    FromAir: [],
    Evaporation: [],
    CarbK: [],
    RMTFAC: [],
    FON: [],
    CNR: [],
    CNRF: [],
    ContactFactor: [],
    DeCarb: [],
    GrNom1: [],
    GRNom2: [],
    GRNom3: [],
    GRNom: [],
    GRCom1: [],
    GRCom2: [],
    GRCom3: [],
    GRCom: [],
    CellK: [],
    DeCell: [],
    DeLign: [],
    FOMNhum: [],
    Resistant: [],
    HumMin: [],
    RhMin: [],
    NetMin: [],
    RNAC: [],
    MinFromFOMRate: [],
    MinFromHumRate: [],
    Noname_1: [],
    Noname_2: [],
    'overall_%N': [],
  };

  let t = 0;

  function customToString() {
    return this[this.length - 1];
  }

  Object.keys(S).forEach((prop) => {
    if (Array.isArray(S[prop])) {
      S[prop].toString = customToString;
    }
  });

  const funcs = {
    RainToGetCurrentWC: () => {
      if (S.Rain[t] === 0) {
        return 0;
      }

      if (type === 'Rye') {
        return (
          -1.6679 +
          0.9724 * Math.exp(0.9443 * S.LitterWaterContent) +
          0.4956 * Math.exp(0.9443 * S.LitterWaterContent)
        );
      }

      return (
        -1.3191 +
        0.829 * Math.exp(0.7603 * S.LitterWaterContent) +
        0.468 * Math.exp(0.7603 * S.LitterWaterContent)
      );
    },
    WCFromRain: () => {
      if (S.Rain[t] === 0) {
        return 0;
      }

      if (type === 'Rye') {
        return (
          0.8523 * (1 - Math.exp(-0.9525 * (S.Rain[t] + S.RainToGetCurrentWC))) +
          2.9558 * (1 - Math.exp(-0.0583 * (S.Rain[t] + S.RainToGetCurrentWC)))
        );
      }

      return (
        1.6414 * (1 - Math.exp(-0.4351 * (S.Rain[t] + S.RainToGetCurrentWC))) +
        4.3623 * (1 - Math.exp(-0.0324 * (S.Rain[t] + S.RainToGetCurrentWC)))
      );
    },
    FromRain: () =>
      S.Rain[t] === 0 ? 0 : Math.max(0, Math.min(S.WCFromRain - S.LitterWaterContent, 0.3)),
    FromDew: () => {
      if (type === 'Rye') {
        return S.Dew[t] === 1 && S.LitterWaterContent < 2.5 && S.FOM > 1500 ? 0.5 : 0;
      }
      return S.Dew[t] === 1 && S.LitterWaterContent < 2.5 && S.FOM > 1500 ? 0.85 : 0;
    },
    Air_MPa: () =>
      (8.314 * (S.Temp[t] + 273.15) * Math.log(S.RH[t] / 100)) / (18 * 10 ** -6) / 1000000,
    '%_lignin': () => Math.min(13, (S.Lign / S.FOM) * 100),
    a: () => -0.5981 * S['%_lignin'] + 8.1823,
    b: () => -0.1181 * S['%_lignin'] - 0.3783,
    LitterMPa: () => Math.max(-200, -S.a * S.LitterWaterContent ** S.b),
    Litter_MPa_Gradient: () => S.Air_MPa - S.LitterMPa,
    k1: () => {
      if (S.RHChange > 0 && S.Litter_MPa_Gradient < 30) return 0.0008;
      if (S.RHChange > 0 && S.Litter_MPa_Gradient > 30) return 0.0004;
      return 0;
    },
    FromAir: () => {
      if (S.RHChange > 0 && S.Litter_MPa_Gradient > 0) {
        if (S.k1 * S.Litter_MPa_Gradient > 0.01) return 0.026;
        return S.k1 * S.Litter_MPa_Gradient;
      }
      return 0;
    },
    Evaporation: () =>
      Math.max(0, S.LitterWaterContent - S.WaterLossFromEvap > 0 ? S.WaterLossFromEvap : 0),
    CarbK: () => 0.018 * Math.exp(-12 * (S['%_lignin'] / 100)),
    CellK: () => S.k3 * Math.exp(-12 * (S['%_lignin'] / 100)),
    RMTFAC: () =>
      S.Temp[t] < 0
        ? 0
        : (0.384 + 0.018 * S.Temp[t]) * Math.exp(S.LitterMPa * (0.142 + 0.628 * S.Temp[t] ** -1)),
    FON: () => S.CarbN + S.CellN + S.LigninN,
    CNR: () => (0.426 * S.FOM) / (S.FON + S.INkg),
    CNRF: () => Math.min(1, Math.exp((-0.693 * (S.CNR - 13)) / 13)),
    ContactFactor: () =>
      S.FOM > 3000 ? S.Critical_FOM / 3000 : Math.min(1, S.Critical_FOM / S.FOM),
    DeCarb: () => S.CarbK * S.RMTFAC * S.CNRF * S.ContactFactor,
    DeCell: () => S.CellK * S.RMTFAC * S.CNRF * S.ContactFactor,
    DeLign: () => S.LignK * S.RMTFAC * S.CNRF * S.ContactFactor,
    GrNom1: () => Math.max(0, S.CarbN * S.DeCarb),
    GRNom2: () => Math.max(0, S.CellN * S.DeCell),
    GRNom3: () => Math.max(0, S.LigninN * S.DeLign),
    GRNom: () => S.GrNom1 + S.GRNom2 + S.GRNom3,
    FOMNhum: () => Math.max(0, S.GRNom * S.FractionHumified),
    GRCom1: () => Math.max(0, S.Carb * S.DeCarb),
    GRCom2: () => Math.max(0, S.Cell * S.DeCell),
    GRCom3: () => Math.max(0, S.Lign * S.DeLign),
    GRCom: () => Math.max(0, S.GRCom1 + S.GRCom2 + S.GRCom3),
    Resistant: () => Math.max((S.FractionHumified * S.GRNom) / 0.04),
    HumMin: () => Math.max(0, (S.Dminr * S.RMTFAC) / 0.04),
    RhMin: () => Math.max(0, S.Dminr * S.RMTFAC),
    NetMin: () => Math.max(0, S.RhMin + (1 - S.FractionHumified) * S.GRNom),
    RNAC: () => Math.max(0, Math.min(S.INkg, S.GRCom * 0.0213 - S.GRNom)),
    // MinFromFOMRate: () => Math.max(0, S.GRNom * (1 - S.FractionHumified) - S.RNAC),
    MinFromFOMRate: () => S.GRNom * (1 - S.FractionHumified) - S.RNAC,
    MinFromHumRate: () => Math.max(0, S.RhMin),
    Noname_1: () => Math.max(0, S.FOMNhum),
    Noname_2: () => Math.max(0, S.RNAC),
    'overall_%N': () => (S.FON / S.FOM) * 100,
    Dew: () => (S.RH[t] > 85 && S.RH[t - 1] < 85 && S.Rain[t] === 0 ? 1 : 0),
    PrevLitWC: () => Math.max(0, S.LitterWaterContent[t - 1]),
    PrevRH: () => S.RH[t - 1],
    RHChange: () => S.RH[t] - S.PrevRH,
    k_4: () => S.c * S.Temp[t] * S.LitterWaterContent,
  };

  const set = (parm, value, min = -Infinity) => {
    if (typeof value === 'undefined') {
      S[parm][t] = funcs[parm]();
    } else if (typeof value === 'string') {
      S[parm][t] = value;
    } else {
      S[parm][t] = Math.max(min, value);
    }
    obj[parm] = S[parm][t];

    // if (t > 0) {
    //   S[parm][t + 1] = S[parm][t];
    // }
  }; // set

  const add = (parm, value, allowneg) => {
    const min = allowneg ? -Infinity : 0;

    S[parm][t] = Math.max(min, +S[parm][t - 1] + +value);
    obj[parm] = S[parm][t];
  }; // add

  // process.stdout.write(`${type}          \r`);

  obj = {
    Rain: S.Rain[0],
    Temp: S.Temp[0],
    RH: S.RH[0],
  };
  set('Date', formatDate(date));
  date.setHours(date.getHours() + 1);

  set('RainToGetCurrentWC');
  set('WCFromRain');
  set('FromRain');
  set('FromDew');
  set('Air_MPa');
  set('%_lignin');
  set('a');
  set('b');
  set('LitterMPa');
  set('Litter_MPa_Gradient');
  set('k1');
  set('FromAir');
  set('Evaporation');
  set('CarbK');
  set('RMTFAC');
  set('FON');
  set('CNR');
  set('CNRF');
  set('ContactFactor');
  set('DeCarb');
  set('GrNom1');
  set('CellK');
  set('DeCell');
  set('GRNom2');
  set('DeLign');
  set('GRNom3');
  set('GRNom');
  set('FOMNhum');
  set('GRCom1');
  set('GRCom2');
  set('GRCom3');
  set('GRCom');
  set('Resistant');
  set('HumMin');
  set('RhMin');
  set('NetMin');
  set('RNAC');
  set('MinFromFOMRate');
  set('MinFromHumRate');
  set('Noname_1');
  set('Noname_2');
  set('overall_%N');
  // set('Rain');
  results.push(obj);

  for (t = 1; t <= hours; t += 1) {
    S.Date[t] = formatDate(date);
    obj = {
      Date: formatDate(date),
      Rain: S.Rain[t],
      Temp: S.Temp[t],
      RH: S.RH[t],
    };
    date.setHours(date.getHours() + 1);

    add('FOM', -S.GRCom);
    add('Carb', -S.GRCom1);
    add('CarbN', S.RNAC - S.GrNom1);
    add('Cell', -S.GRCom2);
    add('CellN', -S.GRNom2);
    add('Hum', S.Resistant - S.HumMin);
    add('HumN', S.FOMNhum - S.RhMin);
    add('INkg', S.NetMin - S.RNAC);
    add('Lign', -S.GRCom3);
    add('LigninN', -S.GRNom3);
    add('LitterWaterContent', S.FromAir + S.FromRain + S.FromDew - S.Evaporation);
    add('MinNfromFOM', S.MinFromFOMRate, true);
    add('MinNfromHum', S.MinFromHumRate);
    add('NImmobFromFOM', S.Noname_1);
    add('NimmobIntoCarbN', S.Noname_2);

    set('Dew');
    set('PrevLitWC');
    set('PrevRH');
    set('RHChange');
    set('k_4');

    let w;
    if (S.LitterWaterContent <= 0.04) w = 0;
    else if (S.Dew[t] === 0 && S.Dew[t - 1] > 0) w = type === 'Rye' ? 0.2 : 0.4;
    else if (S.Rain[t] === 0 && S.Rain[t - 1] > 0) w = 0.7;
    else if (S.RHChange >= 0) w = 0;
    else if (S.RHChange > -2.5) w = 0.001;
    else if (S.k_4 > 0.03) w = 0.06;
    else w = S.k_4;
    set('WaterLossFromEvap', w);

    set('RainToGetCurrentWC');
    set('WCFromRain');
    set('FromRain');
    set('FromDew');
    set('Air_MPa');
    set('%_lignin');
    set('a');
    set('b');
    set('LitterMPa');
    set('Litter_MPa_Gradient');
    set('k1');
    set('FromAir');
    set('Evaporation');
    set('RMTFAC');
    set('FON');
    set('CNR');
    set('CNRF');
    set('ContactFactor');
    set('CarbK');
    set('DeCarb');
    set('GrNom1');
    set('CellK');
    set('DeCell');
    set('GRNom2');
    set('DeLign');
    set('GRNom3');
    set('GRNom');
    set('FOMNhum');
    set('GRCom1');
    set('GRCom2');
    set('GRCom3');
    set('GRCom');
    set('Resistant');
    set('HumMin');
    set('RhMin');
    set('NetMin');
    set('RNAC');
    set('MinFromFOMRate');
    set('MinFromHumRate');
    set('Noname_1');
    set('Noname_2');
    set('overall_%N');
    results.push(obj);
  }

  // console.log(results);
  // Object.keys(S).forEach((p) => {
  //   if (Array.isArray(S[p])) {
  //     S[p] = S[p].slice(0, stop);
  //   } else {
  //     S[p] = new Array(stop).fill(S[p]);
  //   }

  //   if (p !== 'Date') {
  //     S[p] = S[p].map((n) => (+n >= 10000 ? +n : +((+n).toPrecision(5))));
  //   }
  // });

  // console.timeEnd('surfaceModel');
  return results;
}; // surfaceModel

module.exports = {
  surfaceModel,
};
