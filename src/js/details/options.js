function populateTable(data) {
  const table = document.getElementById('rules-table');
  function processTableNode(item) {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.id = `row-${item.id}`;
    // console.log(item)
    if (item.type === 'file') {
      ['name', 'description', 'url', 'risk'].forEach(field => {
        const cell = document.createElement('div');
        
        cell.className = 'table-cell';
        cell.textContent = item[field] || '';
        row.appendChild(cell);
      });
      table.appendChild(row); 
    }
  
    if (item.type === 'path') {
      const cell = document.createElement('div');
      cell.className = 'table-cell';
      cell.textContent = `Path: ${item.url || item.name}`;
      row.appendChild(cell);
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
}


function highlightTableRow(nodeId) {
  document.querySelectorAll('.table-row').forEach(row => {
    row.classList.remove('highlight-row');
  });

  const rowToHighlight = document.getElementById(`row-${nodeId}`);
  console.log(nodeId)
  if (rowToHighlight) {
    rowToHighlight.classList.add('highlight-row');
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
  console.log(networkData)
  const options = {
    nodes: {
      shape: 'box',
      font: { size: 25, color: '#000' },
    },
    edges: {
      color: '#888',
      arrows: { to: true },
      smooth: { type: 'cubicBezier' },
      smooth: false, 
    },
    layout: {
      hierarchical: {
        direction: 'LR', 
        sortMethod: 'directed',
        levelSeparation: 800, 
        nodeSpacing: 600
      },
    },
    interaction: {
      zoomView: true,      
      dragView: true            
    }
  };
  const network = new vis.Network(container, networkData, options);
  network.on("click", function (params) {
    
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      highlightTableRow(nodeId);
    }
  });
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