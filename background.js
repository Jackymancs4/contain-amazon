// Param values from https://developer.mozilla.org/Add-ons/WebExtensions/API/contextualIdentities/create
const AMAZON_CONTAINER_NAME = "Amazon";
const AMAZON_CONTAINER_COLOR = "red";
const AMAZON_CONTAINER_ICON = "briefcase";
let AMAZON_DOMAINS = ["amazon.com", "amazon.ac", "amazon.ad", "amazon.ae", "amazon.com.af", "amazon.com.ag", "amazon.com.ai", "amazon.al", "amazon.am", "amazon.co.ao", "amazon.com.ar", "amazon.as", "amazon.at", "amazon.com.au", "amazon.az", "amazon.ba", "amazon.com.bd", "amazon.be", "amazon.bf", "amazon.bg", "amazon.com.bh", "amazon.bi", "amazon.bj", "amazon.com.bn", "amazon.com.bo", "amazon.com.br", "amazon.bs", "amazon.bt", "amazon.com.bw", "amazon.by", "amazon.com.bz", "amazon.ca", "amazon.com.kh", "amazon.cc", "amazon.cd", "amazon.cf", "amazon.cat", "amazon.cg", "amazon.ch", "amazon.ci", "amazon.co.ck", "amazon.cl", "amazon.cm", "amazon.cn", "amazon.com.co", "amazon.co.cr", "amazon.com.cu", "amazon.cv", "amazon.com.cy", "amazon.cz", "amazon.de", "amazon.dj", "amazon.dk", "amazon.dm", "amazon.com.do", "amazon.dz", "amazon.com.ec", "amazon.ee", "amazon.com.eg", "amazon.es", "amazon.com.et", "amazon.fi", "amazon.com.fj", "amazon.fm", "amazon.fr", "amazon.ga", "amazon.ge", "amazon.gf", "amazon.gg", "amazon.com.gh", "amazon.com.gi", "amazon.gl", "amazon.gm", "amazon.gp", "amazon.gr", "amazon.com.gt", "amazon.gy", "amazon.com.hk", "amazon.hn", "amazon.hr", "amazon.ht", "amazon.hu", "amazon.co.id", "amazon.iq", "amazon.ie", "amazon.co.il", "amazon.im", "amazon.co.in", "amazon.io", "amazon.is", "amazon.it", "amazon.je", "amazon.com.jm", "amazon.jo", "amazon.co.jp", "amazon.co.ke", "amazon.ki", "amazon.kg", "amazon.co.kr", "amazon.com.kw", "amazon.kz", "amazon.la", "amazon.lb", "amazon.com.lc", "amazon.li", "amazon.lk", "amazon.co.ls", "amazon.lt", "amazon.lu", "amazon.lv", "amazon.com.ly", "amazon.co.ma", "amazon.md", "amazon.me", "amazon.mg", "amazon.mk", "amazon.ml", "amazon.com.mm", "amazon.mn", "amazon.ms", "amazon.com.mt", "amazon.mu", "amazon.mv", "amazon.mw", "amazon.com.mx", "amazon.com.my", "amazon.co.mz", "amazon.com.na", "amazon.ne", "amazon.com.nf", "amazon.com.ng", "amazon.com.ni", "amazon.nl", "amazon.no", "amazon.com.np", "amazon.nr", "amazon.nu", "amazon.co.nz", "amazon.com.om", "amazon.com.pk", "amazon.com.pa", "amazon.com.pe", "amazon.com.ph", "amazon.pl", "amazon.com.pg", "amazon.pn", "amazon.com.pr", "amazon.ps", "amazon.pt", "amazon.com.py", "amazon.com.qa", "amazon.ro", "amazon.rs", "amazon.ru", "amazon.rw", "amazon.com.sa", "amazon.com.sb", "amazon.sc", "amazon.se", "amazon.com.sg", "amazon.sh", "amazon.si", "amazon.sk", "amazon.com.sl", "amazon.sn", "amazon.sm", "amazon.so", "amazon.st", "amazon.sr", "amazon.com.sv", "amazon.td", "amazon.tg", "amazon.co.th", "amazon.com.tj", "amazon.tk", "amazon.tl", "amazon.tm", "amazon.to", "amazon.tn", "amazon.com.tr", "amazon.tt", "amazon.com.tw", "amazon.co.tz", "amazon.com.ua", "amazon.co.ug", "amazon.co.uk", "amazon.us", "amazon.com.uy", "amazon.co.uz", "amazon.com.vc", "amazon.co.ve", "amazon.vg", "amazon.co.vi", "amazon.com.vn", "amazon.vu", "amazon.ws", "amazon.co.za", "amazon.co.zm", "amazon.co.zw", "youtube.com", "blogger.com", "doubleclickbyamazon.com", "amazonblog.com", "blog.amazon", "amazonusercontent.com"];

