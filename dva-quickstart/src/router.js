import React, {
  useEffect,
  useState
} from 'react';
// 前端路由
import { Router, Route, Switch, Link } from 'dva/router';
import { Menu } from 'antd'
// add route info to router table
import IndexPage from './routes/IndexPage';
import Products from './routes/Products';

function RouterConfig(props) {
  console.log('props', props)
  const { history } = props
  const items = [
    { label: <Link to="/">Home</Link> , key: '' }, // 菜单项务必填写 key
    { label: <Link to="/products">Product</Link>, key: 'products' }
  ];
  const [selectedKeys, setSelectedKeys] = useState([])
  const onSelect = (item) => {
    setSelectedKeys(item.selectedKeys)
  }
  useEffect(() => {
    const pathname = history.location.pathname.split('/')[1]
    setSelectedKeys([pathname])
  }, [history])
  return (
    <>
      <Router history={history}>
        <div>
          <Menu items={items} mode="horizontal" onSelect={onSelect} selectedKeys={selectedKeys} style={{marginBottom:'10px'}}/>
          <Switch>
            <Route path="/" exact component={IndexPage} />
            <Route path="/products" exact component={Products} />
          </Switch>
        </div>
      </Router>
    </>
  );
}

export default RouterConfig;
