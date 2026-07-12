/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Menu.gs
 * Версия: 1.0.0
 * Назначение:
 *   Главное меню Google Sheets.
 *
 * История изменений:
 *   1.0.0 - Меню приведено к архитектуре Core/Schema.
 * ============================================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu(CORE.PROJECT.NAME);

  menu
    .addSubMenu(ui.createMenu("Настройка")
      .addItem("Настроить токен", "TI_ShowTokenDialog")
      .addItem("Проверить подключение", "TI_TestConnection")
      .addItem("Подготовить листы", "TI_InitializeSheets")
      .addItem("Заполнить настройки", "TI_InitializeSettings")
      .addItem("Заполнить стратегию", "TI_InitializeStrategy")
      .addItem("Заполнить инвестиционную конституцию", "TI_InitializeConstitution")
      .addItem("Заполнить счета и стратегии", "TI_InitializeMultiAccount")
      .addItem("Заполнить правила стратегии", "TI_InitializeStrategyRules"))
    .addSubMenu(ui.createMenu("Синхронизация")
      .addItem("Быстро обновить портфель", "TI_QuickSync")
      .addItem("Полная синхронизация данных", "TI_FullSync")
      .addItem("Пересчитать рекомендации", "TI_RecalculateRecommendations")
      .addSeparator()
      .addItem("Статус синхронизации", "TI_ShowBatchSyncStatus")
      .addItem("Остановить синхронизацию", "TI_StopBatchSync")
      .addSeparator()
      .addItem("Включить быстрое автообновление 21:00", "TI_EnableDailySync")
      .addItem("Отключить автообновление", "TI_DisableDailySync"))
    .addSubMenu(ui.createMenu("Редкие данные")
      .addItem("Обновить редкие данные сейчас", "TI_MaintenanceSync")
      .addItem("Включить редкое автообновление", "TI_EnableMaintenanceSync")
      .addItem("Отключить редкое автообновление", "TI_DisableMaintenanceSync"))
    .addSubMenu(ui.createMenu("Обновление рыночных данных")
      .addItem("Обновить из портфеля и сделок", "TI_UpdateDirectory")
      .addItem("Оптимизировать: только биржевые", "TI_OptimizeDirectoryExchangeOnly")
      .addItem("Обновить биржевой справочник пакетно", "TI_StartDirectoryBatch")
      .addItem("Статус обновления справочника", "TI_ShowDirectoryBatchStatus")
      .addItem("Остановить обновление справочника", "TI_StopDirectoryBatch"))
    .addSubMenu(ui.createMenu("Расчёты")
      .addItem("Синхронизировать сделки", "TI_SyncTrades")
      .addItem("Пересобрать сделки", "TI_RebuildTrades")
      .addItem("Построить FIFO", "TI_BuildFIFO")
      .addItem("Построить портфель", "TI_BuildPortfolio")
      .addItem("Обновить цены", "TI_UpdatePrices")
      .addItem("Доходы и денежные потоки", "TI_BuildIncome")
      .addItem("Обновить инфляцию", "TI_UpdateInflation")
      .addItem("Рассчитать налоги", "TI_BuildTax")
      .addItem("Рассчитать ребалансировку", "TI_BuildRebalance")
      .addItem("Построить план сделок", "TI_BuildTradePlan")
      .addItem("Пересчитать решения", "TI_BuildDecisions")
      .addItem("Оценить здоровье портфеля", "TI_BuildPortfolioHealth")
      .addItem("Рассчитать интеллект портфеля", "TI_BuildPortfolioIntelligence")
      .addItem("Обновить факты и оценки", "TI_BuildKnowledgeEngine")
      .addItem("Рассчитать режим рынка", "TI_BuildMarketRegime")
      .addItem("Рассчитать рейтинги компаний", "TI_BuildCompanyRating")
      .addItem("Рассчитать облигации", "TI_BuildBondAnalysis")
      .addItem("Оценить активы", "TI_BuildAssetScoring")
      .addItem("Рассчитать индекс возможностей", "TI_BuildCOI")
      .addItem("Обновить стратегические цели", "TI_UpdateStrategyTargets"))
    .addSubMenu(ui.createMenu("Аналитика")
      .addItem("Обновить главную", "TI_UpdateMain")
      .addItem("Обновить визуализацию", "TI_BuildVisualization")
      .addItem("Оформить интерфейс", "TI_ApplyUI")
      .addItem("Обновить советник", "TI_BuildAdvisor")
      .addItem("Обновить стратегический советник", "TI_BuildStrategyAdvisor")
      .addItem("Обновить статус данных источников", "TI_RefreshDataCacheStatus")
      .addItem("Запустить диагностику", "TI_RunDiagnostics")
      .addItem("Запустить стабилизационные проверки", "TI_RunStabilizationChecks")
      .addItem("Запустить smoke-тесты", "TI_RunSmokeTests"))
    .addToUi();
}

/**
 * Диалог токена.
 */
function TI_ShowTokenDialog() {
  var html = HtmlService
    .createHtmlOutputFromFile("TokenDialog")
    .setWidth(450)
    .setHeight(240);

  SpreadsheetApp
    .getUi()
    .showModalDialog(html, "Настройка токена");
}

/**
 * Подготовить листы по схеме.
 */
function TI_InitializeSheets() {
  Schema.initialize();
  var settingsCount = TI.Settings.ensureDefaults();
  var constitutionCount = TI.Constitution.ensureDefaults();
  var rulesCount = TI.RuleEngine.ensureDefaults();
  var multiAccountStats = TI.MultiAccount.ensureDefaults();

  SpreadsheetApp.getUi().alert(
    "Листы подготовлены по схеме проекта.\n\n" +
    "Добавлено настроек: " + (settingsCount + constitutionCount) + "\n" +
    "Добавлено правил: " + rulesCount + "\n" +
    "Счетов найдено: " + multiAccountStats.accounts.total
  );
}

/**
 * Мягко подготовить листы стратегического слоя v1.1.
 * Не запускает долгие API-синхронизации и не очищает пользовательские данные.
 */
function TI_EnsureV11Sheets() {
  try {
    Schema.prepareSheet(CORE.SHEETS.CONSTITUTION);
    Schema.prepareSheet(CORE.SHEETS.MARKET_REGIME);
    Schema.prepareSheet(CORE.SHEETS.COMPANY_RATING);
    TI.Constitution.ensureDefaults();
  } catch (e) {
    Logger.log(e);
  }
}

/**
 * Проверить соединение с API.
 */
function TI_TestConnection() {
  try {
    var result = TI.Api.test();

    SpreadsheetApp.getUi().alert(
      "Подключение успешно.\n\n" +
      "Счетов найдено: " + ((result.accounts || []).length)
    );
  } catch (e) {
    SpreadsheetApp.getUi().alert(e.toString());
    throw e;
  }
}

/**
 * Пакетная полная синхронизация.
 */
function TI_FullSync() {
  TI.BatchSync.start("manual", "full");
  var state = TI.BatchSync.runNext();

  SpreadsheetApp.getUi().alert(TI.BatchSync.statusText(state));
}

