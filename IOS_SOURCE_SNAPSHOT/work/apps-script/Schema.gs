/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Schema.gs
 * Версия: 1.0.0
 * Часть: 1 из N
 *
 * Назначение:
 *   Описание структуры листов проекта и универсальные
 *   функции работы со схемой.
 * ============================================================
 */

/**
 * Пространство имён схемы.
 */
var Schema = Schema || {};

/**
 * Типы данных.
 */
Schema.Types = Object.freeze({
  TEXT: "text",
  NUMBER: "number",
  MONEY: "money",
  PERCENT: "percent",
  DATE: "date",
  BOOLEAN: "boolean",
  OPERATION: "operation"
});

/**
 * Внутренние ключи листов.
 */
Schema.SheetKeys = Object.freeze({
  TRADES: "TRADES",
  FIFO_LOTS: "FIFO_LOTS",
  FIFO_SALES: "FIFO_SALES",
  FIFO_ERRORS: "FIFO_ERRORS",
  DIAGNOSTICS: "DIAGNOSTICS",
  SMOKE_TESTS: "SMOKE_TESTS",
  STABILIZATION: "STABILIZATION",
  TECH_LOG: "TECH_LOG",
  DATA_CACHE: "DATA_CACHE",
  MAIN: "MAIN",
  PORTFOLIO: "PORTFOLIO",
  DIVIDENDS: "DIVIDENDS",
  COUPONS: "COUPONS",
  CASHFLOW: "CASHFLOW",
  INFLATION: "INFLATION",
  ADVISOR: "ADVISOR",
  STRATEGY: "STRATEGY",
  CONSTITUTION: "CONSTITUTION",
  MARKET_REGIME: "MARKET_REGIME",
  COMPANY_RATING: "COMPANY_RATING",
  FACTS: "FACTS",
  FEATURES: "FEATURES",
  SCORES: "SCORES",
  TAX: "TAX",
  REBALANCE: "REBALANCE",
  TRADE_PLAN: "TRADE_PLAN",
  STRATEGY_RULES: "STRATEGY_RULES",
  DECISIONS: "DECISIONS",
  ACCOUNTS: "ACCOUNTS",
  STRATEGIES: "STRATEGIES",
  ACCOUNT_STRATEGIES: "ACCOUNT_STRATEGIES",
  PORTFOLIO_HEALTH: "PORTFOLIO_HEALTH",
  PORTFOLIO_INTELLIGENCE: "PORTFOLIO_INTELLIGENCE",
  BOND_ANALYSIS: "BOND_ANALYSIS",
  ASSET_SCORING: "ASSET_SCORING",
  COI: "COI",
  SETTINGS: "SETTINGS",
  DIRECTORY: "DIRECTORY"
});

/**
 * Описание листов.
 */
Schema.Definitions = {

  /**
   * Лист "Сделки"
   */
  TRADES: [

    {
      field: "tradeDate",
      title: "Дата сделки",
      type: Schema.Types.DATE,
      hidden: false,
      width: 110
    },

    {
      field: "ticker",
      title: "Тикер",
      type: Schema.Types.TEXT,
      hidden: false,
      width: 90
    },

    {
      field: "name",
      title: "Название",
      type: Schema.Types.TEXT,
      hidden: false,
      width: 220
    },

    {
      field: "operationType",
      title: "Операция",
      type: Schema.Types.OPERATION,
      hidden: false,
      width: 140
    },

    {
      field: "quantity",
      title: "Количество",
      type: Schema.Types.NUMBER,
      hidden: false,
      width: 100
    },

    {
      field: "price",
      title: "Цена",
      type: Schema.Types.MONEY,
      hidden: false,
      width: 110
    },

    {
      field: "tradeAmount",
      title: "Сумма сделки",
      type: Schema.Types.MONEY,
      hidden: false,
      width: 130
    },

    {
      field: "commission",
      title: "Комиссия",
      type: Schema.Types.MONEY,
      hidden: false,
      width: 110
    },

    {
      field: "currency",
      title: "Валюта",
      type: Schema.Types.TEXT,
      hidden: false,
      width: 80
    },

    {
      field: "accountName",
      title: "Счёт",
      type: Schema.Types.TEXT,
      hidden: false,
      width: 120
    },

    {
      field: "tradeId",
      title: "ID сделки",
      type: Schema.Types.TEXT,
      hidden: true,
      width: 220
    },

    {
      field: "operationId",
      title: "ID операции",
      type: Schema.Types.TEXT,
      hidden: true,
      width: 220
    },

    {
      field: "operationTypeCode",
      title: "Код операции",
      type: Schema.Types.TEXT,
      hidden: true,
      width: 180
    },

    {
      field: "accountId",
      title: "ID счёта",
      type: Schema.Types.TEXT,
      hidden: true,
      width: 220
    },

    {
      field: "instrumentType",
      title: "Тип инструмента",
      type: Schema.Types.TEXT,
      hidden: true,
      width: 160
    },

    {
      field: "assetUid",
      title: "UID актива",
      type: Schema.Types.TEXT,
      hidden: true,
      width: 220
    },

    {
      field: "figi",
      title: "FIGI",
      type: Schema.Types.TEXT,
      hidden: true,
      width: 180
    },

    {
      field: "instrumentUid",
      title: "UID инструмента",
      type: Schema.Types.TEXT,
      hidden: true,
      width: 220
    }

  ]

};


/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Schema.gs
 * Версия: 1.0.0
 * Часть: 2 из N
 *
 * Продолжение Schema.Definitions
 * ============================================================
 */

Object.assign(Schema.Definitions, {

  /**
   * Лист "Лоты FIFO"
   */
  FIFO_LOTS: [

    { field:"ticker",       title:"Тикер",                  type:Schema.Types.TEXT,    hidden:false, width:90 },
    { field:"name",         title:"Название",               type:Schema.Types.TEXT,    hidden:false, width:220 },
    { field:"buyDate",      title:"Дата покупки",           type:Schema.Types.DATE,    hidden:false, width:110 },
    { field:"quantity",     title:"Куплено",                type:Schema.Types.NUMBER,  hidden:false, width:90 },
    { field:"quantityLeft", title:"Осталось",               type:Schema.Types.NUMBER,  hidden:false, width:90 },
    { field:"buyPrice",     title:"Цена покупки",           type:Schema.Types.MONEY,   hidden:false, width:110 },
    { field:"costLeft",     title:"Себестоимость остатка",  type:Schema.Types.MONEY,   hidden:false, width:150 },
    { field:"marketPrice",  title:"Рыночная цена",          type:Schema.Types.MONEY,   hidden:false, width:120 },
    { field:"profit",       title:"Доходность",             type:Schema.Types.PERCENT, hidden:false, width:110 },
    { field:"ageDays",      title:"Возраст лота",           type:Schema.Types.NUMBER,  hidden:false, width:100 },

    { field:"lotId",         title:"ID лота",              type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"tradeId",       title:"ID сделки",            type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"operationId",   title:"ID операции",          type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"accountId",     title:"ID счёта",             type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"instrumentType",title:"Тип инструмента",      type:Schema.Types.TEXT, hidden:true, width:160 },
    { field:"assetUid",      title:"UID актива",           type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"figi",          title:"FIGI",                 type:Schema.Types.TEXT, hidden:true, width:160 },
    { field:"instrumentUid", title:"UID инструмента",      type:Schema.Types.TEXT, hidden:true, width:220 }

  ],

  /**
   * Лист "Продажи FIFO"
   */
  FIFO_SALES: [

    { field:"ticker",       title:"Тикер",             type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"buyDate",      title:"Дата покупки",      type:Schema.Types.DATE,   hidden:false, width:110 },
    { field:"sellDate",     title:"Дата продажи",      type:Schema.Types.DATE,   hidden:false, width:110 },
    { field:"quantity",     title:"Количество",        type:Schema.Types.NUMBER, hidden:false, width:90 },
    { field:"buyPrice",     title:"Цена покупки",      type:Schema.Types.MONEY,  hidden:false, width:110 },
    { field:"sellPrice",    title:"Цена продажи",      type:Schema.Types.MONEY,  hidden:false, width:110 },
    { field:"cost",         title:"Себестоимость",     type:Schema.Types.MONEY,  hidden:false, width:130 },
    { field:"proceeds",     title:"Выручка",           type:Schema.Types.MONEY,  hidden:false, width:130 },
    { field:"profit",       title:"Прибыль",           type:Schema.Types.MONEY,  hidden:false, width:130 },
    { field:"ndflBase",     title:"Налоговая база",    type:Schema.Types.MONEY,  hidden:false, width:140 },

    { field:"lotId",        title:"ID лота",           type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"buyTradeId",   title:"ID покупки",        type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"sellTradeId",  title:"ID продажи",        type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"accountId",    title:"ID счёта",           type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"assetUid",     title:"UID актива",         type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"figi",         title:"FIGI",               type:Schema.Types.TEXT, hidden:true, width:160 },
    { field:"instrumentUid",title:"UID инструмента",    type:Schema.Types.TEXT, hidden:true, width:220 }

  ],

  /**
   * Лист "Ошибки FIFO"
   */
  FIFO_ERRORS: [

    { field:"ticker",             title:"Тикер",                 type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"message",            title:"Ошибка",                type:Schema.Types.TEXT,   hidden:false, width:320 },
    { field:"quantityNotCovered", title:"Непокрытое количество", type:Schema.Types.NUMBER, hidden:false, width:160 },

    { field:"tradeId",       title:"ID сделки",       type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"accountId",     title:"ID счёта",        type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"assetUid",      title:"UID актива",      type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"figi",          title:"FIGI",            type:Schema.Types.TEXT, hidden:true, width:160 },
    { field:"instrumentUid", title:"UID инструмента", type:Schema.Types.TEXT, hidden:true, width:220 }

  ]

});


