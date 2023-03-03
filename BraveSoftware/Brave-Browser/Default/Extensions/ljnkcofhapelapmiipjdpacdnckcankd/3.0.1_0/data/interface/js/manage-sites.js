// WARNING! This file contains some subset of JS that is not supported by type inference.
// You can try checking 'Transpile to ES5' checkbox if you want the types to be inferred
'use strict';
class ManageSites {
  constructor() {
    this.isAppWorking = true;
    this.scheduledDomains = [];
    this.categories = [];
    this.whiteList = [];
    this.blockedDomains = [];
    this.blockedWords = [];
    this.popup = document.querySelector(".popup");
    this.extensionSwitcher = null;
    this.addSpans = document.querySelectorAll("i.add");
    this.blockDomainInput = document.querySelector("#content1 #block-domain");
    this.workScheduleInput = document.querySelector("#content2 #work-schedule");
    this.startTimeInputs = document.getElementsByClassName("start-time");
    this.endTimeInputs = document.getElementsByClassName("end-time");
    this.scheduleOptions = document.querySelector(".schedule-options");
    this.deleteInterval = document.querySelector("#content2 .delete-interval");
    this.days = document.querySelectorAll("#content2 .schedule-days li");
    this.addIntervalBtn = document.querySelector("#content2 .schedule-range-container .add-interval");
    this.setScheduleBtn = document.querySelector("#content2 .set-schedule");
    this.setScheduleAll = document.querySelector("#content2 .set-schedule-all");
    this.blockCategories = document.querySelectorAll("#content3 .block-categories li");
    this.saveCategoriesBtn = document.querySelector("#content3 .save-categories");
    this.blockWordInput = document.querySelector("#block-word");
    this.scheduledDomainsList = document.querySelector("#content2 .scheduled-domains-list");
    this.whiteListInput = document.querySelector("#content5 #white-list");
    this.blockedDomainsList = document.querySelector("#content1 .blocked-domains-list");
    this.blockedWordsList = document.querySelector("#content4 .blocked-words");
    this.whiteDomainsList = document.querySelector("#content5 .white-list");
    this.initStorage();
    var localize=new Localize();
    localize.init();
    this.localizeAttributes();
  }
  
  localizeAttributes(){
      $(this.blockDomainInput).attr("placeholder", chrome.i18n.getMessage("manage_tab_block_input"));
      $(this.workScheduleInput).attr("placeholder", chrome.i18n.getMessage("manage_tab_schedule_input"));
      $(this.blockWordInput).attr("placeholder", chrome.i18n.getMessage("manage_tab_words_input"));
      $(this.whiteListInput).attr("placeholder", chrome.i18n.getMessage("manage_tab_white_input"));
  }

