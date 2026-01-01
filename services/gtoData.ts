// Apex Hub GTO Engine v2.0
export const GTO_ENGINE_V2 = {
  name: "Apex Hub GTO Engine v2.0",
  game: "6-max No-Limit Hold'em",
  stack: "100bb",
  rake: "low",

  strength_categories: {
    premium: ["AA", "KK", "QQ", "AKs", "AKo", "AQs"],
    strong: ["AJs", "ATs", "KQs", "KJs", "QJs", "JTs", "TT", "99"],
  },

  equity_map: {
    "AA": 85,
    "KK": 82,
    "QQ": 78,
    "AKs": 68,
    "AKo": 65,
    "AQs": 63,
    "AJs": 60,
    "KQs": 58,
    "TT": 75,
    "99": 72,
    "88": 68,
    "77": 66,
    "default": 40
  },

  preflop_ranges: {
    "UTG": {
      "open": ["77+", "AJo+", "KQo", "A9s+", "KJs+", "QJs", "JTs", "T9s"],
      "3bet": ["QQ+", "AK", "AQs"]
    },
    "HJ": {
      "open": ["66+", "ATo+", "KQo", "A8s+", "KTs+", "QTs+", "JTs", "T9s", "98s"],
      "3bet": ["JJ+", "AK", "AQs", "KQs"]
    },
    "CO": {
      "open": ["55+", "A9o+", "KJo+", "QJo+", "A7s+", "K9s+", "QTs+", "JTs", "T9s", "98s", "87s"],
      "3bet": ["TT+", "AK", "AJs+", "KQs"]
    },
    "BTN": {
      "open": ["22+", "A2o+", "K8o+", "Q9o+", "J9o+", "A2s+", "K7s+", "Q8s+", "J8s+", "T8s+", "98s+", "87s+", "76s+", "65s+", "54s+"],
      "3bet": ["88+", "AJs+", "AQo+", "KJs+"]
    },
    "SB": {
      "open": ["22+", "A2o+", "K6o+", "Q9o+", "J9o+", "A2s+", "K6s+", "Q8s+", "J8s+", "T8s+", "98s+", "87s+", "76s+", "65s+", "54s+"],
      "3bet": ["77+", "AJo+", "KQs", "A5s-A2s"]
    },
    "BB": {
      "call_vs_open": ["88-22", "AJo-A2o", "KTo+", "QTo+", "JTo", "T9o", "98o", "87o", "76o", "A9s-A2s", "KTs+", "QTs+", "JTs", "T9s", "98s", "87s", "76s", "65s", "54s", "pocket pairs", "suited broadway"],
      "3bet_vs_open": ["99+", "AK", "AQs+", "KQs", "A5s-A3s"]
    }
  },

  insights: {
    "premium_raise": "Raise — premium hand",
    "nut_advantage": "Raise — nut advantage",
    "blocker_raise": "Raise — blocker removes nuts",
    "pot_odds_call": "Call — pot odds met",
    "defense_call": "Call — good defense frequency",
    "out_of_range_fold": "Fold — out of range",
    "dominated_fold": "Fold — dominated",
    "exploit_wide": "Exploit — villain wide range",
    "exploit_overfold": "Exploit — villain overfolds",
    "bluff_blocker": "Bluff — good blocker combo"
  },
};
