import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addClient,
  createAgency,
  createCampaign,
  exportAgencyData,
  exportCampaignsCsv,
  getCampaignPerformance,
  getAgencySummary,
  recordCampaignPerformance
} from '../src/agency.js';

test('creates clients, campaigns, and an agency summary', () => {
  const agency = createAgency({ name: 'PaperInk', id: 'agency-1' });
  const client = addClient(agency, {
    name: 'Acme Foods',
    industry: 'Food and beverage',
    id: 'client-1'
  });

  createCampaign(agency, {
    name: 'Summer launch',
    clientId: client.id,
    budget: 12500,
    status: 'active',
    id: 'campaign-1'
  });

  assert.deepEqual(getAgencySummary(agency), {
    agencyId: 'agency-1',
    clientCount: 1,
    campaignCount: 1,
    totalBudget: 12500,
    campaignsByStatus: { active: 1 }
  });
});

test('rejects duplicate clients and campaigns for unknown clients', () => {
  const agency = createAgency({ name: 'PaperInk', id: 'agency-2' });
  addClient(agency, { name: 'Acme Foods', id: 'client-2' });

  assert.throws(
    () => addClient(agency, { name: 'acme foods', id: 'client-3' }),
    /client already exists/
  );
  assert.throws(
    () => createCampaign(agency, { name: 'Invalid', clientId: 'missing' }),
    /client not found/
  );
});

test('calculates campaign performance metrics', () => {
  const agency = createAgency({ name: 'PaperInk', id: 'agency-3' });
  const client = addClient(agency, { name: 'Acme Foods', id: 'client-3' });
  const campaign = createCampaign(agency, {
    name: 'Performance campaign',
    clientId: client.id,
    budget: 20000,
    id: 'campaign-3'
  });

  const performance = recordCampaignPerformance(agency, campaign.id, {
    impressions: 10000,
    clicks: 500,
    conversions: 50,
    spend: 2500,
    revenue: 10000
  });

  assert.equal(performance.clickThroughRate, 0.05);
  assert.equal(performance.conversionRate, 0.1);
  assert.equal(performance.costPerClick, 5);
  assert.equal(performance.costPerAcquisition, 50);
  assert.equal(performance.returnOnAdSpend, 4);
});

test('exports agency data as JSON and campaign metrics as CSV', () => {
  const agency = createAgency({ name: 'PaperInk', id: 'agency-4' });
  const client = addClient(agency, { name: 'Acme Foods', id: 'client-4' });
  const campaign = createCampaign(agency, {
    name: 'Export campaign',
    clientId: client.id,
    id: 'campaign-4'
  });
  recordCampaignPerformance(agency, campaign.id, {
    impressions: 100,
    clicks: 10,
    conversions: 2,
    spend: 100,
    revenue: 500
  });

  const json = JSON.parse(exportAgencyData(agency));
  const csv = exportCampaignsCsv(agency);
  assert.equal(json.name, 'PaperInk');
  assert.match(csv, /campaignId,campaignName/);
  assert.match(csv, /campaign-4,Export campaign/);
  assert.match(csv, /5/);
});

test('returns zero for undefined-rate analytics without dividing by zero', () => {
  const agency = createAgency({ name: 'PaperInk', id: 'agency-5' });
  const client = addClient(agency, { name: 'Zero Metrics Co', id: 'client-5' });
  const campaign = createCampaign(agency, {
    name: 'Zero metrics campaign',
    clientId: client.id,
    id: 'campaign-5'
  });

  const performance = getCampaignPerformance(agency, campaign.id);

  assert.equal(performance.clickThroughRate, 0);
  assert.equal(performance.conversionRate, 0);
  assert.equal(performance.costPerClick, 0);
  assert.equal(performance.costPerAcquisition, 0);
  assert.equal(performance.returnOnAdSpend, 0);
});

test('rejects impossible campaign performance metrics', () => {
  const agency = createAgency({ name: 'PaperInk', id: 'agency-6' });
  const client = addClient(agency, { name: 'Validation Co', id: 'client-6' });
  const campaign = createCampaign(agency, {
    name: 'Validation campaign',
    clientId: client.id,
    id: 'campaign-6'
  });

  assert.throws(
    () => recordCampaignPerformance(agency, campaign.id, {
      impressions: 10,
      clicks: 11
    }),
    /clicks cannot exceed impressions/
  );
  assert.throws(
    () => recordCampaignPerformance(agency, campaign.id, {
      impressions: 10,
      clicks: 5,
      conversions: 6
    }),
    /conversions cannot exceed clicks/
  );
  assert.throws(
    () => recordCampaignPerformance(agency, campaign.id, { spend: -1 }),
    /spend must be a non-negative number/
  );
});

test('escapes commas and quotes in CSV campaign exports', () => {
  const agency = createAgency({ name: 'PaperInk', id: 'agency-7' });
  const client = addClient(agency, { name: 'Comma, & Co', id: 'client-7' });
  createCampaign(agency, {
    name: 'Launch "Special"',
    clientId: client.id,
    id: 'campaign-7'
  });

  const csv = exportCampaignsCsv(agency);

  assert.match(csv, /campaign-7,"Launch ""Special""",client-7/);
});
