function init_main() {
    chrome.storage.sync.get(null, function (data) {
        console.log(data)
    });
}

let baseUrl = "";

async function checkPhishingWebsite() {
  const apiUrl = "http://127.0.0.1:5000/check"; // Replace with your actual API endpoint
  console.log("API URL:", apiUrl); // Debugging log

  try {
      const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: baseUrl })
      });

      const data = await response.json();
      alert(`The website is likely ${data.is_phishing ? "a phishing site" : "safe"}.`);
  } catch (error) {
      console.error("Error calling phishing API:", error);
      alert("Failed to check the website. Please try again later.");
  } finally {
      button.disabled = false;
      button.textContent = "Check Phishing Website";
  }
}

document.getElementById("checkUrlsButton").addEventListener("click", () => {
  // Disable the button and update the text while starting the scan
  const button = document.getElementById("checkUrlsButton");
  button.disabled = true;
  button.textContent = "Scanning...";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
          const tab = tabs[0];
          try {
              const url = new URL(tab.url);
              baseUrl = url.origin; // Extract the origin
              console.log("Base URL:", baseUrl); // Debugging log

              // Send a message to start the checkUrls process
              chrome.runtime.sendMessage({ action: "checkUrls" }, (response) => {
                  if (response && response.status === "checkUrls started") {
                      console.log("checkUrls started successfully.");
                  }
              });

              // Proceed to check phishing after successfully extracting the base URL
              checkPhishingWebsite();
          } catch (error) {
              console.error("Invalid URL:", tab.url);
              alert("Failed to extract the URL from the current tab.");
              button.disabled = false;
              button.textContent = "Check URLs"; // Reset the button if an error occurs
          }
      } else {
          alert("No active tab found.");
          button.disabled = false;
          button.textContent = "Check URLs"; // Reset the button if no active tab is found
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

function clearVersionStorage() {
    chrome.storage.local.remove(['serverVersions', 'cmsVersions'], () => {
      console.log('Cleared serverVersions and cmsVersions from local storage.');
    });
  }
  

document.addEventListener('DOMContentLoaded', init_main);