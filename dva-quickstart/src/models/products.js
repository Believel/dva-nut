
// 延迟 1 秒怎么没执行？？？
function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
// dva 通过 model 的概念把一个领域的模型管理起来，包含同步更新state的reducers，处理异步逻辑的effects,订阅数据源的subscriptions
export default {
  // 表示全局state上的key
  namespace: 'products',
  // state 是初始值，在这里是空数组
  state: [
    { name: 'dva', id: 1 },
    { name: 'antd', id: 2 }
  ],
  // 相当于一个监听器
  // 是一种从源获取数据的方法
  // 用于订阅一个数据源，然后根据条件dispatch需要的action。
  // 数据源可以是当前的时间、服务器的websocket连接、keyboard输入、geolocation变化、history路由变化等等。
  subscriptions: {
    // 方法名是任意定义的，每次变化都会一次去调用里面的所有方法，所以一般会加相应的判断
    setup({ dispatch, history }) {  // eslint-disable-line
      console.log('subscriptions dispatch:', dispatch)
      console.log('subscriptions history:', history)
      // 路由监听
      history.listen((pathname) => {
        console.log(pathname)
      })
    },
    onClick({dispatch}) {
      // 鼠标点击时就会触发里面的dispatch命令
      // document.addEventListener('click', () => {
      //   dispatch({type: 'add', payload: {name: '222', id: Math.random() * 100}})
      // })
    }
  },
  // 副作用，常见的就是异步操作
  // 之所以叫副作用是因为它使得我们的函数变得不纯，同样的输入不一定获得同样的输出。
  // 底层引入了redux-saga做异步流程控制
  effects: {
    // 是一个 generator函数，内部使用yield关键字，标识每一步的操作（不管是异步或同步）
    *addProductAfterSecond({ payload }, { call, put }) {  // eslint-disable-line
      // call：执行异步函数
      yield call(delay, 1000)
      // 发出一个Action,类似于dispatch
      yield put({ type: 'add', payload });
    },
  },
  // 等同于redux中的reducer,接收action,同步更新state
  reducers: {
    delete(state, { payload: id }) {
      return state.filter(item => item.id === id)
    },
    add(state, { payload: product}) {
      return [...state, product]
    }
  },

};
