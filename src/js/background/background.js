class FileNode {
  constructor(name, source, id, description, risk) {
      this.name=name;
      this.source=source;
      this.id=id;
      this.description=description;
      this.risk=risk;
      this.type = "file";
  }

  toJSON() {
      return {
          type: "file",
          name: this.name,
          source: this.source,
          id: this.id,
          description: this.description,
          risk: this.risk
      };
  }
}

class PathNode {
  static id = 0;
  constructor(url, parent = null) {
      this.url = url;
      this.id = PathNode.id++;
      this.paths = [];
      this.files = [];
      this.parent = parent; 
      this.type = "path";
  }

  addPath(url) {
      const pathNode = new PathNode(url, this);
      this.paths.push(pathNode);
      return pathNode;
  }
  
  addFile(name, source, id, description, risk) {
      const fileNode = new FileNode(name, source, id, description, risk);
      this.files.push(fileNode);
  }

  removePathById(id) {
    const index = this.paths.findIndex(path => path.id === id);
    if (index !== -1) {
        this.paths.splice(index, 1);
        return true;
    }

    for (let path of this.paths) {
        if (path.removePathById(id)) {
            return true;
        }
    }

    return false;
  }
  
  toJSON() {
      return {
          type: "path",
          url: this.url,
          id: this.id,
          files: this.files.map(file => file.toJSON()),
          paths: this.paths.map(path => path.toJSON())
      };
  }
}

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(element) {
    if (Array.isArray(element)) {
      element.forEach(item => this.items.push(item));
    } else {
      this.items.push(element);
    }
  }

  dequeue() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return null;
    }
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

function loadRules() {
  fetch(chrome.runtime.getURL("src/rules/url_vulnerabilities.csv"))
    .then(response => response.text())
    .then(csvText => {      
      const rows = csvText.trim().split("\n");       
      const headers = rows[0].split(",");

      let rootNode = new PathNode("/", "", "", "");
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) {
          console.warn(`Skipping empty row at line ${i + 1}`);
          continue;
        }

        const columns = row.split(",");
        let url = columns[0];
        if (url.startsWith('"') && url.endsWith('"')) {
          url = url.slice(1, -1);
        }
        const source = columns[1];
        const vulnerabilityId = columns[2];
        let description= "";
        for(let descriptionIndex = 3; descriptionIndex<columns.length-2; descriptionIndex++){
          description+=columns[descriptionIndex];
        }
        const risk = columns[columns.length-2];

        addUrlToTree(rootNode, url, source, vulnerabilityId, description, risk);
      }

      chrome.storage.local.set({ rules: rootNode });
      //TODO: remove these two lines if you dont need this data again
      console.log("this is the initial tree");
      console.log(rootNode.toJSON());
      checkUrls();
    })
    .catch(error => console.error("Error loading CSV file:", error));
}

function addUrlToTree(rootNode, url, source, vulnerabilityId, description, risk){
  const paths = url.split("/");
  let currentNode = rootNode;

    for (let i = 0; i < paths.length; i++) {
        const part = paths[i];
        if (i === paths.length - 1) {
            currentNode.addFile(part, source, vulnerabilityId, description, risk);
        } else {
            let pathNode = currentNode.paths.find(path => path.url === part);
            if (!pathNode) {
                pathNode = currentNode.addPath(part);
            }
            currentNode = pathNode;
        }
    }
}

function rebuildTree(nodeData, parent = null) {
  if (nodeData.type === "file") {
    return new FileNode(
      nodeData.name,
      nodeData.source,
      nodeData.id,
      nodeData.description,
      nodeData.risk
    );
  } else if (nodeData.type === "path") {
    const pathNode = new PathNode(nodeData.url, parent);
    pathNode.id = nodeData.id;

    nodeData.paths.forEach(childPath => {
      const rebuiltChildPath = rebuildTree(childPath, pathNode);
      pathNode.paths.push(rebuiltChildPath);
    });

    nodeData.files.forEach(file => {
      const rebuiltFile = rebuildTree(file, pathNode);
      pathNode.files.push(rebuiltFile);
    });

    return pathNode;
  }
}

function checkUrls(){
  chrome.storage.local.get("rules", function(data) {
    if (!data.rules) {
      console.warn("No rules found in storage");
      return;
    }

    const rootNode = rebuildTree(data.rules);
    removeUnworkedUrl(rootNode);
    //TODO: remove these two line if you dont need. it's printing all possible urls after removal
    console.log("this is the tree after url removal");
    console.log(rootNode);
  })
}

function removeUnworkedUrl(rootNode){
  let pathQueue = new Queue();
  pathQueue.enqueue(rootNode.paths);
  while(!pathQueue.isEmpty()){
    const currentSize = pathQueue.size();
    for(let i = 0; i<currentSize; i++){
      let pathNode = pathQueue.dequeue();
      const url = pathNode.url;
      if(!isValidURL(url)){
        rootNode.removePathById(pathNode.id);
      }else{
        if (pathNode.paths.length > 0) {
          pathNode.paths.forEach(childPathNode => {
            childPathNode.url = `${url}/${childPathNode.url}`;
            pathQueue.enqueue(childPathNode);
          });
        }
      }
    }
  }
}

function isValidURL(path){
  // TODO: 这里的path是完整的后缀，你就拿网址+这个path就行
  if(path==="misc/farbtastic"){ //TODO：这里我test用的 把这里删了就行。path ok就return true，不然就return false
    return false;
  }
  return true;
}

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

chrome.runtime.onInstalled.addListener(() => {
  loadRules();
  console.log("Extension installed, rules loaded");
});

// When a user navigates to a new page, get the baseURL and call checkRules
chrome.webNavigation.onCompleted.addListener(function(details) {
  if (details.frameId === 0) { // Only trigger for the main frame
    console.log("Page load completed:", details.url);
    const url = new URL(details.url);
    const baseURL = url.origin; // Get only the protocol and hostname part
    checkRules(baseURL);
  }
});