/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Schema.gs
 * Версия: 1.0.0
 * Часть: 3 из N
 *
 * Схемы пользовательских листов
 * ============================================================
 */

Object.assign(Schema.Definitions, {

  /**
   * Лист "Портфель"
   */
  PORTFOLIO: [

    { field:"accountName",    title:"Счёт",                 type:Schema.Types.TEXT,    hidden:false, width:140 },
    { field:"ticker",         title:"Тикер",                 type:Schema.Types.TEXT,    hidden:false, width:90 },
    { field:"name",           title:"Название",              type:Schema.Types.TEXT,    hidden:false, width:220 },
    { field:"instrumentType", title:"Тип инструмента",       type:Schema.Types.TEXT,    hidden:false, width:140 },
    { field:"sector",         title:"Отрасль",               type:Schema.Types.TEXT,    hidden:false, width:160 },
    { field:"issuer",         title:"Эмитент",               type:Schema.Types.TEXT,    hidden:false, width:180 },
    { field:"quantity",       title:"Количество",            type:Schema.Types.NUMBER,  hidden:false, width:100 },
    { field:"averagePrice",   title:"Средняя цена",          type:Schema.Types.MONEY,   hidden:false, width:120 },
    { field:"currentPrice",   title:"Текущая цена",          type:Schema.Types.MONEY,   hidden:false, width:120 },
    { field:"lot",            title:"Лот",                   type:Schema.Types.NUMBER,  hidden:false, width:80 },
    { field:"marketValue",    title:"Рыночная стоимость",    type:Schema.Types.MONEY,   hidden:false, width:150 },
    { field:"cost",           title:"Себестоимость",         type:Schema.Types.MONEY,   hidden:false, width:140 },
    { field:"profit",         title:"Прибыль",               type:Schema.Types.MONEY,   hidden:false, width:120 },
    { field:"profitPercent",  title:"Доходность",            type:Schema.Types.PERCENT, hidden:false, width:120 },
    { field:"portfolioShare", title:"Доля в портфеле",       type:Schema.Types.PERCENT, hidden:false, width:120 },

    { field:"accountId",      title:"ID счёта",              type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"assetUid",       title:"UID актива",            type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"figi",           title:"FIGI",                  type:Schema.Types.TEXT, hidden:true, width:160 },
    { field:"instrumentUid",  title:"UID инструмента",       type:Schema.Types.TEXT, hidden:true, width:220 }

  ],

  /**
   * Лист "Дивиденды"
   */
  DIVIDENDS: [

    { field:"paymentDate", title:"Дата выплаты",   type:Schema.Types.DATE,   hidden:false, width:110 },
    { field:"ticker",      title:"Тикер",          type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"name",        title:"Название",       type:Schema.Types.TEXT,   hidden:false, width:220 },
    { field:"amount",      title:"Сумма",          type:Schema.Types.MONEY,  hidden:false, width:120 },
    { field:"currency",    title:"Валюта",         type:Schema.Types.TEXT,   hidden:false, width:80 },
    { field:"tax",         title:"Удержан налог",  type:Schema.Types.MONEY,  hidden:false, width:120 }

  ],

  /**
   * Лист "Купоны"
   */
  COUPONS: [

    { field:"paymentDate", title:"Дата выплаты",   type:Schema.Types.DATE,   hidden:false, width:110 },
    { field:"ticker",      title:"Тикер",          type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"name",        title:"Название",       type:Schema.Types.TEXT,   hidden:false, width:220 },
    { field:"amount",      title:"Сумма",          type:Schema.Types.MONEY,  hidden:false, width:120 },
    { field:"currency",    title:"Валюта",         type:Schema.Types.TEXT,   hidden:false, width:80 },
    { field:"tax",         title:"Удержан налог",  type:Schema.Types.MONEY,  hidden:false, width:120 }

  ],

  /**
   * Лист "Денежные потоки"
   */
  CASHFLOW: [

    { field:"date",         title:"Дата",             type:Schema.Types.DATE,   hidden:false, width:110 },
    { field:"operationType",title:"Операция",         type:Schema.Types.OPERATION, hidden:false, width:140 },
    { field:"amount",       title:"Сумма",            type:Schema.Types.MONEY,  hidden:false, width:120 },
    { field:"currency",     title:"Валюта",           type:Schema.Types.TEXT,   hidden:false, width:80 },
    { field:"comment",      title:"Комментарий",      type:Schema.Types.TEXT,   hidden:false, width:250 }

  ]

});


/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Schema.gs
 * Версия: 1.0.0
 * Часть: 4 из N
 *
 * Дополнительные пользовательские листы
 * ============================================================
 */

