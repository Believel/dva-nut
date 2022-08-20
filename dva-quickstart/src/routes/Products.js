import React from "react";
// connect 就是将 model 和 component 连接起来，类似于react-redux中的connect
import { connect } from 'dva'
import ProductList from '../components/ProductList'

const Products = ({ dispatch, products }) => {
  const handleDelete = (id) => {
    dispatch({
      type: 'products/delete',
      payload: id
    })
  }
  // 异步调用添加
  const handlePromiseAdd = () => {
    dispatch({
      type: 'products/addProductAfterSecond',
      payload: {
        name: 'zjr'+ Math.floor(Math.random() * 2000),
        id: Math.random() * 100
      }
    })
  }
  // 同步调用添加
  const handleAdd = () => {
    dispatch({
      type: 'products/add',
      payload: {
        name: 'zjr'+ Math.floor(Math.random() * 2000),
        id: Math.random() * 100
      }
    })
  }

  return (
    <ProductList onDelete={handleDelete} products={products} onAdd={handleAdd} onPromiseAdd={handlePromiseAdd}></ProductList>
  )
}

export default connect(({ products}) => ({products}))(Products)