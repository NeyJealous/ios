/**
 * Canonical Account ID based participation rules.
 * Missing flags and unknown Account IDs are disabled by design.
 */
var TI = TI || {};

TI.AccountScope = {
  FLAGS: Object.freeze({
    SYNC: "Sync_Enabled",
    CALCULATION: "Calculation_Enabled",
    DISPLAY: "Display_Enabled",
    RECOMMENDATIONS: "Recommendations_Enabled",
    HISTORY: "History_Enabled"
  }),

  _executionCache: null,

  resetExecutionCache: function() {
    this._executionCache = null;
  },

  isTrue: function(value) {
    if (value === true) return true;
    if (value === false || value === null || value === undefined || value === "") return false;
    var normalized = String(value).trim().toLowerCase();
    return normalized === "true" || normalized === "да" || normalized === "yes" || normalized === "1";
  },

  snapshot: function() {
    if (this._executionCache) return this._executionCache;

    var byId = {};
    var idsByFlag = {};
    Object.keys(this.FLAGS).forEach(function(key) {
      idsByFlag[TI.AccountScope.FLAGS[key]] = [];
    });

    TI.MultiAccount.accounts().forEach(function(row) {
      var accountId = String(row.accountId || "").trim();
      if (!accountId) throw new Error("ACCOUNT_SCOPE_ACCOUNT_ID_REQUIRED");
      if (byId[accountId]) {
        throw new Error("ACCOUNT_SCOPE_DUPLICATE_ACCOUNT_ID: " + TI.AccountStrategyAudit.suffix(accountId));
      }

      var flags = {};
      Object.keys(TI.AccountScope.FLAGS).forEach(function(key) {
        var field = TI.AccountScope.FLAGS[key];
        flags[field] = TI.AccountScope.isTrue(row[field]);
        if (flags[field]) idsByFlag[field].push(accountId);
      });
      byId[accountId] = { row: row, flags: flags };
    });

    Object.keys(idsByFlag).forEach(function(field) {
      idsByFlag[field].sort();
    });
    this._executionCache = {
      byId: byId,
      idsByFlag: idsByFlag,
      allAccounts: Object.keys(byId).sort().map(function(accountId) { return byId[accountId].row; })
    };
    return this._executionCache;
  },

  getAllAccounts: function() {
    return this.snapshot().allAccounts.slice();
  },

  ids: function(flag) {
    return (this.snapshot().idsByFlag[flag] || []).slice();
  },

  enabled: function(accountId, flag) {
    var key = String(accountId || "").trim();
    var entry = this.snapshot().byId[key];
    return !!(entry && entry.flags[flag] === true);
  },

  filterRows: function(rows, flag) {
    return (rows || []).filter(function(row) {
      return TI.AccountScope.enabled(row && row.accountId, flag);
    });
  },

  filterCalculationOrDisplayRows: function(rows) {
    return (rows || []).filter(function(row) {
      var accountId = row && row.accountId;
      return TI.AccountScope.isCalculationEnabled(accountId) || TI.AccountScope.isDisplayEnabled(accountId);
    });
  },

  isAggregateRow: function(row) {
    row = row || {};
    var scopeType = String(row.scopeType || "").trim().toUpperCase();
    return scopeType === "AGGREGATE" || scopeType === "СТРАТЕГИЯ" ||
      String(row.accountName || "").trim() === TI.Rebalance.ALL_ACCOUNTS;
  },

  filterScopedRows: function(rows, flag) {
    return (rows || []).filter(function(row) {
      if (TI.AccountScope.isAggregateRow(row)) return true;
      return TI.AccountScope.enabled(row && row.accountId, flag);
    });
  },

  accounts: function(flag) {
    var self = this;
    return this.getAllAccounts().filter(function(row) {
      return self.enabled(row.accountId, flag);
    });
  },

  filterSyncRows: function(rows) { return this.filterRows(rows, this.FLAGS.SYNC); },
  filterCalculationRows: function(rows) { return this.filterRows(rows, this.FLAGS.CALCULATION); },
  filterDisplayRows: function(rows) { return this.filterRows(rows, this.FLAGS.DISPLAY); },
  filterRecommendationRows: function(rows) { return this.filterRows(rows, this.FLAGS.RECOMMENDATIONS); },
  filterHistoryRows: function(rows) { return this.filterRows(rows, this.FLAGS.HISTORY); },
  filterDisplayScopedRows: function(rows) { return this.filterScopedRows(rows, this.FLAGS.DISPLAY); },
  filterRecommendationScopedRows: function(rows) { return this.filterScopedRows(rows, this.FLAGS.RECOMMENDATIONS); },
  filterCalculationScopedRows: function(rows) { return this.filterScopedRows(rows, this.FLAGS.CALCULATION); },

  getSyncEnabledAccountIds: function() { return this.ids(this.FLAGS.SYNC); },
  getCalculationEnabledAccountIds: function() { return this.ids(this.FLAGS.CALCULATION); },
  getDisplayEnabledAccountIds: function() { return this.ids(this.FLAGS.DISPLAY); },
  getRecommendationEnabledAccountIds: function() { return this.ids(this.FLAGS.RECOMMENDATIONS); },
  getHistoryEnabledAccountIds: function() { return this.ids(this.FLAGS.HISTORY); },

  isSyncEnabled: function(accountId) { return this.enabled(accountId, this.FLAGS.SYNC); },
  isCalculationEnabled: function(accountId) { return this.enabled(accountId, this.FLAGS.CALCULATION); },
  isDisplayEnabled: function(accountId) { return this.enabled(accountId, this.FLAGS.DISPLAY); },
  isRecommendationEnabled: function(accountId) { return this.enabled(accountId, this.FLAGS.RECOMMENDATIONS); },
  isHistoryEnabled: function(accountId) { return this.enabled(accountId, this.FLAGS.HISTORY); },

  syncMetrics: function(accountsDiscovered) {
    var all = this.getAllAccounts();
    var enabled = this.getSyncEnabledAccountIds();
    var skipped = all.filter(function(account) {
      return !TI.AccountScope.isSyncEnabled(account.accountId);
    });
    return {
      accountsDiscovered: accountsDiscovered === undefined ? all.length : Number(accountsDiscovered) || 0,
      accountsSyncEnabled: enabled.length,
      accountsSkipped: skipped.length,
      skippedAccountIdSuffixes: skipped.map(function(account) {
        return TI.AccountStrategyAudit.suffix(account.accountId);
      }).sort(),
      savedApiCallsEstimate: skipped.length * 5
    };
  }
};

