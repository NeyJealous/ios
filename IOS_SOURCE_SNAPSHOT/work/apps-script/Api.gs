/**
 * ==========================================
 * TInvest Sync v2
 * API Client
 * ==========================================
 */

var TI = TI || {};

TI.Api = {

  /**
   * Выполнить запрос к REST API
   */
  call: function(service, method, body) {

    body = body || {};
    TI.SyncExecution.recordApi("T-Invest " + service + "/" + method);

    var url =
      CONFIG.API_URL +
      "/" +
      service +
      "/" +
      method;

    var response = UrlFetchApp.fetch(url, {

      method: "post",

      contentType: "application/json",

      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + TI_GetToken()
      },

      payload: JSON.stringify(body),

      muteHttpExceptions: true

    });

    var code = response.getResponseCode();

    var text = response.getContentText();

    Logger.log("======================================");
    Logger.log("POST " + url);
    Logger.log("HTTP " + code);

    if (code !== 200) {

      Logger.log(text);

      throw new Error(
        "HTTP " + code + "\n\n" + text
      );

    }

    var json = JSON.parse(text);

    return json;

  },

  /**
   * Проверка подключения
   */
  test: function() {

    return this.call(
      API.USERS,
      "GetAccounts",
      {}
    );

  }

};


/**
 * Проверка API
 */
function TI_TestApi() {

  var result = TI.Api.test();

  Logger.log(result);

  SpreadsheetApp
    .getUi()
    .alert(
      "Подключение успешно."
    );

}

