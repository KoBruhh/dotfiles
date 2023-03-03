// WARNING! This file contains some subset of JS that is not supported by type inference.
// You can try checking 'Transpile to ES5' checkbox if you want the types to be inferred
'use strict';
const UI_PATH = "/data/interface/";
class Popup {
  constructor() {
    this.isAppWorking = true;
    this.whiteList = [];
    this.blockedDomains = [];
    this.blockedWords = [];
    this.scheduledDomains = [];
    this.domain = "";
    this.manageSite = "";
    this.extensionSwitcher = "";
    this.blockSite = "";
    this.enabled = true;
    this.tabUrl = "";
    this.getCurrentTab();
    var localize = new Localize();
    localize.init();  
    localize.localizeHtmlPage();  
  }
  getCurrentTab() {
    chrome.tabs.query({
      active : true,
      currentWindow : true
    }, (a) => {
      this.tabUrl = a[0].url;
      this.initStorage();
    });
  }
  initStorage() {
    chrome.storage.local.get((exports) => {
      this.isAppWorking = exports.isAppWorking;
      this.whiteList = exports.whiteList;
      this.blockedDomains = exports.blockedDomains;
      this.scheduledDomains = exports.scheduledDomains;
      this.blockedWords = exports.blockedWords;
      this.buildPage();
    });
  }
  initListeners() {
    if (this.manageSite) {
      this.manageSite.addEventListener("click", this.manageSiteHandler);
    }
    if (this.extensionSwitcher) {
      this.extensionSwitcher.addEventListener("click", () => {
        return this.handleSwitcherClick();
      });
    }
    if (this.blockSite) {
      this.blockSite.addEventListener("click", () => {
        return this.handleBlockButton();
      });
    }
  }
  manageSiteHandler() {
    chrome.tabs.create({
      url : `${UI_PATH}manage-sites.html`
    });
  }


  handleSwitcherClick() {
    this.isAppWorking = !this.isAppWorking;
    chrome.storage.local.set({
      isAppWorking : this.isAppWorking
    }, () => {
  
      this.toggleActive();
    });
  }

  setSwitcher(){
    var spanLabel = document.getElementById("switch-label");
    spanLabel.innerHTML = this.isAppWorking ? "On" : "Off";
    if(this.isAppWorking){
        if(this.blockSite && this.blockSite.disabled){
            this.blockSite.removeAttribute("disabled");
        }
    }
    else{
        if(this.blockSite && !this.blockSite.disabled){
            this.blockSite.setAttribute("disabled", true);
        }

    }
    

  }

  handleBlockButton() {
    if (this.isAppWorking) {
      if (!this.scheduledDomains.length) {
        return this.blockedDomains.push(this.domain), void chrome.storage.local.set({
          blockedDomains : this.blockedDomains
        }, () => {
          chrome.tabs.create({
            url : `${UI_PATH}manage-sites.html`
          }, () => {
          });
        });
      }
      let domainInstance = this.getHostName(this.tabUrl);
      for (let i = 0; i < this.scheduledDomains.length; i++) {
        if (domainInstance === this.scheduledDomains[i].domain) {
          return;
        }
      }
      this.blockedDomains.push(this.domain);
      chrome.storage.local.set({
        blockedDomains : this.blockedDomains
      }, () => {
        chrome.tabs.create({
          url : `${UI_PATH}manage-sites.html`
        }, () => {
        });
      });
    }
  }
  toggleActive() {
    this.extensionSwitcher.classList.toggle("active");
    this.setSwitcher()
    
  }
  buildPage() {
    chrome.tabs.query({
      active : true,
      currentWindow : true
    }, (tabs) => {
      const b = this.isDomainCorrect(tabs[0].url);
      this.extensionSwitcher = document.querySelector(".switch-app");
      this.checkSwitchApp();
      this.manageSite = document.querySelector(".manage-site");
      if (b) {
        this.createValidPage();
        this.domain = this.getHostName(tabs[0].url);
        var img = tabs[0].favIconUrl === undefined ?  "img/blocking.png" : tabs[0].favIconUrl; 
        this.createBlockedItem(this.domain, img);
        this.blockSite = document.querySelector(".block-site");
        this.initListeners();
      } else {
        this.createInvalidPage();
        this.initListeners();
      }
      document.querySelector(".container").classList.remove("hidden");
      this.setSwitcher();
    });
  }

  createBlockedItem(html, map) {
    let c = document.createElement("span");
    c.className = "blocked-domain";
    c.textContent = html;
    let d = document.createElement("img");
    d.setAttribute("src", map);
    document.querySelector(".current-domain").appendChild(d);
    document.querySelector(".current-domain").appendChild(c);
  }

  checkSwitchApp() {
    if (this.isAppWorking) {
      this.extensionSwitcher.classList.add("active");
    }
    this.setSwitcher()
  }

  createValidPage() {


    document.querySelector(".dynamic-container").innerHTML = `
        <div class="sub-container">    
            <div class="current-domain"></div>
            <div class="buttons-container">
                <button class="block-site">
                    <img src="../icons/32.png"><br/>${chrome.i18n.getMessage("popup_btn_block")}
                </button>
            </div>
        </div>
    `;
  }

  createInvalidPage() {
    document.querySelector(".dynamic-container").innerHTML = `
        <div class="sub-container">    
            <div class="current-domain invalid">
                <div class="invalid-favicon"></div>
                <div class="invalid-info">
                    <h1 class="not-avaliable-header">
                    ${chrome.i18n.getMessage("popup_not_avail")} 
                    </h1>
                </div>            
            </div>
        </div>
    `;
  }

  getHostName(url) {
    url = url.replace("www.", "");
    var b = url.indexOf("//") + 2;
    if (1 < b) {
      var c = url.indexOf("/", b);
      return 0 < c ? url.substring(b, c) : (c = url.indexOf("?", b), 0 < c ? url.substring(b, c) : url.substring(b));
    }
    return url;
  }

  isDomainCorrect(html) {
    if (-1 !== html.indexOf("chrome-extension://")) {
      return false;
    }
    var b = /(?!:\/\/)([a-zA-Z0-9-]+\.){0,5}[a-zA-Z0-9-][a-zA-Z0-9-]+\.[a-zA-Z]{2,64}?([^:\/\n?]?)/gi;
    return b.test(html);
  }
}
const c = new Popup();
