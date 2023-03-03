var BLOCKLIST = {};

var save = function (o) {chrome.storage.local.set(o, function () {})};

var add = function () {
  var domain = document.getElementById("domain").value;
  if (domain) {
    domain = domain.replace("https://", '').replace("http://", '').replace("ftp://", '');
    var pageUrl = "https://" + domain;
    var hostname = new URL(pageUrl).hostname;
    BLOCKLIST[hostname] = null;
    chrome.storage.local.set({"blocklist": BLOCKLIST}, function () {});
  }
};

var fill = function () {
  chrome.storage.local.get(null, function (storage) {
    var count = 1;
    document.getElementById("domain").focus();
    document.getElementById("domain").value = '';
    var tbody = document.getElementById("blocklist");
    BLOCKLIST = ("blocklist" in storage) ? storage["blocklist"] : {};
    tbody.textContent = '';
    /*  */
    for (var domain in BLOCKLIST) {
      var item = document.createElement('tr');
      var close = document.createElement('td');
      var number = document.createElement('td');
      var blocked = document.createElement('td');
      var redirect = document.createElement('td');
      /*  */
      close.setAttribute('type', 'close');
      number.setAttribute('type', 'number');
      blocked.setAttribute('type', 'blocked');
      redirect.setAttribute('type', 'redirect');
      /*  */
      number.textContent = count;
      blocked.textContent = "*://" + domain + "/*";
      /*  */
      var input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.value = BLOCKLIST[domain] || '';
      input.setAttribute('blocked', domain);
      input.setAttribute('placeholder', "i.e. https://www.bing.com/");
      input.addEventListener("change", function (e) {
        var _blocked = e.target.getAttribute("blocked");
        BLOCKLIST[_blocked] = e.target.value;
        save({"blocklist": BLOCKLIST});
      });
      /*  */
      close.setAttribute('blocked', domain);
      close.addEventListener("click", function (e) {
        var _blocked = e.target.getAttribute("blocked");
        delete BLOCKLIST[_blocked];
        save({"blocklist": BLOCKLIST});
      });
      /*  */
      item.appendChild(number);
      item.appendChild(blocked);
      redirect.appendChild(input);
      item.appendChild(redirect);
      item.appendChild(close);
      tbody.appendChild(item);
      count++;
    }
  });
};

var load = function () {
  fill();
  /*  */
  document.getElementById("add").addEventListener("click", add);
  document.getElementById("reload").addEventListener("click", function () {document.location.reload()});
  document.getElementById("support").addEventListener("click", function (e) {save({"support": e.target.checked})});
  document.getElementById("domain").addEventListener("keypress", function (e) {if ((e.which || e.keyCode) === 13) add()});
  document.getElementById("notifications").addEventListener("click", function (e) {save({"notifications": e.target.checked})});
  /*  */
  chrome.storage.local.get(null, function (storage) {
    var firefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
    var notifications = ("notifications" in storage) ? storage["notifications"] : true;
    var support = ("support" in storage) ? storage["support"] : (firefox ? false : true);
    /*  */
    document.getElementById("support").checked = support;
    document.getElementById("notifications").checked = notifications;
  });
  /*  */
  window.removeEventListener('load', load, false);
};

window.addEventListener('load', load, false);
chrome.storage.onChanged.addListener(function (e) {if ("blocklist" in e) fill()});
