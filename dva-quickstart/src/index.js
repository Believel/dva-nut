import dva from 'dva';
import { createBrowserHistory as createHistory } from 'history'
import 'antd/dist/antd.css'
import './index.css';


// 1. Initialize  创建应用
const app = dva({
  history: createHistory()
});

// 2. Plugins
// app.use({});

// 3. Model  在这里载入model
const model = app.model(require('./models/products').default);

// 处理 effects 和 reducers之后的model对象
// console.log('model', model)
// {
//   "namespace": "products",
//   "effects": {
//     {
//       "products/addProductAfterSecond": f
//     }
//   },
//   "reducers": {
//     "products/add": f,
//     "products/delete": f
//   }
// }


// 4. Router 注册视图
app.router(require('./router').default);

// 5. Start 启动应用
app.start('#root');

// 以上步骤：dva 完成了：
// 使用 React 解决 View 层
// redux 管理 model
// saga 解决异步


