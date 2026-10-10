# Campaign Performance Analytics and Exports

The core tools in `src/agency.js` provide an in-memory model for agencies, clients, campaigns, performance metrics, and report exports. They use only Node.js built-ins and do not require additional dependencies.

## Import the tools

```js
import {
  addClient,
  createAgency,
  createCampaign,
  exportAgencyData,
  exportCampaignsCsv,
  getCampaignPerformance,
  recordCampaignPerformance
} from './src/agency.js';
```

## Create an agency, client, and campaign

```js
const agency = createAgency({
  name: 'PaperInk',
  currency: 'USD'
});

const client = addClient(agency, {
  name: 'Acme Foods',
  industry: 'Food and beverage'
});

const campaign = createCampaign(agency, {
  name: 'Summer launch',
  clientId: client.id,
  budget: 20000,
  status: 'active'
});
```

### Supported campaign statuses

- `planned`
- `active`
- `paused`
- `completed`

## Record performance metrics

Use `recordCampaignPerformance()` to attach a snapshot of campaign results:

```js
const performance = recordCampaignPerformance(agency, campaign.id, {
  impressions: 10000,
  clicks: 500,
  conversions: 50,
  spend: 2500,
  revenue: 10000
});

console.log(performance);
```

The returned object includes the input metrics plus these calculated values:

| Metric | Calculation |
|---|---|
| `clickThroughRate` | `clicks / impressions` |
| `conversionRate` | `conversions / clicks` |
| `costPerClick` | `spend / clicks` |
| `costPerAcquisition` | `spend / conversions` |
| `returnOnAdSpend` | `revenue / spend` |

When a denominator is zero, the corresponding calculated value is `0` rather than `NaN` or `Infinity`.

The function rejects invalid data, including:

- Negative impressions, clicks, conversions, spend, or revenue
- Clicks greater than impressions
- Conversions greater than clicks
- A campaign ID that does not exist

## Read campaign performance

To retrieve the current metrics later:

```js
const current = getCampaignPerformance(agency, campaign.id);
console.log(`ROAS: ${current.returnOnAdSpend}`);
```

Campaigns without recorded performance return zero-valued metrics.

## Export the complete agency as JSON

`exportAgencyData()` serializes the agency, clients, campaigns, and any recorded performance data:

```js
import { writeFile } from 'node:fs/promises';

const json = exportAgencyData(agency);
await writeFile('agency-export.json', json);
```

For compact JSON suitable for transport:

```js
const compactJson = exportAgencyData(agency, { pretty: false });
```

## Export campaign reporting as CSV

`exportCampaignsCsv()` returns a CSV report with campaign details and calculated performance metrics:

```js
const csv = exportCampaignsCsv(agency);
await writeFile('campaign-report.csv', csv);
```

The CSV columns are:

```text
campaignId,campaignName,clientId,status,budget,impressions,clicks,conversions,spend,revenue,clickThroughRate,conversionRate,returnOnAdSpend
```

Campaign names containing commas, quotes, or newlines are escaped according to CSV conventions.

## Run the tests

From the repository root:

```bash
npm test
```

The test suite covers standard calculations, zero-denominator behavior, invalid metrics, JSON export, and CSV escaping.
