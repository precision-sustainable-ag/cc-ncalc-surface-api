// biome-ignore lint/correctness/noUnusedVariables: testing
const exit = (s) => {
  console.log(s);
  process.exit();
};

const surfaceModelNew = ({
  FOMkg,
  FOMpctN,
  FOMpctCarb,
  FOMpctCell,
  FOMpctLign,
  // LitterWaterContent,
  BD,
  INppm,
  hours,
  PMN = 7,
  // stop,
  temp,
  RH,
  rain,
  start,
  nonly,
}) => {
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formattedDate = `${month}/${day}/${year} ${hour}:${minutes}`;

    return formattedDate;
  };

  console.time('surfaceModelNew');
  const date = new Date(`${start} 00:00`);

  FOMkg = Math.max(FOMkg, 0.00001);
  // res.send({FOMkg, FOMpctN, FOMpctCarb, FOMpctCell, FOMpctLign, LitterWaterContent, BD, INppm, hours, stop, temp, RH, rain}); return;

  const update = (v, delta) => Math.max(0, v + delta);

  const type = FOMpctN >= 2.25 && FOMpctCarb >= 50 ? 'Clover' : 'Rye';

  const depthIn = 8;
  const depthLayerCm = depthIn * 2.54;
  const FAC = BD * depthLayerCm * 0.1;
  // const Sat = (1 - (BD / 2.65)) / BD;
  const Dminr = ((((0.0024 + 0.022 * PMN) * (BD * depthLayerCm)) / 10 / 0.66666 / 0.7) * 2) / 24;
  const InitialFOMN = (FOMkg * FOMpctN) / 100;
  let CarbN = (InitialFOMN * FOMpctCarb) / 100;
  let CellN = (InitialFOMN * FOMpctCell) / 100;
  let LigninN = (InitialFOMN * FOMpctLign) / 100;
  const SOCpct = 1.95;
  const c = 0.01;

  let FOM = +FOMkg;
  let Carb = (FOMkg * FOMpctCarb) / 100;
  let Cell = (FOMkg * FOMpctCell) / 100;
  let Lign = (FOMkg * FOMpctLign) / 100;

  let pctCarb = (Carb / (Carb + Cell + Lign)) * 100;
  let M = 1.1642 + 0.0612 * pctCarb;
  let k = 0.1871 - 0.0015 * FOMpctCarb;
  let LitterWaterContent = M;

  let Hum = Math.max(0, (SOCpct * BD * depthLayerCm * 1000) / 0.58);
  let HumN = Math.max(0, SOCpct * depthLayerCm * BD * 100);
  let INkg = INppm * FAC;
  let MinNfromFOM = 0;
  let MinNfromHum = 0;
  let NImmobFromFOM = 0;
  let NimmobIntoCarbN = 0;
  let Dew = 0;
  let prevDew = 0;
  // let PrevLitWC = LitterWaterContent;
  let PrevRH = RH[0];
  let RHChange = 0;
  let k_4 = c * temp[0] * LitterWaterContent;
  let WaterLossFromEvap = 0;
  let RainToGetCurrentWC;
  let WCFromRain;
  let FromRain;
  let FromDew;
  let Air_MPa;
  let pctLignin;
  let a;
  let b;
  let LitterMPa;
  let Litter_MPa_Gradient;
  let k1;
  let FromAir;
  let Evaporation;
  let CarbK;
  let CellK;
  let RMTFAC;
  let FON;
  let CNR;
  let CNRF;
  let ContactFactor;
  let DeCarb;
  let DeCell;
  let DeLign;
  let GrNom1;
  let GRNom2;
  let GRNom3;
  let GRNom;
  let FOMNhum;
  let GRCom1;
  let GRCom2;
  let GRCom3;
  let GRCom;
  let Resistant;
  let HumMin;
  let RhMin;
  let NetMin;
  let RNAC;
  let MinFromFOMRate;
  let MinFromHumRate;
  let Noname_1;
  let Noname_2;
  // let overallN;

  const k3 = 0.01;
  const Critical_FOM = 1400;
  const LignK = 0.00095;
  const FractionHumified = 0.55;

  const S = [];

  let t = 0;

  const fRainToGetCurrentWC = () =>
    rain[t] === 0 ? 0 : Math.log((M - LitterWaterContent) / M) / -k;

  const fWCFromRain = () =>
    rain[t] === 0 ? 0 : M * (1 - Math.exp(-k * (rain[t] + RainToGetCurrentWC)));

  const fFromRain = () =>
    rain[t] === 0 ? 0 : Math.max(0, Math.min(WCFromRain - LitterWaterContent, 0.3));

  const fFromDew = () =>
    Dew === 1 && LitterWaterContent < 2.5 && FOM > 1500 ? (type === 'Rye' ? 0.5 : 0.85) : 0;

  const fAir_MPa = () =>
    (8.314 * (temp[t] + 273.15) * Math.log(RH[t] / 100)) / (18 * 10 ** -6) / 1000000;

  const fpctLignin = () => Math.min(13, (Lign / FOM) * 100);
  const fa = () => -0.5981 * pctLignin + 8.1823;
  const fb = () => -0.1181 * pctLignin - 0.3783;

  const fLitterMPa = () => Math.max(-200, -a * LitterWaterContent ** b);

  const fLitter_MPa_Gradient = () => Air_MPa - LitterMPa;

  const fk1 = () => {
    if (RHChange > 0) {
      return Litter_MPa_Gradient < 30 ? 0.0008 : 0.0004;
    }
    return 0;
  };

  const fFromAir = () => {
    if (RHChange > 0 && Litter_MPa_Gradient > 0) {
      if (k1 * Litter_MPa_Gradient > 0.01) return 0.026;
      return k1 * Litter_MPa_Gradient;
    }
    return 0;
  };

  const fEvaporation = () =>
    Math.max(0, LitterWaterContent - WaterLossFromEvap > 0 ? WaterLossFromEvap : 0);
  const fCarbK = () => 0.018 * Math.exp(-12 * (pctLignin / 100));
  const fCellK = () => k3 * Math.exp(-12 * (pctLignin / 100));
  const fRMTFAC = () =>
    temp[t] < 0
      ? 0
      : (0.384 + 0.018 * temp[t]) * Math.exp(LitterMPa * (0.142 + 0.628 * (1 / temp[t])));
  const fFON = () => CarbN + CellN + LigninN;
  const fCNR = () => (0.426 * FOM) / (FON + INkg);
  const fCNRF = () => Math.min(1, Math.exp((-0.693 * (CNR - 13)) / 13));
  const fContactFactor = () => (FOM > 3000 ? Critical_FOM / 3000 : Math.min(1, Critical_FOM / FOM));
  const fDeCarb = () => CarbK * RMTFAC * CNRF * ContactFactor;
  const fDeCell = () => CellK * RMTFAC * CNRF * ContactFactor;
  const fDeLign = () => LignK * RMTFAC * CNRF * ContactFactor;
  const fGrNom1 = () => Math.max(0, CarbN * DeCarb);
  const fGRNom2 = () => Math.max(0, CellN * DeCell);
  const fGRNom3 = () => Math.max(0, LigninN * DeLign);
  const fGRNom = () => GrNom1 + GRNom2 + GRNom3;
  const fFOMNhum = () => Math.max(0, GRNom * FractionHumified);
  const fGRCom1 = () => Math.max(0, Carb * DeCarb);
  const fGRCom2 = () => Math.max(0, Cell * DeCell);
  const fGRCom3 = () => Math.max(0, Lign * DeLign);
  const fGRCom = () => Math.max(0, GRCom1 + GRCom2 + GRCom3);
  const fResistant = () => Math.max((FractionHumified * GRNom) / 0.04);
  const fHumMin = () => Math.max(0, (Dminr * RMTFAC) / 0.04);
  const fRhMin = () => Math.max(0, Dminr * RMTFAC);
  const fNetMin = () => Math.max(0, RhMin + (1 - FractionHumified) * GRNom);
  const fRNAC = () => Math.max(0, Math.min(INkg, GRCom * 0.0213 - GRNom));
  const fMinFromFOMRate = () => GRNom * (1 - FractionHumified) - RNAC;
  const fMinFromHumRate = () => Math.max(0, RhMin);
  const fNoname_1 = () => Math.max(0, FOMNhum);
  const fNoname_2 = () => Math.max(0, RNAC);

  // const foverallN = () => (FON / FOM) * 100;

  const spush = () => {
    if (nonly) {
      S.push({
        MinNfromFOM: FOMkg === 0.00001 ? 0 : MinNfromFOM,
      });
    } else {
      S.push({
        Date: formatDate(date),
        FromAir,
        FromRain,
        FromDew,
        Evaporation,
        WaterLossFromEvap,
        LitterWaterContent,
        GRCom1,
        GRCom2,
        GRCom3,
        GRCom,
        a,
        b,
        '%_lignin': pctLignin,
        CarbK,
        DeCarb,
        Air_MPa,
        Carb,
        CarbN,
        Cell,
        CellN,
        CNRF,
        ContactFactor,
        FOM,
        FON,
        Lign,
        LigninN,
        LitterMPa,
        MinNfromFOM,
        Rain: rain[t],
        RH: RH[t],
        RMTFAC,
        Temp: temp[t],
      });
    }
  }; // spush

  RainToGetCurrentWC = fRainToGetCurrentWC();
  WCFromRain = fWCFromRain();
  FromRain = fFromRain();
  FromDew = fFromDew();
  Air_MPa = fAir_MPa();
  pctLignin = fpctLignin();
  a = fa();
  b = fb();
  LitterMPa = fLitterMPa();
  Litter_MPa_Gradient = fLitter_MPa_Gradient();
  k1 = fk1();
  FromAir = fFromAir();
  Evaporation = fEvaporation();
  CarbK = fCarbK();
  RMTFAC = fRMTFAC();
  FON = fFON();
  CNR = fCNR();
  CNRF = fCNRF();
  ContactFactor = fContactFactor();
  DeCarb = fDeCarb();
  GrNom1 = fGrNom1();
  CellK = fCellK();
  DeCell = fDeCell();
  GRNom2 = fGRNom2();
  DeLign = fDeLign();
  GRNom3 = fGRNom3();
  GRNom = fGRNom();
  FOMNhum = fFOMNhum();
  GRCom1 = fGRCom1();
  GRCom2 = fGRCom2();
  GRCom3 = fGRCom3();
  GRCom = fGRCom();
  Resistant = fResistant();
  HumMin = fHumMin();
  RhMin = fRhMin();
  NetMin = fNetMin();
  RNAC = fRNAC();
  MinFromFOMRate = fMinFromFOMRate();
  MinFromHumRate = fMinFromHumRate();
  Noname_1 = fNoname_1();
  Noname_2 = fNoname_2();
  // overallN = foverallN();

  spush();

  for (t = 1; t < hours; t += 1) {
    date.setHours(date.getHours() + 1);

    pctCarb = (Carb / (Carb + Cell + Lign)) * 100;
    M = 1.1642 + 0.0612 * pctCarb;
    k = 0.1871 - 0.0015 * pctCarb;

    FOM = update(FOM, -GRCom);
    Carb = update(Carb, -GRCom1);
    CarbN = update(CarbN, RNAC - GrNom1);
    Cell = update(Cell, -GRCom2);
    CellN = update(CellN, -GRNom2);
    Hum = update(Hum, Resistant - HumMin);
    HumN = update(HumN, FOMNhum - RhMin);
    INkg = update(INkg, NetMin - RNAC);
    Lign = update(Lign, -GRCom3);
    LigninN = update(LigninN, -GRNom3);

    // LitterWaterContent = Math.max(0, LitterWaterContent + (FromAir + FromRain + FromDew - Evaporation));
    LitterWaterContent = Math.min(
      M,
      LitterWaterContent + (FromAir + FromRain + FromDew - Evaporation),
    );

    MinNfromFOM += MinFromFOMRate;
    MinNfromHum = update(MinNfromHum, MinFromHumRate);
    NImmobFromFOM = update(NImmobFromFOM, Noname_1);
    NimmobIntoCarbN = update(NimmobIntoCarbN, Noname_2);
    prevDew = Dew;
    Dew = RH[t] > 85 && RH[t - 1] < 85 && rain[t] === 0 ? 1 : 0;

    // PrevLitWC = Math.max(0, S.LitterWaterContent[t - 1]);  // !!!

    PrevRH = RH[t - 1];
    RHChange = RH[t] - PrevRH;
    k_4 = c * temp[t] * LitterWaterContent;

    let w;
    if (LitterWaterContent <= 0.04) w = 0;
    else if (Dew === 0 && prevDew > 0)
      w = type === 'Rye' ? 0.2 : 0.4; // !!!
    else if (rain[t] === 0 && rain[t - 1] > 0) w = 0.7;
    else if (RHChange >= 0) w = 0;
    else if (RHChange > -2.5) w = 0.001;
    else if (k_4 > 0.03) w = 0.06;
    else w = k_4;

    WaterLossFromEvap = w;
    RainToGetCurrentWC = fRainToGetCurrentWC();
    WCFromRain = fWCFromRain();
    FromRain = fFromRain();
    FromDew = fFromDew();
    Air_MPa = fAir_MPa();
    pctLignin = fpctLignin();
    a = fa();
    b = fb();
    LitterMPa = fLitterMPa();
    Litter_MPa_Gradient = fLitter_MPa_Gradient();
    k1 = fk1();
    FromAir = fFromAir();
    Evaporation = fEvaporation();
    RMTFAC = fRMTFAC();
    FON = fFON();
    CNR = fCNR();
    CNRF = fCNRF();
    ContactFactor = fContactFactor();
    CarbK = fCarbK();
    DeCarb = fDeCarb();
    GrNom1 = fGrNom1();
    CellK = fCellK();
    DeCell = fDeCell();
    GRNom2 = fGRNom2();
    DeLign = fDeLign();
    GRNom3 = fGRNom3();
    GRNom = fGRNom();
    FOMNhum = fFOMNhum();
    GRCom1 = fGRCom1();
    GRCom2 = fGRCom2();
    GRCom3 = fGRCom3();
    GRCom = fGRCom();
    Resistant = fResistant();
    HumMin = fHumMin();
    RhMin = fRhMin();
    NetMin = fNetMin();
    RNAC = fRNAC();
    MinFromFOMRate = fMinFromFOMRate();
    MinFromHumRate = fMinFromHumRate();
    Noname_1 = fNoname_1();
    Noname_2 = fNoname_2();

    // overallN = foverallN();
    spush();
  }

  console.timeEnd('surfaceModelNew');

  // console.time('keys');

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

  // console.timeEnd('keys');
  return S;
}; // surfaceModelNew

module.exports = {
  surfaceModelNew,
};
