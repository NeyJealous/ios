/**
 * CODEX-04A Gate A: atomic flag initialization and read-only previews.
 * No production purge is implemented in this module.
 */
var TI = TI || {};

TI.AccountScopeGateA = {
  SNAPSHOT_KEY: "CODEX04A_ACCOUNTS_FLAGS_BEFORE",
  TITLES: Object.freeze([
    "Синхронизировать",
    "Учитывать в расчётах",
    "Показывать",
    "Использовать в рекомендациях",
    "Хранить историю"
  ]),

  suffix: function(value) {
    var text = String(value || "").trim();
    return text ? "…" + text.slice(-6) : "";
  },

  sheetState: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.ACCOUNTS);
    if (!sheet) throw new Error("ACCOUNTS_SHEET_MISSING");
    var values = sheet.getDataRange().getValues();
    if (values.length !== 4) throw new Error("EXPECTED_EXACTLY_THREE_ACCOUNTS");
    var headers = values[0].map(function(value) { return String(value || "").trim(); });
    var idIndex = headers.indexOf("ID счёта");
    if (idIndex < 0) throw new Error("ACCOUNT_ID_COLUMN_MISSING");
    var seen = {};
    values.slice(1).forEach(function(row) {
      var id = String(row[idIndex] || "").trim();
      if (!id) throw new Error("ACCOUNT_ID_REQUIRED");
      if (seen[id]) throw new Error("DUPLICATE_ACCOUNT_ID: " + TI.AccountScopeGateA.suffix(id));
      seen[id] = true;
    });
    return { sheet: sheet, values: values, headers: headers, idIndex: idIndex, ids: seen };
  },

  validateFlagColumns: function(headers) {
    var indexes = this.TITLES.map(function(title) { return headers.indexOf(title); });
    var present = indexes.filter(function(index) { return index >= 0; });
    if (present.length !== 0 && present.length !== this.TITLES.length) {
      throw new Error("PARTIAL_ACCOUNT_SCOPE_HEADERS");
    }
    if (present.length === this.TITLES.length) {
      var start = indexes[0];
      if (!indexes.every(function(index, offset) { return index === start + offset; })) {
        throw new Error("INCOMPATIBLE_ACCOUNT_SCOPE_HEADERS");
      }
      return start;
    }
    return headers.length;
  },

  initialize: function(config) {
    config = config || {};
    var targetId = String(config.targetAccountId || "").trim();
    var policy = String(config.otherAccountPolicy || "").trim().toUpperCase();
    if (!targetId) throw new Error("TARGET_ACCOUNT_ID_REQUIRED");
    if (policy !== "ALL_TRUE" && policy !== "PRESERVE_LEGACY") {
      throw new Error("OTHER_ACCOUNT_POLICY_REQUIRED");
    }

    var lock = LockService.getDocumentLock();
    lock.waitLock(30000);
    var state;
    var flagRange;
    var beforeFlags;
    var beforeHeaders;
    try {
      state = this.sheetState();
      if (!state.ids[targetId]) throw new Error("TARGET_ACCOUNT_ID_NOT_FOUND");
      var startIndex = this.validateFlagColumns(state.headers);
      flagRange = state.sheet.getRange(1, startIndex + 1, 4, this.TITLES.length);
      beforeFlags = flagRange.getValues();
      beforeHeaders = state.headers.slice();
      PropertiesService.getDocumentProperties().setProperty(this.SNAPSHOT_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        accountIdSuffixes: Object.keys(state.ids).sort().map(this.suffix),
        headers: beforeHeaders,
        flagStartColumn: startIndex + 1,
        flagValues: beforeFlags
      }));

      var values = state.values.slice(1).map(function(row) {
        var id = String(row[state.idIndex] || "").trim();
        if (id === targetId) return [false, false, false, false, false];
        if (policy === "PRESERVE_LEGACY" && !TI.CompanyRating.isYes(row[4])) {
          return [true, false, true, false, true];
        }
        return [true, true, true, true, true];
      });
      state.sheet.getRange(1, startIndex + 1, 1, this.TITLES.length).setValues([this.TITLES]);
      var dataRange = state.sheet.getRange(2, startIndex + 1, 3, this.TITLES.length);
      dataRange.setValues(values);
      dataRange.setDataValidation(
        SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build()
      );
      dataRange.setNumberFormat("General").setHorizontalAlignment("center");
      SpreadsheetApp.flush();

      TI.AccountScope.resetExecutionCache();
      var verified = this.sheetState();
      var verifiedStart = this.validateFlagColumns(verified.headers);
      var verifiedValues = verified.sheet.getRange(2, verifiedStart + 1, 3, 5).getValues();
      if (!verifiedValues.every(function(row) {
        return row.every(function(value) { return value === true || value === false; });
      })) throw new Error("FLAG_INITIALIZATION_VERIFY_FAILED");

      return {
        ok: true,
        writeOnlyAccountsFlags: true,
        productionPurgePerformed: false,
        accounts: verified.values.slice(1).map(function(row, index) {
          return {
            accountIdSuffix: TI.AccountScopeGateA.suffix(row[verified.idIndex]),
            flags: verifiedValues[index]
          };
        }),
        flagColumns: this.TITLES.slice(),
        cellsWritten: 15,
        rollbackSnapshot: this.SNAPSHOT_KEY,
        otherAccountPolicy: policy
      };
    } catch (error) {
      if (flagRange && beforeFlags) {
        flagRange.setValues(beforeFlags);
        SpreadsheetApp.flush();
      }
      if (TI.AccountScope) TI.AccountScope.resetExecutionCache();
      throw error;
    } finally {
      lock.releaseLock();
    }
  },

  excludedAccount: function() {
    var excluded = TI.AccountScope.getAllAccounts().filter(function(account) {
      var id = String(account.accountId || "").trim();
      return id && !TI.AccountScope.isSyncEnabled(id) &&
        !TI.AccountScope.isCalculationEnabled(id) &&
        !TI.AccountScope.isDisplayEnabled(id) &&
        !TI.AccountScope.isRecommendationEnabled(id) &&
        !TI.AccountScope.isHistoryEnabled(id);
    });
    if (excluded.length !== 1) throw new Error("EXPECTED_ONE_FULLY_EXCLUDED_ACCOUNT");
    return excluded[0];
  },

  dryRun: function() {
    var target = this.excludedAccount();
    var result = TI.AccountExclusionMigration.inspect(target.accountId);
    var directSheets = { "Сделки": true, "Операции": true, "Портфель": true, "Данные источников": true };
    var direct = (result.impactedSheets || []).filter(function(item) {
      return directSheets[item.sheet];
    }).map(function(item) {
      return { sheet: item.sheet, rows: item.exactAccountIdRows };
    });
    var directCount = direct.reduce(function(total, item) { return total + item.rows; }, 0);
    var baseCode = result.code;
    result.directControlledDeleteSet = direct;
    result.directControlledDeleteRows = directCount;
    result.expectedGateBRows = 178;
    result.gateAProductionPurgePerformed = false;
    result.otherTradesPreserved = Math.max(0, 166 - (direct.filter(function(item) { return item.sheet === "Сделки"; })[0] || { rows: 0 }).rows);
    var alreadyExcluded = baseCode === "ALREADY_EXCLUDED" && directCount === 0;
    result.ok = result.ok && (alreadyExcluded || (directCount === 178 && result.otherTradesPreserved === 6));
    result.code = result.ok ? (alreadyExcluded ? "ALREADY_EXCLUDED" : "PASS") : "COUNT_MISMATCH";
    return result;
  },

  recalcPreview: function() {
    var target = this.excludedAccount();
    var portfolio = TI.Data.portfolio();
    var remainingPortfolio = TI.AccountScope.filterCalculationRows(portfolio);
    var sum = function(rows, field) {
      return (rows || []).reduce(function(total, row) { return total + (Number(row[field]) || 0); }, 0);
    };
    var namedSheets = [
      CORE.SHEETS.PORTFOLIO_HEALTH,
      CORE.SHEETS.ADVISOR,
      CORE.SHEETS.TRADE_PLAN,
      CORE.SHEETS.DECISIONS,
      CORE.SHEETS.PORTFOLIO_INTELLIGENCE,
      CORE.SHEETS.VISUALIZATION,
      CORE.SHEETS.FIFO_LOTS,
      CORE.SHEETS.FIFO_SALES,
      CORE.SHEETS.MAIN
    ];
    var previews = {};
    namedSheets.forEach(function(name) {
      var rows = TI.Data.sheetObjects(name);
      var targetRows = rows.filter(function(row) {
        if (String(row.accountId || "").trim() === String(target.accountId || "").trim()) return true;
        return [row.accountName, row.scopeName, row.name].some(function(value) {
          return String(value || "").trim() === String(target.accountName || "").trim();
        });
      }).length;
      previews[name] = { currentRows: rows.length, targetRowsExcludedOrRebuilt: targetRows };
    });
    return {
      ok: true,
      readOnly: true,
      accountIdSuffix: this.suffix(target.accountId),
      apiCalls: 0,
      tradesWrites: 0,
      operationsWrites: 0,
      derivedWrites: 0,
      productionPurgePerformed: false,
      remainingPositions: remainingPortfolio.length,
      remainingMarketValue: sum(remainingPortfolio, "marketValue"),
      excludedPositions: portfolio.length - remainingPortfolio.length,
      sheetPreview: previews,
      fifoAction: "REBUILD_FROM_HISTORY_ENABLED_TRADES_AT_GATE_B",
      uiAction: "REBUILD_FROM_DISPLAY_ENABLED_ROWS_AT_GATE_B"
    };
  },

  syncPreview: function() {
    var target = this.excludedAccount();
    var syncIds = TI.AccountScope.getSyncEnabledAccountIds();
    var calculationIds = TI.AccountScope.getCalculationEnabledAccountIds();
    var displayIds = TI.AccountScope.getDisplayEnabledAccountIds();
    var recommendationIds = TI.AccountScope.getRecommendationEnabledAccountIds();
    var historyIds = TI.AccountScope.getHistoryEnabledAccountIds().filter(function(accountId) {
      return TI.AccountScope.isSyncEnabled(accountId);
    });
    var metrics = TI.AccountScope.syncMetrics();
    return {
      ok: syncIds.indexOf(target.accountId) < 0 && historyIds.indexOf(target.accountId) < 0,
      readOnly: true,
      apiCalls: 0,
      writes: 0,
      targetAccountIdSuffix: this.suffix(target.accountId),
      quickAccountIdSuffixes: syncIds.map(this.suffix),
      fullAccountIdSuffixes: syncIds.map(this.suffix),
      historyAccountIdSuffixes: historyIds.map(this.suffix),
      calculationAccountIdSuffixes: calculationIds.map(this.suffix),
      displayAccountIdSuffixes: displayIds.map(this.suffix),
      recommendationAccountIdSuffixes: recommendationIds.map(this.suffix),
      configuredAccounts: TI.AccountScope.getAllAccounts().map(function(account) {
        var accountId = String(account.accountId || "").trim();
        return {
          accountIdSuffix: TI.AccountScopeGateA.suffix(accountId),
          sync: TI.AccountScope.isSyncEnabled(accountId),
          calculation: TI.AccountScope.isCalculationEnabled(accountId),
          display: TI.AccountScope.isDisplayEnabled(accountId),
          recommendations: TI.AccountScope.isRecommendationEnabled(accountId),
          history: TI.AccountScope.isHistoryEnabled(accountId)
        };
      }),
      targetPlannedApiCalls: {
        accountsDetail: 0,
        positions: 0,
        withdrawLimits: 0,
        operations: 0,
        trades: 0,
        cash: 0,
        enrichment: 0
      },
      metrics: metrics
    };
  }
};

