/**
 * Static mapping of ticker symbols to full company / fund names.
 * Covers common US equities, sector ETFs, and broad-market funds.
 */
const COMPANY_NAMES: Record<string, string> = {
  // Broad market ETFs
  SPY: 'SPDR S&P 500 ETF Trust',
  QQQ: 'Invesco QQQ Trust (NASDAQ-100)',
  IWM: 'iShares Russell 2000 ETF',
  DIA: 'SPDR Dow Jones Industrial Average ETF',
  VTI: 'Vanguard Total Stock Market ETF',
  VOO: 'Vanguard S&P 500 ETF',
  SCHB: 'Schwab US Broad Market ETF',

  // Sector ETFs (SPDR)
  XLE: 'Energy Select Sector SPDR Fund',
  XLF: 'Financial Select Sector SPDR Fund',
  XLK: 'Technology Select Sector SPDR Fund',
  XLU: 'Utilities Select Sector SPDR Fund',
  XLV: 'Health Care Select Sector SPDR Fund',
  XLI: 'Industrial Select Sector SPDR Fund',
  XLC: 'Communication Services Select Sector SPDR Fund',
  XLY: 'Consumer Discretionary Select Sector SPDR Fund',
  XLP: 'Consumer Staples Select Sector SPDR Fund',
  XLRE: 'Real Estate Select Sector SPDR Fund',
  XLB: 'Materials Select Sector SPDR Fund',

  // Technology
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  NVDA: 'NVIDIA Corporation',
  GOOGL: 'Alphabet Inc. (Class A)',
  GOOG: 'Alphabet Inc. (Class C)',
  META: 'Meta Platforms, Inc.',
  AMZN: 'Amazon.com, Inc.',
  TSLA: 'Tesla, Inc.',
  AVGO: 'Broadcom Inc.',
  ORCL: 'Oracle Corporation',
  CRM: 'Salesforce, Inc.',
  ADBE: 'Adobe Inc.',
  CSCO: 'Cisco Systems, Inc.',
  INTC: 'Intel Corporation',
  AMD: 'Advanced Micro Devices, Inc.',
  QCOM: 'QUALCOMM Incorporated',
  TXN: 'Texas Instruments Incorporated',
  NOW: 'ServiceNow, Inc.',
  INTU: 'Intuit Inc.',
  IBM: 'International Business Machines Corporation',
  UBER: 'Uber Technologies, Inc.',
  LYFT: 'Lyft, Inc.',
  SNAP: 'Snap Inc.',
  PINS: 'Pinterest, Inc.',
  SPOT: 'Spotify Technology S.A.',
  RBLX: 'Roblox Corporation',
  COIN: 'Coinbase Global, Inc.',
  HOOD: 'Robinhood Markets, Inc.',
  PLTR: 'Palantir Technologies Inc.',
  AI: 'C3.ai, Inc.',
  PATH: 'UiPath Inc.',
  DDOG: 'Datadog, Inc.',
  NET: 'Cloudflare, Inc.',
  SNOW: 'Snowflake Inc.',
  MDB: 'MongoDB, Inc.',
  CRWD: 'CrowdStrike Holdings, Inc.',
  ZS: 'Zscaler, Inc.',
  OKTA: 'Okta, Inc.',
  TEAM: 'Atlassian Corporation',
  TWLO: 'Twilio Inc.',
  ZM: 'Zoom Video Communications, Inc.',
  DOCU: 'DocuSign, Inc.',
  SHOP: 'Shopify Inc.',
  SQ: 'Block, Inc.',
  PYPL: 'PayPal Holdings, Inc.',
  AFRM: 'Affirm Holdings, Inc.',

  // Financials
  JPM: 'JPMorgan Chase & Co.',
  BAC: 'Bank of America Corporation',
  WFC: 'Wells Fargo & Company',
  GS: 'The Goldman Sachs Group, Inc.',
  MS: 'Morgan Stanley',
  BLK: 'BlackRock, Inc.',
  V: 'Visa Inc.',
  MA: 'Mastercard Incorporated',
  AXP: 'American Express Company',
  C: 'Citigroup Inc.',
  USB: 'U.S. Bancorp',
  PNC: 'PNC Financial Services Group, Inc.',
  SCHW: 'Charles Schwab Corporation',

  // Health Care
  UNH: 'UnitedHealth Group Incorporated',
  JNJ: 'Johnson & Johnson',
  LLY: 'Eli Lilly and Company',
  ABBV: 'AbbVie Inc.',
  MRK: 'Merck & Co., Inc.',
  PFE: 'Pfizer Inc.',
  TMO: 'Thermo Fisher Scientific Inc.',
  ABT: 'Abbott Laboratories',
  DHR: 'Danaher Corporation',
  BMY: 'Bristol-Myers Squibb Company',
  AMGN: 'Amgen Inc.',
  GILD: 'Gilead Sciences, Inc.',
  REGN: 'Regeneron Pharmaceuticals, Inc.',
  MRNA: 'Moderna, Inc.',
  BIIB: 'Biogen Inc.',
  ISRG: 'Intuitive Surgical, Inc.',
  CVS: 'CVS Health Corporation',

  // Energy
  XOM: 'Exxon Mobil Corporation',
  CVX: 'Chevron Corporation',
  COP: 'ConocoPhillips',
  SLB: 'SLB (Schlumberger)',
  EOG: 'EOG Resources, Inc.',
  PSX: 'Phillips 66',
  MPC: 'Marathon Petroleum Corporation',
  OXY: 'Occidental Petroleum Corporation',

  // Consumer
  AMZN_CONSUMER: 'Amazon.com, Inc.',
  WMT: 'Walmart Inc.',
  COST: 'Costco Wholesale Corporation',
  TGT: 'Target Corporation',
  HD: 'The Home Depot, Inc.',
  LOW: 'Lowe\'s Companies, Inc.',
  MCD: 'McDonald\'s Corporation',
  SBUX: 'Starbucks Corporation',
  NKE: 'NIKE, Inc.',
  LULU: 'Lululemon Athletica Inc.',
  TJX: 'The TJX Companies, Inc.',
  PG: 'Procter & Gamble Company',
  KO: 'The Coca-Cola Company',
  PEP: 'PepsiCo, Inc.',
  PM: 'Philip Morris International Inc.',
  MO: 'Altria Group, Inc.',
  CL: 'Colgate-Palmolive Company',

  // Industrials
  RTX: 'RTX Corporation',
  LMT: 'Lockheed Martin Corporation',
  BA: 'The Boeing Company',
  GE: 'GE Aerospace',
  HON: 'Honeywell International Inc.',
  CAT: 'Caterpillar Inc.',
  DE: 'Deere & Company',
  UPS: 'United Parcel Service, Inc.',
  FDX: 'FedEx Corporation',
  CSX: 'CSX Corporation',
  UNP: 'Union Pacific Corporation',

  // Real Estate
  AMT: 'American Tower Corporation',
  PLD: 'Prologis, Inc.',
  EQIX: 'Equinix, Inc.',
  SPG: 'Simon Property Group, Inc.',

  // Utilities
  NEE: 'NextEra Energy, Inc.',
  DUK: 'Duke Energy Corporation',
  SO: 'The Southern Company',
  D: 'Dominion Energy, Inc.',

  // Communication
  T: 'AT&T Inc.',
  VZ: 'Verizon Communications Inc.',
  CMCSA: 'Comcast Corporation',
  NFLX: 'Netflix, Inc.',
  DIS: 'The Walt Disney Company',
  WBD: 'Warner Bros. Discovery, Inc.',
  PARA: 'Paramount Global',

  // Commodities / Precious Metals ETFs
  GLD: 'SPDR Gold Shares',
  SLV: 'iShares Silver Trust',
  USO: 'United States Oil Fund',
  UNG: 'United States Natural Gas Fund',
  DBC: 'Invesco DB Commodity Index Tracking Fund',

  // Fixed Income ETFs
  TLT: 'iShares 20+ Year Treasury Bond ETF',
  IEF: 'iShares 7-10 Year Treasury Bond ETF',
  SHY: 'iShares 1-3 Year Treasury Bond ETF',
  BND: 'Vanguard Total Bond Market ETF',
  AGG: 'iShares Core US Aggregate Bond ETF',
  HYG: 'iShares iBoxx High Yield Corporate Bond ETF',
  LQD: 'iShares iBoxx Investment Grade Corporate Bond ETF',

  // Thematic / Sector-Specific ETFs
  SOXX: 'iShares Semiconductor ETF',
  SMH: 'VanEck Semiconductor ETF',
  BOTZ: 'Global X Robotics & Artificial Intelligence ETF',
  AIQ: 'Global X Artificial Intelligence & Technology ETF',
  IGV: 'iShares Expanded Tech-Software Sector ETF',

  // Leveraged / Inverse ETFs
  TQQQ: 'ProShares UltraPro QQQ (3x Long NASDAQ-100)',
  SQQQ: 'ProShares UltraPro Short QQQ (3x Short NASDAQ-100)',
  UPRO: 'ProShares UltraPro S&P 500 (3x Long S&P 500)',
  SPXU: 'ProShares UltraPro Short S&P 500 (3x Short)',
  SSO: 'ProShares Ultra S&P 500 (2x Long)',
  SDS: 'ProShares UltraShort S&P 500 (2x Short)',

  // Crypto-related
  IBIT: 'iShares Bitcoin Trust ETF',
  FBTC: 'Fidelity Wise Origin Bitcoin Fund',
  GBTC: 'Grayscale Bitcoin Trust',
  MSTR: 'MicroStrategy Incorporated',
}

/**
 * Look up the full company / fund name for a ticker symbol.
 * Returns undefined if the ticker is not in the mapping.
 */
export function getCompanyName(symbol: string): string | undefined {
  return COMPANY_NAMES[symbol.toUpperCase()]
}

export default COMPANY_NAMES
