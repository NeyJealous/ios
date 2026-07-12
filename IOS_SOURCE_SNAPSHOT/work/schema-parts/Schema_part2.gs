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
    { field:"assetUid",     title:"UID актива",        type:Schema.Types.TEXT, hidden:true, width:220 }

  ]

});

