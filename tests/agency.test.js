import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addClient,
  createAgency,
  createCampaign,
  getAgencySummary
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
