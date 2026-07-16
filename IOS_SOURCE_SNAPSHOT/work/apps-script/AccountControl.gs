/**
 * CODEX-04B safe user account scope control.
 * Account ID remains the only technical key; browser clients receive opaque refs.
 */
var TI = TI || {};

TI.AccountControl = {
  SNAPSHOT_KEY: "CODEX04B_ACCOUNT_SCOPE_ROLLBACK",
  PROTECTION_DESCRIPTION: "CODEX-04B: управляется через меню IOS → Счета",
  FLAG_FIELDS: Object.freeze([
    "Sync_Enabled",
    "Calculation_Enabled",
    "Display_Enabled",
    "Recommendations_Enabled",
    "History_Enabled"
  ]),
  FLAG_TITLES: Object.freeze([
    "Синхронизировать",
    "Учитывать в расчётах",
    "Показывать",
    "Использовать в рекомендациях",
    "Хранить историю"
  ]),
  PRESETS: Object.freeze([
    { id: "FULL", title: "Полностью активный", flags: [true, true, true, true, true], explanation: "Синхронизация, расчёты, отображение, рекомендации и история включены." },
    { id: "DISPLAY_HISTORY", title: "Только отображение и история", flags: [true, false, true, false, true], explanation: "Счёт синхронизируется и виден, история сохраняется, но агрегаты и рекомендации его не используют." },
    { id: "HISTORY_ONLY", title: "Только история", flags: [false, false, false, false, true], explanation: "Новые текущие данные не синхронизируются, но исторический контур разрешён." },
    { id: "SYNC_NO_CALC", title: "Синхронизация без расчётов", flags: [true, false, false, false, true], explanation: "Текущие данные и история загружаются, но счёт скрыт и не влияет на расчёты." },
    { id: "EXCLUDED", title: "Полностью исключён", flags: [false, false, false, false, false], explanation: "Счёт не синхронизируется, не рассчитывается, не отображается и не создаёт рекомендации." }
  ]),
  CALCULATION_SHEETS: Object.freeze([
    "Портфель", "Здоровье портфеля", "Налоги", "Ребалансировка",
    "Интеллект портфеля", "Главная", "Стратегические агрегаты"
  ]),
  DISPLAY_SHEETS: Object.freeze([
    "Главная", "Портфель", "Здоровье портфеля", "Советник",
    "План сделок", "Пользовательские отчёты"
  ]),
  RECOMMENDATION_SHEETS: Object.freeze([
    "Решения", "Советник", "План сделок", "Ребалансировка"
  ]),

  digest: function(value) {
    return TI.SyncVerification.digest(value);
  },

  suffix: function(accountId) {
    return TI.AccountStrategyAudit.suffix(String(accountId || "").trim());
  },

  isValidAccountId: function(accountId) {
    return /^\d{6,}$/.test(String(accountId || "").trim());
  },

  accountRef: function(accountId) {
    return this.digest({ accountId: String(accountId || "").trim(), purpose: "CODEX-04B" }).slice(0, 20);
  },

  flagObject: function(row) {
    var result = {};
    this.FLAG_FIELDS.forEach(function(field) {
      result[field] = TI.AccountScope.isTrue(row && row[field]);
    });
    return result;
  },

  flagArray: function(flags) {
    return this.FLAG_FIELDS.map(function(field) { return !!flags[field]; });
  },

  scopeSnapshot: function() {
    var accounts = TI.MultiAccount.accounts().slice().sort(function(a, b) {
      return String(a.accountId || "").localeCompare(String(b.accountId || ""));
    });
    var seen = {};
    var rows = accounts.map(function(account) {
      var accountId = String(account.accountId || "").trim();
      if (!accountId) throw new Error("ACCOUNT_SCOPE_ACCOUNT_ID_REQUIRED");
      if (seen[accountId]) throw new Error("ACCOUNT_SCOPE_DUPLICATE_ACCOUNT_ID: " + TI.AccountControl.suffix(accountId));
      seen[accountId] = true;
      return { accountId: accountId, flags: TI.AccountControl.flagObject(account) };
    });
    return { accounts: accounts, rows: rows, revision: this.digest(rows) };
  },

  migrationRecord: function() {
    try {
      var raw = PropertiesService.getDocumentProperties().getProperty(TI.AccountPurgeMigration.COMMIT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (ignored) {
      return null;
    }
  },

  countRows: function(rows, accountId) {
    return (rows || []).filter(function(row) {
      return String(row.accountId || "").trim() === accountId;
    }).length;
  },

  countSheetAccountRows: function(sheetName, accountId) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) return 0;
    var values = sheet.getDataRange().getValues();
    var idIndex = TI.AccountPurgeMigration.accountIdHeaderIndex(values[0] || []);
    if (idIndex < 0) return 0;
    return values.slice(1).filter(function(row) {
      return String(row[idIndex] || "").trim() === accountId;
    }).length;
  },

  accountStrategies: function(accountId) {
    var strategies = TI.MultiAccount.strategyMap();
    return TI.MultiAccount.accountStrategies().filter(function(link) {
      return String(link.accountId || "").trim() === accountId && TI.CompanyRating.isYes(link.active);
    }).map(function(link) {
      var strategyId = String(link.strategyId || "").trim();
      return (strategies[strategyId] && strategies[strategyId].strategyName) ||
        String(link.strategy || "").trim();
    }).filter(Boolean);
  },

  warningsFor: function(account, stats, flags, migration) {
    var warnings = [];
    if (flags.Recommendations_Enabled && !flags.Calculation_Enabled) {
      warnings.push("Некорректная комбинация: рекомендации требуют участия в расчётах.");
    }
    if (!flags.History_Enabled && stats.historyRows > 0) {
      warnings.push("Отключение истории не удаляет уже сохранённые операции и сделки.");
    }
    var suffix = this.suffix(account.accountId);
    if (migration && migration.targetAccountIdSuffix === suffix && stats.trades === 0 && stats.positions === 0) {
      warnings.push("Счёт исключён. Данные очищены. Архив доступен; включение флагов не восстановит данные автоматически.");
    }
    return warnings;
  },

  model: function() {
    var snapshot = this.scopeSnapshot();
    var trades = TI.Data.trades();
    var positions = TI.Data.portfolio();
    var migration = this.migrationRecord();
    return {
      ok: true,
      readOnly: true,
      scopeRevision: snapshot.revision,
      presets: this.PRESETS.map(function(preset) {
        return { id: preset.id, title: preset.title, flags: preset.flags.slice(), explanation: preset.explanation };
      }),
      accounts: snapshot.accounts.map(function(account) {
        var accountId = String(account.accountId || "").trim();
        var flags = TI.AccountControl.flagObject(account);
        var stats = {
          positions: TI.AccountControl.countRows(positions, accountId),
          trades: TI.AccountControl.countRows(trades, accountId),
          operations: TI.AccountControl.countSheetAccountRows(CORE.SERVICE_SHEETS.API_OPERATIONS, accountId)
        };
        stats.historyRows = stats.trades + stats.operations;
        var suffix = TI.AccountControl.suffix(accountId);
        var purged = !!(migration && migration.targetAccountIdSuffix === suffix &&
          stats.trades === 0 && stats.positions === 0);
        return {
          accountRef: TI.AccountControl.accountRef(accountId),
          accountIdMasked: suffix,
          accountName: String(account.accountName || "Без названия"),
          accountType: String(account.accountType || ""),
          status: String(account.active || ""),
          flags: flags,
          strategies: TI.AccountControl.accountStrategies(accountId),
          statistics: stats,
          warnings: TI.AccountControl.warningsFor(account, stats, flags, migration),
          exclusion: {
            excluded: TI.AccountControl.flagArray(flags).every(function(value) { return !value; }),
            dataPurged: purged,
            archiveAvailable: purged && !!migration
          }
        };
      }),
      knownExternalRisk: {
        code: "CRITICAL_ACTIVE_INFLUENCE_RISK",
        status: "OPEN",
        message: "Legacy multiplier > 1 может влиять на приоритет покупки через Decision Engine / Rule R030. Риск находится вне scope CODEX-04B."
      }
    };
  },

  resolveChanges: function(request, snapshot) {
    request = request || {};
    var accountsByRef = {};
    snapshot.accounts.forEach(function(account) {
      accountsByRef[TI.AccountControl.accountRef(account.accountId)] = account;
    });
    var changes = [];
    var seen = {};
    (request.changes || []).forEach(function(change) {
      var ref = String(change.accountRef || "").trim();
      if (!ref || !accountsByRef[ref] || seen[ref]) throw new Error("ACCOUNT_SCOPE_INVALID_ACCOUNT_REF");
      seen[ref] = true;
      var flags = {};
      TI.AccountControl.FLAG_FIELDS.forEach(function(field) {
        if (!change.flags || typeof change.flags[field] !== "boolean") {
          throw new Error("ACCOUNT_SCOPE_INVALID_FLAG_VALUE: " + field);
        }
        flags[field] = change.flags[field];
      });
      changes.push({ account: accountsByRef[ref], before: TI.AccountControl.flagObject(accountsByRef[ref]), after: flags });
    });
    return changes;
  },

  validate: function(changes, snapshot, criticalConfirmation) {
    var errors = [];
    var warnings = [];
    var finalById = {};
    snapshot.accounts.forEach(function(account) {
      finalById[String(account.accountId || "").trim()] = TI.AccountControl.flagObject(account);
    });
    changes.forEach(function(change) {
      var accountId = String(change.account.accountId || "").trim();
      finalById[accountId] = change.after;
      if (change.after.Recommendations_Enabled && !change.after.Calculation_Enabled) {
        errors.push("Recommendations=true требует Calculation=true для " + TI.AccountControl.suffix(accountId) + ".");
      }
      if ((change.after.Calculation_Enabled || change.after.Sync_Enabled) && !TI.AccountControl.isValidAccountId(accountId)) {
        errors.push("Нельзя включить Sync/Calculation для невалидного Account ID " + TI.AccountControl.suffix(accountId) + ".");
      }
      if (change.before.History_Enabled && !change.after.History_Enabled) {
        warnings.push("История " + TI.AccountControl.suffix(accountId) + " не будет удалена автоматически.");
      }
      if (!change.before.Calculation_Enabled && change.after.Calculation_Enabled) {
        var direct = TI.AccountPurgeMigration.directCounts(TI.AccountPurgeMigration.directCaptures(accountId));
        if (direct.total === 0 && TI.AccountControl.countRows(TI.Data.portfolio(), accountId) === 0) {
          warnings.push("Данные " + TI.AccountControl.suffix(accountId) + " не восстановятся автоматически; потребуется отдельная restore migration.");
        }
      }
    });
    var finalIds = Object.keys(finalById);
    var calculationCount = finalIds.filter(function(id) { return finalById[id].Calculation_Enabled; }).length;
    var displayCount = finalIds.filter(function(id) { return finalById[id].Display_Enabled; }).length;
    var calculationAccountDisabled = changes.some(function(change) {
      return change.before.Calculation_Enabled && !change.after.Calculation_Enabled;
    });
    var critical = calculationCount === 0 || calculationAccountDisabled;
    if (calculationCount === 0) warnings.push("После изменения не останется ни одного Calculation-счёта.");
    if (calculationAccountDisabled && calculationCount > 0) {
      warnings.push("Отключается действующий Calculation-счёт; влияние на агрегаты требует критического подтверждения.");
    }
    if (displayCount === 0) warnings.push("После изменения не останется ни одного Display-счёта.");
    if (critical && criticalConfirmation !== true) {
      errors.push("Для отключения всех Calculation-счетов требуется критическое подтверждение.");
    }
    return { ok: errors.length === 0, errors: errors, warnings: warnings, criticalConfirmationRequired: critical };
  },

  preview: function(request) {
    request = request || {};
    var snapshot = this.scopeSnapshot();
    if (request.scopeRevision && request.scopeRevision !== snapshot.revision) {
      return { ok: false, code: "ACCOUNT_SCOPE_REVISION_CONFLICT", readOnly: true, scopeRevision: snapshot.revision };
    }
    var resolved = this.resolveChanges(request, snapshot);
    var effective = resolved.filter(function(change) {
      return TI.AccountControl.digest(change.before) !== TI.AccountControl.digest(change.after);
    });
    var validation = this.validate(effective, snapshot, request.criticalConfirmation === true);
    var changes = effective.map(function(change) {
      var before = TI.AccountControl.flagArray(change.before);
      var after = TI.AccountControl.flagArray(change.after);
      return {
        accountIdMasked: TI.AccountControl.suffix(change.account.accountId),
        accountName: String(change.account.accountName || ""),
        before: before,
        after: after,
        changedFlags: TI.AccountControl.FLAG_FIELDS.filter(function(field, index) { return before[index] !== after[index]; })
      };
    });
    var syncChanged = effective.some(function(change) {
      return change.before.Sync_Enabled !== change.after.Sync_Enabled ||
        change.before.History_Enabled !== change.after.History_Enabled;
    });
    var calculationChanged = effective.some(function(change) {
      return change.before.Calculation_Enabled !== change.after.Calculation_Enabled;
    });
    var displayChanged = effective.some(function(change) {
      return change.before.Display_Enabled !== change.after.Display_Enabled;
    });
    var recommendationsChanged = effective.some(function(change) {
      return change.before.Recommendations_Enabled !== change.after.Recommendations_Enabled;
    });
    var previewCore = {
      scopeRevision: snapshot.revision,
      changes: changes,
      validation: validation,
      apiPaths: syncChanged ? ["accounts detail", "positions", "withdraw limits", "operations", "trades", "cash", "enrichment"] : [],
      calculationSheets: calculationChanged ? this.CALCULATION_SHEETS.slice() : [],
      displaySheets: displayChanged ? this.DISPLAY_SHEETS.slice() : [],
      recommendationSheets: recommendationsChanged ? this.RECOMMENDATION_SHEETS.slice() : [],
      recalcRequired: calculationChanged || displayChanged || recommendationsChanged,
      separateDataGateRequired: effective.some(function(change) {
        return (!change.before.Sync_Enabled && change.after.Sync_Enabled) ||
          (!change.before.History_Enabled && change.after.History_Enabled);
      }),
      productionDataDeleted: false,
      productionDataRestored: false,
      apiCalls: 0,
      writes: 0
    };
    previewCore.previewHash = this.digest(previewCore);
    previewCore.ok = validation.ok;
    previewCore.code = effective.length ? (validation.ok ? "PREVIEW_READY" : "VALIDATION_FAILED") : "NO_CHANGES";
    previewCore.readOnly = true;
    return previewCore;
  },

  sheetLayout: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.ACCOUNTS);
    if (!sheet) throw new Error("ACCOUNTS_SHEET_MISSING");
    var values = sheet.getDataRange().getValues();
    var headers = (values[0] || []).map(function(value) { return String(value || "").trim(); });
    var idIndex = headers.indexOf("ID счёта");
    var flagIndexes = this.FLAG_TITLES.map(function(title) { return headers.indexOf(title); });
    if (idIndex < 0 || flagIndexes.some(function(index) { return index < 0; })) throw new Error("ACCOUNT_SCOPE_COLUMNS_MISSING");
    if (!flagIndexes.every(function(index, offset) { return index === flagIndexes[0] + offset; })) {
      throw new Error("ACCOUNT_SCOPE_COLUMNS_NOT_CONTIGUOUS");
    }
    return { sheet: sheet, values: values, headers: headers, idIndex: idIndex, flagStart: flagIndexes[0] };
  },

  userLabel: function() {
    try {
      return Session.getActiveUser().getEmail() || "Не определён";
    } catch (ignored) {
      return "Не определён";
    }
  },

  appendAudit: function(rows) {
    if (!rows.length) return 0;
    var sheet = Schema.prepareSheet(CORE.SHEETS.ACCOUNT_SCOPE_AUDIT);
    var values = rows.map(function(row) { return Schema.buildRow(CORE.SHEETS.ACCOUNT_SCOPE_AUDIT, row); });
    sheet.getRange(Math.max(2, sheet.getLastRow() + 1), 1, values.length, values[0].length).setValues(values);
    return values.length;
  },

  buildAuditRows: function(resolved, context) {
    context = context || {};
    var now = context.timestamp || new Date();
    return (resolved || []).map(function(change) {
      var before = TI.AccountControl.flagArray(change.before);
      var after = TI.AccountControl.flagArray(change.after);
      return {
        timestamp: now,
        runId: context.runId || "",
        user: context.user || TI.AccountControl.userLabel(),
        accountIdMasked: TI.AccountControl.suffix(change.account.accountId),
        beforeSync: before[0], beforeCalculation: before[1], beforeDisplay: before[2],
        beforeRecommendations: before[3], beforeHistory: before[4],
        afterSync: after[0], afterCalculation: after[1], afterDisplay: after[2],
        afterRecommendations: after[3], afterHistory: after[4],
        reason: String(context.reason || "").trim(),
        previewHash: context.previewHash || "",
        scopeRevisionBefore: context.scopeRevisionBefore || "",
        scopeRevisionAfter: context.scopeRevisionAfter || "",
        result: context.result || "APPLIED",
        rollbackAvailable: context.rollbackAvailable !== false
      };
    });
  },

  apply: function(request) {
    request = request || {};
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return { ok: false, code: "GLOBAL_LOCK_UNAVAILABLE" };
    var runId = this.suffix(Utilities.getUuid());
    try {
      var syncState = TI.BatchSync.status();
      if (syncState && syncState.status === "running") return { ok: false, code: "SYNC_ALREADY_RUNNING", runId: runId };
      var snapshot = this.scopeSnapshot();
      if (request.scopeRevision !== snapshot.revision) {
        return { ok: false, code: "ACCOUNT_SCOPE_REVISION_CONFLICT", runId: runId, scopeRevision: snapshot.revision };
      }
      var preview = this.preview(request);
      if (preview.code === "NO_CHANGES") {
        return { ok: true, code: "NO_CHANGES", runId: runId, scopeRevision: snapshot.revision, writes: 0, auditRows: 0 };
      }
      if (!preview.ok) return { ok: false, code: preview.code, runId: runId, validation: preview.validation };
      if (!request.previewHash || request.previewHash !== preview.previewHash) {
        return { ok: false, code: "ACCOUNT_SCOPE_PREVIEW_HASH_CONFLICT", runId: runId };
      }
      var resolved = this.resolveChanges(request, snapshot).filter(function(change) {
        return TI.AccountControl.digest(change.before) !== TI.AccountControl.digest(change.after);
      });
      var layout = this.sheetLayout();
      var beforeMatrix = layout.values.slice(1).map(function(row) {
        return TI.AccountControl.FLAG_FIELDS.map(function(field, index) {
          return TI.AccountScope.isTrue(row[layout.flagStart + index]);
        });
      });
      var afterMatrix = beforeMatrix.map(function(row) { return row.slice(); });
      var rowById = {};
      layout.values.slice(1).forEach(function(row, index) {
        rowById[String(row[layout.idIndex] || "").trim()] = index;
      });
      resolved.forEach(function(change) {
        var accountId = String(change.account.accountId || "").trim();
        if (rowById[accountId] === undefined) throw new Error("ACCOUNT_SCOPE_TARGET_ROW_MISSING");
        afterMatrix[rowById[accountId]] = TI.AccountControl.flagArray(change.after);
      });
      PropertiesService.getDocumentProperties().setProperty(this.SNAPSHOT_KEY, JSON.stringify({
        createdAt: new Date().toISOString(),
        runId: runId,
        scopeRevision: snapshot.revision,
        rows: snapshot.rows
      }));
      layout.sheet.getRange(2, layout.flagStart + 1, afterMatrix.length, this.FLAG_FIELDS.length).setValues(afterMatrix);
      SpreadsheetApp.flush();
      TI.AccountScope.resetExecutionCache();
      var afterSnapshot = this.scopeSnapshot();
      var expectedRevision = this.digest(snapshot.rows.map(function(item) {
        var match = resolved.filter(function(change) { return change.account.accountId === item.accountId; })[0];
        return { accountId: item.accountId, flags: match ? match.after : item.flags };
      }));
      if (afterSnapshot.revision !== expectedRevision) {
        layout.sheet.getRange(2, layout.flagStart + 1, beforeMatrix.length, this.FLAG_FIELDS.length).setValues(beforeMatrix);
        SpreadsheetApp.flush();
        TI.AccountScope.resetExecutionCache();
        throw new Error("ACCOUNT_SCOPE_POST_VALIDATION_FAILED");
      }
      var auditRows = this.buildAuditRows(resolved, {
        timestamp: new Date(),
        runId: runId,
        user: this.userLabel(),
        reason: request.reason,
        previewHash: preview.previewHash,
        scopeRevisionBefore: snapshot.revision,
        scopeRevisionAfter: afterSnapshot.revision,
        result: "APPLIED",
        rollbackAvailable: true
      });
      this.appendAudit(auditRows);
      TI.TechLog.info("AccountControl", "apply", "Настройки счетов изменены.", {
        runId: runId, accounts: auditRows.map(function(row) { return row.accountIdMasked; }),
        scopeRevisionBefore: snapshot.revision, scopeRevisionAfter: afterSnapshot.revision
      });
      return {
        ok: true, code: "APPLIED", runId: runId, changedAccounts: auditRows.length,
        scopeRevisionBefore: snapshot.revision, scopeRevisionAfter: afterSnapshot.revision,
        previewHash: preview.previewHash, rollbackAvailable: true, recalcRequired: preview.recalcRequired,
        productionDataDeleted: false, productionDataRestored: false
      };
    } finally {
      lock.releaseLock();
    }
  },

  rollbackSnapshot: function() {
    var raw = PropertiesService.getDocumentProperties().getProperty(this.SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  previewRollback: function(request) {
    request = request || {};
    var saved = this.rollbackSnapshot();
    if (!saved || !saved.rows) return { ok: false, code: "ACCOUNT_SCOPE_ROLLBACK_NOT_AVAILABLE", readOnly: true };
    var current = this.scopeSnapshot();
    var savedById = {};
    saved.rows.forEach(function(row) { savedById[row.accountId] = row.flags; });
    var changes = current.accounts.filter(function(account) {
      return savedById[account.accountId] &&
        TI.AccountControl.digest(TI.AccountControl.flagObject(account)) !== TI.AccountControl.digest(savedById[account.accountId]);
    }).map(function(account) {
      return {
        accountRef: TI.AccountControl.accountRef(account.accountId),
        flags: savedById[account.accountId]
      };
    });
    var preview = this.preview({
      scopeRevision: current.revision,
      changes: changes,
      criticalConfirmation: request.criticalConfirmation === true
    });
    preview.code = changes.length ? "ROLLBACK_PREVIEW_READY" : "NO_CHANGES";
    preview.rollbackOnlyFlags = true;
    preview.restoresTrades = false;
    preview.restoresPortfolio = false;
    preview.restoresCache = false;
    preview.runsPurge = false;
    return preview;
  },

  applyRollback: function(request) {
    request = request || {};
    var saved = this.rollbackSnapshot();
    if (!saved || !saved.rows) return { ok: false, code: "ACCOUNT_SCOPE_ROLLBACK_NOT_AVAILABLE" };
    var current = this.scopeSnapshot();
    var changes = saved.rows.map(function(row) {
      return { accountRef: TI.AccountControl.accountRef(row.accountId), flags: row.flags };
    });
    return this.apply({
      scopeRevision: request.scopeRevision || current.revision,
      changes: changes,
      reason: String(request.reason || "Rollback настроек счетов"),
      criticalConfirmation: request.criticalConfirmation === true,
      previewHash: request.previewHash
    });
  },

  auditHistory: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.ACCOUNT_SCOPE_AUDIT);
    if (!sheet || sheet.getLastRow() <= 1) return [];
    return TI.Data.sheetObjects(CORE.SHEETS.ACCOUNT_SCOPE_AUDIT).slice(-100).reverse().map(function(row) {
      return {
        timestamp: row.timestamp, runId: row.runId, user: row.user,
        accountIdMasked: row.accountIdMasked, result: row.result, reason: row.reason,
        rollbackAvailable: TI.AccountScope.isTrue(row.rollbackAvailable)
      };
    });
  },

  protectionStatus: function() {
    var layout = this.sheetLayout();
    var descriptions = layout.sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).map(function(protection) {
      return String(protection.getDescription() || "");
    });
    return {
      flagColumnsProtected: descriptions.indexOf(this.PROTECTION_DESCRIPTION + ":flags") !== -1,
      accountIdProtected: descriptions.indexOf(this.PROTECTION_DESCRIPTION + ":accountId") !== -1,
      accountIdHidden: layout.sheet.isColumnHiddenByUser(layout.idIndex + 1)
    };
  },

  ensureProtection: function() {
    var layout = this.sheetLayout();
    var existing = {};
    layout.sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function(protection) {
      existing[String(protection.getDescription() || "")] = protection;
    });
    var flagDescription = this.PROTECTION_DESCRIPTION + ":flags";
    var idDescription = this.PROTECTION_DESCRIPTION + ":accountId";
    if (!existing[flagDescription]) {
      layout.sheet.getRange(1, layout.flagStart + 1, Math.max(layout.sheet.getMaxRows(), 4), this.FLAG_FIELDS.length)
        .protect().setDescription(flagDescription).setWarningOnly(true);
    }
    if (!existing[idDescription]) {
      layout.sheet.getRange(1, layout.idIndex + 1, Math.max(layout.sheet.getMaxRows(), 4), 1)
        .protect().setDescription(idDescription).setWarningOnly(true);
    }
    layout.sheet.hideColumns(layout.idIndex + 1);
    return { ok: true, code: "PROTECTION_APPLIED", status: this.protectionStatus() };
  },

  diagnostics: function() {
    var snapshot = this.scopeSnapshot();
    var errors = [];
    var warnings = [];
    var ids = {};
    snapshot.accounts.forEach(function(account) {
      var id = String(account.accountId || "").trim();
      if (!TI.AccountControl.isValidAccountId(id)) errors.push("Невалидный Account ID " + TI.AccountControl.suffix(id));
      if (ids[id]) errors.push("Дубликат Account ID " + TI.AccountControl.suffix(id));
      ids[id] = true;
      var flags = TI.AccountControl.flagObject(account);
      if (flags.Recommendations_Enabled && !flags.Calculation_Enabled) {
        errors.push("Recommendations без Calculation: " + TI.AccountControl.suffix(id));
      }
      TI.AccountControl.FLAG_FIELDS.forEach(function(field) {
        var raw = account[field];
        if (!(raw === true || raw === false || raw === "true" || raw === "false" ||
          raw === "Да" || raw === "Нет" || raw === 1 || raw === 0)) {
          errors.push("Неизвестное значение " + field + ": " + TI.AccountControl.suffix(id));
        }
      });
      if (flags.Calculation_Enabled && TI.AccountControl.countRows(TI.Data.portfolio(), id) === 0) {
        warnings.push("Calculation включён, но позиций нет: " + TI.AccountControl.suffix(id));
      }
    });
    if (!snapshot.accounts.some(function(account) { return TI.AccountScope.isTrue(account.Calculation_Enabled); })) {
      errors.push("Нет ни одного Calculation-счёта.");
    }
    var orphanLinks = TI.MultiAccount.accountStrategies().filter(function(link) {
      return !ids[String(link.accountId || "").trim()];
    }).length;
    if (orphanLinks) errors.push("Orphan AccountStrategy links: " + orphanLinks);
    var lock = LockService.getScriptLock();
    var lockAvailable = lock.tryLock(1);
    if (lockAvailable) lock.releaseLock();
    return {
      ok: errors.length === 0,
      readOnly: true,
      accountCount: snapshot.accounts.length,
      duplicateIds: errors.filter(function(item) { return item.indexOf("Дубликат") === 0; }).length,
      invalidIds: errors.filter(function(item) { return item.indexOf("Невалидный") === 0; }).length,
      orphanAccountStrategyLinks: orphanLinks,
      calculationAccounts: snapshot.accounts.filter(function(account) { return TI.AccountScope.isTrue(account.Calculation_Enabled); }).length,
      displayAccounts: snapshot.accounts.filter(function(account) { return TI.AccountScope.isTrue(account.Display_Enabled); }).length,
      scopeRevision: snapshot.revision,
      migrationState: this.migrationRecord() ? "EXCLUSION_COMMITTED" : "NOT_RECORDED",
      globalLockAvailable: lockAvailable,
      protection: this.protectionStatus(),
      errors: errors,
      warnings: warnings
    };
  },

  noOpRequest: function() {
    var model = this.model();
    return {
      scopeRevision: model.scopeRevision,
      reason: "CODEX-04B Gate A no-op verification",
      criticalConfirmation: false,
      changes: model.accounts.map(function(account) {
        return { accountRef: account.accountRef, flags: account.flags };
      })
    };
  }
};

