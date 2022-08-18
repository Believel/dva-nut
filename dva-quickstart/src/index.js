import dva from 'dva';
import 'antd/dist/antd.css'
import './index.css';

// 1. Initialize  创建应用
const app = dva();

// 2. Plugins
// app.use({});

// 3. Model  在这里载入model
app.model(require('./models/products').default);

// 4. Router 注册视图
app.router(require('./router').default);

// 5. Start 启动应用
app.start('#root');

// 以上步骤：dva 完成了：
// 使用 React 解决 View 层
// redux 管理 model
// saga 解决异步


// 1+2*10+（3 + 4）
const calculate = function(s) {
  // 存放数字的队列
  const q = s.split(/[\+\-\*\/\(\)]/).filter(v => v);
  // 存放操作符的队列：
  const op = s.split(/\d*/).filter(v => v.trim() !== '');
  // 定义两个变量，num 用来表示当前的数字，sum 用来记录最后的和 
  let sum = q.shift() - 0;
  return calculateRecursion(q, op, sum)
}

const calculateRecursion = function(q, op, sum) {
  // 用一个新的变量，记录要被处理的数
  const stack = []
   // 遍历数字队列
   while(q.length) {
     // 取出操作符
     const opV = op.shift()
     // 取出下一个数字
     const c = q.shift()
     // 遇到一个左括号，开始递归调用，求得括号里的计算结果，
     if (opV === '(') {
        q.push(stack.pop(), c)
        sum = calculateRecursion(q, op)
     } else {
       if (opV === '+') {
         // 遇到加号，把当前的数压入到堆栈中
         stack.push(c - 0)
       } else if (opV === '-') {
         // 减号：把当前数的相反数压入到堆栈中
         stack.push(-c)
       } else if (opV === '*') {
         // 如果乘法在第一个表达式中，栈中是没有值的
         if (!stack.length) {
          stack.push(sum)
         }
         // 遇到乘法：取出stack中前一个数取出 和当前数相乘，把结果入栈中
         stack.push(stack.pop() * c)
       } else if (opV === '/') {
          // 如果除法在第一个表达式中，栈中是没有值的
          if (!stack.length) {
            stack.push(sum)
          }
         // 除号，把前一个数从堆栈中取出，然后除以当前的数，再把结果放回堆栈
         stack.push(stack.pop() / c)
       } else if (opV === ')') {
       // 遇到右括号，就可以结束循环，直接返回当前的总和 
         break
       }
     }
     
   }
   // 把堆栈中的数字求和
   while(stack.length) {
     sum += stack.shift()
   }
  
   return sum
}

// console.log(calculate('1+2*10+(3+4)'))