const BLOGSPOT_DOMAINS = ["blogspot.com", "blogspot.ae", "blogspot.al", "blogspot.am", "blogspot.com.ar", "blogspot.co.at", "blogspot.com.au", "blogspot.ba", "blogspot.be", "blogspot.bg", "blogspot.bj", "blogspot.com.br", "blogspot.com.by", "blogspot.ca", "blogspot.cf", "blogspot.ch", "blogspot.cl", "blogspot.com.co", "blogspot.cv", "blogspot.com.cy", "blogspot.cz", "blogspot.de", "blogspot.dj", "blogspot.dk", "blogspot.dm", "blogspot.com.do", "blogspot.dz", "blogspot.com.eg", "blogspot.es", "blogspot.fi", "blogspot.fr", "blogspot.gr", "blogspot.hr", "blogspot.hu", "blogspot.co.id", "blogspot.ie", "blogspot.co.il", "blogspot.in", "blogspot.is", "blogspot.it", "blogspot.jp", "blogspot.co.ke", "blogspot.kr", "blogspot.li", "blogspot.lt", "blogspot.lu", "blogspot.md", "blogspot.mk", "blogspot.com.mt", "blogspot.mx", "blogspot.my", "blogspot.com.ng", "blogspot.nl", "blogspot.no", "blogspot.co.nz", "blogspot.pt", "blogspot.qa", "blogspot.ro", "blogspot.rs", "blogspot.ru", "blogspot.se", "blogspot.sg", "blogspot.si", "blogspot.sk", "blogspot.sn", "blogspot.com.sr", "blogspot.td", "blogspot.co.tl", "blogspot.co.to", "blogspot.com.tr", "blogspot.tw", "blogspot.co.uk", "blogspot.com.uy", "blogspot.co.za"];

AMAZON_DOMAINS = AMAZON_DOMAINS.concat(BLOGSPOT_DOMAINS);

const MAC_ADDON_ID = "@testpilot-containers";

let macAddonEnabled = false;
let amazonCookieStoreId = null;

const canceledRequests = {};
const tabsWaitingToLoad = {};
const amazonHostREs = [];

