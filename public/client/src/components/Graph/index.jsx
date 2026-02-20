import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useDispatch, useSelector } from 'react-redux';
import { get, set } from 'redux-autosetters';
import './styles.scss';

const animation = {
  duration: 200,
};

const dailyAverage = (date, arr, parm) => {
  let total = 0;
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && i % 24 === 0) {
      result.push({
        x: +date,
        y: +(total / 24).toFixed(2),
      });
      date.setDate(date.getDate() + 1);
      total = 0;
    } else {
      total += arr[i][parm];
    }
  }
  return result;
}; // dailyAverage

const dailyTotal = (date, arr, parm) => {
  let total = 0;
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && i % 24 === 0) {
      result.push({
        x: +date,
        y: +total.toFixed(2),
      });
      date.setDate(date.getDate() + 1);
      total = 0;
    } else {
      total += arr[i][parm];
    }
  }
  return result;
}; // dailyTotal

const WeatherGraph = ({ sdatanew }) => {
  const series = [
    {
      name: 'Rainfall',
      data: dailyTotal(new Date(sdatanew[0].Date), sdatanew, 'Rain'),
      animation,
      color: 'green',
      type: 'column',
    },
    {
      name: 'Air temperature',
      data: dailyAverage(new Date(sdatanew[0].Date), sdatanew, 'Temp'),
      animation,
      color: 'blue',
    },
    {
      name: 'Relative humidity',
      data: dailyAverage(new Date(sdatanew[0].Date), sdatanew, 'RH'),
      animation,
      color: 'brown',
      yAxis: 1,
    },
  ];

  const options = {
    chart: {
      type: 'line',
      animation,
    },
    title: {
      text: 'Weather',
    },
    xAxis: {
      type: 'datetime',
      crosshair: {
        color: 'green',
        dashStyle: 'dash',
      },
    },
    yAxis: [
      {
        title: {
          text: `
            <div style="font-weight: bold; color: green">Rainfall&nbsp;(mm)</div>
            <br>
            <div style="font-weight: bold; color: blue">Air&nbsp;temperature&nbsp;(&deg;C)</div>
          `,
        },
        min: 0,
        max: 50,
      },
      {
        title: {
          text: `
            <div style="font-weight: bold; color: brown">Relative&nbsp;humidity&nbsp;(%)</div>
          `,
        },
        opposite: true,
      },
    ],
    series,
  };

  return (
    <div className="chart">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: '100%', width: '100%' } }}
      />
    </div>
  );
};

const Graph = ({
  sdataold, sdatanew, parm, desc,
}) => {
  const series = [
    {
      name: 'current',
      data: dailyAverage(new Date(sdataold[0].Date), sdataold, parm),
      animation,
      color: 'green',
    },
    {
      name: 'new',
      data: dailyAverage(new Date(sdatanew[0].Date), sdatanew, parm),
      animation,
      color: 'red',
    },
  ];

  const options = {
    chart: {
      type: 'line',
      animation,
    },
    title: {
      text: desc,
    },
    xAxis: {
      type: 'datetime',
      crosshair: {
        color: 'green',
        dashStyle: 'dash',
      },
    },
    yAxis: [
      {
        title: {
          text: parm,
        },
      },
    ],
    series,
  };

  return (
    <div className="chart">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: '100%', width: '100%' } }}
      />
    </div>
  );
}; // Graph

const Charts = () => {
  const weather = useSelector(get.weather);
  const temp = useSelector(get.temp);
  const rain = useSelector(get.rain);
  const RH = useSelector(get.RH);
  const biomass = useSelector(get.biomass);
  const n = useSelector(get.n);
  const carb = useSelector(get.carb);
  const cell = useSelector(get.cell);
  const lign = useSelector(get.lign);
  const OM = useSelector(get.OM);
  const BD = useSelector(get.BD);
  const INppm = useSelector(get.in);
  const PMN = useSelector(get.PMN);
  const lwc = useSelector(get.lwc);

  console.log(temp.length, weather.length, RH.length, rain.length, typeof surfaceModelNew);
  if (weather.length && temp.length && RH.length && rain.length && typeof surfaceModelNew === 'function') {
    const inputs = {
      FOMkg: biomass,
      FOMpctN: n,
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
      temp,
      RH,
      rain,
      start: weather[0].date.split(' ')[0],
    };

    // eslint-disable-next-line no-undef
    const sdatanew = surfaceModelNew(inputs);
    // console.log(sdatanew);

    // const sdataold = sdatanew;

    // eslint-disable-next-line no-undef
    const sdataold = surfaceModel(inputs);
    // console.log(sdataold);

    document.querySelector('#Charts')?.classList.remove('loading');

    return (
      <div id="Charts">
        <h2>Fresh Organic Matter</h2>
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="Carb" desc="Carbohydrates" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="Cell" desc="Holo-cellulose" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="Lign" desc="Lignin" />

        <h2>Fresh Organic Nitrogen</h2>
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="CarbN" desc="Carbohydrates" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="CellN" desc="Holo-cellulose" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="LigninN" desc="Lignin" />

        <h2>Decay rate adjustment factors</h2>
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="RMTFAC" desc="Residue moisture-temperature reduction factor" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="CNRF" desc="C:N ratio factor" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="ContactFactor" desc="Residue contact factor" />

        <h2>Other</h2>
        <WeatherGraph sdatanew={sdatanew} />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="LitterMPa" desc="Litter water potential" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="Air_MPa" desc="Air water potential" />
      </div>
    );
  }

  return <div>Loading&hellip;</div>;
};

