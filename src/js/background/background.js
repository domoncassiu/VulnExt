// Load the rules.json file
fetch(chrome.runtime.getURL("src/rules/rules.json"))
  .then(response => response.json())
  .then(rules => {
    chrome.storage.local.set({ rules: rules });
  })
  .catch(error => console.error("Error loading rules:", error));

// Check if the specified baseURL has already been checked
function checkRules(baseURL) {
  // Retrieve the list of checked sites and rules
  chrome.storage.local.get(["checkedSites", "rules"], function(data) {
    const checkedSites = data.checkedSites || {};
    const rules = data.rules || [];
    
    // If the baseURL has already been checked, skip the check
    if (checkedSites[baseURL]) {
      console.log(`Already checked: ${baseURL}`);
      return;
    }

    // Otherwise, mark as checked and proceed with the check
    checkedSites[baseURL] = true;
    const matches = [];

    // Iterate through the rules and create the full URL for each rule to check
    const fetchPromises = rules.map(rule => {
      const fullURL = `${baseURL}/${rule.url}`;
      
      // Use fetch to check if the path exists
      return fetch(fullURL, { method: "HEAD" })
        .then(response => {
          if (response.ok) {
            console.log(`Checked ${fullURL}: ${response.status}`);
            // If the URL exists, add it to the matches array
            matches.push({
              name: rule.name,
              description: rule.description,
              url: fullURL,
              risk: rule.risk
            });
          }else{
            console.log(`Checked ${fullURL}: ${response.status}`);
          }
        })
        .catch(error => {
          console.error(`Error checking ${fullURL}:`, error);
        });
    });

    // Once all requests are completed, store the results in storage and update checkedSites
    Promise.all(fetchPromises).finally(() => {
      chrome.storage.local.set({ matches: matches, checkedSites: checkedSites });
    });
  });
}

// When a user navigates to a new page, get the baseURL and call checkRules
chrome.webNavigation.onCompleted.addListener(function(details) {
  if (details.frameId === 0) { // Only trigger for the main frame
    console.log("Page load completed:", details.url);
    const url = new URL(details.url);
    const baseURL = url.origin; // Get only the protocol and hostname part
    checkRules(baseURL);
  }
});
