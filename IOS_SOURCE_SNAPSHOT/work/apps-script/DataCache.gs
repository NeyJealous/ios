/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: DataCache.gs
 * Версия: 1.0.0
 * Назначение:
 *   Долгоживущий кэш данных внешних источников.
 * ============================================================
 */

var TI = TI || {};

TI.DataCache = {

  SHEET: CORE.SHEETS.DATA_CACHE,
  _entriesByKey: null,

  TTL: Object.freeze({
    MACRO: 86400,
    FX: 86400,
    INFLATION: 2592000,
    BONDS: 604800,
    INSTRUMENTS: 86400,
    PRICES: 86400,
    PORTFOLIO: 900,
    ACCOUNTS: 900
  }),

  /**
   * Подготовить лист данных источников.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Получить запись по ключу.
   * @param {string} key
   * @return {Object|null}
   */
  getEntry: function(key) {
    key = String(key || "").trim();

    if (!key) {
      return null;
    }

    return this.entryMap()[key] || null;
  },

  /**
   * Карта записей кэша за один запуск.
   * @return {Object}
   */
  entryMap: function() {
    if (this._entriesByKey) {
      return this._entriesByKey;
    }

    var map = {};

    TI.Data.sheetObjects(this.SHEET).forEach(function(row) {
      var entry = TI.DataCache.normalizeEntry(row);
      var key = String(entry.key || "").trim();

      if (key) {
        map[key] = entry;
      }
    });

    this._entriesByKey = map;
    return map;
  },

  /**
   * Получить данные из кэша.
   * @param {string} key
   * @param {Object=} options
   * @return {*}
   */
  get: function(key, options) {
    options = options || {};

    var entry = this.getEntry(key);

    if (!entry) {
      return null;
    }

    if (entry.stale && options.allowStale !== true) {
      return null;
    }

    return entry.value;
  },

  /**
   * Сохранить данные.
   * @param {string} key
   * @param {string} source
   * @param {*} value
   * @param {number} ttlSeconds
   * @param {string=} comment
   * @return {Object}
   */
  put: function(key, source, value, ttlSeconds, comment) {
    var sheet = this.prepare();
    var rows = TI.Data.sheetObjects(this.SHEET);
    var rowNumber = 0;
    var now = new Date();
    var entry = {
      key: String(key || "").trim(),
      source: source || "",
      updatedAt: now,
      ttlSeconds: Math.max(0, Math.floor(Number(ttlSeconds) || 0)),
      stale: "Нет",
      data: this.stringify(value),
      comment: comment || ""
    };

    if (!entry.key) {
      throw new Error("Не задан ключ данных источника.");
    }

    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].key || "").trim() === entry.key) {
        rowNumber = i + 2;
        break;
      }
    }

    var values = [Schema.buildRow(this.SHEET, entry)];

    if (rowNumber > 0) {
      sheet.getRange(rowNumber, 1, 1, values[0].length).setValues(values);
    } else {
      sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, 1, values[0].length)
        .setValues(values);
    }

    this._entriesByKey = null;

    return entry;
  },

  /**
   * Получить данные или выполнить загрузчик.
   * @param {Object} options
   * @return {*}
   */
  remember: function(options) {
    options = options || {};

    if (!options.forceRefresh) {
      var cached = this.get(options.key, {
        allowStale: options.allowStale === true
      });

      if (cached !== null && cached !== undefined) {
        return cached;
      }
    }

    try {
      var value = options.loader();

      this.put(
        options.key,
        options.source || "",
        value,
        options.ttlSeconds || 0,
        options.comment || ""
      );

      return value;
    } catch (e) {
      var stale = this.get(options.key, { allowStale: true });

      if (stale !== null && stale !== undefined && options.allowStale === true) {
        TI.TechLog.warning(
          "DataCache",
          "remember",
          "Источник временно недоступен, использованы устаревшие данные.",
          {
            key: options.key,
            error: e.message || String(e)
          }
        );

        return stale;
      }

      throw e;
    }
  },

  /**
   * Обновить признак устаревания по всем строкам.
   * @return {number}
   */
  refreshStaleFlags: function() {
    var sheet = this.prepare();
    var rows = TI.Data.sheetObjects(this.SHEET);
    var count = 0;

    rows.forEach(function(row, index) {
      var entry = TI.DataCache.normalizeEntry(row);
      var value = entry.stale ? "Да" : "Нет";

      sheet.getRange(index + 2, 5).setValue(value);
      count++;
    });

    return count;
  },

  normalizeEntry: function(row) {
    var updatedAt = row.updatedAt instanceof Date
      ? row.updatedAt
      : new Date(row.updatedAt);
    var ttlSeconds = Number(row.ttlSeconds) || 0;
    var ageMs = updatedAt && !isNaN(updatedAt.getTime())
      ? Date.now() - updatedAt.getTime()
      : Number.MAX_SAFE_INTEGER;
    var stale = ttlSeconds > 0
      ? ageMs > ttlSeconds * 1000
      : false;

    return {
      key: row.key || "",
      source: row.source || "",
      updatedAt: updatedAt,
      ttlSeconds: ttlSeconds,
      stale: stale,
      value: this.parse(row.data),
      comment: row.comment || ""
    };
  },

  stringify: function(value) {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  },

  parse: function(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  },

  clear: function() {
    var sheet = this.prepare();

    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .clearContent();
    }

    this._entriesByKey = null;

    return 0;
  }

};

function TI_RefreshDataCacheStatus() {
  var count = TI.DataCache.refreshStaleFlags();

  SpreadsheetApp.getUi().alert(
    "Статус данных источников обновлён.\n\n" +
    "Строк: " + count
  );

  return count;
}