let timer;

const Input = ({ parm, desc, unit }) => {
  const dispatch = useDispatch();
  const value = useSelector(get[parm]);

  return (
    <tr>
      <td>{desc}</td>
      <td>
        <input
          id={parm}
          onChange={(event) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
              dispatch(set[parm](event.target.value));
            }, 200);
          }}
          defaultValue={value}
        />
      </td>
      <td>
        <small>{unit}</small>
      </td>
    </tr>
  );
};

const Inputs = () => (
  <div id="Inputs">
    <table>
      <tbody>
        <Input parm="lat" desc="Latitude" />
        <Input parm="lon" desc="Longitude" />
        <Input parm="start" desc="Start date" />
        <Input parm="end" desc="End date" />
        <Input parm="biomass" desc="Dry biomass" unit="kg/ha" />
        <Input parm="n" desc="Nitrogen" unit="%" />
        <Input parm="carb" desc="Carbohydrates" unit="%" />
        <Input parm="cell" desc="Holocellulose" unit="%" />
        <Input parm="lign" desc="Lignin" unit="%" />
        <Input parm="OM" desc="Soil organic matter" unit="%" />
        <Input parm="BD" desc="Bulk density" unit="g/cm3" />
        <Input parm="in" desc="Soil inorganic N" unit="ppm" />
        <Input parm="PMN" desc="Potentially mineralizable N" unit="mg N/kg" />
        <Input parm="lwc" desc="Water Content at Termination" unit="g water/g dry biomass" />
      </tbody>
    </table>
  </div>
);

const Sites = () => {
  const dispatch = useDispatch();
  const sites = useSelector(get.sites);

  const handleChange = (event) => {
    const site = sites[event.currentTarget.value]?.[0];

    if (site) {
      ['lat', 'lon', 'biomass', 'carb', 'cell', 'lign', 'lwc', 'n'].forEach((parm) => {
        document.querySelector(`#${parm}`).value = site[parm];
        dispatch(set[parm](site[parm]));
      });

      document.querySelector('#start').value = site.date;
      dispatch(set.start(site.date));

      const last = sites[event.currentTarget.value].slice(-1)[0];
      document.querySelector('#end').value = last.date;
      dispatch(set.end(last.date));

      console.log(sites[event.currentTarget.value]);
    }
  };

  return (
    <>
      &nbsp;PSA sites:&nbsp;
      <select
        onChange={handleChange}
      >
        <option />
        {
          Object.keys(sites).map((site) => (
            <option key={site}>{site}</option>
          ))
        }
      </select>
    </>
  );
}; // Sites

const Graphs = () => {
  const dispatch = useDispatch();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const didRunOnce = useRef(false);
  const lat = useSelector(get.lat);
  const lon = useSelector(get.lon);
  const start = useSelector(get.start);
  const end = useSelector(get.end);

  const retrieve = async () => {
    console.log('retrieving');
    try {
      const url = `https://weather.covercrop-data.org/hourly?email=ncalc@psa.org&lat=${lat}&lon=${lon}&start=${start}&end=${end}`
        + '&attributes=air_temperature,relative_humidity,precipitation&options=predicted,mrms';
      console.log(url);

      document.querySelector('#Charts')?.classList.add('loading');
      const w = await (await fetch(url)).json();

      dispatch(set.weather(w));
      dispatch(set.temp(w.map((row) => row.air_temperature)));
      dispatch(set.RH(w.map((row) => row.relative_humidity * 100)));
      dispatch(set.rain(w.map((row) => row.precipitation)));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (isDevelopment && !didRunOnce.current) {
      didRunOnce.current = true;
    } else {
      retrieve();
    }
  }, [lat, lon, start, end]);

  return (
    <div id="Graphs">
      <Sites />
      <Inputs />
      <Charts />
    </div>
  );
};

export default Graphs;
