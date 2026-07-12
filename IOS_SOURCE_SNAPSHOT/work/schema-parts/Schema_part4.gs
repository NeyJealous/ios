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

  ADVISOR: [
    { field:"priority",     title:"Приоритет",           type:Schema.Types.TEXT,    hidden:false, width:90 },
    { field:"category",     title:"Категория",           type:Schema.Types.TEXT,    hidden:false, width:120 },
    { field:"recommendation",title:"Рекомендация",       type:Schema.Types.TEXT,    hidden:false, width:420 },
    { field:"reason",       title:"Обоснование",         type:Schema.Types.TEXT,    hidden:false, width:320 },
    { field:"effect",       title:"Ожидаемый эффект",    type:Schema.Types.TEXT,    hidden:false, width:220 }
  ],

  STRATEGY: [
    { field:"parameter",    title:"Параметр",            type:Schema.Types.TEXT,    hidden:false, width:240 },
    { field:"value",        title:"Значение",            type:Schema.Types.TEXT,    hidden:false, width:160 },
    { field:"description",  title:"Описание",            type:Schema.Types.TEXT,    hidden:false, width:420 }
  ],

  TAX: [
    { field:"year",         title:"Год",                 type:Schema.Types.NUMBER,  hidden:false, width:80 },
    { field:"taxBase",      title:"Налоговая база",      type:Schema.Types.MONEY,   hidden:false, width:140 },
    { field:"taxRate",      title:"Ставка НДФЛ",         type:Schema.Types.PERCENT, hidden:false, width:120 },
    { field:"taxAmount",    title:"Сумма НДФЛ",          type:Schema.Types.MONEY,   hidden:false, width:140 },
    { field:"inflation",    title:"Инфляция",            type:Schema.Types.PERCENT, hidden:false, width:120 }
  ],

  REBALANCE: [
    { field:"ticker",       title:"Тикер",               type:Schema.Types.TEXT,    hidden:false, width:90 },
    { field:"targetShare",  title:"Целевая доля",        type:Schema.Types.PERCENT, hidden:false, width:120 },
    { field:"actualShare",  title:"Фактическая доля",    type:Schema.Types.PERCENT, hidden:false, width:140 },
    { field:"deviation",    title:"Отклонение",          type:Schema.Types.PERCENT, hidden:false, width:120 },
    { field:"action",       title:"Рекомендация",        type:Schema.Types.TEXT,    hidden:false, width:220 }
  ],

  SETTINGS: [
    { field:"parameter",    title:"Параметр",            type:Schema.Types.TEXT, hidden:false, width:240 },
    { field:"value",        title:"Значение",            type:Schema.Types.TEXT, hidden:false, width:200 }
  ],

  DIRECTORY: [
    { field:"ticker",       title:"Тикер",               type:Schema.Types.TEXT, hidden:false, width:90 },
    { field:"name",         title:"Название",            type:Schema.Types.TEXT, hidden:false, width:240 },
    { field:"currency",     title:"Валюта",              type:Schema.Types.TEXT, hidden:false, width:80 },
    { field:"isin",         title:"ISIN",                type:Schema.Types.TEXT, hidden:false, width:160 },
    { field:"figi",         title:"FIGI",                type:Schema.Types.TEXT, hidden:true, width:180 },
    { field:"assetUid",     title:"UID актива",          type:Schema.Types.TEXT, hidden:true, width:220 }
  ]

});

