

function populateTable(data) {
  const table = document.getElementById('rules-table');

  function processTableNode(item) {
    const row = document.createElement('div');
    row.className = 'table-row';

    if (item.type === 'file') {
      ['name', 'description', 'url', 'risk'].forEach(field => {
        const cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.textContent = item[field] || '';
        row.appendChild(cell);
      });
      table.appendChild(row); // 添加行到表格
    }

    if (item.type === 'path') {
      // 如果是路径节点，仅展示路径的信息或使用路径的名称
      const cell = document.createElement('div');
      cell.className = 'table-cell';
      cell.textContent = `Path: ${item.url || item.name}`;
      row.appendChild(cell);
      table.appendChild(row); // 添加行到表格

      // 如果路径中包含文件或子路径，递归处理这些文件和路径
      if (item.files && item.files.length > 0) {
        item.files.forEach(file => processTableNode(file));
      }

      if (item.paths && item.paths.length > 0) {
        item.paths.forEach(subPath => processTableNode(subPath));
      }
    }
    
  }

  // 处理根对象的 files 和 paths 数组
  if (data.files && data.files.length > 0) {
    data.files.forEach(file => processTableNode(file));
  }

  if (data.paths && data.paths.length > 0) {
    data.paths.forEach(path => processTableNode(path));
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

// load tree
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

  new vis.Network(container, networkData, options);
}
function processNode(node, nodes, edges, parentName = null) {
  const nodeId = `${node.id}`;
  nodes.push({
    id: nodeId,
    label: node.type === 'path' ? `Path: ${node.url}` : `File: ${node.name}`,
    title: node.name === 'file' ? `Description: ${node.description}\nRisk: ${node.risk}` : `URL: ${node.url}`,
    color: node.type === 'path' ? 'lightblue' : 'pink',
    url:node.url
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
        title: `Description: ${file.description}\nSource: ${file.source}\nRisk: ${file.risk}\nURL: ${file.url}`,
        color: file.type === 'path' ? 'lightblue' : 'pink',
        url:file.url
      });
      // Create an edge from the current path node to this file
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