Object.assign(Schema.Definitions, {

  MAIN: [
    { field:"section",    title:"Раздел",       type:Schema.Types.TEXT,  hidden:false, width:170 },
    { field:"metric",     title:"Показатель",   type:Schema.Types.TEXT,  hidden:false, width:260 },
    { field:"value",      title:"Значение",     type:Schema.Types.TEXT,  hidden:false, width:220 },
    { field:"status",     title:"Статус",       type:Schema.Types.TEXT,  hidden:false, width:110 },
    { field:"comment",    title:"Комментарий",  type:Schema.Types.TEXT,  hidden:false, width:420 },
    { field:"updatedAt",  title:"Обновлено",    type:Schema.Types.DATE,  hidden:false, width:130 }
  ],

  VISUALIZATION: [
    { field:"section",    title:"Раздел",       type:Schema.Types.TEXT,   hidden:false, width:170 },
    { field:"name",       title:"Название",     type:Schema.Types.TEXT,   hidden:false, width:240 },
    { field:"value",      title:"Стоимость",    type:Schema.Types.MONEY,  hidden:false, width:140 },
    { field:"share",      title:"Доля",         type:Schema.Types.PERCENT,hidden:false, width:110 },
    { field:"comment",    title:"Комментарий",  type:Schema.Types.TEXT,   hidden:false, width:320 }
  ],

  DIAGNOSTICS: [
    { field:"status",     title:"Статус",       type:Schema.Types.TEXT, hidden:false, width:110 },
    { field:"area",       title:"Раздел",       type:Schema.Types.TEXT, hidden:false, width:160 },
    { field:"check",      title:"Проверка",     type:Schema.Types.TEXT, hidden:false, width:260 },
    { field:"message",    title:"Сообщение",    type:Schema.Types.TEXT, hidden:false, width:420 },
    { field:"action",     title:"Что сделать",  type:Schema.Types.TEXT, hidden:false, width:360 },
    { field:"updatedAt",  title:"Обновлено",    type:Schema.Types.DATE, hidden:false, width:130 }
  ],

  SMOKE_TESTS: [
    { field:"name",       title:"Проверка",          type:Schema.Types.TEXT,   hidden:false, width:260 },
    { field:"status",     title:"Статус",            type:Schema.Types.TEXT,   hidden:false, width:110 },
    { field:"message",    title:"Сообщение",         type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"durationMs", title:"Длительность, мс",  type:Schema.Types.NUMBER, hidden:false, width:130 },
    { field:"details",    title:"Детали",            type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"updatedAt",  title:"Обновлено",         type:Schema.Types.DATE,   hidden:false, width:130 }
  ],

  STABILIZATION: [
    { field:"status",     title:"Статус",            type:Schema.Types.TEXT,   hidden:false, width:110 },
    { field:"area",       title:"Раздел",            type:Schema.Types.TEXT,   hidden:false, width:170 },
    { field:"check",      title:"Проверка",          type:Schema.Types.TEXT,   hidden:false, width:260 },
    { field:"message",    title:"Сообщение",         type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"action",     title:"Что сделать",       type:Schema.Types.TEXT,   hidden:false, width:380 },
    { field:"durationMs", title:"Длительность, мс",  type:Schema.Types.NUMBER, hidden:false, width:130 },
    { field:"updatedAt",  title:"Обновлено",         type:Schema.Types.DATE,   hidden:false, width:130 }
  ],

  TECH_LOG: [
    { field:"timestamp",  title:"Время",             type:Schema.Types.DATE,   hidden:false, width:150 },
    { field:"level",      title:"Уровень",           type:Schema.Types.TEXT,   hidden:false, width:100 },
    { field:"source",     title:"Модуль",            type:Schema.Types.TEXT,   hidden:false, width:160 },
    { field:"action",     title:"Действие",          type:Schema.Types.TEXT,   hidden:false, width:220 },
    { field:"message",    title:"Сообщение",         type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"durationMs", title:"Длительность, мс",  type:Schema.Types.NUMBER, hidden:false, width:130 },
    { field:"details",    title:"Детали",            type:Schema.Types.TEXT,   hidden:false, width:420 }
  ],

  DATA_CACHE: [
    { field:"key",        title:"Ключ",              type:Schema.Types.TEXT,   hidden:false, width:280 },
    { field:"source",     title:"Источник",          type:Schema.Types.TEXT,   hidden:false, width:180 },
    { field:"updatedAt",  title:"Обновлено",         type:Schema.Types.DATE,   hidden:false, width:140 },
    { field:"ttlSeconds", title:"Актуально, секунд", type:Schema.Types.NUMBER, hidden:false, width:140 },
    { field:"stale",      title:"Данные устарели",   type:Schema.Types.TEXT,   hidden:false, width:130 },
    { field:"data",       title:"Данные",            type:Schema.Types.TEXT,   hidden:true,  width:420 },
    { field:"comment",    title:"Комментарий",       type:Schema.Types.TEXT,   hidden:false, width:360 }
  ],

  ADVISOR: [
    { field:"priority",     title:"Приоритет",           type:Schema.Types.TEXT,    hidden:false, width:90 },
    { field:"category",     title:"Категория",           type:Schema.Types.TEXT,    hidden:false, width:120 },
    { field:"accountName",  title:"Счёт",                type:Schema.Types.TEXT,    hidden:false, width:140 },
    { field:"ticker",       title:"Инструмент",          type:Schema.Types.TEXT,    hidden:false, width:120 },
    { field:"recommendation",title:"Рекомендация",       type:Schema.Types.TEXT,    hidden:false, width:420 },
    { field:"reason",       title:"Обоснование",         type:Schema.Types.TEXT,    hidden:false, width:320 },
    { field:"confidence",   title:"Уверенность",         type:Schema.Types.TEXT,    hidden:false, width:120 },
    { field:"risk",         title:"Риск",                type:Schema.Types.TEXT,    hidden:false, width:260 },
    { field:"nextStep",     title:"Следующий шаг",       type:Schema.Types.TEXT,    hidden:false, width:320 },
    { field:"effect",       title:"Ожидаемый эффект",    type:Schema.Types.TEXT,    hidden:false, width:220 }
  ],

  STRATEGY: [
    {
      field:"parameter",
      title:"Разрез",
      type:Schema.Types.TEXT,
      hidden:false,
      width:160,
      editable:true,
      required:true,
      validator:["Тикер", "Тип инструмента", "Отрасль", "Эмитент", "Резерв"],
      description:"По какому признаку контролировать долю."
    },
    {
      field:"value",
      title:"Значение",
      type:Schema.Types.TEXT,
      hidden:false,
      width:180,
      editable:true,
      required:true,
      validator:{
        rangeSheet:CORE.SHEETS.DIRECTORY,
        rangeColumn:1,
        startRow:2,
        allowInvalid:true
      },
      description:"Тикер, тип инструмента, отрасль или эмитент."
    },
    {
      field:"targetShare",
      title:"Целевая доля",
      type:Schema.Types.PERCENT,
      hidden:false,
      width:120,
      editable:true,
      required:true,
      description:"Автоматическая или базовая целевая доля."
    },
    {
      field:"description",
      title:"Описание",
      type:Schema.Types.TEXT,
      hidden:false,
      width:420,
      editable:true,
      description:"Пояснение для себя и советника."
    },
    {
      field:"accountName",
      title:"Счёт",
      type:Schema.Types.TEXT,
      hidden:false,
      width:150,
      editable:true,
      description:"Пусто или Все счета - цель применяется ко всему портфелю."
    },
    {
      field:"source",
      title:"Источник",
      type:Schema.Types.TEXT,
      hidden:false,
      width:170,
      editable:true,
      description:"Ручная цель или рассчитана стратегией."
    },
    {
      field:"updatedAt",
      title:"Обновлено",
      type:Schema.Types.DATE,
      hidden:false,
      width:130,
      editable:false
    },
    {
      field:"manualTargetShare",
      title:"Ручная доля",
      type:Schema.Types.PERCENT,
      hidden:false,
      width:120,
      editable:true,
      required:false,
      description:"Если заполнено, используется вместо автоматической целевой доли."
    }
  ],

  TAX: [
    { field:"year",         title:"Год",                 type:Schema.Types.NUMBER,  hidden:false, width:80 },
    { field:"taxBase",      title:"Налоговая база",      type:Schema.Types.MONEY,   hidden:false, width:140 },
    { field:"taxRate",      title:"Ставка НДФЛ",         type:Schema.Types.PERCENT, hidden:false, width:120 },
    { field:"taxAmount",    title:"Сумма НДФЛ",          type:Schema.Types.MONEY,   hidden:false, width:140 },
    { field:"inflation",    title:"Инфляция",            type:Schema.Types.PERCENT, hidden:false, width:120 }
  ],

  INFLATION: [
    { field:"year",              title:"Год",                       type:Schema.Types.NUMBER,  hidden:false, width:80 },
    { field:"officialInflation", title:"Официальная инфляция",      type:Schema.Types.PERCENT, hidden:false, width:170 },
    { field:"perceivedInflation",title:"Инфляция по ощущениям",     type:Schema.Types.PERCENT, hidden:false, width:170 },
    { field:"usedInflation",     title:"Используется в расчётах",   type:Schema.Types.PERCENT, hidden:false, width:180 },
    { field:"source",            title:"Источник",                  type:Schema.Types.TEXT,    hidden:false, width:220 },
    { field:"updatedAt",         title:"Обновлено",                 type:Schema.Types.DATE,    hidden:false, width:130 },
    { field:"comment",           title:"Комментарий",               type:Schema.Types.TEXT,    hidden:false, width:320 }
  ],

  REBALANCE: [
    { field:"accountName",   title:"Счёт",                type:Schema.Types.TEXT,    hidden:false, width:140 },
    { field:"targetKind",   title:"Разрез",              type:Schema.Types.TEXT,    hidden:false, width:140 },
    { field:"targetName",   title:"Значение",            type:Schema.Types.TEXT,    hidden:false, width:180 },
    { field:"targetShare",  title:"Целевая доля",        type:Schema.Types.PERCENT, hidden:false, width:120 },
    { field:"targetValue",  title:"Целевая сумма",       type:Schema.Types.MONEY,   hidden:false, width:130 },
    { field:"currentValue", title:"Текущая сумма",       type:Schema.Types.MONEY,   hidden:false, width:130 },
    { field:"actualShare",  title:"Фактическая доля",    type:Schema.Types.PERCENT, hidden:false, width:140 },
    { field:"deviation",    title:"Отклонение",          type:Schema.Types.PERCENT, hidden:false, width:120 },
    { field:"tradeAmount",  title:"Сумма операции",      type:Schema.Types.MONEY,   hidden:false, width:130 },
    { field:"currentPrice", title:"Цена",                 type:Schema.Types.MONEY,   hidden:false, width:110 },
    { field:"lot",          title:"Лот",                  type:Schema.Types.NUMBER,  hidden:false, width:80 },
    { field:"lotsToTrade",  title:"Лотов",                type:Schema.Types.NUMBER,  hidden:false, width:90 },
    { field:"unitsToTrade", title:"Бумаг",                type:Schema.Types.NUMBER,  hidden:false, width:90 },
    { field:"roundedAmount",title:"Сумма по лотам",       type:Schema.Types.MONEY,   hidden:false, width:130 },
    { field:"availableCash",title:"Свободные деньги",    type:Schema.Types.MONEY,   hidden:false, width:140 },
    { field:"action",       title:"Рекомендация",        type:Schema.Types.TEXT,    hidden:false, width:220 }
  ],

  TRADE_PLAN: [
    { field:"accountName",   title:"Счёт",                type:Schema.Types.TEXT,   hidden:false, width:140 },
    { field:"strategy",      title:"Стратегия",           type:Schema.Types.TEXT,   hidden:false, width:150 },
    { field:"action",        title:"Действие",            type:Schema.Types.TEXT,   hidden:false, width:100 },
    { field:"ticker",        title:"Тикер",               type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"targetKind",    title:"Разрез",              type:Schema.Types.TEXT,   hidden:false, width:130 },
    { field:"targetName",    title:"Цель",                type:Schema.Types.TEXT,   hidden:false, width:170 },
    { field:"currentPrice",  title:"Цена",                type:Schema.Types.MONEY,  hidden:false, width:110 },
    { field:"lot",           title:"Лот",                 type:Schema.Types.NUMBER, hidden:false, width:80 },
    { field:"lots",          title:"Лотов",               type:Schema.Types.NUMBER, hidden:false, width:90 },
    { field:"units",         title:"Бумаг",               type:Schema.Types.NUMBER, hidden:false, width:90 },
    { field:"amount",        title:"Сумма",               type:Schema.Types.MONEY,  hidden:false, width:130 },
    { field:"availableCash", title:"Свободные деньги",    type:Schema.Types.MONEY,  hidden:false, width:140 },
    { field:"rating",        title:"Рейтинг",             type:Schema.Types.NUMBER, hidden:false, width:90 },
    { field:"reason",        title:"Причина",             type:Schema.Types.TEXT,   hidden:false, width:360 },
    { field:"status",        title:"Статус",              type:Schema.Types.TEXT,   hidden:false, width:170 },
    { field:"comment",       title:"Комментарий",         type:Schema.Types.TEXT,   hidden:false, width:360 }
  ],

  STRATEGY_RULES: [
    { field:"ruleId",      title:"ID правила",       type:Schema.Types.TEXT,   hidden:true,  width:160 },
    { field:"version",     title:"Версия",           type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"scope",       title:"Область",          type:Schema.Types.TEXT,   hidden:false, width:110, validator:{ values:["GLOBAL", "STRATEGY", "ACCOUNT"], allowInvalid:false } },
    { field:"strategy",    title:"Стратегия",        type:Schema.Types.TEXT,   hidden:false, width:160 },
    { field:"accountName", title:"Счёт",             type:Schema.Types.TEXT,   hidden:false, width:150 },
    { field:"category",    title:"Категория",        type:Schema.Types.TEXT,   hidden:false, width:150 },
    { field:"priority",    title:"Приоритет",        type:Schema.Types.NUMBER, hidden:false, width:100 },
    { field:"enabled",     title:"Включено",         type:Schema.Types.TEXT,   hidden:false, width:100, validator:{ values:["Да", "Нет"], allowInvalid:false } },
    { field:"condition",   title:"Условие",          type:Schema.Types.TEXT,   hidden:false, width:220 },
    { field:"action",      title:"Действие",         type:Schema.Types.TEXT,   hidden:false, width:190 },
    { field:"parameter",   title:"Параметр",         type:Schema.Types.TEXT,   hidden:false, width:180 },
    { field:"explanation", title:"Объяснение",       type:Schema.Types.TEXT,   hidden:false, width:420 }
  ],

  DECISIONS: [
    { field:"accountName", title:"Счёт",                 type:Schema.Types.TEXT,   hidden:false, width:140 },
    { field:"strategy",    title:"Стратегия",            type:Schema.Types.TEXT,   hidden:false, width:150 },
    { field:"ticker",      title:"Тикер",                type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"action",      title:"Решение",              type:Schema.Types.TEXT,   hidden:false, width:170 },
    { field:"score",       title:"Оценка",               type:Schema.Types.NUMBER, hidden:false, width:90 },
    { field:"confidence",  title:"Уверенность",          type:Schema.Types.TEXT,   hidden:false, width:120 },
    { field:"reasons",     title:"Причины",              type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"risks",       title:"Риски",                type:Schema.Types.TEXT,   hidden:false, width:360 },
    { field:"rules",       title:"Сработавшие правила",  type:Schema.Types.TEXT,   hidden:true,  width:280 },
    { field:"nextStep",    title:"Следующий шаг",        type:Schema.Types.TEXT,   hidden:false, width:300 },
    { field:"updatedAt",   title:"Обновлено",            type:Schema.Types.DATE,   hidden:false, width:130 }
  ],

  ACCOUNTS: [
    { field:"accountName",   title:"Счёт",                       type:Schema.Types.TEXT, hidden:false, width:180 },
    { field:"broker",        title:"Брокер",                     type:Schema.Types.TEXT, hidden:false, width:130 },
    { field:"accountType",   title:"Тип счёта",                  type:Schema.Types.TEXT, hidden:false, width:130 },
    { field:"active",        title:"Активен",                    type:Schema.Types.TEXT, hidden:false, width:100, validator:{ values:["Да", "Нет"], allowInvalid:false } },
    { field:"includeTotal",  title:"Включать в общий портфель",  type:Schema.Types.TEXT, hidden:false, width:190, validator:{ values:["Да", "Нет"], allowInvalid:false } },
    { field:"strategy",      title:"Стратегия",                  type:Schema.Types.TEXT, hidden:false, width:170 },
    { field:"limits",        title:"Лимиты",                     type:Schema.Types.TEXT, hidden:false, width:260 },
    { field:"comment",       title:"Комментарий",                type:Schema.Types.TEXT, hidden:false, width:320 },
    { field:"accountId",     title:"ID счёта",                   type:Schema.Types.TEXT, hidden:true,  width:220 }
  ],

  STRATEGIES: [
    { field:"strategyName",    title:"Стратегия",              type:Schema.Types.TEXT, hidden:false, width:180 },
    { field:"version",         title:"Версия",                 type:Schema.Types.TEXT, hidden:false, width:90 },
    { field:"goal",            title:"Цель",                   type:Schema.Types.TEXT, hidden:false, width:300 },
    { field:"riskProfile",     title:"Профиль риска",          type:Schema.Types.TEXT, hidden:false, width:150 },
    { field:"allocationModel", title:"Модель распределения",   type:Schema.Types.TEXT, hidden:false, width:240 },
    { field:"active",          title:"Активна",                type:Schema.Types.TEXT, hidden:false, width:100, validator:{ values:["Да", "Нет"], allowInvalid:false } },
    { field:"comment",         title:"Комментарий",            type:Schema.Types.TEXT, hidden:false, width:320 },
    { field:"strategyId",      title:"ID стратегии",           type:Schema.Types.TEXT, hidden:true,  width:180 }
  ],

  ACCOUNT_STRATEGIES: [
    { field:"accountName", title:"Счёт",              type:Schema.Types.TEXT, hidden:false, width:180 },
    { field:"strategy",    title:"Стратегия",         type:Schema.Types.TEXT, hidden:false, width:180 },
    { field:"startDate",   title:"Дата начала",       type:Schema.Types.DATE, hidden:false, width:120 },
    { field:"active",      title:"Активна",           type:Schema.Types.TEXT, hidden:false, width:100, validator:{ values:["Да", "Нет"], allowInvalid:false } },
    { field:"limits",      title:"Лимиты",            type:Schema.Types.TEXT, hidden:false, width:260 },
    { field:"reserve",     title:"Резерв",            type:Schema.Types.TEXT, hidden:false, width:140 },
    { field:"comment",     title:"Комментарий",       type:Schema.Types.TEXT, hidden:false, width:320 },
    { field:"accountId",   title:"ID счёта",          type:Schema.Types.TEXT, hidden:true,  width:220 }
  ],

  PORTFOLIO_HEALTH: [
    { field:"scopeType",         title:"Разрез",                  type:Schema.Types.TEXT,    hidden:false, width:130 },
    { field:"scopeName",         title:"Название",                type:Schema.Types.TEXT,    hidden:false, width:180 },
    { field:"strategy",          title:"Стратегия",               type:Schema.Types.TEXT,    hidden:false, width:170 },
    { field:"marketValue",       title:"Стоимость бумаг",         type:Schema.Types.MONEY,   hidden:false, width:150 },
    { field:"cash",              title:"Свободные деньги",        type:Schema.Types.MONEY,   hidden:false, width:150 },
    { field:"totalValue",        title:"Итого",                   type:Schema.Types.MONEY,   hidden:false, width:150 },
    { field:"positions",         title:"Позиций",                 type:Schema.Types.NUMBER,  hidden:false, width:90 },
    { field:"maxPositionShare",  title:"Макс. доля позиции",      type:Schema.Types.PERCENT, hidden:false, width:150 },
    { field:"reserveShare",      title:"Доля резерва",            type:Schema.Types.PERCENT, hidden:false, width:130 },
    { field:"strategyDeviation", title:"Отклонение от стратегии", type:Schema.Types.PERCENT, hidden:false, width:170 },
    { field:"risks",             title:"Риски",                   type:Schema.Types.TEXT,    hidden:false, width:360 },
    { field:"status",            title:"Статус",                  type:Schema.Types.TEXT,    hidden:false, width:130 },
    { field:"updatedAt",         title:"Обновлено",               type:Schema.Types.DATE,    hidden:false, width:130 }
  ],

  PORTFOLIO_INTELLIGENCE: [
    { field:"scopeType",         title:"Разрез",                         type:Schema.Types.TEXT,    hidden:false, width:130 },
    { field:"scopeName",         title:"Название",                       type:Schema.Types.TEXT,    hidden:false, width:180 },
    { field:"strategy",          title:"Стратегия",                      type:Schema.Types.TEXT,    hidden:false, width:170 },
    { field:"rank",              title:"Место",                          type:Schema.Types.NUMBER,  hidden:false, width:80 },
    { field:"score",             title:"Оценка",                         type:Schema.Types.NUMBER,  hidden:false, width:90 },
    { field:"availableCash",     title:"Свободные деньги",               type:Schema.Types.MONEY,   hidden:false, width:150 },
    { field:"totalValue",        title:"Итого",                          type:Schema.Types.MONEY,   hidden:false, width:150 },
    { field:"reserveShare",      title:"Доля резерва",                   type:Schema.Types.PERCENT, hidden:false, width:130 },
    { field:"strategyDeviation", title:"Отклонение от стратегии",        type:Schema.Types.PERCENT, hidden:false, width:170 },
    { field:"recommendedShare",  title:"Доля нового пополнения",         type:Schema.Types.PERCENT, hidden:false, width:190 },
    { field:"recommendedAmount", title:"Сумма из свободных денег",        type:Schema.Types.MONEY,   hidden:false, width:180 },
    { field:"decision",          title:"Решение",                        type:Schema.Types.TEXT,    hidden:false, width:190 },
    { field:"reason",            title:"Причина",                        type:Schema.Types.TEXT,    hidden:false, width:420 },
    { field:"nextStep",          title:"Следующий шаг",                  type:Schema.Types.TEXT,    hidden:false, width:360 },
    { field:"updatedAt",         title:"Обновлено",                      type:Schema.Types.DATE,    hidden:false, width:130 }
  ],

  BOND_ANALYSIS: [
    { field:"ticker",         title:"Тикер",                   type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"name",           title:"Название",                type:Schema.Types.TEXT,   hidden:false, width:240 },
    { field:"bondType",       title:"Тип облигации",           type:Schema.Types.TEXT,   hidden:false, width:150 },
    { field:"couponType",     title:"Тип купона",              type:Schema.Types.TEXT,   hidden:false, width:130 },
    { field:"currency",       title:"Валюта",                  type:Schema.Types.TEXT,   hidden:false, width:80 },
    { field:"lastPrice",      title:"Последняя цена",          type:Schema.Types.MONEY,  hidden:false, width:120 },
    { field:"priceToNominal", title:"Цена к номиналу",         type:Schema.Types.PERCENT,hidden:false, width:140 },
    { field:"couponRate",     title:"Купон, %",                type:Schema.Types.PERCENT,hidden:false, width:110, editable:true },
    { field:"ytm",            title:"Доходность к погашению",  type:Schema.Types.PERCENT,hidden:false, width:170, editable:true },
    { field:"duration",       title:"Дюрация",                 type:Schema.Types.NUMBER, hidden:false, width:100, editable:true },
    { field:"maturityDate",   title:"Дата погашения",          type:Schema.Types.DATE,   hidden:false, width:130, editable:true },
    { field:"yearsToMaturity",title:"Лет до погашения",        type:Schema.Types.NUMBER, hidden:false, width:130 },
    { field:"creditRisk",     title:"Кредитный риск",          type:Schema.Types.TEXT,   hidden:false, width:140 },
    { field:"liquidity",      title:"Ликвидность",             type:Schema.Types.TEXT,   hidden:false, width:120 },
    { field:"score",          title:"Оценка",                  type:Schema.Types.NUMBER, hidden:false, width:90 },
    { field:"decision",       title:"Решение",                 type:Schema.Types.TEXT,   hidden:false, width:180 },
    { field:"confidence",     title:"Уверенность",             type:Schema.Types.TEXT,   hidden:false, width:120 },
    { field:"reasons",        title:"Причины",                 type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"updatedAt",      title:"Обновлено",               type:Schema.Types.DATE,   hidden:false, width:130 },
    { field:"figi",           title:"FIGI",                    type:Schema.Types.TEXT,   hidden:true,  width:180 },
    { field:"instrumentUid",  title:"UID инструмента",         type:Schema.Types.TEXT,   hidden:true,  width:220 }
  ],

  ASSET_SCORING: [
    { field:"ticker",         title:"Тикер",           type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"name",           title:"Название",        type:Schema.Types.TEXT,   hidden:false, width:240 },
    { field:"instrumentType", title:"Тип инструмента", type:Schema.Types.TEXT,   hidden:false, width:140 },
    { field:"scoreType",      title:"Тип оценки",      type:Schema.Types.TEXT,   hidden:false, width:150 },
    { field:"score",          title:"Оценка",          type:Schema.Types.NUMBER, hidden:false, width:90 },
    { field:"decision",       title:"Решение",         type:Schema.Types.TEXT,   hidden:false, width:190 },
    { field:"confidence",     title:"Уверенность",     type:Schema.Types.TEXT,   hidden:false, width:120 },
    { field:"reasons",        title:"Причины",         type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"risks",          title:"Риски",           type:Schema.Types.TEXT,   hidden:false, width:320 },
    { field:"source",         title:"Источник",        type:Schema.Types.TEXT,   hidden:false, width:170 },
    { field:"updatedAt",      title:"Обновлено",       type:Schema.Types.DATE,   hidden:false, width:130 }
  ],

  COI: [
    { field:"component",   title:"Компонент",   type:Schema.Types.TEXT,   hidden:false, width:220 },
    { field:"value",       title:"Значение",    type:Schema.Types.TEXT,   hidden:false, width:160 },
    { field:"score",       title:"Баллы",       type:Schema.Types.NUMBER, hidden:false, width:90 },
    { field:"status",      title:"Статус",      type:Schema.Types.TEXT,   hidden:false, width:180 },
    { field:"explanation", title:"Объяснение",  type:Schema.Types.TEXT,   hidden:false, width:460 },
    { field:"updatedAt",   title:"Обновлено",   type:Schema.Types.DATE,   hidden:false, width:130 }
  ],

  CONSTITUTION: [
    { field:"parameter", title:"Параметр",   type:Schema.Types.TEXT, hidden:false, width:260 },
    { field:"value",     title:"Значение",   type:Schema.Types.TEXT, hidden:false, width:180 },
    { field:"comment",   title:"Комментарий",type:Schema.Types.TEXT, hidden:false, width:420 },
    { field:"updatedAt", title:"Обновлено",  type:Schema.Types.DATE, hidden:false, width:130 }
  ],

  MARKET_REGIME: [
    { field:"metric",    title:"Показатель", type:Schema.Types.TEXT, hidden:false, width:260 },
    { field:"value",     title:"Значение",   type:Schema.Types.TEXT, hidden:false, width:180 },
    { field:"status",    title:"Статус",     type:Schema.Types.TEXT, hidden:false, width:180 },
    { field:"comment",   title:"Комментарий",type:Schema.Types.TEXT, hidden:false, width:420 },
    { field:"updatedAt", title:"Обновлено",  type:Schema.Types.DATE, hidden:false, width:130 }
  ],

  COMPANY_RATING: [
    { field:"ticker",            title:"Тикер",                 type:Schema.Types.TEXT,   hidden:false, width:90 },
    { field:"name",              title:"Название",              type:Schema.Types.TEXT,   hidden:false, width:240 },
    { field:"instrumentType",    title:"Тип инструмента",       type:Schema.Types.TEXT,   hidden:false, width:130 },
    { field:"sector",            title:"Отрасль",               type:Schema.Types.TEXT,   hidden:false, width:160 },
    { field:"dividends",         title:"Дивиденды",             type:Schema.Types.NUMBER, hidden:false, width:110, description:"0-30 баллов." },
    { field:"profitGrowth",      title:"Рост прибыли",          type:Schema.Types.NUMBER, hidden:false, width:120, description:"0-20 баллов." },
    { field:"debt",              title:"Долг",                  type:Schema.Types.NUMBER, hidden:false, width:90,  description:"0-15 баллов: чем ниже долговой риск, тем выше оценка." },
    { field:"marketPosition",    title:"Положение на рынке",    type:Schema.Types.NUMBER, hidden:false, width:150, description:"0-15 баллов." },
    { field:"pricePotential",    title:"Потенциал роста",       type:Schema.Types.NUMBER, hidden:false, width:130, description:"0-10 баллов." },
    { field:"stability",         title:"Стабильность",          type:Schema.Types.NUMBER, hidden:false, width:120, description:"0-10 баллов." },
    { field:"totalRating",       title:"Итоговый рейтинг",      type:Schema.Types.NUMBER, hidden:false, width:130 },
    { field:"decision",          title:"Решение",               type:Schema.Types.TEXT,   hidden:false, width:170 },
    { field:"investmentThesis",  title:"Инвестиционный тезис",  type:Schema.Types.TEXT,   hidden:false, width:260 },
    { field:"comment",           title:"Комментарий",           type:Schema.Types.TEXT,   hidden:false, width:260 },
    { field:"thesisBroken",      title:"Тезис нарушен",         type:Schema.Types.TEXT,   hidden:false, width:120, validator:{ values:["Нет", "Да"], allowInvalid:true } },
    { field:"dangerousDebt",     title:"Долг опасен",           type:Schema.Types.TEXT,   hidden:false, width:110, validator:{ values:["Нет", "Да"], allowInvalid:true } },
    { field:"noProfit",          title:"Нет прибыли",           type:Schema.Types.TEXT,   hidden:false, width:110, validator:{ values:["Нет", "Да"], allowInvalid:true } },
    { field:"badGovernance",     title:"Проблемы управления",   type:Schema.Types.TEXT,   hidden:false, width:160, validator:{ values:["Нет", "Да"], allowInvalid:true } },
    { field:"fundamentalsWorse", title:"Фундамент ухудшился",   type:Schema.Types.TEXT,   hidden:false, width:170, validator:{ values:["Нет", "Да"], allowInvalid:true } },
    { field:"updatedAt",         title:"Обновлено",             type:Schema.Types.DATE,   hidden:false, width:130 },
    { field:"highRisk",          title:"Высокий риск",          type:Schema.Types.TEXT,   hidden:false, width:120, validator:{ values:["Нет", "Да"], allowInvalid:true } }
  ],

  FACTS: [
    { field:"instrument", title:"Инструмент",       type:Schema.Types.TEXT, hidden:false, width:120 },
    { field:"factKey",    title:"Факт",             type:Schema.Types.TEXT, hidden:false, width:190 },
    { field:"value",      title:"Значение",         type:Schema.Types.TEXT, hidden:false, width:220 },
    { field:"source",     title:"Источник",         type:Schema.Types.TEXT, hidden:false, width:170 },
    { field:"updatedAt",  title:"Обновлено",        type:Schema.Types.DATE, hidden:false, width:130 },
    { field:"confidence", title:"Уверенность",      type:Schema.Types.TEXT, hidden:false, width:120 },
    { field:"stale",      title:"Данные устарели",  type:Schema.Types.TEXT, hidden:false, width:130 },
    { field:"comment",    title:"Комментарий",      type:Schema.Types.TEXT, hidden:false, width:360 }
  ],

  FEATURES: [
    { field:"instrument",  title:"Инструмент",       type:Schema.Types.TEXT,   hidden:false, width:120 },
    { field:"featureKey",  title:"Признак",          type:Schema.Types.TEXT,   hidden:false, width:220 },
    { field:"value",       title:"Значение",         type:Schema.Types.TEXT,   hidden:false, width:220 },
    { field:"score",       title:"Оценка признака",  type:Schema.Types.NUMBER, hidden:false, width:120 },
    { field:"facts",       title:"Исходные факты",   type:Schema.Types.TEXT,   hidden:false, width:280 },
    { field:"explanation", title:"Объяснение",       type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"confidence",  title:"Уверенность",      type:Schema.Types.TEXT,   hidden:false, width:120 },
    { field:"updatedAt",   title:"Обновлено",        type:Schema.Types.DATE,   hidden:false, width:130 }
  ],

  SCORES: [
    { field:"scoreType",   title:"Тип оценки",       type:Schema.Types.TEXT,   hidden:false, width:150 },
    { field:"instrument",  title:"Инструмент",       type:Schema.Types.TEXT,   hidden:false, width:120 },
    { field:"accountName", title:"Счёт",             type:Schema.Types.TEXT,   hidden:false, width:140 },
    { field:"strategy",    title:"Стратегия",        type:Schema.Types.TEXT,   hidden:false, width:150 },
    { field:"value",       title:"Значение",         type:Schema.Types.NUMBER, hidden:false, width:100 },
    { field:"confidence",  title:"Уверенность",      type:Schema.Types.TEXT,   hidden:false, width:120 },
    { field:"reasons",     title:"Причины",          type:Schema.Types.TEXT,   hidden:false, width:420 },
    { field:"decision",    title:"Решение",          type:Schema.Types.TEXT,   hidden:false, width:180 },
    { field:"updatedAt",   title:"Дата расчёта",     type:Schema.Types.DATE,   hidden:false, width:130 }
  ],

  SETTINGS: [
    { field:"parameter",    title:"Параметр",            type:Schema.Types.TEXT, hidden:false, width:240 },
    { field:"value",        title:"Значение",            type:Schema.Types.TEXT, hidden:false, width:200, format:"auto" }
  ],

  DIRECTORY: [
    { field:"ticker",       title:"Тикер",               type:Schema.Types.TEXT, hidden:false, width:90 },
    { field:"name",         title:"Название",            type:Schema.Types.TEXT, hidden:false, width:240 },
    { field:"currency",     title:"Валюта",              type:Schema.Types.TEXT, hidden:false, width:80 },
    { field:"isin",         title:"ISIN",                type:Schema.Types.TEXT, hidden:false, width:160 },
    {
      field:"instrumentType",
      title:"Тип инструмента",
      type:Schema.Types.TEXT,
      hidden:false,
      width:140,
      editable:true,
      validator:{
        values:["Акции", "Облигации", "Фонды", "Валюта", "Фьючерсы"],
        allowInvalid:true
      },
      description:"Класс инструмента для стратегии."
    },
    {
      field:"sector",
      title:"Отрасль",
      type:Schema.Types.TEXT,
      hidden:false,
      width:160,
      editable:true,
      description:"Отрасль или сектор инструмента."
    },
    {
      field:"issuer",
      title:"Эмитент",
      type:Schema.Types.TEXT,
      hidden:false,
      width:180,
      editable:true,
      description:"Компания, фонд или управляющий эмитент."
    },
    { field:"lastPrice",    title:"Последняя цена",      type:Schema.Types.MONEY, hidden:false, width:120 },
    { field:"lot",          title:"Лот",                  type:Schema.Types.NUMBER, hidden:false, width:80 },
    {
      field:"tradeAvailable",
      title:"Доступен для торговли",
      type:Schema.Types.TEXT,
      hidden:false,
      width:150,
      validator:{
        values:["Да", "Нет"],
        allowInvalid:true
      }
    },
    { field:"exchange",     title:"Биржа",                type:Schema.Types.TEXT, hidden:false, width:120 },
    { field:"country",      title:"Страна",               type:Schema.Types.TEXT, hidden:false, width:120 },
    { field:"updatedAt",    title:"Обновлено",            type:Schema.Types.DATE, hidden:false, width:130 },
    { field:"figi",         title:"FIGI",                type:Schema.Types.TEXT, hidden:true, width:180 },
    { field:"assetUid",     title:"UID актива",          type:Schema.Types.TEXT, hidden:true, width:220 },
    { field:"instrumentUid",title:"UID инструмента",     type:Schema.Types.TEXT, hidden:true, width:220 }
  ]

});


