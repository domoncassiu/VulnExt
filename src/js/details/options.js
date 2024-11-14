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

async function getRootNode() {
  try {
    const rootNode = await loadRootNodeFromStorage();
    console.log("Loaded rootNode from chrome.storage.local:", rootNode);
  } catch (error) {
    console.warn(error);
  }
}

getRootNode();