function TI_GetAccountControlModel() {
  return TI.AccountControl.model();
}

function TI_PreviewAccountScopeChanges(request) {
  return TI.AccountControl.preview(request);
}

function TI_ApplyAccountScopeChanges(request) {
  return TI.AccountControl.apply(request);
}

function TI_PreviewAccountScopeRollback(request) {
  return TI.AccountControl.previewRollback(request);
}

function TI_ApplyAccountScopeRollback(request) {
  return TI.AccountControl.applyRollback(request);
}

function TI_AccountScopeDiagnostics() {
  return TI.AccountControl.diagnostics();
}

function TI_EnsureAccountScopeProtection() {
  return TI.AccountControl.ensureProtection();
}

function TI_GetAccountScopeHistory() {
  return TI.AccountControl.auditHistory();
}

function TI_TestAccountControlContract() {
  var full = TI.AccountControl.PRESETS.filter(function(preset) { return preset.id === "FULL"; })[0];
  var displayHistory = TI.AccountControl.PRESETS.filter(function(preset) { return preset.id === "DISPLAY_HISTORY"; })[0];
  var invalid = TI.AccountControl.validate([
    {
      account: { accountId: "123456" },
      before: TI.AccountControl.flagObject({}),
      after: {
        Sync_Enabled: true, Calculation_Enabled: false, Display_Enabled: true,
        Recommendations_Enabled: true, History_Enabled: true
      }
    }
  ], { accounts: [{ accountId: "123456" }] }, false);
  var auditRows = TI.AccountControl.buildAuditRows([{
    account: { accountId: "123456789" },
    before: {
      Sync_Enabled: true, Calculation_Enabled: false, Display_Enabled: true,
      Recommendations_Enabled: false, History_Enabled: true
    },
    after: {
      Sync_Enabled: true, Calculation_Enabled: true, Display_Enabled: true,
      Recommendations_Enabled: true, History_Enabled: true
    }
  }], {
    runId: "…test01", user: "test", reason: "contract",
    previewHash: "hash", scopeRevisionBefore: "before", scopeRevisionAfter: "after"
  });
  return {
    ok: full.flags.join("/") === "true/true/true/true/true" &&
      displayHistory.flags.join("/") === "true/false/true/false/true" &&
      !invalid.ok &&
      TI.AccountControl.suffix("123456789").indexOf("123456789") === -1 &&
      auditRows.length === 1 && auditRows[0].accountIdMasked === "…456789",
    presets: TI.AccountControl.PRESETS.length,
    recommendationsWithoutCalculationRejected: !invalid.ok,
    fullIdsMasked: TI.AccountControl.suffix("123456789") === "…456789",
    displayWithoutCalculationSupported: displayHistory.flags[2] && !displayHistory.flags[1],
    auditRowBuiltWithMaskedId: auditRows.length === 1 && auditRows[0].accountIdMasked === "…456789"
  };
}

