import React, { useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HCMore from 'highcharts/highcharts-more';
import { useDispatch, useSelector } from 'react-redux';
import { set, get } from 'redux-autosetters';
import { data } from '../../store/Store';

import './styles.scss';

HCMore(Highcharts);

Math.percentile = (array, p) => {
  if (array.length === 0) return null;
  array.sort((a, b) => a - b);
  const index = (p / 100) * (array.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return array[lower];

  return array[lower] + (index - lower) * (array[upper] - array[lower]);
};

Math.rpd = (v1, v2) => (Math.abs(v1 - v2) / ((v1 + v2) / 2)) * 100;

Math.rmse = (a1, a2) => (
  a1.length
    ? Math.sqrt(a1.reduce((acc, n, i) => acc + (n - a2[i]) ** 2, 0) / a1.length)
    : null
);

Math.mean = (array) => (
  array.length ? array.reduce((a, b) => +a + +b) / array.length : null
);

Math.Min = (array) => Math.min(...array);
Math.Q1 = (array) => Math.percentile(array, 25);
Math.Q2 = Math.mean;
Math.Q3 = (array) => Math.percentile(array, 75);
Math.Max = (array) => Math.max(...array);

Math.median = (array) => {
  array = array.sort((a, b) => a - b);

  const middle = Math.floor((array.length - 1) / 2);

  if (array.length % 2) {
    return +array[middle];
  }

  return (+array[middle] + +array[middle + 1]) / 2.0;
}; // median

Math.range = (array) => (
  `${Math.min(...array).toFixed(2)}-${Math.max(...array).toFixed(2)}`
); // range

Math.std = (array) => {
  const mean = Math.mean(array);
  const dev = array.map((itm) => (itm - mean) * (itm - mean));

  return Math.sqrt(dev.reduce((a, b) => a + b) / (array.length - 1));
}; // std

Math.nse = (obs, sim) => {
  // Nash-Sutcliffe Coefficient
  const avg = Math.mean(obs);
  const num = obs.reduce((acc, n, i) => acc + (n - sim[i]) ** 2, 0);
  const den = obs.reduce((acc, n) => acc + (n - avg) ** 2, 0);

  // const acc = obs.reduce((sum, n, i) => sum + (n - sim[i]) ** 2, 0);

  return 1 - num / den;
}; // nse

// eslint-disable-next-line no-unused-vars
const growthStage = (zadoksNumber) => { // https://www.agric.wa.gov.au/grains/zadoks-growth-scale
  const stages = {
    0: 'Germination',
    10: 'Seedling growth',
    20: 'Tillering',
    30: 'Stem elongation',
    40: 'Booting',
    50: 'Awn emergence',
    60: 'Anthesis (Flowering)',
    70: 'Milk development',
    80: 'Dough development',
    90: 'Ripening',
    100: 'Maturity',
  };

  const mainStage = Math.floor(zadoksNumber / 10) * 10;

  return stages[mainStage] ?? 'Invalid Zadoks number';
};

const BoxPlotChart = () => {
  const ndata = useSelector(get.ndata);
  const filters = useSelector(get.filters);
  useSelector(get.updated);

  const dataValues = (parm) => (
    ndata
      .filter((row) => row[parm].trim() > '')
      .map((row) => +row[parm])
  );

  const carb = dataValues('carb');
  const cell = dataValues('cellulose');
  const lign = dataValues('lignin');

  const options = {
    chart: {
      animation: false,
      type: 'boxplot',
    },
    plotOptions: {
      series: {
        animation: false,
        dataLabels: {
          enabled: true, // Enable labels
          format: '{y}', // Show value
          align: 'center',
        },
      },
    },
    title: {
      text: 'Boxplots for Carbohydrates, Cellulose, and Lignin',
    },
    xAxis: {
      categories: ['Carb', 'Cellulose', 'Lignin'],
      title: {
        text: '',
      },
    },
    yAxis: {
      title: {
        text: 'Percentage',
      },
    },
    series: [
      {
        name: 'Observations',
        data: [
          [Math.Min(carb), Math.Q1(carb), Math.Q2(carb), Math.Q3(carb), Math.Max(carb)],
          [Math.Min(cell), Math.Q1(cell), Math.Q2(cell), Math.Q3(cell), Math.Max(cell)],
          [Math.Min(lign), Math.Q1(lign), Math.Q2(lign), Math.Q3(lign), Math.Max(lign)],
        ],
        tooltip: {
          headerFormat: '<em>{point.key}</em><br/>',
        },
      },
    ],
  };

  if (!ndata.length) return null;

  const desc = (parm) => {
    const unused = document.querySelectorAll(`[data-class="${parm}"].unused`);

    if (unused.length === 0) {
      return (
        <>
          <strong>{parm}</strong>
          : All
        </>
      );
    }

    const sunused = [...unused].map((obj) => obj.textContent);
    return (
      <>
        <strong>{parm}</strong>
        :&nbsp;
        {filters[parm].map((s) => s || 'Unknown').filter((s) => !sunused.includes(s)).join(', ')}
      </>
    );
  };

  return (
    <table>
      <tbody>
        <tr>
          <td>
            <div style={{ width: '600px', height: '400px', border: '1px solid #aaa' }}>
              <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
          </td>
          <td style={{ verticalAlign: 'top' }}>
            <table className="caption">
              <thead>
                <tr>
                  <th>Stat</th>
                  <th>Carbohydrates</th>
                  <th>Cellulose</th>
                  <th>Lignin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>N</td>
                  <td>{carb.length}</td>
                  <td>{cell.length}</td>
                  <td>{lign.length}</td>
                </tr>
                <tr>
                  <td>Min</td>
                  <td>{Math.Min(carb)?.toFixed(2)}</td>
                  <td>{Math.Min(cell)?.toFixed(2)}</td>
                  <td>{Math.Min(lign)?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Q1</td>
                  <td>{Math.Q1(carb)?.toFixed(2)}</td>
                  <td>{Math.Q1(cell)?.toFixed(2)}</td>
                  <td>{Math.Q1(lign)?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Q2</td>
                  <td>{Math.Q2(carb)?.toFixed(2)}</td>
                  <td>{Math.Q2(cell)?.toFixed(2)}</td>
                  <td>{Math.Q2(lign)?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Q3</td>
                  <td>{Math.Q3(carb)?.toFixed(2)}</td>
                  <td>{Math.Q3(cell)?.toFixed(2)}</td>
                  <td>{Math.Q3(lign)?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Max</td>
                  <td>{Math.Max(carb)?.toFixed(2)}</td>
                  <td>{Math.Max(cell)?.toFixed(2)}</td>
                  <td>{Math.Max(lign)?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <p>
              {desc('Source')}
              <br />
              {desc('Family')}
              <br />
              {desc('Category')}
              <br />
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const Documents = () => (
  <details>
    <summary>Documents</summary>
    <table>
      <thead>
        <tr>
          <th>Contributor</th>
          <th>Document</th>
          <th>Species</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Jeff Liebert</td>
          <td>
            <a href="Forage_quality_NY_MD_2015.csv">Forage_quality_NY_MD_2015.csv</a>
          </td>
          <td>Barley, Cereal rye, Triticale</td>
          <td>Raw data for NY and MD 2015</td>
        </tr>
        <tr>
          <td>Steven Mirsky</td>
          <td>
            <a target="_blank" href="fsufs-07-1067506.pdf">
              fsufs-07-1067506.pdf
            </a>
          </td>
          <td>Barley, Cereal rye, Triticale</td>
          <td>
            Winter cereal species, cultivar, and harvest timing affect trade-offs between forage quality and yield
          </td>
        </tr>
        <tr>
          <td>Chris Reberg-Horton</td>
          <td>
            <a target="_blank" href="Winter_Pea_Genotypes.pdf">
              Winter_Pea_Genotypes.pdf
            </a>
          </td>
          <td>Winter pea</td>
          <td>
            Differences among eighteen winter pea genotypes for forage and cover crop use in the southeastern United States
          </td>
        </tr>
        <tr>
          <td>Chris Reberg-Horton</td>
          <td>
            <a target="_blank" href="Winter_Pea_NIRS.pdf">
              Winter_Pea_NIRS.pdf
            </a>
          </td>
          <td>Winter pea</td>
          <td>
            Near-infrared spectroscopic models for analysis of winter pea
            {' '}
            <i>(Pisum sativum L.)</i>
            {' '}
            quality constituents
          </td>
        </tr>
        <tr>
          <td>Chris Reberg-Horton</td>
          <td>
            <a target="_blank" href="20NCForageQualityResults.xlsx">
              20NCForageQualityResults.xlsx
            </a>
          </td>
          <td>
            Winter pea
          </td>
          <td>
            2020 ALT forage quality
          </td>
        </tr>
        <tr>
          <td>Chris Reberg-Horton</td>
          <td>
            <a target="_blank" href="MO_WP_ForageQualityAnalysis_results.xlsx">
              MO_WP_ForageQualityAnalysis_results.xlsx
            </a>
          </td>
          <td>
            Winter pea
          </td>
          <td>
            FFAR Winter Pea ALT forage quality analysis
          </td>
        </tr>
        <tr>
          <td>Miguel Cabrera</td>
          <td>
            <a target="_blank" href="Summary_At_Termination.xlsx">
              Summary_At_Termination.xlsx
            </a>
          </td>
          <td>Crimson, Rye</td>
          <td>Summary of Quality at Termination Time</td>
        </tr>
        <tr>
          <td>OnFarm</td>
          <td>
            <a target="_blank" href="OnFarm.xlsx">
              OnFarm.xlsx
            </a>
          </td>
          <td>Barley, Cereal Rye, Oats, Ryegrass, Triticale, Hairy vetch, Wheat </td>
          <td>OnFarm data</td>
        </tr>
        <tr>
          <td>UGA</td>
          <td>
            <a target="_blank" href="UGA.xlsx">
              UGA.xlsx
            </a>
          </td>
          <td>Many</td>
          <td>University of Georgia data</td>
        </tr>
        <tr>
          <td>Resham Thapa</td>
          <td>
            <a target="_blank" href="psa_Initial litterbag fiber analysis_2021-2023.xlsx">
              psa_Initial litterbag fiber analysis_2021-2023.xlsx
            </a>
          </td>
          <td>Cereal rye, Crimson clover, Hairy vetch</td>
          <td>PSA-CE1 experiment</td>
        </tr>
        <tr>
          <td>Jyoti Jennewein</td>
          <td>
            <a target="_blank" href="WCC_fq_data_2021-2024_quality_for_lookup_tables.csv">
              WCC_fq_data_2021-2024_quality_for_lookup_tables.csv
            </a>
          </td>
          <td>Many</td>
          <td>Raw data for MD, 2021-2024</td>
        </tr>
      </tbody>
    </table>
    <hr />
  </details>
); // Documents

// eslint-disable-next-line no-unused-vars
const WinterPea = () => (
  <div id="WinterPea">
    <details>
      <summary>Winter Pea</summary>
      <table>
        <caption>
          Table 1. Descriptive statistics for the 11 constituents of winter pea used for the development of NIRS calibration models
        </caption>
        <thead>
          <tr>
            <th>
              Constituent
              {' '}
              <span>
                (g kg
                <sup>-1</sup>
                )
              </span>
            </th>
            <th>N</th>
            <th>Range</th>
            <th>Mean</th>
            <th>SD</th>
            <th>Q1</th>
            <th>Q2</th>
            <th>Q3</th>
            <th>IQ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Moisture </td>
            <td>88</td>
            <td>29.90–86.70</td>
            <td>50.67</td>
            <td>12.53</td>
            <td>41.27</td>
            <td>48.00</td>
            <td>60.23</td>
            <td>18.95</td>
          </tr>
          <tr>
            <td>Dry-matter </td>
            <td>88</td>
            <td>913.30–970.10</td>
            <td>949.33</td>
            <td>12.53</td>
            <td>939.78</td>
            <td>952.00</td>
            <td>958.73</td>
            <td>18.95</td>
          </tr>
          <tr>
            <td>Total N </td>
            <td>97</td>
            <td>18.20–48.40</td>
            <td>29.11</td>
            <td>5.81</td>
            <td>25.50</td>
            <td>28.50</td>
            <td>33.00</td>
            <td>7.50</td>
          </tr>
          <tr>
            <td>Crude protein </td>
            <td>97</td>
            <td>118.30–302.50</td>
            <td>181.93</td>
            <td>36.32</td>
            <td>159.40</td>
            <td>178.10</td>
            <td>206.30</td>
            <td>46.90</td>
          </tr>
          <tr>
            <td>ADF</td>
            <td>95</td>
            <td>194.70–484.80</td>
            <td>336.35</td>
            <td>72.02</td>
            <td>281.15</td>
            <td>328.60</td>
            <td>398.50</td>
            <td>117.35</td>
          </tr>
          <tr>
            <td>NDF </td>
            <td>97</td>
            <td>279.20–683.50</td>
            <td>448.91</td>
            <td>85.33</td>
            <td>387.40</td>
            <td>429.60</td>
            <td>522.20</td>
            <td>134.80</td>
          </tr>
          <tr>
            <td>AD-lignin </td>
            <td>96</td>
            <td>66.95–169.65</td>
            <td>106.65</td>
            <td>18.98</td>
            <td>85.28</td>
            <td>64.75</td>
            <td>79.55</td>
            <td>26.70</td>
          </tr>
          <tr>
            <td>Ash </td>
            <td>96</td>
            <td>51.10–159.70</td>
            <td>91.07</td>
            <td>26.19</td>
            <td>69.65</td>
            <td>85.40</td>
            <td>108.10</td>
            <td>38.45</td>
          </tr>
          <tr>
            <td>Cellulose </td>
            <td>95</td>
            <td>152.30–414.40</td>
            <td>269.65</td>
            <td>59.78</td>
            <td>223.85</td>
            <td>252.05</td>
            <td>317.25</td>
            <td>93.40</td>
          </tr>
          <tr>
            <td>Hemicellulose </td>
            <td>97</td>
            <td>5.30–401.50</td>
            <td>119.50</td>
            <td>55.14</td>
            <td>97.90</td>
            <td>115.40</td>
            <td>136.90</td>
            <td>39.00</td>
          </tr>
          <tr>
            <td>NFC </td>
            <td>96</td>
            <td>2.20–397.70</td>
            <td>253.83</td>
            <td>89.52</td>
            <td>203.63</td>
            <td>262.30</td>
            <td>322.15</td>
            <td>118.52</td>
          </tr>
        </tbody>
      </table>

      {/* <hr />
      <table>
        <caption>
          Table 2. Descriptive statistics for the 11 constituents of winter pea used in the monitoring (validation) of NIRS calibration models
        </caption>
        <thead>
          <tr>
            <th>
              Constituent
              {' '}
              <span>
                (g kg
                <sup>-1</sup>
                )
              </span>
            </th>
            <th>N</th>
            <th>Minimum</th>
            <th>Maximum</th>
            <th>Mean</th>
            <th>SD</th>
            <th>Q1</th>
            <th>Q2</th>
            <th>Q3</th>
            <th>IQ</th>
            <th>Average GH</th>
            <th>Average NH</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Moisture</td>
            <td>46</td>
            <td>32.80</td>
            <td>89.30</td>
            <td>50.96</td>
            <td>11.96</td>
            <td>43.13</td>
            <td>48.40</td>
            <td>55.80</td>
            <td>12.67</td>
            <td>1.19</td>
            <td>0.437</td>
          </tr>
          <tr>
            <td>Dry-matter </td>
            <td>46</td>
            <td>910.70</td>
            <td>967.20</td>
            <td>949.04</td>
            <td>11.96</td>
            <td>944.20</td>
            <td>952.60</td>
            <td>956.87</td>
            <td>12.67</td>
            <td>1.19</td>
            <td>0.437</td>
          </tr>
          <tr>
            <td>Total N </td>
            <td>49</td>
            <td>14.50</td>
            <td>39.10</td>
            <td>27.68</td>
            <td>5.42</td>
            <td>24.40</td>
            <td>28.00</td>
            <td>30.30</td>
            <td>5.90</td>
            <td>1.17</td>
            <td>0.422</td>
          </tr>
          <tr>
            <td>Crude protein </td>
            <td>49</td>
            <td>90.70</td>
            <td>244.00</td>
            <td>173.04</td>
            <td>38.35</td>
            <td>152.50</td>
            <td>178.80</td>
            <td>189.40</td>
            <td>36.90</td>
            <td>1.17</td>
            <td>0.422</td>
          </tr>
          <tr>
            <td>ADF </td>
            <td>49</td>
            <td>190.20</td>
            <td>519.20</td>
            <td>358.11</td>
            <td>80.20</td>
            <td>280.90</td>
            <td>354.70</td>
            <td>418.30</td>
            <td>131.40</td>
            <td>1.14</td>
            <td>0.417</td>
          </tr>
          <tr>
            <td>NDF </td>
            <td>49</td>
            <td>297.60</td>
            <td>700.70</td>
            <td>473.42</td>
            <td>93.16</td>
            <td>400.50</td>
            <td>466.40</td>
            <td>545.80</td>
            <td>145.30</td>
            <td>1.17</td>
            <td>0.422</td>
          </tr>
          <tr>
            <td>AD-lignin </td>
            <td>49</td>
            <td>40.40</td>
            <td>122.40</td>
            <td>71.25</td>
            <td>16.96</td>
            <td>57.10</td>
            <td>69.20</td>
            <td>82.60</td>
            <td>25.50</td>
            <td>1.09</td>
            <td>0.393</td>
          </tr>
          <tr>
            <td>Ash </td>
            <td>49</td>
            <td>54.20</td>
            <td>165.60</td>
            <td>97.38</td>
            <td>32.91</td>
            <td>74.40</td>
            <td>92.30</td>
            <td>116.30</td>
            <td>39.90</td>
            <td>1.08</td>
            <td>0.423</td>
          </tr>
          <tr>
            <td>Cellulose </td>
            <td>49</td>
            <td>144.30</td>
            <td>438.50</td>
            <td>286.87</td>
            <td>69.62</td>
            <td>223.80</td>
            <td>293.30</td>
            <td>350.00</td>
            <td>126.20</td>
            <td>1.13</td>
            <td>0.422</td>
          </tr>
          <tr>
            <td>Hemicellulose </td>
            <td>49</td>
            <td>11.80</td>
            <td>195.30</td>
            <td>115.30</td>
            <td>42.14</td>
            <td>90.00</td>
            <td>120.50</td>
            <td>134.10</td>
            <td>39.00</td>
            <td>1.18</td>
            <td>0.423</td>
          </tr>
          <tr>
            <td>NFC </td>
            <td>49</td>
            <td>23.10</td>
            <td>403.30</td>
            <td>231.10</td>
            <td>95.51</td>
            <td>172.80</td>
            <td>216.70</td>
            <td>315.20</td>
            <td>142.40</td>
            <td>1.14</td>
            <td>0.418</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <table>
        <caption>
          Table 3. Standard error of laboratory reference data and its relationship with SD and mean of the 13 alfalfa forage proficiency testing (PT)
          samples dispatched by National Forage Testing Association (NFTA) during 2014 to 2016 certification years
        </caption>
        <thead>
          <tr>
            <th>
              Constituent
              {' '}
              <span>
                (g kg
                <sup>-1</sup>
                )
              </span>
            </th>
            <th>Number of samples</th>
            <th>Mean</th>
            <th>SD</th>
            <th>
              CV
              <sub>AS</sub>
            </th>
            <th>SEL</th>
            <th>
              CV
              <sub>AR</sub>
            </th>
            <th>SD/SEL ratio</th>
            <th>Maximum allowed SEL for passing the PT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dry-matter</td>
            <td>13</td>
            <td>930.1</td>
            <td>8.39</td>
            <td>0.90</td>
            <td>4.92</td>
            <td>0.53</td>
            <td>1.71</td>
            <td>14.76</td>
          </tr>
          <tr>
            <td>Total N</td>
            <td>13</td>
            <td>28.06</td>
            <td>2.40</td>
            <td>8.55</td>
            <td>0.73</td>
            <td>2.60</td>
            <td>3.29</td>
            <td>2.19</td>
          </tr>
          <tr>
            <td>Crude protein</td>
            <td>13</td>
            <td>175.4</td>
            <td>14.99</td>
            <td>8.55</td>
            <td>4.56</td>
            <td>2.60</td>
            <td>3.29</td>
            <td>13.68</td>
          </tr>
          <tr>
            <td>ADF</td>
            <td>13</td>
            <td>325.3</td>
            <td>40.81</td>
            <td>12.55</td>
            <td>7.69</td>
            <td>2.36</td>
            <td>5.31</td>
            <td>23.07</td>
          </tr>
          <tr>
            <td>NDF</td>
            <td>13</td>
            <td>399.3</td>
            <td>46.13</td>
            <td>11.55</td>
            <td>9.16</td>
            <td>2.29</td>
            <td>5.04</td>
            <td>27.48</td>
          </tr>
        </tbody>
      </table>

      <hr />
      <table>
        <caption>
          Table 4. Calibration model development statistics obtained using MPLS and scatter correction (2,4,4,1 SNVD)
          for the NIRS prediction of the 11 constituents of winter pea
        </caption>
        <thead>
          <tr>
            <th rowSpan="2">
              Constituent
              {' '}
              <span>
                (g kg
                <sup>-1</sup>
                )
              </span>
            </th>

            <th rowSpan="2">N</th>
            <th rowSpan="2">Terms</th>
            <th rowSpan="2">SD</th>
            <th rowSpan="2">IQ</th>
            <th colSpan="2">Calibration</th>
            <th colSpan="2">Cross-validation</th>
            <th aria-hidden="true" />
            <th aria-hidden="true" />
          </tr>
          <tr>
            <th>SEC</th>
            <th>R2</th>
            <th>SECV</th>
            <th>1 - VR</th>
            <th>RSCD</th>
            <th>RSCIQ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Moisture</td>
            <td>84</td>
            <td>3</td>
            <td>12.53</td>
            <td>18.95</td>
            <td>3.91</td>
            <td>0.895</td>
            <td>4.25</td>
            <td>0.874</td>
            <td>3.20</td>
            <td>4.85</td>
          </tr>
          <tr>
            <td>Dry-matter</td>
            <td>84</td>
            <td>3</td>
            <td>12.53</td>
            <td>18.95</td>
            <td>3.91</td>
            <td>0.895</td>
            <td>4.25</td>
            <td>0.874</td>
            <td>3.20</td>
            <td>4.85</td>
          </tr>
          <tr>
            <td>Total N</td>
            <td>97</td>
            <td>5</td>
            <td>5.81</td>
            <td>7.50</td>
            <td>1.81</td>
            <td>0.903</td>
            <td>2.16</td>
            <td>0.860</td>
            <td>3.21</td>
            <td>4.10</td>
          </tr>
          <tr>
            <td>Crude protein</td>
            <td>97</td>
            <td>5</td>
            <td>36.32</td>
            <td>46.90</td>
            <td>11.30</td>
            <td>0.903</td>
            <td>13.50</td>
            <td>0.860</td>
            <td>3.21</td>
            <td>4.15</td>
          </tr>
          <tr>
            <td>ADF</td>
            <td>92</td>
            <td>7</td>
            <td>72.02</td>
            <td>117.35</td>
            <td>16.10</td>
            <td>0.950</td>
            <td>23.10</td>
            <td>0.898</td>
            <td>4.47</td>
            <td>7.29</td>
          </tr>
          <tr>
            <td>NDF</td>
            <td>87</td>
            <td>8</td>
            <td>83.33</td>
            <td>130.05</td>
            <td>15.40</td>
            <td>0.945</td>
            <td>25.10</td>
            <td>0.891</td>
            <td>4.52</td>
            <td>8.49</td>
          </tr>
          <tr>
            <td>AD-lignin</td>
            <td>88</td>
            <td>7</td>
            <td>18.95</td>
            <td>25.78</td>
            <td>6.25</td>
            <td>0.875</td>
            <td>7.30</td>
            <td>0.774</td>
            <td>3.03</td>
            <td>4.12</td>
          </tr>
          <tr>
            <td>Ash</td>
            <td>86</td>
            <td>6</td>
            <td>27.48</td>
            <td>38.25</td>
            <td>9.70</td>
            <td>0.874</td>
            <td>11.30</td>
            <td>0.807</td>
            <td>3.38</td>
            <td>5.07</td>
          </tr>
          <tr>
            <td>Cellulose</td>
            <td>82</td>
            <td>10</td>
            <td>60.31</td>
            <td>96.10</td>
            <td>9.22</td>
            <td>0.976</td>
            <td>16.80</td>
            <td>0.921</td>
            <td>6.54</td>
            <td>10.42</td>
          </tr>
          <tr>
            <td>Hemicellulose</td>
            <td>80</td>
            <td>7</td>
            <td>30.97</td>
            <td>34.70</td>
            <td>6.10</td>
            <td>0.894</td>
            <td>8.20</td>
            <td>0.499</td>
            <td>3.62</td>
            <td>4.19</td>
          </tr>
          <tr>
            <td>NFC</td>
            <td>88</td>
            <td>8</td>
            <td>88.13</td>
            <td>116.40</td>
            <td>18.00</td>
            <td>0.949</td>
            <td>27.50</td>
            <td>0.890</td>
            <td>4.69</td>
            <td>6.16</td>
          </tr>
        </tbody>
      </table>

      <hr />
      <table>
        <caption>
          Table 5. Monitoring (external validation) statistics for the NIR spectroscopic prediction equations
          developed with 2,4,4,1 math treatment for 11 constituents of winter pea
        </caption>
        <thead>
          <tr>
            <th>
              Constituent
              {' '}
              <span>
                (g kg
                <sup>-1</sup>
                )
              </span>
            </th>

            <th>N</th>
            <th>SD</th>
            <th>IQ</th>
            <th>Bias</th>
            <th>Bias (limit)</th>
            <th>SEPF</th>
            <th>SEP</th>
            <th>SEPc (limit)</th>
            <th>R2</th>
            <th>Slope</th>
            <th>Intercept</th>
            <th>RPD</th>
            <th>RPIQ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Moisture</td>
            <td>45</td>
            <td>12.00</td>
            <td>12.10</td>
            <td>0.380</td>
            <td>2.55</td>
            <td>3.55</td>
            <td>3.57</td>
            <td>5.53</td>
            <td>0.913</td>
            <td>0.962</td>
            <td>2.21</td>
            <td>3.38</td>
            <td>3.41</td>
          </tr>
          <tr>
            <td>Dry-matter</td>
            <td>45</td>
            <td>12.00</td>
            <td>12.10</td>
            <td>-0.380</td>
            <td>2.55</td>
            <td>3.55</td>
            <td>3.57</td>
            <td>5.53</td>
            <td>0.913</td>
            <td>0.962</td>
            <td>48.59</td>
            <td>3.38</td>
            <td>3.41</td>
          </tr>
          <tr>
            <td>Total N</td>
            <td>49</td>
            <td>5.42</td>
            <td>5.90</td>
            <td>-0.200</td>
            <td>2.03</td>
            <td>2.81</td>
            <td>2.87</td>
            <td>3.50</td>
            <td>0.876</td>
            <td>0.994</td>
            <td>0.410</td>
            <td>2.68</td>
            <td>2.92</td>
          </tr>
          <tr>
            <td>Crude protein</td>
            <td>49</td>
            <td>33.85</td>
            <td>36.90</td>
            <td>-1.560</td>
            <td>8.11</td>
            <td>12.63</td>
            <td>12.66</td>
            <td>17.56</td>
            <td>0.876</td>
            <td>0.994</td>
            <td>2.70</td>
            <td>2.68</td>
            <td>2.92</td>
          </tr>
          <tr>
            <td>ADF</td>
            <td>48</td>
            <td>81.00</td>
            <td>132.80</td>
            <td>3.41</td>
            <td>13.84</td>
            <td>22.83</td>
            <td>22.81</td>
            <td>29.98</td>
            <td>0.921</td>
            <td>1.017</td>
            <td>3.30</td>
            <td>3.55</td>
            <td>5.82</td>
          </tr>
          <tr>
            <td>NDF</td>
            <td>49</td>
            <td>93.16</td>
            <td>145.37</td>
            <td>-0.970</td>
            <td>16.84</td>
            <td>23.06</td>
            <td>23.10</td>
            <td>29.98</td>
            <td>0.948</td>
            <td>1.080</td>
            <td>3.43</td>
            <td>3.73</td>
            <td>6.08</td>
          </tr>
          <tr>
            <td>AD-lignin</td>
            <td>42</td>
            <td>17.42</td>
            <td>23.30</td>
            <td>-0.480</td>
            <td>5.02</td>
            <td>7.56</td>
            <td>7.60</td>
            <td>10.88</td>
            <td>0.825</td>
            <td>0.940</td>
            <td>4.97</td>
            <td>2.30</td>
            <td>3.15</td>
          </tr>
          <tr>
            <td>Ash</td>
            <td>49</td>
            <td>22.97</td>
            <td>33.15</td>
            <td>0.80</td>
            <td>2.45</td>
            <td>8.42</td>
            <td>8.36</td>
            <td>10.23</td>
            <td>0.832</td>
            <td>1.090</td>
            <td>3.62</td>
            <td>3.52</td>
            <td>4.68</td>
          </tr>
          <tr>
            <td>Cellulose</td>
            <td>49</td>
            <td>69.63</td>
            <td>123.23</td>
            <td>7.60</td>
            <td>13.94</td>
            <td>22.11</td>
            <td>21.02</td>
            <td>30.20</td>
            <td>0.910</td>
            <td>1.032</td>
            <td>6.54</td>
            <td>3.14</td>
            <td>5.52</td>
          </tr>
          <tr>
            <td>Hemicellulose</td>
            <td>42</td>
            <td>34.71</td>
            <td>30.55</td>
            <td>-2.76</td>
            <td>13.86</td>
            <td>14.08</td>
            <td>13.98</td>
            <td>26.68</td>
            <td>0.840</td>
            <td>0.952</td>
            <td>16.68</td>
            <td>3.47</td>
            <td>3.83</td>
          </tr>
          <tr>
            <td>NFC</td>
            <td>47</td>
            <td>96.40</td>
            <td>137.6</td>
            <td>0.180</td>
            <td>16.52</td>
            <td>27.47</td>
            <td>27.77</td>
            <td>35.80</td>
            <td>0.918</td>
            <td>1.029</td>
            <td>25.13</td>
            <td>3.51</td>
            <td>5.01</td>
          </tr>
        </tbody>
      </table>

      <hr />
      <table>
        <caption>
          Table 6. Monitoring (external validation) statistics for the NIR spectroscopic
          &apos;general mixed legume prediction equation: 16mh50-2-eqa&apos;
          obtained from NIRS forage and feed testing consortium (https://www.nirsconsortium.org/) for six primary constituents of winter pea samples
        </caption>
        <thead>
          <tr>
            <th>
              Constituent
              {' '}
              <span>
                (g kg
                <sup>-1</sup>
                )
              </span>
            </th>
            <th>N</th>
            <th>SD</th>
            <th>IQ</th>
            <th>Bias</th>
            <th>Bias (limit)</th>
            <th>SEPF</th>
            <th>SEP</th>
            <th>SEPc (limit)</th>
            <th>R2</th>
            <th>Slope</th>
            <th>Intercept</th>
            <th>RPD</th>
            <th>RPIQ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dry-matter</td>
            <td>45</td>
            <td>12.00</td>
            <td>12.10</td>
            <td>19.50</td>
            <td>18.70</td>
            <td>7.200</td>
            <td>7.010</td>
            <td>4.040</td>
            <td>0.774</td>
            <td>1.075</td>
            <td>73.33</td>
            <td>1.67</td>
            <td>1.68</td>
          </tr>
          <tr>
            <td>Crude protein</td>
            <td>49</td>
            <td>33.85</td>
            <td>36.90</td>
            <td>11.75</td>
            <td>5.280</td>
            <td>24.10</td>
            <td>21.29</td>
            <td>11.44</td>
            <td>0.606</td>
            <td>0.573</td>
            <td>62.40</td>
            <td>1.40</td>
            <td>1.53</td>
          </tr>
          <tr>
            <td>ADF</td>
            <td>48</td>
            <td>81.00</td>
            <td>132.80</td>
            <td>-21.38</td>
            <td>11.32</td>
            <td>43.70</td>
            <td>38.53</td>
            <td>24.52</td>
            <td>0.770</td>
            <td>0.787</td>
            <td>97.82</td>
            <td>1.85</td>
            <td>3.04</td>
          </tr>
          <tr>
            <td>NDF</td>
            <td>49</td>
            <td>93.16</td>
            <td>145.30</td>
            <td>-58.72</td>
            <td>13.98</td>
            <td>66.76</td>
            <td>62.13</td>
            <td>30.29</td>
            <td>0.883</td>
            <td>0.922</td>
            <td>56.06</td>
            <td>2.26</td>
            <td>4.73</td>
          </tr>
          <tr>
            <td>AD-lignin</td>
            <td>42</td>
            <td>17.42</td>
            <td>23.80</td>
            <td>-9.13</td>
            <td>6.470</td>
            <td>16.14</td>
            <td>13.45</td>
            <td>10.43</td>
            <td>0.552</td>
            <td>0.658</td>
            <td>33.49</td>
            <td>1.08</td>
            <td>1.43</td>
          </tr>
          <tr>
            <td>Ash</td>
            <td>42</td>
            <td>26.62</td>
            <td>33.08</td>
            <td>36.62</td>
            <td>1.300</td>
            <td>47.40</td>
            <td>30.45</td>
            <td>28.10</td>
            <td>0.088</td>
            <td>0.214</td>
            <td>39.94</td>
            <td>0.56</td>
            <td>0.700</td>
          </tr>
        </tbody>
      </table>

      <hr />
      <table>
        <caption>
          Table 7. Statistics of final calibration model development obtained using MPLS and scatter correction (2,4,4,1 SNVD)
          for the NIRS prediction of the 11 constituents of winter pea
        </caption>
        <thead>
          <tr>
            <th rowSpan="2">
              Constituent
              {' '}
              <span>
                (g kg
                <sup>-1</sup>
                )
              </span>
            </th>

            <th rowSpan="2">N</th>
            <th rowSpan="2">Terms</th>
            <th rowSpan="2">SD</th>
            <th rowSpan="2">IQ</th>
            <th colSpan="2">Calibration</th>
            <th colSpan="2">Cross-validation</th>
            <th aria-hidden="true" />
            <th aria-hidden="true" />
          </tr>
          <tr>
            <th>SEC</th>
            <th>R2</th>
            <th>SECV</th>
            <th>1 - VR</th>
            <th>RSCD</th>
            <th>RSCIQ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Moisture</td>
            <td>128</td>
            <td>4</td>
            <td>12.38</td>
            <td>14.73</td>
            <td>3.30</td>
            <td>0.929</td>
            <td>3.66</td>
            <td>0.913</td>
            <td>3.76</td>
            <td>4.47</td>
          </tr>
          <tr>
            <td>Dry-matter</td>
            <td>128</td>
            <td>4</td>
            <td>12.38</td>
            <td>14.73</td>
            <td>3.30</td>
            <td>0.929</td>
            <td>3.66</td>
            <td>0.913</td>
            <td>3.76</td>
            <td>4.47</td>
          </tr>
          <tr>
            <td>Total N</td>
            <td>145</td>
            <td>6</td>
            <td>5.72</td>
            <td>7.20</td>
            <td>1.94</td>
            <td>0.904</td>
            <td>2.05</td>
            <td>0.871</td>
            <td>3.52</td>
            <td>4.05</td>
          </tr>
          <tr>
            <td>Crude protein</td>
            <td>145</td>
            <td>6</td>
            <td>35.77</td>
            <td>45.00</td>
            <td>11.11</td>
            <td>0.904</td>
            <td>12.85</td>
            <td>0.871</td>
            <td>3.52</td>
            <td>4.05</td>
          </tr>
          <tr>
            <td>ADF</td>
            <td>142</td>
            <td>7</td>
            <td>75.74</td>
            <td>124.2</td>
            <td>16.80</td>
            <td>0.951</td>
            <td>20.85</td>
            <td>0.924</td>
            <td>4.51</td>
            <td>7.39</td>
          </tr>
          <tr>
            <td>NDF</td>
            <td>145</td>
            <td>6</td>
            <td>86.32</td>
            <td>131.0</td>
            <td>19.71</td>
            <td>0.946</td>
            <td>24.86</td>
            <td>0.936</td>
            <td>4.37</td>
            <td>6.57</td>
          </tr>
          <tr>
            <td>AD-lignin</td>
            <td>145</td>
            <td>7</td>
            <td>19.26</td>
            <td>26.80</td>
            <td>6.34</td>
            <td>0.892</td>
            <td>7.54</td>
            <td>0.847</td>
            <td>3.04</td>
            <td>4.23</td>
          </tr>
          <tr>
            <td>Ash</td>
            <td>141</td>
            <td>6</td>
            <td>27.60</td>
            <td>38.25</td>
            <td>9.70</td>
            <td>0.874</td>
            <td>11.30</td>
            <td>0.807</td>
            <td>3.38</td>
            <td>5.07</td>
          </tr>
          <tr>
            <td>Cellulose</td>
            <td>129</td>
            <td>9</td>
            <td>63.51</td>
            <td>93.45</td>
            <td>12.00</td>
            <td>0.923</td>
            <td>21.59</td>
            <td>0.884</td>
            <td>4.26</td>
            <td>6.28</td>
          </tr>
          <tr>
            <td>Hemicellulose</td>
            <td>129</td>
            <td>6</td>
            <td>30.98</td>
            <td>36.25</td>
            <td>13.09</td>
            <td>0.809</td>
            <td>18.07</td>
            <td>0.673</td>
            <td>2.29</td>
            <td>2.69</td>
          </tr>
          <tr>
            <td>NFC</td>
            <td>141</td>
            <td>6</td>
            <td>91.85</td>
            <td>129.5</td>
            <td>25.39</td>
            <td>0.924</td>
            <td>28.99</td>
            <td>0.900</td>
            <td>3.62</td>
            <td>5.10</td>
          </tr>
        </tbody>
      </table> */}

    </details>
  </div>
);

// const GS = () => {
//   console.log(123);
//   return (
//     <table>
//       <thead>
//         <tr>
//           {data[0].map((c) => <th key={c}>{c}</th>)}
//         </tr>
//       </thead>
//       <tbody>
//         {
//           data.slice(1).map((row, i) => (
//             <tr key={i}>
//               {row.map((c, j) => <td key={j}>{c}</td>)}
//               <td>{growthStage(row[5])}</td>
//             </tr>
//           ))
//         }
//       </tbody>
//     </table>
//   );
// };

const distinct = (parm) => (
  [...new Set(data.map((row) => row[parm] || ''))].sort((a, b) => (
    parseInt(a.replace(/Feekes /, ''), 10) - parseInt(b.replace(/Feekes /, ''), 10)
    || a.localeCompare(b)
  ))
); // distinct

const List = (parm) => {
  const dispatch = useDispatch();
  const filters = useSelector(get.filters);
  return (
    <div id="List">
      <button
        type="button"
        className="clear"
        onClick={() => {
          dispatch(set.filters((f) => (
            {
              ...f,
              [parm]: [],
            }
          )));
        }}
      >
        x
      </button>

      <button
        type="button"
        className="all"
        onClick={() => {
          dispatch(set.filters((f) => (
            {
              ...f,
              [parm]: distinct(parm),
            }
          )));
        }}
      >
        all
      </button>

      {distinct(parm).map((s) => {
        const inc = filters[parm]?.includes(s);
        return (
          <button
            type="button"
            key={s}
            className={inc ? 'selected' : ''}
            data-value={s}
            data-class={parm}
            onClick={(e) => {
              const f = JSON.parse(JSON.stringify(filters));
              if (e.ctrlKey) {
                f[parm] = [s];
              } else if (inc) {
                f[parm] = f[parm].filter((s2) => s2 !== s);
              } else {
                f[parm].push(s);
              }
              dispatch(set.filters(f));
            }}
          >
            {s || 'Unknown'}
          </button>
        );
      })}
    </div>
  );
};

const Filters = () => {
  const filters = useSelector(get.filters);

  const d = data
    .filter((row) => (
      ['Source', 'State', 'Family', 'Species', 'Growth Stage', 'Category']
        .every((parm) => filters[parm]?.includes(row[parm]))
    ));

  return (
    <div>
      <table id="Filters">
        <caption>
          Ctrl+Click a button to highlight only that selection.
          <button
            type="button"
            style={{ float: 'right' }}
            onClick={() => {
              const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(d, null, 2),
              )}`;
              const dlAnchorElem = document.createElement('a');
              dlAnchorElem.setAttribute('href', dataStr);
              dlAnchorElem.setAttribute('download', 'filters.json');
              dlAnchorElem.click();
            }}
          >
            Export JSON
          </button>
        </caption>
        <tbody>
          <tr>
            <td>Source</td>
            <td>{List('Source')}</td>
          </tr>
          <tr>
            <td>State</td>
            <td>{List('State')}</td>
          </tr>
          {/* <tr>
            <td>Site</td>
            <td>{List('Site')}</td>
          </tr> */}
          <tr>
            <td>Family</td>
            <td>{List('Family')}</td>
          </tr>
          <tr>
            <td>Species</td>
            <td>{List('Species')}</td>
          </tr>
          <tr>
            <td>Growth Stage</td>
            <td>{List('Growth Stage')}</td>
          </tr>
          <tr>
            <td>Category</td>
            <td>{List('Category')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}; // Filters

const dec = {
  latitude: 4,
  longitude: 4,
  Zadoks: 0,
  Yield: 2,
  Fat: 2,
  CP: 2,
  Ash: 2,
  ADF: 2,
  aNDF: 2,
  NDF: 2,
  NFC: 2,
  DM: 2,
  carb: 2,
  cellulose: 2,
  lignin: 2,
  NDFD48: 2,
  RFQ: 0,
};

const fix = (row, c) => (
  row[c] && c in dec ? (+row[c]).toFixed(dec[c]) : row[c]
);

const Stats = ({ stat, parm, dataValues }) => {
  if (parm === 'Source') return stat;

  if (dataValues.length === 0) return '';

  if (!/latitude|longitude/.test(parm) && parm in dec) {
    if (stat === 'range') return Math[stat](dataValues);
    if (stat === 'N') return dataValues.length;
    return Math[stat](dataValues).toFixed(dec[parm]);
  }

  return '';
};

const Summary = () => {
  const filters = useSelector(get.filters);
  const dispatch = useDispatch();

  const d = data
    .filter((row) => (
      ['Source', 'State', 'Family', 'Species', 'Growth Stage', 'Category']
        .every((parm) => filters[parm]?.includes(row[parm]))
    ));

  useEffect(() => {
    dispatch(set.ndata(d));
  }, [d]);

  setTimeout(() => {
    ['Source', 'State', 'Family', 'Species', 'Growth Stage', 'Category'].forEach((cat) => {
      distinct(cat).forEach((s) => {
        if (!d.some((row) => row[cat] === s)) {
          document.querySelector(`[data-value="${s}"]`)?.classList.add('unused');
        } else {
          document.querySelector(`[data-value="${s}"]`)?.classList.remove('unused');
        }
      });
    });
    dispatch(set.updated((updated) => updated + 1));
  }, 10);

  const dataValues = (parm) => (
    d
      .filter((row) => row[parm].trim() > '')
      .map((row) => +row[parm])
  );

  const sort = (e) => {
    const col = e.target.cellIndex;
    const tbody = document.querySelector('#Summary tbody');
    const rows = [...tbody.querySelectorAll('tr')];

    rows.sort((a, b) => {
      const va = a.cells[col].textContent;
      const vb = b.cells[col].textContent;
      return (va - vb) || va.localeCompare(vb);
    });
    rows.forEach((r) => tbody.appendChild(r));
  };

  return (
    <table id="Summary">
      <thead>
        <tr>
          {Object.keys(data[0]).map((c) => <th onClick={sort} key={c}>{c}</th>)}
        </tr>
        {
          ['N', 'range', 'Min', 'Q1', 'Q2', 'Q3', 'Max', 'mean', 'std'].map((stat) => (
            <tr key={stat} className="stats">
              {Object.keys(data[0]).map((parm) => (
                <td key={parm}>
                  <Stats stat={stat} parm={parm} dataValues={dataValues(parm)} />
                </td>
              ))}
            </tr>
          ))
        }
      </thead>
      <tbody>
        {
          d.map((row, i) => (
            <tr key={i}>
              {Object.keys(data[0]).map((c, j) => <td key={j}>{fix(row, c)}</td>)}
            </tr>
          ))
        }
      </tbody>
    </table>
  );
};

const NIR = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const f = {};
    Object.keys(data[0]).forEach((parm) => {
      f[parm] = distinct(parm);
    });

    dispatch(set.filters(f));
  }, []);

  return (
    <div id="NIR">
      <Documents />
      <BoxPlotChart />
      {/* <WinterPea />
      <hr /> */}
      <Filters />
      <Summary />
    </div>
  );
}; // NIR

export default NIR;
