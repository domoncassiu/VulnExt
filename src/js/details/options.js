function populateTable(data) {
  const table = document.getElementById('rules-table');

  // 从 chrome.storage.local 获取 baseURL
  chrome.storage.local.get(['baseURL'], (result) => {
    const baseURL = result.baseURL || "https://default-url.com"; // 默认 baseURL

    function processTableNode(item) {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.id = `row-${item.id}`;

      if (item.type === 'file') {
        ['name', 'description', 'url', 'risk'].forEach(field => {
          const cell = document.createElement('div');
          cell.className = 'table-cell';

          if (field === 'url' && item[field]) {
            // 将 URL 转换为超链接
            const link = document.createElement('a');
            link.href = `${baseURL}/${item[field]}`;
            link.textContent = `${baseURL}/${item[field]}`;
            link.target = '_blank'; // 在新标签中打开链接
            cell.appendChild(link);
          } else {
            cell.textContent = item[field] || '';
          }
          row.appendChild(cell);
        });
        row.addEventListener('click', () => highlightTreeNode(item.id)); // 点击高亮树节点
        table.appendChild(row);
      }

      if (item.type === 'path') {
        const cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.textContent = `Path: ${item.url || item.name}`;
        row.appendChild(cell);
        row.addEventListener('click', () => highlightTreeNode(item.id)); // 点击高亮树节点
        table.appendChild(row);

        if (item.files && item.files.length > 0) {
          item.files.forEach(file => processTableNode(file));
        }

        if (item.paths && item.paths.length > 0) {
          item.paths.forEach(subPath => processTableNode(subPath));
        }
      }
    }

    if (data.files && data.files.length > 0) {
      data.files.forEach(file => processTableNode(file));
    }

    if (data.paths && data.paths.length > 0) {
      data.paths.forEach(path => processTableNode(path));
    }
  });
}




function highlightTreeNode(nodeId) {
  const network = window.networkInstance; // 访问全局网络实例
  if (network) {
    network.selectNodes([`${nodeId}`], true);
    network.focus(`${nodeId}`, { scale: 1.5 });
  }
}

function highlightTableRow(nodeId) {
  document.querySelectorAll('.table-row').forEach(row => {
    row.classList.remove('highlight-row');
  });

  const rowToHighlight = document.getElementById(`row-${nodeId}`);
  if (rowToHighlight) {
    rowToHighlight.classList.add('highlight-row');
    rowToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
  } else {
    console.warn(`Row with ID row-${nodeId} not found in the table.`);
  }
}

chrome.storage.local.get(['matches'], (result) => {
  if (result.matches) {
    populateTable(result.matches);
  }
});



chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.matches) {
    document.getElementById('rules-table').innerHTML = ''; 
    populateTable(changes.matches.newValue); 
  }
});

async function loadRootNodeFromStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("rootNodeTree", (data) => {
      if (data.rootNodeTree) {
        resolve(data.rootNodeTree);
      } else {
        reject("No rootNode found in chrome.storage.local.");
      }
    });
  });
}

function renderTree(data) {
  const nodes = [];
  const edges = [];
  if (data) {
    processNode(data, nodes, edges);
  } else {
    console.warn("No data available to render the tree.");
  }

  const container = document.getElementById('tree-container');
  const networkData = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  const options = {
    nodes: {
      shape: 'box',
      font: { size: 18, color: '#333' },
    },
    edges: {
      color: '#aaa',
      arrows: { to: true },
      smooth: { type: 'cubicBezier' },
    },
    layout: {
      hierarchical: {
        direction: 'LR',
        levelSeparation: 200,
        nodeSpacing: 100,
      },
    },
    interaction: {
      zoomView: true,
      dragView: true,
    },
  };
  const network = new vis.Network(container, networkData, options);
  network.on('click', (params) => {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      highlightTableRow(nodeId);
    }
  });

  // 保存网络实例供其他函数使用
  window.networkInstance = network;
}

