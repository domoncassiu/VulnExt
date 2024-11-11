
const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Description', dataIndex: 'description', key: 'description' },
  { title: 'URL', dataIndex: 'url', key: 'url' },
  { title: 'Risk', dataIndex: 'risk', key: 'risk' },
];
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


// 从 chrome.storage.local 中获取数据并监听更改
let data = [];

chrome.storage.local.get(['matches'], (result) => {
  if (result.matches) {
    data = result.matches;
    renderTable(data);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.matches) {
    data = changes.matches.newValue;
    renderTable(data);
  }
});

// 渲染表格的函数
function renderTable(dataSource) {
  const tableContainer = document.getElementById('table-container');
  tableContainer.innerHTML = ''; // 清空之前的内容

  const table = document.createElement('table');
  table.className = 'table';

  // 创建表头
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.innerText = col.title;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 创建表格内容
  const tbody = document.createElement('tbody');
  dataSource.forEach(item => {
    const row = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      td.innerText = item[col.dataIndex] || '';
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  tableContainer.appendChild(table);
}

// 渲染操作按钮
function renderButtons() {
  const buttonContainer = document.getElementById('button-container');
  buttonContainer.innerHTML = ''; // 清空之前的内容

  const enableAllButton = createButton('Enable All', 'primary', () => alert('Enabled All'));
  const disableAllButton = createButton('Disable All', 'default', () => alert('Disabled All'));
  const deleteAllButton = createButton('Delete All Rules', 'danger', () => alert('Deleted All Rules'));
  const addRuleButton = createButton('Add Rule', 'primary', () => alert('Added Rule'));

  buttonContainer.appendChild(enableAllButton);
  buttonContainer.appendChild(disableAllButton);
  buttonContainer.appendChild(deleteAllButton);
  buttonContainer.appendChild(addRuleButton);
}

// 创建按钮的函数
function createButton(text, className, onClick) {
  const button = document.createElement('button');
  button.innerText = text;
  button.className = className;
  button.onclick = onClick;
  return button;
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  renderTable(hardCodeData); // 初始化时使用 hardCodeData
  renderButtons();
});