/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Schema.gs
 * Версия: 1.0.0
 * Часть: 5 из N
 *
 * Универсальные функции работы со схемой
 * ============================================================
 */

/**
 * Получить описание листа.
 * @param {string} sheetName
 * @return {Array}
 */
Schema.getColumns = function(sheetName) {
  var key = Schema.resolveSheetKey(sheetName);
  var columns = Schema.Definitions[key] || [];

  return columns.map(function(col) {
    return Schema.normalizeColumn(col);
  });
};

/**
 * Получить внутренний ключ схемы по ключу или русскому имени листа.
 * @param {string} sheetName
 * @return {string}
 */
Schema.resolveSheetKey = function(sheetName) {
  if (Schema.Definitions[sheetName]) {
    return sheetName;
  }

  for (var key in CORE.SHEETS) {
    if (
      Object.prototype.hasOwnProperty.call(CORE.SHEETS, key) &&
      CORE.SHEETS[key] === sheetName
    ) {
      return key;
    }
  }

  return sheetName;
};

/**
 * Нормализовать описание столбца.
 * @param {Object} col
 * @return {Object}
 */
Schema.normalizeColumn = function(col) {
  var normalized = {};

  Object.keys(col).forEach(function(key) {
    normalized[key] = col[key];
  });

  if (normalized.required === undefined) normalized.required = false;
  if (normalized.format === undefined) normalized.format = "";
  if (normalized.editable === undefined) normalized.editable = false;
  if (normalized.defaultValue === undefined) normalized.defaultValue = "";
  if (normalized.validator === undefined) normalized.validator = null;
  if (normalized.group === undefined) normalized.group = "";
  if (normalized.description === undefined) normalized.description = "";

  return normalized;
};

