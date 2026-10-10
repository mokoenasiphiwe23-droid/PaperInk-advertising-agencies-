import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addClient,
  createAgency,
  createCampaign,
  exportAgencyData,
  exportCampaignsCsv,
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
