// src/state/storeState.js
// In-memory store for vendor-specific runtime state
module.exports = {
  swiggy: {
    // default storeId for swiggy
    podId: 1374258,
    // lastLocationSuccess tracks whether last location call succeeded
    lastLocationSuccess: false,
    // optional metadata
    meta: {}
  },

  // placeholders for other vendors
  blinkit: {
    // placeholder values to be updated accordingly
    podId: null,
    lastLocationSuccess: false,
    meta: {}
  },

  zepto: {
    podId: null,
    lastLocationSuccess: false,
    meta: {}
  }
};