/**
 * Получить только видимые столбцы.
 * @param {string} sheetName
 * @return {Array}
 */
Schema.getVisibleColumns = function(sheetName) {
  return Schema.getColumns(sheetName)
    .filter(function(col){ return !col.hidden; });
};

/**
 * Получить скрытые столбцы.
 * @param {string} sheetName
 * @return {Array}
 */
Schema.getHiddenColumns = function(sheetName) {
  return Schema.getColumns(sheetName)
    .filter(function(col){ return col.hidden; });
};

/**
 * Получить массив русских заголовков.
 * @param {string} sheetName
 * @return {string[]}
 */
Schema.getHeaders = function(sheetName) {
  return Schema.getColumns(sheetName)
    .map(function(col){ return col.title; });
};

/**
 * Получить внутренние имена полей.
 * @param {string} sheetName
 * @return {string[]}
 */
Schema.getFields = function(sheetName) {
  return Schema.getColumns(sheetName)
    .map(function(col){ return col.field; });
};

/**
 * Получить индекс поля.
 * @param {string} sheetName
 * @param {string} field
 * @return {number}
 */
Schema.getFieldIndex = function(sheetName, field) {
  var cols = Schema.getColumns(sheetName);

  for (var i = 0; i < cols.length; i++) {
    if (cols[i].field === field) {
      return i;
    }
  }

  return -1;
};

