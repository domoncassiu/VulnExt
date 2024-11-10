import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Table, Button } from 'antd';

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Description', dataIndex: 'description', key: 'description' },
  { title: 'URL', dataIndex: 'url', key: 'url' },
  { title: 'Risk', dataIndex: 'risk', key: 'risk' },
];
const hard_code_data = [{name:'MM',description:'hahah',url:'https://mm.com',risk:'HIGH'},
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


const [data,setData]=useState([]);
// useEffect(()=>{
//   chrome.storage.local.get(['matches'], (result) => {
//     if (result.matches) {
//       setData(result.matches); 
//     }
//   });
//   console.log(data);
// },[])

useEffect(() => {
  chrome.storage.local.get(['matches'], (result) => {
    if (result.matches) {
      setData(result.matches);
    }
  });

  const handleStorageChange = (changes, areaName) => {
    if (areaName === 'local' && changes.matches) {
      setData(changes.matches.newValue);
    }
  };

  chrome.storage.onChanged.addListener(handleStorageChange);

  return () => {
    chrome.storage.onChanged.removeListener(handleStorageChange);
  };
}, []);



function Options() {
  return (
    <div>
      <h1>Rules</h1>
      <div style={{ marginBottom: 16 }}>
        {/* <Button type="primary">Enable All</Button>
        <Button type="default">Disable All</Button>
        <Button type="danger">Delete All Rules</Button>
        <Button type="primary">Add Rule</Button> */}
      </div>
      <Table
        columns={columns}
        dataSource={hard_code_data}
        scroll={{ y: 240 }} 
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Options />);
