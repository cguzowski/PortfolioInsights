import { WorkspacePage } from '../models/workspace-page';

export const FEATURE_PAGES: readonly WorkspacePage[] = [
  {
    id: 'portfolio-overview-dashboard',
    route: 'dashboard',
    navLabel: 'Overview',
    navHint: 'Portfolio baseline',
    cards: [
      {
        title: 'Allocation Breakdown',
        context: 'Reveal where capital truly sits so concentration is visible before stress events hit.',
        details: ['By asset', 'By sector', 'By asset class', 'By geography', 'By currency'],
        mvpNote: 'MVP: Render category cards with placeholder percentages and trend arrows.'
      },
      {
        title: 'Portfolio DNA',
        context: 'Translate holdings into factor exposures so behavior is understandable in different environments.',
        details: [
          'Growth vs value',
          'Cyclical vs defensive',
          'Inflation-sensitive',
          'Rate-sensitive',
          'Commodity-sensitive',
          'Currency-sensitive'
        ],
        mvpNote: 'MVP: Start with qualitative tags and later wire in scoring logic.'
      },
      {
        title: 'AI Insights',
        context: 'Narrate what changed, why it matters, and what to watch so users stay context-rich.',
        details: [
          "Explain what's happening",
          'Explain why it matters',
          'Food for thought',
          "Toggle: Explain Like I'm 5",
          "Toggle: Explain Like I'm a Hedge Fund"
        ],
        mvpNote: 'MVP: Show generated insight stubs with tone toggle and future API placeholders.'
      },
      {
        title: 'Risk Breakdown',
        context: 'Surface the ways this portfolio can break before market volatility exposes blind spots.',
        details: [
          'Concentration risk',
          'Sector overexposure',
          'Correlated assets',
          'Drawdown risk',
          'Currency risk',
          'Interest rate risk'
        ],
        mvpNote: 'MVP: Build a risk matrix layout and reserve cells for live scoring.'
      }
    ],
    chatCallout:
      'Use the persistent AI popup to ask portfolio-level what-if questions while staying on this page.',
    chatPrompts: [
      'What if oil spikes?',
      'Why is this portfolio down today?',
      'What would hurt this portfolio most?'
    ]
  },
  {
    id: 'portfolio-input-generator',
    route: 'portfolio-input',
    navLabel: 'Portfolio Manager',
    navHint: 'Build a portfolio',
    cards: [
      {
        title: 'Manual Input',
        context: 'Provide a minimal friction form for creating holdings one line at a time.',
        details: ['Asset ticker', 'Quantity', 'Current price', 'Portfolio percentage'],
        mvpNote: 'MVP: Validate fields locally and queue rows in memory before save.'
      },
      {
        title: 'Generator',
        context: 'Generate sample portfolios from predefined logic to speed up exploration and demos.',
        details: [
          'Random',
          'By sector',
          'By asset class',
          'By goal strategy: Retire early',
          'By goal strategy: Passive income',
          'By goal strategy: Aggressive growth',
          'By goal strategy: Preserve capital',
          'By goal strategy: Beat inflation'
        ],
        mvpNote: 'MVP: Build strategy cards with one-click draft generation.'
      }
    ],
    chatCallout: 'The same AI popup can draft portfolio ideas from user goals without leaving this workflow.',
    chatPrompts: [
      'Build me a passive income portfolio.',
      'I want aggressive growth with moderate risk.',
      'Generate a beat-inflation portfolio draft.'
    ]
  },
  {
    id: 'portfolio-simulations',
    route: 'simulations',
    navLabel: 'Simulations',
    navHint: 'Scenario engine',
    cards: [
      {
        title: 'Selected Portfolio',
        context: 'Anchor every simulation run to one portfolio profile so assumptions are explicit.',
        details: ['Dropdown', 'Allocation chart', 'Current profile'],
        mvpNote: 'MVP: Link selected portfolio to static profile and composition preview.'
      },
      {
        title: 'Scenario / Environment',
        context: 'Choose known crisis templates or design a custom macro regime from key market levers.',
        details: [
          'Historical Scenario: 2008 crash',
          'Historical Scenario: COVID crash',
          'Historical Scenario: Dot-com crash',
          'Historical Scenario: 1970s inflation',
          'Historical Scenario: Rate hike cycle',
          'Historical Scenario: Oil shock',
          'Custom Environment: Inflation',
          'Custom Environment: Interest rates',
          'Custom Environment: Oil prices',
          'Custom Environment: Gold prices',
          'Custom Environment: USD strength',
          'Custom Environment: Market sentiment',
          'Custom Environment: Time horizon'
        ],
        mvpNote: 'MVP: Use slider controls and scenario presets without full backtesting logic yet.'
      },
      {
        title: 'Outcome',
        context: 'Summarize projected portfolio behavior with transparent downside and confidence framing.',
        details: [
          'Projected change',
          'Best/worst affected assets',
          'Drawdown estimate',
          'AI explanation',
          'Confidence level'
        ],
        mvpNote: 'MVP: Render results cards and confidence badges from mock data.'
      }
    ],
    chatCallout:
      'Use the persistent AI popup for live sensitivity prompts while adjusting simulation assumptions.',
    chatPrompts: ['Increase allocation to gold.', 'What if oil rises?', 'What if rates stay high?']
  },
  {
    id: 'live-market-pulse',
    route: 'market-pulse',
    navLabel: 'Market Pulse',
    navHint: 'Live context',
    cards: [
      {
        title: 'Market Summary',
        context: 'Provide compact market direction snapshots across multiple lookback windows.',
        details: ['Today', 'Week', 'Month', 'Year'],
        mvpNote: 'MVP: Use four summary tiles with placeholder return and volatility stats.'
      },
      {
        title: 'Biggest Moves',
        context: 'Highlight where momentum and volatility are concentrated across asset groups.',
        details: ['Stocks', 'Sectors', 'Commodities', 'Bonds', 'Currencies'],
        mvpNote: 'MVP: Render top gainers/losers lists with move magnitude.'
      },
      {
        title: 'News Headlines',
        context: 'Curate key events and infer prevailing sentiment to reduce information overload.',
        details: ['Key events', 'Sentiment summary', 'Macro themes'],
        mvpNote: 'MVP: Card feed with source labels and sentiment tags.'
      },
      {
        title: 'Portfolio Impact',
        context: 'Connect broad market events back to portfolio-specific exposures and likely reactions.',
        details: [
          'Your portfolio is likely affected by...',
          'Markets are risk-off today because...'
        ],
        mvpNote: 'MVP: Add explanation snippets mapped to sector and factor exposure.'
      }
    ],
    chatCallout:
      'The floating AI chat can explain market drops and personalized impact without interrupting navigation.',
    chatPrompts: ['Why is the market down?', 'How does this affect my portfolio?', 'What is the key macro theme today?']
  }
];

export const DEFAULT_FEATURE_PAGE = FEATURE_PAGES[0];

export function findFeaturePageById(pageId: string): WorkspacePage | undefined {
  return FEATURE_PAGES.find((page) => page.id === pageId);
}
