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
    }

  ]

};

