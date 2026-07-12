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
  return Schema.Definitions[sheetName] || [];
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
 * Построить строку из объекта.
 * @param {string} sheetName
 * @param {Object} data
 * @return {Array}
 */
Schema.buildRow = function(sheetName, data) {
  return Schema.getColumns(sheetName).map(function(col){
    return data[col.field] !== undefined ? data[col.field] : "";
  });
};

