function init_main() {
    chrome.storage.sync.get(null, function (data) {
        console.log(data)
    });
}

document.getElementById("checkUrlsButton").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "checkUrls" }, (response) => {
      if (response && response.status === "checkUrls started") {
        const button = document.getElementById("checkUrlsButton");
        button.disabled = true; 
        button.textContent = "Scanning";  
      }
    });
  });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scanComplete") {
        const button = document.getElementById("checkUrlsButton");
        const progressElement = document.getElementById("progressDisplay");
        button.disabled = false;
        button.textContent = "Finished";
        progressElement.textContent = `scan complete`;
    }
});
  

document.getElementById("gradient-button").addEventListener("click", function () {
    chrome.runtime.openOptionsPage();
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "progressUpdate") {
        const progressElement = document.getElementById("progressDisplay");
        const urlElement = document.getElementById("urlDisplay");

        if (progressElement) progressElement.textContent = `Progress: ${message.progress}`;
    }
});
  

document.addEventListener('DOMContentLoaded', init_main);