function TI_TestAccountControlNoOpPreview() {
  var request = TI.AccountControl.noOpRequest();
  var preview = TI.AccountControl.preview(request);
  return {
    ok: preview.ok && preview.code === "NO_CHANGES" && preview.writes === 0 && preview.apiCalls === 0,
    code: preview.code,
    scopeRevision: preview.scopeRevision,
    writes: preview.writes,
    apiCalls: preview.apiCalls
  };
}

function TI_TestAccountControlNoOpApply() {
  var request = TI.AccountControl.noOpRequest();
  var preview = TI.AccountControl.preview(request);
  request.previewHash = preview.previewHash;
  return TI.AccountControl.apply(request);
}

function TI_TestAccountControlRemoteGateA() {
  var model = TI.AccountControl.model();
  var contract = TI_TestAccountControlContract();
  var noOp = TI_TestAccountControlNoOpPreview();
  var diagnostics = TI.AccountControl.diagnostics();
  var bySuffix = {};
  model.accounts.forEach(function(account) {
    bySuffix[account.accountIdMasked] = TI.AccountControl.flagArray(account.flags);
  });
  var allMasked = model.accounts.every(function(account) {
    return /^…\d{6}$/.test(account.accountIdMasked) &&
      String(account.accountIdMasked).indexOf(String(account.accountRef)) === -1;
  });
  var vector = function(suffix) { return (bySuffix[suffix] || []).join("/"); };
  return {
    ok: model.accounts.length === 3 && allMasked && contract.ok && noOp.ok &&
      vector("…020546") === "true/false/true/false/true" &&
      vector("…531683") === "true/true/true/true/true" &&
      vector("…864109") === "false/false/false/false/false",
    accountCount: model.accounts.length,
    allIdsMasked: allMasked,
    presets: model.presets.length,
    semantics: bySuffix,
    contract: contract,
    noOpPreview: noOp,
    diagnostics: diagnostics,
    knownExternalRisk: model.knownExternalRisk,
    productionFlagWrites: 0,
    apiCalls: 0
  };
}