/**
 * Максимальная длина значения в одной ячейке Google Sheets.
 */
Schema.MAX_CELL_TEXT_LENGTH = 49000;

/**
 * Подготовить значение для записи в ячейку.
 * @param {*} value
 * @return {*}
 */
Schema.normalizeCellValue = function(value) {
  if (typeof value !== "string") {
    return value;
  }

  if (value.length <= Schema.MAX_CELL_TEXT_LENGTH) {
    return value;
  }

  return value.slice(0, Schema.MAX_CELL_TEXT_LENGTH) +
    "\n\n[Текст сокращён: превышен лимит Google Sheets]";
};

/**
 * Построить строку из объекта.
 * @param {string} sheetName
 * @param {Object} data
 * @return {Array}
 */
Schema.buildRow = function(sheetName, data) {
  return Schema.getColumns(sheetName).map(function(col){
    var value = data[col.field] !== undefined ? data[col.field] : "";
    return Schema.normalizeCellValue(value);
  });
};


/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Schema.gs
 * Версия: 1.0.0
 * Часть: 6 из N
 *
 * Подготовка листов Google Sheets
 * ============================================================
 */

/**
 * Создать или вернуть лист.
 * @param {string} sheetName
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
Schema.ensureSheet = function(sheetName) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
};

/**
 * Подготовить лист по схеме.
 * @param {string} sheetName
 */
