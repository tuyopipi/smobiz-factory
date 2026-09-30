(function () {
  "use strict";
  var originalFetch = window.fetch.bind(window);
  function cookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[1]) : "";
  }
  window.fetch = function (input, init) {
    var options = init || {};
    var method = String(options.method || (input && input.method) || "GET").toUpperCase();
    var target = new URL(typeof input === "string" ? input : input.url, location.href);
    if (target.origin === location.origin && ["POST", "PUT", "DELETE"].indexOf(method) >= 0) {
      var token = cookie("nrv_csrf");
      if (token) {
        var headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has("x-csrf-token")) headers.set("x-csrf-token", token);
        options = Object.assign({}, options, { headers: headers });
      }
    }
    return originalFetch(input, options);
  };
})();