function processNode(node, nodes, edges, parentName = null) {
  const nodeId = `${node.id}`;
  nodes.push({
    id: nodeId,
    label: node.type === 'path' ? `Path: ${node.url}` : `File: ${node.name}`,
    title: node.name === 'file' ? `Description: ${node.description}\nRisk: ${node.risk}` : `URL: ${node.url}`,
    color: node.type === 'path' ? 'lightblue' : 'pink'
  });
  // console.log(nodes)
  if (parentName) {
    edges.push({ from: parentName, to: nodeId });
  }
  if (node.files && node.files.length > 0) {
    node.files.forEach(file => {
      const fileNodeId = `${file.id}`;
      nodes.push({
        id: fileNodeId,
        label: `File: ${file.name}`,
        title: `Description: ${file.description}\nSource: ${file.source}\nRisk: ${file.risk}`,
        color: file.type === 'path' ? 'lightblue' : 'pink'
      });
      edges.push({ from: nodeId, to: fileNodeId });
    });
    if (node.paths && node.paths.length > 0) {
      node.paths.forEach(subPath => {
        processNode(subPath, nodes, edges, nodeId);
      });
    }
  }
}

async function loadAndRenderTree() {
  try {
    const rootNode = await loadRootNodeFromStorage();
    console.log("Loaded rootNode from chrome.storage.local:", rootNode);
    if (rootNode) {
      renderTree(rootNode);
      populateTable(rootNode)
      
    }
  } catch (error) {
    console.warn(error);
  }
  
}
loadAndRenderTree();


function populateServerVersionsTable() {
  const table = document.getElementById('server-versions-table');

  // Reset table to header only
  table.innerHTML = `
    <div class="table-row table-header">
      <div class="table-cell">URL</div>
      <div class="table-cell">Version</div>
    </div>`;

  // Retrieve server version and CMS version data from local storage
  chrome.storage.local.get(['serverVersions', 'cmsVersions'], (result) => {
    const serverVersions = result.serverVersions || [];
    const cmsVersions = result.cmsVersions || [];
    console.log('Server Versions:', serverVersions);
    console.log('CMS Versions:', cmsVersions);

    // Combine and de-duplicate entries based on URL
    const combinedVersions = {};

    // Add server versions to the map
    serverVersions.forEach(entry => {
      combinedVersions[entry.url] = { serverVersion: entry.version, cmsVersion: null };
    });

    // Add CMS versions to the map, ensuring CMS version takes precedence
    cmsVersions.forEach(entry => {
      if (!combinedVersions[entry.url]) {
        combinedVersions[entry.url] = { serverVersion: null, cmsVersion: entry.version };
      } else {
        combinedVersions[entry.url].cmsVersion = entry.version;
      }
    });

    // Populate the table with combined data
    Object.entries(combinedVersions).forEach(([url, versions]) => {
      const row = document.createElement('div');
      row.className = 'table-row';

      // URL column
      const urlCell = document.createElement('div');
      urlCell.className = 'table-cell';
      const link = document.createElement('a');
      link.href = url;
      link.textContent = url;
      link.target = '_blank';
      urlCell.appendChild(link);

      // Version column
      const versionCell = document.createElement('div');
      versionCell.className = 'table-cell';

      if (versions.cmsVersion) {
        versionCell.innerHTML = versions.cmsVersion; // Prefer CMS version
      } else if (versions.serverVersion) {
        versionCell.textContent = versions.serverVersion; // Fallback to server version
      } else {
        versionCell.textContent = 'N/A'; // No version available
      }

      row.appendChild(urlCell);
      row.appendChild(versionCell);
      table.appendChild(row);

      console.log('Row appended:', row.outerHTML); // Log each appended row
    });
  });
}


// Call this function after the page is loaded
populateServerVersionsTable();

// Update the server versions table dynamically when changes are detected
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && (changes.serverVersions || changes.cmsVersions)) {
    document.getElementById('server-versions-table').innerHTML = `
      <div class="table-row table-header">
        <div class="table-cell">URL</div>
        <div class="table-cell">Version</div>
      </div>`;
    populateServerVersionsTable();
  }
});
