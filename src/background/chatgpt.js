import setting from "./setting.js";
import message from "./message.js";

import { playSynthesis } from "../offscreen/speak.js";

let creating = null; // A global promise to avoid concurrency issues

const setupOffscreenDocument = async () => {
  const path = "offscreen.html";
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) return;

  if (creating) await creating;
  else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play audio of the word",
    });
    await creating;
    creating = null;
  }
};

export default {
  wid: null,
  async init() {
    const savedInfo = await chrome.storage.local.get("chatgpt");
    if (savedInfo.chatgpt) {
      this.wid = savedInfo.chatgpt.wid;
    }

    message.on("chatgpt initiated", (request, sender) => {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ["inject.bundle.js"],
      });
    });

    message.on("chatgpt beforeunload", (request) => {
      setting.setValues({
        windowLeft: request.left,
        windowTop: request.top,
        windowWidth: request.width,
        windowHeight: request.height,
      });
    });

    message.on("read text", async (request) => {
      if (!navigator.userAgent.includes("Gecko/")) {
        await setupOffscreenDocument();
        chrome.runtime.sendMessage({
          type: "speak",
          text: request.text,
        });
      } else {
        playSynthesis(request.text);
      }
    });
  },
  async open() {
    const url = "https://chatgpt.com";

    if (!this.wid) {
      const win = await chrome.windows.create({
        url,
        type: "popup",
        left: setting.getValue("windowLeft"),
        top: setting.getValue("windowTop"),
        width: setting.getValue("windowWidth"),
        height: setting.getValue("windowHeight"),
      });
      this.wid = win.id;
      await chrome.storage.local.set({ chatgpt: { wid: this.wid } });
    } else {
      return chrome.windows.update(this.wid, { focused: true });
    }
  },
  destroyWin(wid) {
    if (this.wid === wid) {
      this.wid = null;
      chrome.storage.local.remove("chatgpt");
    }
  },
};
