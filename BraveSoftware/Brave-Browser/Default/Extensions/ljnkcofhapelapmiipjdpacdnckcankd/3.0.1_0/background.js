
// WARNING! This file contains some subset of JS that is not supported by type inference.
// You can try checking 'Transpile to ES5' checkbox if you want the types to be inferred
'use strict';
const UI_PATH = "/data/interface/";

const CATEGORIES = ["aggressive", "alcohol", "dating", "downloads", "drugs", "gamble", "hacking", "movies", "music", "politics", "shopping", "socialnet", "spyware", "violence", "weapons", "porn"];
const INITIAL_STORAGE = {
  isAppWorking: true,
  categories: [],
  whiteList: [],
  blockedDomains: [],
  blockedWords: [],
  scheduledDomains: [],
  cache: {}
};
class Background {
  constructor() {
    this.isAppWorking = true;
    this.categories = [];
    this.whiteList = null;
    this.blockedDomains = null;
    this.blockedWords = null;
    this.scheduledDomains = null;
    this.cache = null;
    this.initStorage();
  }
  initStorage() {
    chrome.storage.local.get((options) => {
      this.scheduledDomains = null == options.scheduledDomains ? INITIAL_STORAGE.scheduledDomains : options.scheduledDomains;
      this.categories = null == options.categories ? INITIAL_STORAGE.categories : options.categories;
      this.isAppWorking = null == options.isAppWorking ? INITIAL_STORAGE.isAppWorking : options.isAppWorking;
      this.whiteList = null == options.whiteList ? INITIAL_STORAGE.whiteList : options.whiteList;
      this.blockedDomains = null == options.blockedDomains ? INITIAL_STORAGE.blockedDomains : options.blockedDomains;
      this.cache = null == options.cache ? INITIAL_STORAGE.cache : options.cache;
      if (null == options.blockedWords) {
        this.blockedWords = INITIAL_STORAGE.blockedWords;
        chrome.storage.local.set({
          scheduledDomains: this.scheduledDomains,
          categories: this.categories,
          isAppWorking: this.isAppWorking,
          whiteList: this.whiteList,
          blockedDomains: this.blockedDomains,
          blockedWords: this.blockedWords
        }, function () {
        });
      } else {
        this.blockedWords = options.blockedWords;
      }
      this.initListeners();
      this.initWebRequestListeners();
    });
  }
  initListeners() {
    chrome.storage.onChanged.addListener((prefs) => {
      let name = Object.keys(prefs)[0];
      this[name] = prefs[name].newValue;
    });
  }

  async redirect(tabId) {
    chrome.tabs.remove(tabId);
    chrome.tabs.create({
      url: "/data/interface/redirect.html",
    });
  }

  initWebRequestListeners() {
    chrome.webRequest.onBeforeRequest.addListener((lbit) => {
      const tabId = lbit.tabId;
      if (!tabId) { return; }

      if ("main_frame" != lbit.type) {
        return;
      }
      if (lbit.url == chrome.runtime.getURL(`${UI_PATH}redirect.html`)) {
        return;
      }
      if (!this.isAppWorking) {
        return;
      }
      let b = false;
      if (this.whiteList.forEach((sceneUid) => {
        if (-1 != lbit.url.indexOf(sceneUid)) {
          b = true;
        }
      }), b) {
        return;
      }
      let c = false;
      if (this.blockedWords.forEach((sceneUid) => {
        if (-1 != lbit.url.indexOf(sceneUid)) {
          c = true;
        }
      }), c) {
        return void this.redirect(tabId);
      }
      let widthName;
      let e = false;
      if (this.scheduledDomains.forEach((bldomain, width) => {
        if (-1 != lbit.url.indexOf(bldomain.domain)) {
          e = true;
          widthName = width;
        }
      }), e) {
        const a = this.blockScheduledDomain(this.scheduledDomains[widthName]);
        return a ? void this.redirect(tabId) : void 0;
      }
      let f = false;
      if (this.blockedDomains.forEach((sceneUid) => {
        if (-1 != lbit.url.indexOf(sceneUid)) {
          f = true;
        }
      }), f) {
        return void this.redirect(tabId);
      }
      /*let categoriesTitleElement = {};
      const artistTrack = this.getHostname(lbit.url);
      this.getDomainCategories(lbit.url, artistTrack, categoriesTitleElement);
      const page = this.isCategoryBlocked(categoriesTitleElement.data, artistTrack);
      return page ? {
        redirectUrl : chrome.runtime.getURL(`${UI_PATH}redirect.html`)
      } : {
        cancel : false
      };*/
      return {
        cancel: false
      };
    }, {
      urls: ["<all_urls>"]
    }, []);
  }
  blockScheduledDomain(item) {
    let dt = new Date;
    let index = dt.getDay();
    let d = dt.getHours();
    let e = dt.getMinutes();
    let currentTime = (new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric"
    })).format(dt);
    let g = false;
    if (item.days.forEach((value) => {
      if (parseInt(value) === index) {
        return void (g = true);
      }
    }), !g) {
      return false;
    }
    return !!(item.startTime <= currentTime && item.endTime >= currentTime) || !!(item.secondStartTime && item.secondStartTime <= currentTime && item.secondEndTime >= currentTime);
  }

  getDomainCategories(game, name, params) {
    for (let id in this.cache) {
      if (id === name) {
        return void (params.data = this.cache[id]);
      }
    }
    var xhr = new XMLHttpRequest;
    xhr.open("GET", `https://siteblocker.net/api/category/?key=293jfimfo3984fuifoe0f934f&url=${game}`, false);
    xhr.onload = function () {
      let data = JSON.parse(xhr.response);
      params.data = data.categories;
    };
    xhr.send(null);
  }

  isCategoryBlocked(y, x) {
    if (!this.categories.length) {
      return false;
    }
    for (let i = 0; i < this.categories.length; i++) {
      for (let j = 0; j < y.length; j++) {
        if (this.categories[i] === y[j]) {
          return this.cache[x] || (this.cache[x] = y, chrome.storage.local.set({
            cache: this.cache
          }, () => {
            return console.log("site added to cache");
          })), true;
        }
      }
    }
    return false;
  }
  getHostname(url) {
    url = url.replace("www.", "");
    var index = url.indexOf("//") + 2;
    if (1 < index) {
      var i = url.indexOf("/", index);
      return 0 < i ? url.substring(index, i) : (i = url.indexOf("?", index), 0 < i ? url.substring(index, i) : url.substring(index));
    }
    return url;
  }
}
const b = new Background;
