import warning from 'warning';
import { isFunction } from './utils';
import prefixedDispatch from './prefixedDispatch';
/**
 *
 * @param {*} subs subscriptions 监听对象
 * @param {*} model  model对象
 * @param {*} app
 * @param {*} onError
 * @returns
 */
export function run(subs, model, app, onError) {
  // 监听函数的返回值是函数，就存放返回值函数
  const funcs = [];
  // 监听函数的返回值不是函数，就存放当前键值
  const nonFuncs = [];
  for (const key in subs) {
    if (Object.prototype.hasOwnProperty.call(subs, key)) {
      const sub = subs[key];
      // 每个监听函数是可以任意定义的，接收两个参数
      // 参与1：是对象，里面有两个参数，分别是dispatch和history
      // 参数2：onError函数
      const unlistener = sub(
        {
          dispatch: prefixedDispatch(app._store.dispatch, model),
          history: app._history,
        },
        onError,
      );
      if (isFunction(unlistener)) {
        funcs.push(unlistener);
      } else {
        nonFuncs.push(key);
      }
    }
  }
  return { funcs, nonFuncs };
}

export function unlisten(unlisteners, namespace) {
  if (!unlisteners[namespace]) return;

  const { funcs, nonFuncs } = unlisteners[namespace];
  warning(
    nonFuncs.length === 0,
    `[app.unmodel] subscription should return unlistener function, check these subscriptions ${nonFuncs.join(
      ', ',
    )}`,
  );
  for (const unlistener of funcs) {
    unlistener();
  }
  delete unlisteners[namespace];
}