TI.AutoDataRefresh = {

  HANDLER: "TI_AutoRefreshFastData",
  LAST_RESULT_KEY: "TI_AUTO_FAST_DATA_LAST_RESULT",

  refresh: function() {
    var lock = LockService.getScriptLock();

    if (!lock.tryLock(1000)) {
      return {
        status: "skipped",
        reason: "Другое обновление ещё выполняется."
      };
    }

    try {
      var syncState = TI.BatchSync && TI.BatchSync.status
        ? TI.BatchSync.status()
        : {};

      if (syncState.status === "running") {
        return this.saveResult({
          status: "skipped",
          reason: "Сейчас выполняется синхронизация."
        });
      }

      var stats = this.refreshFastSources();
      return this.saveResult(stats);
    } finally {
      lock.releaseLock();
    }
  },

  refreshFastSources: function() {
    var stats = {
      status: "ok",
      updatedAt: new Date().toISOString(),
      accounts: 0,
      cash: 0,
      positions: 0,
      portfolios: 0,
      prices: 0,
      warnings: []
    };

    try {
      var accountResponse = TI.Providers.users.getAccounts(true);
      stats.accounts = (accountResponse.accounts || []).length;
    } catch (e) {
      stats.warnings.push("Счета: " + (e.message || String(e)));
    }

    TI.MultiAccount.accounts().forEach(function(account) {
      var accountId = String(account.accountId || "").trim();

      if (!accountId || String(account.active || "Да").trim() === "Нет") {
        return;
      }

      try {
        TI.Providers.operations.getWithdrawLimits(accountId, true);
        stats.cash += 1;
      } catch (cashError) {
        stats.warnings.push("Свободные деньги: " + account.accountName);
      }

      try {
        TI.Providers.operations.getPositions(accountId, true);
        stats.positions += 1;
      } catch (positionsError) {
        stats.warnings.push("Позиции: " + account.accountName);
      }

      try {
        TI.Providers.operations.getPortfolio(accountId, true);
        stats.portfolios += 1;
      } catch (portfolioError) {
        stats.warnings.push("Портфель: " + account.accountName);
      }
    });

    try {
      stats.prices = TI.Prices.refreshForPositions(TI.Data.portfolio());
    } catch (priceError) {
      stats.warnings.push("Цены: " + (priceError.message || String(priceError)));
    }

    TI.DataCache.refreshStaleFlags();

    return stats;
  },

  saveResult: function(result) {
    result.updatedAt = result.updatedAt || new Date().toISOString();

    PropertiesService
      .getScriptProperties()
      .setProperty(this.LAST_RESULT_KEY, JSON.stringify(result));

    return result;
  },

  status: function() {
    var raw = PropertiesService
      .getScriptProperties()
      .getProperty(this.LAST_RESULT_KEY);
    var result = raw ? JSON.parse(raw) : null;

    return {
      triggers: this.countTriggers(),
      lastResult: result
    };
  },

  enable: function() {
    var minutes = TI.Settings.getAutoQuickRefreshMinutes();

    this.disable();

    ScriptApp.newTrigger(this.HANDLER)
      .timeBased()
      .everyMinutes(minutes)
      .create();

    return {
      minutes: minutes,
      triggers: this.countTriggers()
    };
  },

  disable: function() {
    var handler = this.HANDLER;

    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === handler) {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    return this.countTriggers();
  },

  countTriggers: function() {
    var handler = this.HANDLER;

    return ScriptApp.getProjectTriggers().filter(function(trigger) {
      return trigger.getHandlerFunction() === handler;
    }).length;
  },

  statusText: function() {
    var status = this.status();
    var result = status.lastResult || {};
    var text = "Автообновление быстрых данных.\n\n" +
      "Активных расписаний: " + status.triggers;

    if (result.updatedAt) {
      text += "\nПоследнее обновление: " + result.updatedAt;
      text += "\nСтатус: " + (result.status || "");
      text += "\nСчетов: " + (result.accounts || 0);
      text += "\nСвободные деньги: " + (result.cash || 0);
      text += "\nПозиции: " + (result.positions || 0);
      text += "\nЦены: " + (result.prices || 0);
    }

    if (result.reason) {
      text += "\nПричина: " + result.reason;
    }

    if (result.warnings && result.warnings.length) {
      text += "\nПредупреждений: " + result.warnings.length;
    }

    return text;
  }

};

function TI_AutoRefreshFastData() {
  var removed = TI.AutoMaintenance && TI.AutoMaintenance.disableLegacyFastRefresh
    ? TI.AutoMaintenance.disableLegacyFastRefresh()
    : 0;

  return {
    status: "disabled",
    removed: removed,
    reason: "Заменено редким автообновлением данных."
  };
}

function TI_RefreshFastDataNow() {
  var result = TI.AutoDataRefresh.refresh();

  SpreadsheetApp.getUi().alert(TI.AutoDataRefresh.statusText());

  return result;
}

function TI_EnableFastDataAutoRefresh() {
  var result = TI.AutoDataRefresh.enable();

  SpreadsheetApp.getUi().alert(
    "Автообновление быстрых данных включено.\n\n" +
    "Интервал: " + result.minutes + " мин.\n" +
    "Активных расписаний: " + result.triggers
  );

  return result;
}

function TI_DisableFastDataAutoRefresh() {
  var count = TI.AutoDataRefresh.disable();

  SpreadsheetApp.getUi().alert(
    "Автообновление быстрых данных отключено.\n\n" +
    "Активных расписаний: " + count
  );

  return count;
}

function TI_ShowFastDataAutoRefreshStatus() {
  SpreadsheetApp.getUi().alert(TI.AutoDataRefresh.statusText());
}
