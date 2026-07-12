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

    { field:"ticker",         title:"Тикер",                 type:Schema.Types.TEXT,    hidden:false, width:90 },
    { field:"name",           title:"Название",              type:Schema.Types.TEXT,    hidden:false, width:220 },
    { field:"quantity",       title:"Количество",            type:Schema.Types.NUMBER,  hidden:false, width:100 },
    { field:"averagePrice",   title:"Средняя цена",          type:Schema.Types.MONEY,   hidden:false, width:120 },
    { field:"currentPrice",   title:"Текущая цена",          type:Schema.Types.MONEY,   hidden:false, width:120 },
    { field:"marketValue",    title:"Рыночная стоимость",    type:Schema.Types.MONEY,   hidden:false, width:150 },
    { field:"cost",           title:"Себестоимость",         type:Schema.Types.MONEY,   hidden:false, width:140 },
    { field:"profit",         title:"Прибыль",               type:Schema.Types.MONEY,   hidden:false, width:120 },
    { field:"profitPercent",  title:"Доходность",            type:Schema.Types.PERCENT, hidden:false, width:120 },
    { field:"portfolioShare", title:"Доля в портфеле",       type:Schema.Types.PERCENT, hidden:false, width:120 },

    { field:"assetUid",       title:"UID актива",            type:Schema.Types.TEXT, hidden:true, width:220 }

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

