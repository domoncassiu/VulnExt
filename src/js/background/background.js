class FileNode {
  static id = -1;
  constructor(name, source, id, description, risk) {
      this.name=name;
      this.source=source;
      this.code = id
      this.id = FileNode.id--;
      this.description=description;
      this.risk=risk;
      this.type = "file";
  }

  toJSON() {
      return {
          type: "file",
          name: this.name,
          source: this.source,
          code: this.code,
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

  removeFileById(id) {
    const fileIndex = this.files.findIndex(file => file.id === id);
    if (fileIndex !== -1) {
        this.files.splice(fileIndex, 1); 
        return true; 
    }

    for (let path of this.paths) {
        if (path.removeFileById(id)) {
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
  fetch(chrome.runtime.getURL("src/rules/url_vulnerabilities_updated.csv"))
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

async function checkUrls(baseURL){
  chrome.storage.local.get("rules", async function(data) {
    if (!data.rules) {
      console.warn("No rules found in storage");
      return;
    }

    const rootNode = rebuildTree(data.rules);
    await removeUnworkedUrl(baseURL, rootNode);
    //TODO: remove these two line if you dont need. it's printing all possible urls after removal
    console.log("this is the tree after url removal");
    console.log(rootNode);
    chrome.runtime.sendMessage({ action: "scanComplete" });
  })
}

async function removeUnworkedUrl(baseURL, rootNode) {
  let pathQueue = new Queue();
  pathQueue.enqueue({ node: rootNode, path: "" });

  let totalPaths = rootNode.paths.length + rootNode.files.length;
  let checkedPaths = 0;

  while (!pathQueue.isEmpty()) {
    const currentSize = pathQueue.size();

    for (let i = 0; i < currentSize; i++) {
      const { node, path } = pathQueue.dequeue();
      const currentPath = path ? `${path}/${node.url || node.name}` : node.url || node.name; 

      if (node instanceof PathNode) {
        const fullPath = `${baseURL}/${currentPath}`;

        chrome.runtime.sendMessage({
          action: "progressUpdate",
          url: fullPath,
          progress: `${checkedPaths + 1}/${totalPaths}`
        });
        checkedPaths++;

        if (!await isValidURL(baseURL, currentPath)) {
          rootNode.removePathById(node.id); 
        } else {
          node.paths.forEach(childPathNode => {
            pathQueue.enqueue({ node: childPathNode, path: currentPath });
            totalPaths++;
          });

          node.files.forEach(fileNode => {
            pathQueue.enqueue({ node: fileNode, path: currentPath });
            totalPaths++;
          });
        }
      } else if (node instanceof FileNode) {
        const fileUrl = `${baseURL}/${currentPath}`;
        const fileValid = await isValidURL(baseURL, currentPath);

        chrome.runtime.sendMessage({
          action: "progressUpdate",
          url: fileUrl,
          progress: `${checkedPaths + 1}/${totalPaths}`
        });
        checkedPaths++;

        if (!fileValid) {
          rootNode.removeFileById(node.id);

        }
      }
    }
  }
}




async function isValidURL(baseURL, path, timeout = 5000) {
  const fullURL = `${baseURL}/${path}`;
  const controller = new AbortController();
  const signal = controller.signal;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(fullURL, { method: "HEAD", signal });
    clearTimeout(timeoutId); 

    if (response.ok || response.status === 403) {
      console.log(`ok ${fullURL}: ${response.status}`);
      return true;
    } else {
      console.log(`not ok ${fullURL}: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Request timed out for ${fullURL}`);
    } else {
      console.error(`Error checking ${fullURL}:`, error);
    }
    return false;
  }
}




chrome.runtime.onInstalled.addListener(() => {
  loadRules();
  console.log("Extension installed, rules loaded");
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkUrls") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      
      if (tab.status === "complete") {
        const url = new URL(tab.url);
        const baseURL = url.origin; // Get only the protocol and hostname part
        console.log("Base URL:", baseURL);
        await checkUrls(baseURL);
        sendResponse({ status: "checkUrls started" });
      } else {
        sendResponse({ status: "Page not fully loaded. Try again later." });
      }
    });

    return true;
  }
});


