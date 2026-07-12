/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Core.gs
 * Версия: 1.1.0
 * Назначение:
 *   Центральная конфигурация проекта.
 * ============================================================
 */

var CORE = Object.freeze({

  PROJECT: Object.freeze({
    NAME: "Инвестиционный помощник",
    VERSION: "1.1.0",
    API: "Т-Инвестиции",
    ACCOUNTING_METHOD: "FIFO"
  }),

  SHEETS: Object.freeze({
    MAIN: "Главная",
    VISUALIZATION: "Визуализация",
    DIAGNOSTICS: "Диагностика",
    SMOKE_TESTS: "Smoke-тесты",
    STABILIZATION: "Стабилизация",
    TECH_LOG: "Технический журнал",
    DATA_CACHE: "Данные источников",
    ADVISOR: "Советник",
    PORTFOLIO: "Портфель",
    TRADES: "Сделки",
    FIFO_LOTS: "Лоты FIFO",
    FIFO_SALES: "Продажи FIFO",
    FIFO_ERRORS: "Ошибки FIFO",
    DIVIDENDS: "Дивиденды",
    COUPONS: "Купоны",
    CASHFLOW: "Денежные потоки",
    INFLATION: "Инфляция",
    TAX: "Налоги",
    REBALANCE: "Ребалансировка",
    TRADE_PLAN: "План сделок",
    STRATEGY_RULES: "Правила стратегии",
    DECISIONS: "Решения",
    ACCOUNTS: "Счета",
    STRATEGIES: "Стратегии",
    ACCOUNT_STRATEGIES: "Стратегии счетов",
    PORTFOLIO_HEALTH: "Здоровье портфеля",
    PORTFOLIO_INTELLIGENCE: "Интеллект портфеля",
    BOND_ANALYSIS: "Анализ облигаций",
    ASSET_SCORING: "Оценка активов",
    COI: "Индекс возможностей",
    STRATEGY: "Инвестиционная стратегия",
    CONSTITUTION: "Конституция",
    MARKET_REGIME: "Режим рынка",
    COMPANY_RATING: "Рейтинг компаний",
    FACTS: "Факты",
    FEATURES: "Признаки",
    SCORES: "Оценки",
    SETTINGS: "Настройки",
    DIRECTORY: "Справочник"
  }),

  SERVICE_SHEETS: Object.freeze({
    API_OPERATIONS: "API Операции",
    API_ACCOUNTS: "API Счета",
    CACHE: "Кэш",
    LOG: "Журнал"
  }),

  OPERATION_TYPES: Object.freeze({
    OPERATION_TYPE_BUY: "Покупка",
    OPERATION_TYPE_BUY_CARD: "Покупка",
    OPERATION_TYPE_BUY_MARGIN: "Покупка",
    OPERATION_TYPE_SELL: "Продажа",
    OPERATION_TYPE_SELL_CARD: "Продажа",
    OPERATION_TYPE_SELL_MARGIN: "Продажа",
    OPERATION_TYPE_INPUT: "Пополнение",
    OPERATION_TYPE_OUTPUT: "Вывод средств",
    OPERATION_TYPE_DIVIDEND: "Дивиденды",
    OPERATION_TYPE_DIV_EXT: "Дивиденды",
    OPERATION_TYPE_COUPON: "Купоны",
    OPERATION_TYPE_BROKER_FEE: "Комиссия брокера",
    OPERATION_TYPE_SERVICE_FEE: "Комиссия за обслуживание",
    OPERATION_TYPE_MARGIN_FEE: "Маржинальная комиссия",
    OPERATION_TYPE_SUCCESS_FEE: "Комиссия за успех",
    OPERATION_TYPE_OTHER_FEE: "Прочая комиссия",
    OPERATION_TYPE_TAX: "Налог",
    OPERATION_TYPE_TAX_BACK: "Возврат налога",
    OPERATION_TYPE_TAX_DIVIDEND: "Налог с дивидендов",
    OPERATION_TYPE_TAX_COUPON: "Налог с купонов"
  }),

  OPERATION_GROUPS: Object.freeze({
    BUY: Object.freeze([
      "OPERATION_TYPE_BUY",
      "OPERATION_TYPE_BUY_CARD",
      "OPERATION_TYPE_BUY_MARGIN"
    ]),
    SELL: Object.freeze([
      "OPERATION_TYPE_SELL",
      "OPERATION_TYPE_SELL_CARD",
      "OPERATION_TYPE_SELL_MARGIN"
    ]),
    DIVIDENDS: Object.freeze([
      "OPERATION_TYPE_DIVIDEND",
      "OPERATION_TYPE_DIV_EXT"
    ]),
    COUPONS: Object.freeze([
      "OPERATION_TYPE_COUPON"
    ]),
    TAXES: Object.freeze([
      "OPERATION_TYPE_TAX",
      "OPERATION_TYPE_TAX_BACK",
      "OPERATION_TYPE_TAX_DIVIDEND",
      "OPERATION_TYPE_TAX_COUPON"
    ]),
    COMMISSIONS: Object.freeze([
      "OPERATION_TYPE_BROKER_FEE",
      "OPERATION_TYPE_SERVICE_FEE",
      "OPERATION_TYPE_MARGIN_FEE",
      "OPERATION_TYPE_SUCCESS_FEE",
      "OPERATION_TYPE_OTHER_FEE"
    ]),
    DEPOSITS: Object.freeze([
      "OPERATION_TYPE_INPUT",
      "OPERATION_TYPE_INP_MULTI"
    ]),
    WITHDRAWALS: Object.freeze([
      "OPERATION_TYPE_OUTPUT",
      "OPERATION_TYPE_OUT_MULTI"
    ])
  }),

  CURRENCIES: Object.freeze({
    BASE: "RUB",
    RUB: "RUB",
    USD: "USD",
    EUR: "EUR",
    CNY: "CNY"
  }),

  FEATURES: Object.freeze({
    FIFO: true,
    TAX: true,
    INFLATION: true,
    ADVISOR: true,
    REBALANCE: true
  }),

  SETTINGS: Object.freeze({
    CACHE_MINUTES: 5,
    ROUND_DIGITS: 2,
    DATE_FORMAT: "dd.MM.yyyy",
    PRICE_CACHE_SECONDS: 300,
    TAX_RATE: 0.13,
    INFLATION_RATE: 0,
    REBALANCE_THRESHOLD: 0.01
  })

});

/**
 * Возвращает русское название типа операции.
 *
 * @param {string} apiType
 * @return {string}
 */
function getOperationTitle(apiType) {
  return CORE.OPERATION_TYPES[apiType] || apiType || "";
}

