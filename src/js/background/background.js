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
      this.url = "";
  }

  toJSON() {
      return {
          type: "file",
          name: this.name,
          source: this.source,
          code: this.code,
          id: this.id,
          description: this.description,
          risk: this.risk,
          url: this.url
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
    chrome.storage.local.set({ rootNodeTree: rootNode.toJSON() }, () => {
      console.log("rootNode has been saved to chrome.storage.local");
    });
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
      const { node } = pathQueue.dequeue();
      // const currentPath = path ? `${path}/${node.url || node.name}` : node.url || node.name; 
      let path = node.url.replace(/\/+$/, '');
      if (node instanceof PathNode) {
        const fullPath = `${baseURL}/${path}`;

        chrome.runtime.sendMessage({
          action: "progressUpdate",
          url: fullPath,
          progress: `${checkedPaths + 1}/${totalPaths}`
        });
        checkedPaths++;

        if (!await isValidURL(baseURL, path)) {
          rootNode.removePathById(node.id); 
        } else {
          node.paths.forEach(childPathNode => {
            childPathNode.url = `${path}/${childPathNode.url}`;
            pathQueue.enqueue({ node: childPathNode });
            totalPaths++;
          });

          node.files.forEach(fileNode => {
            fileNode.url = `${path}/${fileNode.name}`;
            pathQueue.enqueue({ node: fileNode});
            totalPaths++;
          });
        }
      } else if (node instanceof FileNode) {
        const fileUrl = `${baseURL}/${path}`;
        const fileValid = await isValidURL(baseURL, path);

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

    let versionInfo = null;

    if (response.ok || response.status === 403) {
      console.log(`ok ${fullURL}: ${response.status}`);
      const serverHeader = response.headers.get("server");
      if (serverHeader) {
        console.log(`Server header found: ${serverHeader}`);
        serverVersion = extractServerVersion(serverHeader);
      }
      const bodyResponse = await fetch(fullURL, { method: "GET", signal });
      const bodyText = await bodyResponse.text();
      cmsVersion = extractServerVersion(bodyText);

      if (serverVersion) {
        console.log(`Server version extracted: ${serverVersion}`);
        recordVersionInfo(fullURL, serverVersion, "serverVersion");
      }
  
      if (cmsVersion) {
        console.log(`CMS version extracted: ${cmsVersion}`);
        recordVersionInfo(fullURL, cmsVersion, "cmsVersion");
      }
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

function extractServerVersion(text) {
  const patterns = [
    /<meta[^>]*name=["']?Generator["']?[^>]*content=["']?([\w\s.-]+) version ([\d.]+)/i, // Match meta generator tag
    /powered by\s*([\w\s.-]+)\s*version\s*([\d.]+)/i,                                    // Match "powered by <name> version x.y.z"
    /CMS Made Simple.*version\s*([\d.]+)/i,                                              // Match CMS Made Simple specifically
    /(?:Apache|nginx|IIS|LiteSpeed|Caddy|Tomcat|Jetty|JBoss|Node\.js|Express|PHP)\/([\d.]+)/i, // Match server types including PHP
    /PHP\/([\d.]+)/i,                                                                    // Match standalone PHP versions
    /(?:powered by|version)\s*[^\d]*([\d.]+)/i,                                          // General "powered by" or "version x.y.z" pattern
    /\bCMS Made Simple\b.*?([\d.]+)/i,                                                  // Match "CMS Made Simple version x.y.z"
    /Apache\/([\d.]+)/i,                                                                 // Match Apache versions
    /nginx\/([\d.]+)/i,                                                                  // Match nginx versions
    /IIS\/([\d.]+)/i,                                                                    // Match IIS versions
    /LiteSpeed\/([\d.]+)/i,                                                              // Match LiteSpeed versions
    /Caddy\/([\d.]+)/i,                                                                  // Match Caddy versions
    /OpenResty\/([\d.]+)/i,                                                              // Match OpenResty versions
    /Tomcat\/([\d.]+)/i,                                                                 // Match Tomcat versions
    /Jetty\/([\d.]+)/i,                                                                  // Match Jetty versions
    /JBoss\/([\d.]+)/i,                                                                  // Match JBoss versions
    /Node\.js\/([\d.]+)/i,                                                               // Match Node.js versions
    /Express\/([\d.]+)/i,                                                                // Match Express versions
    /\bDrupal\s*([\d.]+)/i,                                                              // Match Drupal versions
    /\bWordPress\s*([\d.]+)/i,                                                           // Match WordPress versions
    /\bJoomla!\s*([\d.]+)/i,                                                             // Match Joomla! versions
    /\bMagento\s*([\d.]+)/i,                                                             // Match Magento versions
    /\bShopify\s*([\d.]+)/i,                                                             // Match Shopify versions
    /\bPrestashop\s*([\d.]+)/i                                                           // Match Prestashop versions
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0]; // Return the first matched version string
    }
  }

  return null; // No version information found
}



function recordVersionInfo(url, version, type) {
  const key = type === "serverVersion" ? "serverVersions" : "cmsVersions";

  chrome.storage.local.get({ [key]: [] }, (data) => {
    const updatedVersions = data[key];

    // Avoid duplicate entries for the same URL and version
    const alreadyExists = updatedVersions.some(
      (entry) => entry.url === url && entry.version === version
    );

    if (!alreadyExists) {
      updatedVersions.push({ url, version });

      chrome.storage.local.set({ [key]: updatedVersions }, () => {
        console.log(`Saved ${type}: ${url} -> ${version}`);
      });
    }
  });
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
        const path = url.pathname;  // Get the path part
        console.log("Base URL:", baseURL);
        chrome.storage.local.set({ baseURL }, () => {
          console.log("Base URL saved to chrome.storage.local:", baseURL);
        });
        console.log("path:", path);
        await isValidURL(baseURL, path); // check the current page
        await checkUrls(baseURL);
        sendResponse({ status: "checkUrls started" });
      } else {
        sendResponse({ status: "Page not fully loaded. Try again later." });
      }
    });

    return true;
  }
});


