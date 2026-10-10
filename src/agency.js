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


export function recordCampaignPerformance(
  agency,
  campaignId,
  { impressions = 0, clicks = 0, conversions = 0, spend = 0, revenue = 0 }
) {
  requireAgency(agency);
  const campaign = agency.campaigns.find((candidate) => candidate.id === campaignId);
  if (!campaign) {
    throw new Error(`campaign not found: ${campaignId}`);
  }

  const metrics = {
    impressions: requireNonNegativeNumber(impressions, 'impressions'),
    clicks: requireNonNegativeNumber(clicks, 'clicks'),
    conversions: requireNonNegativeNumber(conversions, 'conversions'),
    spend: requireNonNegativeNumber(spend, 'spend'),
    revenue: requireNonNegativeNumber(revenue, 'revenue')
  };

  if (metrics.clicks > metrics.impressions) {
    throw new RangeError('clicks cannot exceed impressions');
  }
  if (metrics.conversions > metrics.clicks) {
    throw new RangeError('conversions cannot exceed clicks');
  }

  campaign.performance = metrics;
  return getCampaignPerformance(agency, campaignId);
}

export function getCampaignPerformance(agency, campaignId) {
  requireAgency(agency);
  const campaign = agency.campaigns.find((candidate) => candidate.id === campaignId);
  if (!campaign) {
    throw new Error(`campaign not found: ${campaignId}`);
  }

  const performance = campaign.performance ?? {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    revenue: 0
  };
  const { impressions, clicks, conversions, spend, revenue } = performance;

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    ...performance,
    clickThroughRate: impressions === 0 ? 0 : clicks / impressions,
    conversionRate: clicks === 0 ? 0 : conversions / clicks,
    costPerClick: clicks === 0 ? 0 : spend / clicks,
    costPerAcquisition: conversions === 0 ? 0 : spend / conversions,
    returnOnAdSpend: spend === 0 ? 0 : revenue / spend
  };
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function exportAgencyData(agency, { pretty = true } = {}) {
  requireAgency(agency);
  return JSON.stringify(agency, null, pretty ? 2 : 0);
}

export function exportCampaignsCsv(agency) {
  requireAgency(agency);
  const headers = [
    'campaignId',
    'campaignName',
    'clientId',
    'status',
    'budget',
    'impressions',
    'clicks',
    'conversions',
    'spend',
    'revenue',
    'clickThroughRate',
    'conversionRate',
    'returnOnAdSpend'
  ];
  const rows = agency.campaigns.map((campaign) => {
    const metrics = getCampaignPerformance(agency, campaign.id);
    return [
      campaign.id,
      campaign.name,
      campaign.clientId,
      campaign.status,
      campaign.budget,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.spend,
      metrics.revenue,
      metrics.clickThroughRate,
      metrics.conversionRate,
      metrics.returnOnAdSpend
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}
