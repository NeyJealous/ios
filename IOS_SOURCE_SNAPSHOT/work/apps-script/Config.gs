/**
 * ==========================================
 * TInvest Sync v2
 * Конфигурация проекта
 * ==========================================
 */

var CONFIG = {

  // REST API
  API_URL: "https://invest-public-api.tinkoff.ru/rest",

  // Кэш (5 минут)
  CACHE_SECONDS: 300,

  // Листы
  SHEETS: {
    SETTINGS: "Настройки",
    TRADES: "Сделки",
    PORTFOLIO: "Портфель",
    DIVIDENDS: "Дивиденды",
    STRUCTURE: "Структура",
    BALANCE: "Баланс",
    PRICES: "Цены",
    INSTRUMENTS: "Инструменты",
    LOG: "Лог"
  },

  // Загружаем историю с этой даты
  START_DATE: "2026-04-01T00:00:00Z",

  // Размер страницы API
  PAGE_LIMIT: 1000

};

var API = {

  USERS:
    "tinkoff.public.invest.api.contract.v1.UsersService",

  OPERATIONS:
    "tinkoff.public.invest.api.contract.v1.OperationsService",

  INSTRUMENTS:
    "tinkoff.public.invest.api.contract.v1.InstrumentsService",

  MARKET_DATA:
    "tinkoff.public.invest.api.contract.v1.MarketDataService"

};

/**
 * Получить токен
 */
function TI_GetToken() {

  var token = PropertiesService
    .getScriptProperties()
    .getProperty("TOKEN");

  if (!token) {
    throw new Error(
      "Не задан токен API."
    );
  }

  return token;

}

/**
 * Сохранить токен
 */
function TI_SaveToken(token) {

  token = String(token || "").trim();

  if (token === "") {
    throw new Error("Токен не может быть пустым.");
  }

  PropertiesService
    .getScriptProperties()
    .setProperty("TOKEN", token);

  SpreadsheetApp
    .getUi()
    .alert("✅ Токен успешно сохранён.");

}

/**
 * Удалить токен
 */
function TI_DeleteToken() {

  PropertiesService
    .getScriptProperties()
    .deleteProperty("TOKEN");

  SpreadsheetApp
    .getUi()
    .alert("🗑️ Токен удалён.");

}

/**
 * Проверить наличие токена
 */
function TI_HasToken() {

  return !!PropertiesService
    .getScriptProperties()
    .getProperty("TOKEN");

}

/**
 * Получить CacheService
 */
function TI_GetCache() {

  return CacheService.getScriptCache();

}

/**
 * Очистить кэш
 */
function TI_ClearCache() {

  CacheService
    .getScriptCache()
    .removeAll([
      "accounts",
      "operations",
      "portfolio",
      "prices",
      "instruments"
    ]);

}