function TI_TestAccountScopeContract() {
  var originalAccounts = TI.MultiAccount.accounts;
  try {
    TI.MultiAccount.accounts = function() {
      return [
        { accountId: "enabled", Sync_Enabled: true, Calculation_Enabled: "Да", Display_Enabled: 1, Recommendations_Enabled: "true", History_Enabled: "yes" },
        { accountId: "disabled", Sync_Enabled: false, Calculation_Enabled: "Нет" },
        { accountId: "missing" }
      ];
    };
    TI.AccountScope.resetExecutionCache();
    return {
      ok: TI.AccountScope.isSyncEnabled("enabled") &&
        TI.AccountScope.isCalculationEnabled("enabled") &&
        TI.AccountScope.isDisplayEnabled("enabled") &&
        TI.AccountScope.isRecommendationEnabled("enabled") &&
        TI.AccountScope.isHistoryEnabled("enabled") &&
        !TI.AccountScope.isSyncEnabled("disabled") &&
        !TI.AccountScope.isSyncEnabled("missing") &&
        !TI.AccountScope.isSyncEnabled("unknown"),
      enabledIds: TI.AccountScope.getSyncEnabledAccountIds(),
      unknownEnabled: TI.AccountScope.isSyncEnabled("unknown"),
      missingFlagEnabled: TI.AccountScope.isSyncEnabled("missing")
    };
  } finally {
    TI.MultiAccount.accounts = originalAccounts;
    TI.AccountScope.resetExecutionCache();
  }
}
