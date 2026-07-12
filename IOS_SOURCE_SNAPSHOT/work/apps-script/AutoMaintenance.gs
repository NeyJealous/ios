/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: AutoMaintenance.gs
 * Назначение:
 *   Редкое автоматическое обновление данных обслуживания.
 * ============================================================
 */

var TI = TI || {};

TI.AutoMaintenance = {

  LEGACY_FAST_HANDLER: "TI_AutoRefreshFastData",
  DAYS_SETTING: "Редкое автообновление данных, дней",

  ensureSettings: function() {
    var existing = {};

    try {
      existing = TI.Settings.readMap();
    } catch (e) {
      Logger.log(e);
    }

    if (existing[this.DAYS_SETTING] !== undefined) {
      return 0;
    }

    var sheet = TI.Settings.prepare();
    var values = [Schema.buildRow(CORE.SHEETS.SETTINGS, {
      parameter: this.DAYS_SETTING,
      value: 7
    })];

    sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, 1, values[0].length)
      .setValues(values);

    return 1;
  },

  days: function() {
    var fallback = 7;

    try {
      if (TI.Settings && TI.Settings.getNumber) {
        return Math.max(
          2,
          Math.floor(TI.Settings.getNumber(this.DAYS_SETTING, fallback))
        );
      }
    } catch (e) {
      Logger.log(e);
    }

    return fallback;
  },

  disableLegacyFastRefresh: function() {
    var handler = this.LEGACY_FAST_HANDLER;
    var removed = 0;

    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === handler) {
        ScriptApp.deleteTrigger(trigger);
        removed += 1;
      }
    });

    return removed;
  }

};

function TI_AutoMaintenanceSync() {
  return TI.BatchSync.runMaintenance();
}

function TI_MaintenanceSync() {
  TI.BatchSync.start("manual", "maintenance");
  var state = TI.BatchSync.runNext();

  SpreadsheetApp.getUi().alert(TI.BatchSync.statusText(state));
}

function TI_EnableMaintenanceSync() {
  TI.AutoMaintenance.ensureSettings();
  var removedFast = TI.AutoMaintenance.disableLegacyFastRefresh();
  var count = TI.BatchSync.enableMaintenance();
  var days = TI.AutoMaintenance.days();

  SpreadsheetApp.getUi().alert(
    "Редкое автообновление данных включено.\n\n" +
    "Период: раз в " + days + " дн.\n" +
    "Время запуска: около 05:00\n" +
    "Активных расписаний: " + count + "\n" +
    "Отключено старых быстрых расписаний: " + removedFast
  );
}

function TI_DisableMaintenanceSync() {
  var count = TI.BatchSync.disableMaintenance();

  SpreadsheetApp.getUi().alert(
    "Редкое автообновление данных отключено.\n\n" +
    "Активных расписаний: " + count
  );
}

function TI_AutoRefreshFastData() {
  var removed = TI.AutoMaintenance.disableLegacyFastRefresh();

  return {
    status: "disabled",
    removed: removed,
    reason: "Заменено редким автообновлением данных."
  };
}