Schema.prepareSheet = function(sheetName) {

  var sheet = Schema.ensureSheet(sheetName);
  var cols = Schema.getColumns(sheetName);

  if (cols.length === 0) {
    throw new Error("Не найдена схема листа: " + sheetName);
  }

  if (sheet.getMaxColumns() < cols.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      cols.length - sheet.getMaxColumns()
    );
  }

  var headers = cols.map(function(c){ return c.title; });
  sheet.getRange(1, 1, 1, Math.max(sheet.getMaxColumns(), headers.length))
       .clearContent();
  sheet.getRange(1,1,1,headers.length).setValues([headers]);

  sheet.setFrozenRows(1);
  Schema.applyHeaderStyle(sheet, headers.length);

  for (var i=0;i<cols.length;i++){
    sheet.setColumnWidth(i+1, cols[i].width || 100);
    if (cols[i].hidden){
      sheet.hideColumns(i+1);
    } else {
      try { sheet.showColumns(i+1); } catch(e){}
    }
  }

  Schema.applyColumnFormats(sheet, cols);
  Schema.applyColumnValidations(sheet, cols);
  Schema.applyBodyStyle(sheet, cols.length);

  var currentFilter = sheet.getFilter();
  if (currentFilter) {
    currentFilter.remove();
  }

  sheet.getRange(1,1,Math.max(sheet.getMaxRows(),2),headers.length)
    .createFilter();

  return sheet;
};

