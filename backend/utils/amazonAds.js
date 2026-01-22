const MARKETPLACE_CONFIG = {
  NA: {
    region: 'na',
    authEndpoint: 'https://www.amazon.com/ap/oa',
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    adsEndpoint: 'https://advertising-api.amazon.com'
  },
  EU: {
    region: 'eu',
    authEndpoint: 'https://eu.account.amazon.com/ap/oa',
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    adsEndpoint: 'https://advertising-api-eu.amazon.com'
  },
  FE: {
    region: 'fe',
    authEndpoint: 'https://apac.account.amazon.com/ap/oa',
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    adsEndpoint: 'https://advertising-api-fe.amazon.com'
  }
};

const getAuthEndpoint = (marketplace) => {
  return MARKETPLACE_CONFIG[marketplace]?.authEndpoint;
};

const getTokenEndpoint = (marketplace) => {
  return MARKETPLACE_CONFIG[marketplace]?.tokenEndpoint;
};

const getAdsEndpoint = (marketplace) => {
  return MARKETPLACE_CONFIG[marketplace]?.adsEndpoint;
};

module.exports = {
  MARKETPLACE_CONFIG,
  getAuthEndpoint,
  getTokenEndpoint,
  getAdsEndpoint
};