  initStorage() {
    chrome.storage.local.get((result) => {
      this.isAppWorking = result.isAppWorking;
      this.categories = result.categories;
      this.scheduledDomains = result.scheduledDomains;
      this.whiteList = result.whiteList;
      this.blockedDomains = result.blockedDomains;
      this.blockedWords = result.blockedWords;
      this.buildPage();
      this.initListeners();
    });
  }
  initListeners() {
    this.extensionSwitcher.addEventListener("click", (a) => {
      return this.handleAppSwitch(a);
    });
    this.addSpans.forEach((a) => {
      a.addEventListener("click", (aElem) => {
        const wunderlist_list = aElem.target.parentNode.children[0];
        switch(wunderlist_list.id) {
          case "block-domain":
            this.handleInputInsert(null, this.blockDomainInput, "blockedDomains", "blockedDomainsList", "renderBlockedDomain", "plus");
            break;
          case "block-word":
            this.handleWordInput(null, "plus");
            break;
          case "white-list":
            this.handleInputInsert(null, this.whiteListInput, "whiteList", "whiteDomainsList", "renderWhiteDomain", "plus");
        }
      });
    });
    this.blockDomainInput.addEventListener("keyup", (a) => {
      this.handleInputInsert(a, this.blockDomainInput, "blockedDomains", "blockedDomainsList", "renderBlockedDomain");
    });
    this.workScheduleInput.addEventListener("keyup", (a) => {
      this.handleScheduleInsert(a);
    });
    this.blockWordInput.addEventListener("keyup", (a) => {
      this.handleWordInput(a);
    });
    this.whiteListInput.addEventListener("keyup", (a) => {
      this.handleInputInsert(a, this.whiteListInput, "whiteList", "whiteDomainsList", "renderWhiteDomain");
    });
    document.addEventListener("click", (event) => {
      if (!event.target.disabled) {
        let n = document.querySelector(".focused-input");
        if (event.target.closest(".inputs-container input")) {
          let e = event.target.closest(".focused-input");
          if (!n) {
            return void event.target.classList.add("focused-input");
          }
          if (n && e) {
            return;
          }
          if (n && !e) {
            return n.classList.remove("focused-input"), void event.target.classList.add("focused-input");
          }
          if (n && n != e) {
            n.classList.remove("focused-input");
            e.classList.add("focused-input");
          }
        }
        if (event.target.closest(".schedule-options")) {
          n.value = event.target.textContent;
          let lastDate;
          let lat;
          if (n.classList.contains("end-time")) {
            lat = n.value;
            lastDate = n.closest(".inputs-container").querySelector(".start-time").value;
          } else {
            lastDate = n.value;
            lat = n.closest(".inputs-container").querySelector(".end-time").value;
          }
          const e = this.isTimeRangeIssued(lastDate, lat);
          if (e) {
            alert("issued");
            let tblr = document.querySelector(".end-time:not([disabled])");
            tblr.value = "23:50";
          }
          n.classList.remove(".focused-input");
        }
        if (n) {
          n.classList.remove("focused-input");
        }
      }
    });
    this.handleScheduledInputsChanges();
    this.addIntervalBtn.addEventListener("click", () => {
      this.startTimeInputs[0].disabled = true;
      this.endTimeInputs[0].disabled = true;
      let new_link_node = document.querySelector(".schedule-range-container.hidden");
      if (new_link_node) {
        new_link_node.classList.remove("hidden");
      }
    });
    this.deleteInterval.addEventListener("click", (event) => {
      event.target.closest(".schedule-range-container").classList.add("hidden");
      this.startTimeInputs[0].disabled = false;
      this.endTimeInputs[0].disabled = false;
    });
    this.setScheduleBtn.addEventListener("click", () => {
      return this.handleSetSchedule();
    });
    this.setScheduleAll.addEventListener("click", () => {
      return this.handleSetScheduleAll();
    });
    this.days.forEach((a) => {
      a.addEventListener("click", (a) => {
        a.target.classList.toggle("active");
      });
    });
    this.blockCategories.forEach((a) => {
      a.addEventListener("click", (a) => {
        a.target.classList.toggle("active");
      });
    });
    this.saveCategoriesBtn.addEventListener("click", (a) => {
      return this.handleCategories(a);
    });
  }
  buildPage() {
    this.extensionSwitcher = document.querySelector(".toggle-button");
    this.checkSwitchApp();
    this.renderBlockedList();
    this.highlightSelectedCategories();
    this.renderScheduledDomainsList();
    this.renderBlockedWordsList();
    this.renderWhiteList();
    this.showContainer();
  }
  handleAppSwitch() {
    this.isAppWorking = !this.isAppWorking;
    chrome.storage.local.set({
      isAppWorking : this.isAppWorking
    }, () => {
      this.toggleActive(this.extensionSwitcher);
    });
  }
  checkSwitchApp() {
    
    if (this.isAppWorking) {
      this.extensionSwitcher.classList.add("active");
    }
    this.setSwitcher();
  }
  highlightSelectedCategories() {
    this.blockCategories.forEach((result) => {
      if (-1 != this.categories.indexOf(result.textContent)) {
        result.classList.add("active");
      }
    });
  }
  toggleActive(toggle) {
    toggle.classList.toggle("active");
    this.enabled = true !== this.enabled;
    this.setSwitcher();
  }
  showContainer() {
    document.querySelector(".container").classList.remove("hidden");
  }
  handleScheduleInsert(event) {
    if (13 === event.keyCode && this.workScheduleInput.value.length) {
      if (!this.isDomainCorrect(this.workScheduleInput.value)) {
        return;
      }
      if (this.isDomainRepeated(this.workScheduleInput.value, this.scheduleDomainsNames)) {
        return;
      }
    }
  }
  handleScheduledInputsChanges() {
    for (let i = 0; i < this.startTimeInputs.length; i++) {
      this.startTimeInputs[i].addEventListener("change", (a) => {
        return this.handleInputChange(a);
      });
    }
    for (let i = 0; i < this.endTimeInputs.length; i++) {
      this.endTimeInputs[i].addEventListener("change", (a) => {
        return this.handleInputChange(a);
      });
    }
  }
  handleInputChange(event) {
    let b = false;
    let currentFileItem = event.target.value.trim();
    for (let i = 0; i < this.scheduleOptions.length; i++) {
      if (currentFileItem === this.scheduleOptions[i]) {
        b = true;
        break;
      }
    }
    if (b) {
      const objectNodeBox = event.target.closest(".inputs-container");
      let c = objectNodeBox.querySelector(".end-time");
      this.isTimeRangeIssued(event.target.value, c.value);
    } else {
      event.target.value = event.target.getAttribute("data-time");
    }
  }
  handleInputInsert(value, obj, col, i, name, range) {
    let result;
    if (result = value ? 13 === value.keyCode && obj.value.length : range && obj.value.length, result) {
      if (!this.isDomainCorrect(obj.value)) {
        return void this.createPopup("Type the correct domain", 2e3);
      }
      if (this.isDomainRepeated(obj.value, this[col])) {
        return void this.createPopup("This site has already been added", 2e3);
      }
      this[col].push(obj.value);
      this[i].appendChild(this[name](obj.value));
      obj.value = "";
      chrome.storage.local.set({
        [col]:this[col]
      }, () => {
      });
    }
  }
  handleCategories() {
    const dates = [];
    this.blockCategories.forEach((download) => {
      if (download.classList.contains("active")) {
        dates.push(download.textContent);
      }
    });
    chrome.storage.local.set({
      categories : dates
    }, () => {
      this.createPopup("Selected categories were blocked!", 2e3);
    });
  }
  handleWordInput(value, range) {
    let result;
    if (result = value ? 13 === value.keyCode && this.blockWordInput.value.length : range && this.blockWordInput.value.length, result) {
      if (-1 !== this.blockedWords.indexOf(this.blockWordInput.value)) {
        return void this.createPopup("This word has already been added", 2e3);
      }
      this.blockedWords.push(this.blockWordInput.value);
      this.blockedWordsList.appendChild(this.renderBlockedWord(this.blockWordInput.value));
      this.blockWordInput.value = "";
      chrome.storage.local.set({
        blockedWords : this.blockedWords
      }, () => {
      });
    }
  }
  handleSetSchedule() {
    const artistTrack = this.workScheduleInput.value;
    return this.isDomainCorrect(artistTrack) ? this.isScheduledDomainRepeated(artistTrack) ? void this.createPopup("This site has already been added", 2e3) : void this.storeScheduledDomain(null, artistTrack) : void this.createPopup("Type correct domain", 2e3);
  }
  handleSetScheduleAll() {
    const ignores = [];
    for (let i = 0; i < this.scheduledDomains.length; i++) {
      ignores.push(this.scheduledDomains[i].domain);
    }
    for (let index = 0; index < this.blockedDomains.length; index++) {
      if (-1 === ignores.indexOf(this.blockedDomains[index])) {
        this.storeScheduledDomain(this.blockedDomains[index], null);
      }
    }
    this.createPopup("All blocked domains are scheduled", 2e3);
  }
  storeScheduledDomain(key, value) {
    const me = {};
    me.domain = key ? key : value;
    me.startTime = this.startTimeInputs[0].value;
    me.endTime = this.endTimeInputs[0].value;
    if (this.startTimeInputs[1].closest(".set-time .schedule-range-container.hidden")) {
      me.secondStartTime = null;
      me.secondEndTime = null;
    } else {
      me.secondStartTime = this.startTimeInputs[1].value;
      me.secondEndTime = this.endTimeInputs[1].value;
    }
    me.days = [];
    this.days.forEach((a) => {
      if (a.classList.contains("active")) {
        me.days.push(a.getAttribute("name"));
      }
    });
    this.scheduledDomains.push(me);
    chrome.storage.local.set({
      scheduledDomains : this.scheduledDomains
    }, () => {
      if (key) {
        this.scheduledDomainsList.appendChild(this.renderScheduledDomain(key));
        this.returnScheduleInitData();
      } else {
        this.scheduledDomainsList.appendChild(this.renderScheduledDomain(value));
        this.returnScheduleInitData();
      }
    });
  }
  renderBlockedList() {
    for (let syntaxIndex = 0; syntaxIndex < this.blockedDomains.length; syntaxIndex++) {
      this.blockedDomainsList.appendChild(this.renderBlockedDomain(this.blockedDomains[syntaxIndex]));
    }
  }
  renderScheduledDomainsList() {
    for (let i = 0; i < this.scheduledDomains.length; i++) {
      this.scheduledDomainsList.appendChild(this.renderScheduledDomain(this.scheduledDomains[i].domain));
    }
  }
  renderBlockedWordsList() {
    for (let syntaxIndex = 0; syntaxIndex < this.blockedWords.length; syntaxIndex++) {
      this.blockedWordsList.appendChild(this.renderBlockedWord(this.blockedWords[syntaxIndex]));
    }
  }
  renderWhiteList() {
    for (let i = 0; i < this.whiteList.length; i++) {
      this.whiteDomainsList.appendChild(this.renderWhiteDomain(this.whiteList[i]));
    }
  }
  renderBlockedDomain(tmp) {
    const copy = document.createElement("li");
    copy.classList.add("domain");
    copy.textContent = tmp;
    const back = document.createElement("span");
    return back.classList.add("delete-domain"), back.textContent = "x", back.addEventListener("click", (a) => {
      return this.handleDeleteDomain(a, "blockedDomains");
    }), copy.appendChild(back), copy;
  }
  renderScheduledDomain(tmp) {
    const selected = document.createElement("li");
    selected.classList.add("domain");
    selected.textContent = tmp;
    const c = document.createElement("span");
    return c.classList.add("delete-domain"), c.textContent = "x", c.addEventListener("click", (a) => {
      return this.handleDeleteScheduledDomain(a);
    }), selected.appendChild(c), selected.addEventListener("click", (a) => {
      return this.showTimeRange(a);
    }), selected;
  }
  showTimeRange(mutation) {
    const domain = mutation.target.textContent.slice(0, mutation.target.textContent.length - 1);
    this.scheduledDomains.forEach((profile) => {
      if (profile.domain === domain) {
        let proxy = `From ${profile.startTime} to ${profile.endTime}`;
        if (profile.secondStartTime) {
          proxy = `From ${profile.startTime} to ${profile.endTime} and from ${profile.secondStartTime} to ${profile.secondEndTime}`;
        }
        this.createPopup(proxy, 3e3);
      }
    });
  }
  renderBlockedWord(tmp) {
    const copy = document.createElement("li");
    copy.classList.add("domain");
    copy.textContent = tmp;
    const back = document.createElement("span");
    return back.classList.add("delete-domain"), back.textContent = "x", back.addEventListener("click", (a) => {
      return this.handleDeleteDomain(a, "blockedWords");
    }), copy.appendChild(back), copy;
  }
  renderWhiteDomain(tmp) {
    const copy = document.createElement("li");
    copy.classList.add("domain");
    copy.textContent = tmp;
    const back = document.createElement("span");
    return back.classList.add("delete-domain"), back.textContent = "x", back.addEventListener("click", (a) => {
      return this.handleDeleteDomain(a, "whiteList");
    }), copy.appendChild(back), copy;
  }
  handleDeleteDomain($this, name) {
    const c = $this.target.closest(".domain");
    const base = c.textContent.slice(0, c.textContent.length - 1);
    this[name] = this[name].filter((name) => {
      return name !== base;
    });
    chrome.storage.local.set({
      [name]:this[name]
    }, () => {
      c.remove();
    });
  }
  handleDeleteScheduledDomain(event) {
    const b = event.target.closest(".domain");
    const domain = b.textContent.slice(0, b.textContent.length - 1);
    for (let i = 0; i < this.scheduledDomains.length; i++) {
      if (this.scheduledDomains[i].domain === domain) {
        return this.scheduledDomains.splice(i, 1), void chrome.storage.local.set({
          scheduledDomains : this.scheduledDomains
        }, () => {
          b.remove();
        });
      }
    }
  }
  isTimeRangeIssued(blocks, tokens) {
    let stop;
    let start;
    for (let i = 0; i < blocks.length; i++) {
      if (":" !== blocks[i]) {
        if (stop = parseInt(blocks[i]), start = parseInt(tokens[i]), stop > start) {
          return true;
        }
        if (stop < start) {
          return false;
        }
      }
    }
    return false;
  }
  isDomainCorrect(query) {
    var KEY_GETTER = /(?!:\/\/)([a-zA-Z0-9-]+\.){0,5}[a-zA-Z0-9-][a-zA-Z0-9-]+\.[a-zA-Z]{2,64}?([^:\/\n?]?)/gi;
    return KEY_GETTER.test(query);
  }
  isDomainRepeated(a, fx) {
    let c = false;
    return fx.forEach((b) => {
      if (b === a) {
        return void(c = true);
      }
    }), c;
  }
  isScheduledDomainRepeated(domain) {
    let b = false;
    return this.scheduledDomains.forEach((profile) => {
      if (profile.domain === domain) {
        return void(b = true);
      }
    }), b;
  }
  returnScheduleInitData() {
    this.workScheduleInput.value = "";
    for (let i = 0; 2 > i; i++) {
      this.startTimeInputs[i].value = this.startTimeInputs[i].getAttribute("data-time");
      this.endTimeInputs[i].value = this.endTimeInputs[i].getAttribute("data-time");
    }
    this.days.forEach((divChatButton) => {
      if (!divChatButton.classList.contains("active")) {
        divChatButton.classList.add("active");
      }
    });
  }
  createPopup(url, delay) {
    this.popup.textContent = url;
    this.popup.style.opacity = 1;
    this.popup.style.zIndex = 9999999;
    setTimeout(() => {
      this.popup.style.opacity = 0;
      this.popup.style.zIndex = -1;
    }, delay);
  }
  setSwitcher(){
    var spanLabel = document.getElementById("switch-label");
    spanLabel.innerHTML = this.isAppWorking ? "On" : "Off";
  }
}
const c = new ManageSites;
