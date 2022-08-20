import warning from 'warning';
import { isArray } from './utils';
import { NAMESPACE_SEP } from './constants';

function prefix(obj, namespace, type) {
  return Object.keys(obj).reduce((memo, key) => {
    warning(
      key.indexOf(`${namespace}${NAMESPACE_SEP}`) !== 0,
      `[prefixNamespace]: ${type} ${key} should not be prefixed with namespace ${namespace}`,
    );
    const newKey = `${namespace}${NAMESPACE_SEP}${key}`;
    memo[newKey] = obj[key];
    return memo;
  }, {});
}
/**
 * 
 * @param {*} model 注册的model对象
 * @returns 
 */
export default function prefixNamespace(model) {
  const { namespace, reducers, effects } = model;
  // 等同于redux中的reducer,接收action,同步更新state
  // 一般是一个对象
  if (reducers) {
    // 如果是数组
    if (isArray(reducers)) {
      // 需要复制一份，不能直接修改 model.reducers[0], 会导致微前端场景下，重复添加前缀
      const [reducer, ...rest] = reducers;
      model.reducers = [prefix(reducer, namespace, 'reducer'), ...rest];
    } else {
      // !目的是保持每个model下的reducer方法是作用当前空间作用域下的，防止与其他空间下的重复
      // 为reducer里面的每个key添加前缀
      // {
      //   ${namespace}/${key}: xxx
      // }
      model.reducers = prefix(reducers, namespace, 'reducer');
    }
  }
  if (effects) {
    model.effects = prefix(effects, namespace, 'effect');
  }
  return model;
}