function TI_TestAccountControlValidationRemote() {
  var model = TI.AccountControl.model();
  var bySuffix = {};
  model.accounts.forEach(function(account) { bySuffix[account.accountIdMasked] = account; });
  var cloneFlags = function(account) {
    var result = {};
    TI.AccountControl.FLAG_FIELDS.forEach(function(field) { result[field] = account.flags[field]; });
    return result;
  };
  var displayOnly = bySuffix["…020546"];
  var calculation = bySuffix["…531683"];
  var excluded = bySuffix["…864109"];

  var invalidFlags = cloneFlags(displayOnly);
  invalidFlags.Recommendations_Enabled = true;
  var invalidRecommendations = TI.AccountControl.preview({
    scopeRevision: model.scopeRevision,
    changes: [{ accountRef: displayOnly.accountRef, flags: invalidFlags }]
  });

  var calculationOff = cloneFlags(calculation);
  calculationOff.Calculation_Enabled = false;
  calculationOff.Recommendations_Enabled = false;
  var lastCalculationGuard = TI.AccountControl.preview({
    scopeRevision: model.scopeRevision,
    changes: [{ accountRef: calculation.accountRef, flags: calculationOff }]
  });

  var excludedHistory = cloneFlags(excluded);
  excludedHistory.History_Enabled = true;
  var excludedRestoreGuard = TI.AccountControl.preview({
    scopeRevision: model.scopeRevision,
    changes: [{ accountRef: excluded.accountRef, flags: excludedHistory }]
  });

  var revisionConflict = TI.AccountControl.preview({
    scopeRevision: "stale-revision",
    changes: []
  });

  return {
    ok: !invalidRecommendations.ok &&
      invalidRecommendations.code === "VALIDATION_FAILED" &&
      lastCalculationGuard.validation.criticalConfirmationRequired &&
      !lastCalculationGuard.ok &&
      excludedRestoreGuard.ok &&
      excludedRestoreGuard.separateDataGateRequired &&
      excludedRestoreGuard.productionDataRestored === false &&
      revisionConflict.code === "ACCOUNT_SCOPE_REVISION_CONFLICT",
    invalidRecommendations: {
      rejected: !invalidRecommendations.ok,
      code: invalidRecommendations.code
    },
    lastCalculationGuard: {
      rejectedWithoutCriticalConfirmation: !lastCalculationGuard.ok,
      criticalConfirmationRequired: lastCalculationGuard.validation.criticalConfirmationRequired
    },
    excludedAccount: {
      previewOnly: excludedRestoreGuard.readOnly,
      separateRestoreGateRequired: excludedRestoreGuard.separateDataGateRequired,
      productionDataRestored: excludedRestoreGuard.productionDataRestored
    },
    revisionConflict: revisionConflict.code,
    writes: 0,
    apiCalls: 0
  };
}
