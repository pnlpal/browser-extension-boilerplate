console.log(
  "Hello from preinject.js! Document is not ready yet.",
  document.body
);

document.addEventListener("DOMContentLoaded", function () {
  console.log("Document is ready now!");

  chrome.runtime.sendMessage({ type: "chatgpt initiated" });
});