async function isMACAddonEnabled () {
  try {
    const macAddonInfo = await browser.management.get(MAC_ADDON_ID);
    if (macAddonInfo.enabled) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

async function setupMACAddonManagementListeners () {
  browser.management.onInstalled.addListener(info => {
    if (info.id === MAC_ADDON_ID) {
      macAddonEnabled = true;
    }
  });
  browser.management.onUninstalled.addListener(info => {
    if (info.id === MAC_ADDON_ID) {
      macAddonEnabled = false;
    }
  });
  browser.management.onEnabled.addListener(info => {
    if (info.id === MAC_ADDON_ID) {
      macAddonEnabled = true;
    }
  });
  browser.management.onDisabled.addListener(info => {
    if (info.id === MAC_ADDON_ID) {
      macAddonEnabled = false;
    }
  });
}

async function getMACAssignment (url) {
  if (!macAddonEnabled) {
    return false;
  }

  try {
    const assignment = await browser.runtime.sendMessage(MAC_ADDON_ID, {
      method: "getAssignment",
      url
    });
    return assignment;
  } catch (e) {
    return false;
  }
}

function cancelRequest (tab, options) {
  // we decided to cancel the request at this point, register canceled request
  canceledRequests[tab.id] = {
    requestIds: {
      [options.requestId]: true
    },
    urls: {
      [options.url]: true
    }
  };

  // since webRequest onCompleted and onErrorOccurred are not 100% reliable
  // we register a timer here to cleanup canceled requests, just to make sure we don't
  // end up in a situation where certain urls in a tab.id stay canceled
  setTimeout(() => {
    if (canceledRequests[tab.id]) {
      delete canceledRequests[tab.id];
    }
  }, 2000);
}

function shouldCancelEarly (tab, options) {
  // we decided to cancel the request at this point
  if (!canceledRequests[tab.id]) {
    cancelRequest(tab, options);
  } else {
    let cancelEarly = false;
    if (canceledRequests[tab.id].requestIds[options.requestId] ||
        canceledRequests[tab.id].urls[options.url]) {
      // same requestId or url from the same tab
      // this is a redirect that we have to cancel early to prevent opening two tabs
      cancelEarly = true;
    }
    // register this requestId and url as canceled too
    canceledRequests[tab.id].requestIds[options.requestId] = true;
    canceledRequests[tab.id].urls[options.url] = true;
    if (cancelEarly) {
      return true;
    }
  }
  return false;
}

function generateAmazonHostREs () {
  for (let amazonDomain of AMAZON_DOMAINS) {
    amazonHostREs.push(new RegExp(`^(.*\\.)?${amazonDomain}$`));
  }
}

async function clearAmazonCookies () {
  // Clear all amazon cookies
  const containers = await browser.contextualIdentities.query({});
  containers.push({
    cookieStoreId: "firefox-default"
  });

  let macAssignments = [];
  if (macAddonEnabled) {
    const promises = AMAZON_DOMAINS.map(async amazonDomain => {
      const assigned = await getMACAssignment(`https://${amazonDomain}/`);
      return assigned ? amazonDomain : null;
    });
    macAssignments = await Promise.all(promises);
  }

  AMAZON_DOMAINS.map(async amazonDomain => {
    const amazonCookieUrl = `https://${amazonDomain}/`;

    // dont clear cookies for amazonDomain if mac assigned (with or without www.)
    if (macAddonEnabled &&
        (macAssignments.includes(amazonDomain) ||
         macAssignments.includes(`www.${amazonDomain}`))) {
      return;
    }

    containers.map(async container => {
      const storeId = container.cookieStoreId;
      if (storeId === amazonCookieStoreId) {
        // Don't clear cookies in the Amazon Container
        return;
      }

      const cookies = await browser.cookies.getAll({
        domain: amazonDomain,
        storeId
      });

      cookies.map(cookie => {
        browser.cookies.remove({
          name: cookie.name,
          url: amazonCookieUrl,
          storeId
        });
      });
    });
  });
}

async function setupContainer () {
  // Use existing Amazon container, or create one
  const contexts = await browser.contextualIdentities.query({name: AMAZON_CONTAINER_NAME});
  if (contexts.length > 0) {
    amazonCookieStoreId = contexts[0].cookieStoreId;
  } else {
    const context = await browser.contextualIdentities.create({
      name: AMAZON_CONTAINER_NAME,
      color: AMAZON_CONTAINER_COLOR,
      icon: AMAZON_CONTAINER_ICON
    });
    amazonCookieStoreId = context.cookieStoreId;
  }
}

function reopenTab ({url, tab, cookieStoreId}) {
  browser.tabs.create({
    url,
    cookieStoreId,
    active: tab.active,
    index: tab.index,
    windowId: tab.windowId
  });
  browser.tabs.remove(tab.id);
}

function isAmazonURL (url) {
  const parsedUrl = new URL(url);
  for (let amazonHostRE of amazonHostREs) {
    if (amazonHostRE.test(parsedUrl.host)) {
      return true;
    }
  }
  return false;
}

function shouldContainInto (url, tab) {
  if (!url.startsWith("http")) {
    // we only handle URLs starting with http(s)
    return false;
  }

  if (isAmazonURL(url)) {
    if (tab.cookieStoreId !== amazonCookieStoreId) {
      // Amazon-URL outside of Amazon Container Tab
      // Should contain into Amazon Container
      return amazonCookieStoreId;
    }
  } else if (tab.cookieStoreId === amazonCookieStoreId) {
    // Non-Amazon-URL inside Amazon Container Tab
    // Should contain into Default Container
    return "firefox-default";
  }

  return false;
}

async function maybeReopenAlreadyOpenTabs () {
  const maybeReopenTab = async tab => {
    const macAssigned = await getMACAssignment(tab.url);
    if (macAssigned) {
      // We don't reopen MAC assigned urls
      return;
    }
    const cookieStoreId = shouldContainInto(tab.url, tab);
    if (!cookieStoreId) {
      // Tab doesn't need to be contained
      return;
    }
    reopenTab({
      url: tab.url,
      tab,
      cookieStoreId
    });
  };

  const tabsOnUpdated = (tabId, changeInfo, tab) => {
    if (changeInfo.url && tabsWaitingToLoad[tabId]) {
      // Tab we're waiting for switched it's url, maybe we reopen
      delete tabsWaitingToLoad[tabId];
      maybeReopenTab(tab);
    }
    if (tab.status === "complete" && tabsWaitingToLoad[tabId]) {
      // Tab we're waiting for completed loading
      delete tabsWaitingToLoad[tabId];
    }
    if (!Object.keys(tabsWaitingToLoad).length) {
      // We're done waiting for tabs to load, remove event listener
      browser.tabs.onUpdated.removeListener(tabsOnUpdated);
    }
  };

  // Query for already open Tabs
  const tabs = await browser.tabs.query({});
  tabs.map(async tab => {
    if (tab.incognito) {
      return;
    }
    if (tab.url === "about:blank") {
      if (tab.status !== "loading") {
        return;
      }
      // about:blank Tab is still loading, so we indicate that we wait for it to load
      // and register the event listener if we haven't yet.
      //
      // This is a workaround until platform support is implemented:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1447551
      // https://github.com/mozilla/multi-account-containers/issues/474
      tabsWaitingToLoad[tab.id] = true;
      if (!browser.tabs.onUpdated.hasListener(tabsOnUpdated)) {
        browser.tabs.onUpdated.addListener(tabsOnUpdated);
      }
    } else {
      // Tab already has an url, maybe we reopen
      maybeReopenTab(tab);
    }
  });
}

async function containAmazon (options) {
  // Listen to requests and open Amazon into its Container,
  // open other sites into the default tab context
  if (options.tabId === -1) {
    // Request doesn't belong to a tab
    return;
  }
  if (tabsWaitingToLoad[options.tabId]) {
    // Cleanup just to make sure we don't get a race-condition with startup reopening
    delete tabsWaitingToLoad[options.tabId];
  }

  // We have to check with every request if the requested URL is assigned with MAC
  // because the user can assign URLs at any given time (needs MAC Events)
  const macAssigned = await getMACAssignment(options.url);
  if (macAssigned) {
    // This URL is assigned with MAC, so we don't handle this request
    return;
  }

  const tab = await browser.tabs.get(options.tabId);
  if (tab.incognito) {
    // We don't handle incognito tabs
    return;
  }

  // Check whether we should contain this request into another container
  const cookieStoreId = shouldContainInto(options.url, tab);
  if (!cookieStoreId) {
    // Request doesn't need to be contained
    return;
  }
  if (shouldCancelEarly(tab, options)) {
    // We need to cancel early to prevent multiple reopenings
    return {cancel: true};
  }
  // Decided to contain
  reopenTab({
    url: options.url,
    tab,
    cookieStoreId
  });
  return {cancel: true};
}

(async function init() {
  await setupMACAddonManagementListeners();
  macAddonEnabled = await isMACAddonEnabled();

  try {
    await setupContainer();
  } catch (error) {
    // TODO: Needs backup strategy
    // See https://github.com/mozilla/contain-facebook/issues/23
    // Sometimes this add-on is installed but doesn't get a amazonCookieStoreId ?
    // eslint-disable-next-line no-console
    console.log(error);
    return;
  }
  clearAmazonCookies();
  generateAmazonHostREs();

  // Clean up canceled requests
  browser.webRequest.onCompleted.addListener((options) => {
    if (canceledRequests[options.tabId]) {
      delete canceledRequests[options.tabId];
    }
  },{urls: ["<all_urls>"], types: ["main_frame"]});
  browser.webRequest.onErrorOccurred.addListener((options) => {
    if (canceledRequests[options.tabId]) {
      delete canceledRequests[options.tabId];
    }
  },{urls: ["<all_urls>"], types: ["main_frame"]});

  // Add the request listener
  browser.webRequest.onBeforeRequest.addListener(containAmazon, {urls: ["<all_urls>"], types: ["main_frame"]}, ["blocking"]);

  maybeReopenAlreadyOpenTabs();
})();
