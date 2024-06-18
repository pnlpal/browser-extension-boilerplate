console.log("Hello from inject.js!", document.body.nodeName);

window.addEventListener("beforeunload", function (event) {
  chrome.runtime.sendMessage({
    type: "chatgpt beforeunload",
    left: window.screenX,
    top: window.screenY,
    width: window.outerWidth,
    height: window.outerHeight,
  });
});
