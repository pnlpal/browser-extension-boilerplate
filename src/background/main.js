import setting from "./setting.js";
import message from "./message.js";
import chatgpt from "./chatgpt.js";

const initPromises = (async function () {
  await setting.init();
  await chatgpt.init();
})();

chrome.runtime.onInstalled.addListener(function (details) {
  const manifestData = chrome.runtime.getManifest();
  if (
    [chrome.runtime.OnInstalledReason.INSTALL].includes(details.reason) &&
    details.previousVersion != manifestData.version
  ) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html"),
    });
  }
});

chrome.runtime.onMessage.addListener(function (...args) {
  initPromises.then(() => {
    message.handle(...args);
  });
  // sendResponse becomes invalid when the event listener returns,
  // unless you return true from the event listener to indicate you wish to send a response asynchronously
  return true;
});

chrome.action.onClicked.addListener(async function (tab) {
  await initPromises;
  chatgpt.open(tab);
});

chrome.windows.onRemoved.addListener(async function (wid, ...args) {
  await initPromises;
  chatgpt.destroyWin(wid);
});
