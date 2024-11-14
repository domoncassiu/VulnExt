const hardCodeData = [{name:'MM',description:'hahah',url:'https://mm.com',risk:'HIGH'},
{name:'PP',description:'hahah',url:'https://pp.com',risk:'LOW'},
{name:'FF',description:'hahah',url:'https://ff.com',risk:'NOT IMPORTANT'},
{name:'MM',description:'hahah',url:'https://mm.com',risk:'HIGH'},
{name:'PP',description:'hahah',url:'https://pp.com',risk:'LOW'},
{name:'FF',description:'hahah',url:'https://ff.com',risk:'NOT IMPORTANT'},
{name:'MM',description:'hahah',url:'https://mm.com',risk:'HIGH'},
{name:'PP',description:'hahah',url:'https://pp.com',risk:'LOW'},
{name:'FF',description:'hahah',url:'https://ff.com',risk:'NOT IMPORTANT'},
{name:'MM',description:'hahah',url:'https://mm.com',risk:'HIGH'},
{name:'PP',description:'hahah',url:'https://pp.com',risk:'LOW'},
{name:'FF',description:'hahah',url:'https://ff.com',risk:'NOT IMPORTANT'},
{name:'MM',description:'hahah',url:'https://mm.com',risk:'HIGH'},
{name:'PP',description:'hahah',url:'https://pp.com',risk:'LOW'},
{name:'FF',description:'hahah',url:'https://ff.com',risk:'NOT IMPORTANT'},
{name:'MM',description:'hahah',url:'https://mm.com',risk:'HIGH'},
{name:'PP',description:'hahah',url:'https://pp.com',risk:'LOW'},
{name:'FF',description:'hahah',url:'https://ff.com',risk:'NOT IMPORTANT'},


];

function populateTable(data) {
  const table = document.getElementById('rules-table');
  
  data.forEach(item => {
    const row = document.createElement('div');
    row.className = 'table-row';

    ['name', 'description', 'url', 'risk'].forEach(field => {
      const cell = document.createElement('div');
      cell.className = 'table-cell';
      cell.textContent = item[field];
      row.appendChild(cell);
    });

    table.appendChild(row);
  });
}


populateTable(hardCodeData);

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
    color: node.type === 'path' ? 'lightblue' : 'pink'
  });
  // console.log(nodes)
  if (parentName) {
    edges.push({ from: parentName, to: nodeId });
  }
  if (node.files && node.files.length > 0) {
    node.files.forEach(file => {
      const fileNodeId = `${file.name}-${file.id}`;
      nodes.push({
        id: fileNodeId,
        label: `File: ${file.name}`,
        title: `Description: ${file.description}\nSource: ${file.source}\nRisk: ${file.risk}`,
        color: file.type === 'path' ? 'lightblue' : 'pink'
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
    }
  } catch (error) {
    console.warn(error);
  }
  
}
loadAndRenderTree();