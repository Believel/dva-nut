# document
[文档](https://dvajs.com/)

# usage
## create a dva project
```js
// 1. install dva-cli
npm install dva-cli -g
dva -v
// dva-cli version 0.10.1

// 2. create new app
dva new dva-quickstart

// 3. run app
cd dva-quickstart
npm start

// 4. build app 
npm run build
// generate dist/
```

# 一个dva项目包括哪些内容
## 1. 创建应用
```js
import dva from 'dva';
import { createBrowserHistory as createHistory } from 'history'

const app = dva({
  // 通过传递 options，更改地址为history模式，默认是hash模式
  history: createHistory()
});
```

## 2. 注册插件
```js
app.use({});
```

## 3. 载入model

```js
// 这里的返回值是处理后的model对象
// 主要是处理了 effects 和 reducers 信息
const model = app.model(require('./models/products').default);
```

## 4. 注册视图
```js
app.router(require('./router').default);
```
## 5. 启动应用
```js
app.start('#root');
```

# dva源码解读
## 源码 dva 大体实现过程
```js
// 入口文件 packages/dva/src/index.js
...
export default function(opts = {}) {
  // 路由模式
  const history = opts.history || createHashHistory();
  // 默认参数
  const createOpts = {
    // redux中传递的初始reducer对象
    initialReducer: {
      // add router reducer into root reducer by passing history to connectRouter
      router: connectRouter(history),
    },
    // redux中传递的中间件
    setupMiddlewares(middlewares) {
      // for dispatching history actions
      return [routerMiddleware(history), ...middlewares];
    },
    setupApp(app) {
      app._history = patchHistory(history);
    },
  };
  // Create dva-core instance.  dva-core中主要处理redux、redux-saga等状态管理器中的相关内容
  const app = create(opts, createOpts);
  // 保存定义的start: Start the app.
  const oldAppStart = app.start;
  app.router = router;
  // 重新定义一个start
  // !这样做的目的：因为start方法里面有用到this,不用call指定调用者为app的话，oldAppStart()会找错对象
  app.start = start;
  return app;

  function router(router) {
    invariant(
      isFunction(router),
      `[app.router] router should be function, but got ${typeof router}`,
    );
    app._router = router;
  }

  function start(container) {
    // 允许 container 是字符串，然后用 querySelector 找元素
    // '#root'
    if (isString(container)) {
      container = document.querySelector(container);
      invariant(container, `[app.start] container ${container} not found`);
    }

    // 并且是 HTMLElement
    invariant(
      !container || isHTMLElement(container),
      `[app.start] container should be HTMLElement`,
    );

    // 路由必须提前注册
    invariant(app._router, `[app.start] router must be registered before app.start()`);

    if (!app._store) {
      oldAppStart.call(app);
    }
    const store = app._store;

    // export _getProvider for HMR
    // ref: https://github.com/dvajs/dva/issues/469
    app._getProvider = getProvider.bind(null, store, app);

    // If has container, render; else, return react component
    if (container) {
      // render react component
      render(container, store, app, app._router);
      app._plugin.apply('onHmr')(render.bind(null, container, store, app));
    } else {
      return getProvider(store, this, this._router);
    }
  }
}
...

```
## 源码 dva-core 大体实现步骤

```js
// 入口文件 packages/dva-core/src/index.js

/**
 * Create dva-core instance.
 *
 * @param hooksAndOpts 注册dva时传递的参数
 * @param createOpts   默认初始化的参数对象
 */
export function create(hooksAndOpts = {}, createOpts = {}) {
  const { initialReducer, setupApp = noop } = createOpts;
  // 注册插件
  const plugin = new Plugin();
  plugin.use(filterHooks(hooksAndOpts));

  const app = {
    // 存储处理之后的每个model对象
    _models: [prefixNamespace({ ...dvaModel })],
    _store: null,
    _plugin: plugin,
    use: plugin.use.bind(plugin),
    // model 函数
    model,
    // 启动应用函数
    start,
  };
  return app;

  /**
   * Register model before app is started.
   *
   * @param m {Object} model to register   注册的model文件
   */
  function model(m) {
    if (process.env.NODE_ENV !== 'production') {
      checkModel(m, app._models);
    }
    // 处理 model对象每个 effects 和 reducer中的key键，加上spacename前缀
    const prefixedModel = prefixNamespace({ ...m });
    // 将 prefixedModel 对象存放在 _models数组中
    app._models.push(prefixedModel);
    return prefixedModel;
  }

  /**
   * Inject model after app is started.
   *
   * @param createReducer
   * @param onError
   * @param unlisteners
   * @param m
   */
  function injectModel(createReducer, onError, unlisteners, m) {
    m = model(m);

    const store = app._store;
    store.asyncReducers[m.namespace] = getReducer(m.reducers, m.state, plugin._handleActions);
    store.replaceReducer(createReducer());
    // 处理异步函数 - 放在saga中
    if (m.effects) {
      store.runSaga(app._getSaga(m.effects, m, onError, plugin.get('onEffect'), hooksAndOpts));
    }
    // 监听函数 - 放在unlisteners数组中
    if (m.subscriptions) {
      unlisteners[m.namespace] = runSubscription(m.subscriptions, m, app, onError);
    }
  }

  /**
   * Unregister model.
   *
   * @param createReducer
   * @param reducers
   * @param unlisteners
   * @param namespace
   *
   * Unexpected key warn problem:
   * https://github.com/reactjs/redux/issues/1636
   */
  function unmodel(createReducer, reducers, unlisteners, namespace) {
    const store = app._store;

    // Delete reducers
    delete store.asyncReducers[namespace];
    delete reducers[namespace];
    store.replaceReducer(createReducer());
    store.dispatch({ type: '@@dva/UPDATE' });

    // Cancel effects
    store.dispatch({ type: `${namespace}/@@CANCEL_EFFECTS` });

    // Unlisten subscrioptions
    unlistenSubscription(unlisteners, namespace);

    // Delete model from app._models
    app._models = app._models.filter(model => model.namespace !== namespace);
  }

  /**
   * Replace a model if it exsits, if not, add it to app
   * Attention:
   * - Only available after dva.start gets called
   * - Will not check origin m is strict equal to the new one
   * Useful for HMR
   * @param createReducer
   * @param reducers
   * @param unlisteners
   * @param onError
   * @param m
   */
  function replaceModel(createReducer, reducers, unlisteners, onError, m) {
    const store = app._store;
    const { namespace } = m;
    const oldModelIdx = findIndex(app._models, model => model.namespace === namespace);

    if (~oldModelIdx) {
      // Cancel effects
      store.dispatch({ type: `${namespace}/@@CANCEL_EFFECTS` });

      // Delete reducers
      delete store.asyncReducers[namespace];
      delete reducers[namespace];

      // Unlisten subscrioptions
      unlistenSubscription(unlisteners, namespace);

      // Delete model from app._models
      app._models.splice(oldModelIdx, 1);
    }

    // add new version model to store
    app.model(m);

    store.dispatch({ type: '@@dva/UPDATE' });
  }

  /**
   * Start the app.
   *
   * @returns void
   */
  function start() {
    // Global error handler
    const onError = (err, extension) => {
      if (err) {
        if (typeof err === 'string') err = new Error(err);
        err.preventDefault = () => {
          err._dontReject = true;
        };
        plugin.apply('onError', err => {
          throw new Error(err.stack || err);
        })(err, app._store.dispatch, extension);
      }
    };

    // create saga middleware
    const sagaMiddleware = createSagaMiddleware();
    const promiseMiddleware = createPromiseMiddleware(app);
    app._getSaga = getSaga.bind(null);

    const sagas = [];
    const reducers = { ...initialReducer };
    // 循环遍历每个注册的model
    for (const m of app._models) {
      // m 表示当前的model对象值

      // 将每个model下的reducer和state对象，整理成redux中reducer格式
      reducers[m.namespace] = getReducer(m.reducers, m.state, plugin._handleActions);
      if (m.effects) {
        sagas.push(app._getSaga(m.effects, m, onError, plugin.get('onEffect'), hooksAndOpts));
      }
    }
    const reducerEnhancer = plugin.get('onReducer');
    const extraReducers = plugin.get('extraReducers');
    invariant(
      Object.keys(extraReducers).every(key => !(key in reducers)),
      `[app.start] extraReducers is conflict with other reducers, reducers list: ${Object.keys(
        reducers,
      ).join(', ')}`,
    );

    // Create store
    app._store = createStore({
      reducers: createReducer(),
      initialState: hooksAndOpts.initialState || {},
      plugin,
      createOpts,
      sagaMiddleware,
      promiseMiddleware,
    });

    const store = app._store;

    // Extend store
    store.runSaga = sagaMiddleware.run;
    store.asyncReducers = {};

    // Execute listeners when state is changed
    const listeners = plugin.get('onStateChange');
    for (const listener of listeners) {
      store.subscribe(() => {
        listener(store.getState());
      });
    }

    // Run sagas
    sagas.forEach(sagaMiddleware.run);

    // Setup app
    setupApp(app);

    // Run subscriptions
    const unlisteners = {};
    for (const model of this._models) {
      // 当前model对象中的事件监听对象
      if (model.subscriptions) {
        // runSubscription 函数返回
        // {
        //   funcs,  Array 每个监听函数的返回值是函数的存放值的集合
        //   nonFuncs    Array 每个监听函数的返回值不是函数，存放的函数键值key的集合
        // }
        unlisteners[model.namespace] = runSubscription(model.subscriptions, model, app, onError);
      }
    }

    // Setup app.model and app.unmodel
    app.model = injectModel.bind(app, createReducer, onError, unlisteners);
    app.unmodel = unmodel.bind(app, createReducer, reducers, unlisteners);
    app.replaceModel = replaceModel.bind(app, createReducer, reducers, unlisteners, onError);

    /**
     * Create global reducer for redux.
     *
     * @returns {Object}
     */
    function createReducer() {
      return reducerEnhancer(
        combineReducers({
          ...reducers,
          ...extraReducers,
          ...(app._store ? app._store.asyncReducers : {}),
        }),
      );
    }
  }
}

```