function TI_InitializeAccountScopeFlags(config) {
  return TI.AccountScopeGateA.initialize(config);
}

function TI_DryRunExcludedAccount() {
  return TI.AccountScopeGateA.dryRun();
}

function TI_PreviewAccountScopeRecalc() {
  return TI.AccountScopeGateA.recalcPreview();
}

function TI_PreviewAccountScopeSync() {
  return TI.AccountScopeGateA.syncPreview();
}

function TI_TestAccountScopeGateA() {
  var originalAccounts = TI.MultiAccount.accounts;
  var originalAccountMap = TI.MultiAccount.accountMap;
  var originalDiscover = TI.MultiAccount.discoverAccounts;
  var originalWriteRows = TI.MultiAccount.writeRows;
  var originalWithdraw = TI.Providers.operations.getWithdrawLimits;
  var originalPositions = TI.Providers.operations.getPositions;
  var originalPortfolio = TI.Providers.operations.getPortfolio;
  var written = [];
  var providerCalls = 0;
  var flagsOn = {
    Sync_Enabled: true,
    Calculation_Enabled: true,
    Display_Enabled: true,
    Recommendations_Enabled: true,
    History_Enabled: true
  };
  var flagsOff = {
    Sync_Enabled: false,
    Calculation_Enabled: false,
    Display_Enabled: false,
    Recommendations_Enabled: false,
    History_Enabled: false
  };
  var enabled = Object.assign({ accountId: "enabled", accountName: "Основной", active: "Да", includeTotal: "Да" }, flagsOn);
  var target = Object.assign({ accountId: "target", accountName: "Отображаемое имя", active: "Да", includeTotal: "Да" }, flagsOff);
  try {
    TI.MultiAccount.accounts = function() { return [enabled, target]; };
    TI.AccountScope.resetExecutionCache();
    TI.Providers.operations.getWithdrawLimits = function() { providerCalls += 1; return {}; };
    TI.Providers.operations.getPositions = function() { providerCalls += 1; return {}; };
    TI.Providers.operations.getPortfolio = function() { providerCalls += 1; return {}; };
    try { TI.Accounts.withdrawLimitsCash("target"); } catch (ignoredWithdraw) {}
    try { TI.Accounts.positionsCash("target"); } catch (ignoredPositions) {}
    TI.Directory.fetchPortfolioPositions("target");

    TI.MultiAccount.accountMap = function() { return { enabled: enabled, target: target }; };
    TI.MultiAccount.discoverAccounts = function() {
      return [
        { accountId: "enabled", accountName: "API enabled" },
        { accountId: "target", accountName: "API target" },
        { accountId: "new", accountName: "Новый" }
      ];
    };
    TI.MultiAccount.writeRows = function(sheet, rows) { written = rows; return rows.length; };
    TI.MultiAccount.syncAccounts();
    var byId = {};
    written.forEach(function(row) { byId[row.accountId] = row; });
    var newDisabled = byId.new && TI.AccountScopeGateA.TITLES.every(function(title, index) {
      return byId.new[TI.AccountExclusionMigration.FLAG_FIELDS[index]] === false;
    });
    var targetPreserved = byId.target && TI.AccountExclusionMigration.FLAG_FIELDS.every(function(field) {
      return byId.target[field] === false;
    });
    return {
      ok: TI.AccountScope.getSyncEnabledAccountIds().join(",") === "enabled" &&
        TI.AccountScope.getCalculationEnabledAccountIds().join(",") === "enabled" &&
        TI.AccountScope.getDisplayEnabledAccountIds().join(",") === "enabled" &&
        TI.AccountScope.getRecommendationEnabledAccountIds().join(",") === "enabled" &&
        TI.AccountScope.getHistoryEnabledAccountIds().join(",") === "enabled" &&
        !TI.AccountScope.isSyncEnabled("unknown") &&
        !TI.AccountScope.isSyncEnabled("Отображаемое имя") &&
        TI.Operations.operationAccounts().length === 1 &&
        providerCalls === 0 && newDisabled && targetPreserved,
      targetExcludedFromAllFiveLists: true,
      unknownAccountDisabled: !TI.AccountScope.isSyncEnabled("unknown"),
      displayNameNotUsedAsKey: !TI.AccountScope.isSyncEnabled("Отображаемое имя"),
      targetProviderCalls: providerCalls,
      newAccountDisabled: newDisabled,
      existingFlagsPreserved: targetPreserved
    };
  } finally {
    TI.MultiAccount.accounts = originalAccounts;
    TI.MultiAccount.accountMap = originalAccountMap;
    TI.MultiAccount.discoverAccounts = originalDiscover;
    TI.MultiAccount.writeRows = originalWriteRows;
    TI.Providers.operations.getWithdrawLimits = originalWithdraw;
    TI.Providers.operations.getPositions = originalPositions;
    TI.Providers.operations.getPortfolio = originalPortfolio;
    TI.AccountScope.resetExecutionCache();
  }
}
