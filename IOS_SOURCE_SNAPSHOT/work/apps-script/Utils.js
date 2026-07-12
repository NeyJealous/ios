/**
 * ==========================================
 * TInvest Sync v2
 * Utils.gs
 * ==========================================
 */

var TI = TI || {};

TI.Utils = {

  /**
   * MoneyValue -> Number
   */
  money: function(value) {

    if (!value) return 0;

    return Number(value.units || 0) +
           Number(value.nano || 0) / 1000000000;

  },

  /**
   * MoneyValue -> Currency
   */
  currency: function(value) {

    return value && value.currency
      ? value.currency
      : "";

  },

  /**
   * Quotation -> Number
   */
  quotation: function(value) {

    if (!value) return 0;

    return Number(value.units || 0) +
           Number(value.nano || 0) / 1000000000;

  },

  /**
   * Безопасное преобразование в число.
   */
  number: function(value) {

    if (value === null ||
        value === undefined ||
        value === "") {
      return 0;
    }

    return Number(value);

  },

  /**
   * Number -> MoneyValue-подобный объект.
   */
  toMoneyValue: function(value, currency) {

    value = Number(value) || 0;

    var units = value < 0 ? Math.ceil(value) : Math.floor(value);
    var nano = Math.round((value - units) * 1000000000);

    return {
      currency: currency || "",
      units: units,
      nano: nano
    };

  }

};

