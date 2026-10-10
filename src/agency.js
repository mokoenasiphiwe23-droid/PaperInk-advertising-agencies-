import { randomUUID } from 'node:crypto';

const campaignStatuses = new Set(['planned', 'active', 'paused', 'completed']);

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireNonNegativeNumber(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative number`);
  }
  return value;
}

function requireAgency(agency) {
  if (!agency || !Array.isArray(agency.clients) || !Array.isArray(agency.campaigns)) {
    throw new TypeError('agency must be a valid agency workspace');
  }
}

export function createAgency({ name, currency = 'USD', id = randomUUID() }) {
  return {
    id,
    name: requireText(name, 'name'),
    currency: requireText(currency, 'currency').toUpperCase(),
    clients: [],
    campaigns: []
  };
}

export function addClient(agency, { name, industry = 'General', id = randomUUID() }) {
  requireAgency(agency);
  const clientName = requireText(name, 'client name');
  const clientIndustry = requireText(industry, 'industry');

  if (agency.clients.some((client) => client.name.toLowerCase() === clientName.toLowerCase())) {
    throw new Error(`client already exists: ${clientName}`);
  }

  const client = { id, name: clientName, industry: clientIndustry };
  agency.clients.push(client);
  return client;
}

export function createCampaign(
  agency,
  { name, clientId, budget = 0, status = 'planned', id = randomUUID() }
) {
  requireAgency(agency);
  const campaignName = requireText(name, 'campaign name');
  const client = agency.clients.find((candidate) => candidate.id === clientId);

  if (!client) {
    throw new Error(`client not found: ${clientId}`);
  }
  if (!campaignStatuses.has(status)) {
    throw new RangeError(`status must be one of: ${[...campaignStatuses].join(', ')}`);
  }

  const campaign = {
    id,
    name: campaignName,
    clientId: client.id,
    budget: requireNonNegativeNumber(budget, 'budget'),
    status
  };
  agency.campaigns.push(campaign);
  return campaign;
}

export function getAgencySummary(agency) {
  requireAgency(agency);
  return {
    agencyId: agency.id,
    clientCount: agency.clients.length,
    campaignCount: agency.campaigns.length,
    totalBudget: agency.campaigns.reduce((total, campaign) => total + campaign.budget, 0),
    campaignsByStatus: agency.campaigns.reduce((counts, campaign) => {
      counts[campaign.status] = (counts[campaign.status] ?? 0) + 1;
      return counts;
    }, {})
  };
}