/**
 * Применить проверки значений по описанию столбцов.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Object[]} cols
 */
Schema.applyColumnValidations = function(sheet, cols) {
  var rowsCount = Math.max(sheet.getMaxRows() - 1, 1);

  cols.forEach(function(col, index) {
    var range = sheet.getRange(2, index + 1, rowsCount, 1);

    range.clearDataValidations();

    if (!col.validator) {
      return;
    }

    var builder = SpreadsheetApp.newDataValidation();

    if (Array.isArray(col.validator)) {
      builder
        .requireValueInList(col.validator, true)
        .setAllowInvalid(false);
    } else if (Array.isArray(col.validator.values)) {
      builder
        .requireValueInList(col.validator.values, true)
        .setAllowInvalid(col.validator.allowInvalid === true);
    } else if (col.validator.rangeSheet && col.validator.rangeColumn) {
      var sourceSheet = Schema.ensureSheet(col.validator.rangeSheet);
      var startRow = col.validator.startRow || 2;
      var maxRows = Math.max(sourceSheet.getMaxRows() - startRow + 1, 1);
      var sourceRange = sourceSheet.getRange(
        startRow,
        col.validator.rangeColumn,
        maxRows,
        1
      );

      builder
        .requireValueInRange(sourceRange, true)
        .setAllowInvalid(col.validator.allowInvalid === true);
    } else {
      return;
    }

    var rule = builder.build();

    range.setDataValidation(rule);
  });
};

/**
 * Оформить строку заголовков.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} columnsCount
 */
Schema.applyHeaderStyle = function(sheet, columnsCount) {
  sheet.getRange(1, 1, 1, columnsCount)
    .setFontWeight("bold")
    .setBackground("#1f4e78")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.setRowHeight(1, 36);
};

/**
 * Оформить тело листа.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} columnsCount
 */
Schema.applyBodyStyle = function(sheet, columnsCount) {
  var rowsCount = Math.max(sheet.getMaxRows() - 1, 1);

  sheet.getRange(2, 1, rowsCount, columnsCount)
    .setVerticalAlignment("middle")
    .setWrap(true);
};

/**
 * Применить форматы колонок по типам.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Object[]} cols
 */
Schema.applyColumnFormats = function(sheet, cols) {
  var rowsCount = Math.max(sheet.getMaxRows() - 1, 1);

  cols.forEach(function(col, index) {
    var column = index + 1;
    var range = sheet.getRange(2, column, rowsCount, 1);

    if (col.format === "auto") {
      range.setNumberFormat("General");
    } else if (col.type === Schema.Types.DATE) {
      range.setNumberFormat(CORE.SETTINGS.DATE_FORMAT);
    } else if (col.type === Schema.Types.MONEY) {
      range.setNumberFormat("#,##0.00");
    } else if (col.type === Schema.Types.PERCENT) {
      range.setNumberFormat("0.00%");
    } else if (col.type === Schema.Types.NUMBER) {
      range.setNumberFormat("#,##0.########");
    } else if (col.type === Schema.Types.BOOLEAN) {
      range.setNumberFormat("@");
    } else {
      range.setNumberFormat("@");
    }

    if (
      col.type === Schema.Types.MONEY ||
      col.type === Schema.Types.PERCENT ||
      col.type === Schema.Types.NUMBER
    ) {
      range.setHorizontalAlignment("right");
    } else if (col.type === Schema.Types.DATE) {
      range.setHorizontalAlignment("center");
    } else {
      range.setHorizontalAlignment("left");
    }
  });
};

/**
 * Подготовить все пользовательские листы.
 */
Schema.initialize = function() {

  [
    CORE.SHEETS.MAIN,
    CORE.SHEETS.VISUALIZATION,
    CORE.SHEETS.TRADES,
    CORE.SHEETS.FIFO_LOTS,
    CORE.SHEETS.FIFO_SALES,
    CORE.SHEETS.FIFO_ERRORS,
    CORE.SHEETS.DIAGNOSTICS,
    CORE.SHEETS.SMOKE_TESTS,
    CORE.SHEETS.STABILIZATION,
    CORE.SHEETS.TECH_LOG,
    CORE.SHEETS.DATA_CACHE,
    CORE.SHEETS.PORTFOLIO,
    CORE.SHEETS.DIVIDENDS,
    CORE.SHEETS.COUPONS,
    CORE.SHEETS.CASHFLOW,
    CORE.SHEETS.INFLATION,
    CORE.SHEETS.TAX,
    CORE.SHEETS.REBALANCE,
    CORE.SHEETS.TRADE_PLAN,
    CORE.SHEETS.STRATEGY_RULES,
    CORE.SHEETS.DECISIONS,
    CORE.SHEETS.ACCOUNTS,
    CORE.SHEETS.STRATEGIES,
    CORE.SHEETS.ACCOUNT_STRATEGIES,
    CORE.SHEETS.PORTFOLIO_HEALTH,
    CORE.SHEETS.PORTFOLIO_INTELLIGENCE,
    CORE.SHEETS.BOND_ANALYSIS,
    CORE.SHEETS.ASSET_SCORING,
    CORE.SHEETS.COI,
    CORE.SHEETS.ADVISOR,
    CORE.SHEETS.STRATEGY,
    CORE.SHEETS.CONSTITUTION,
    CORE.SHEETS.MARKET_REGIME,
    CORE.SHEETS.COMPANY_RATING,
    CORE.SHEETS.FACTS,
    CORE.SHEETS.FEATURES,
    CORE.SHEETS.SCORES,
    CORE.SHEETS.SETTINGS,
    CORE.SHEETS.DIRECTORY
  ].forEach(function(name){
    Schema.prepareSheet(name);
  });

  SpreadsheetApp.flush();
};


