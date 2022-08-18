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
  const handleAdd = () => {
    dispatch({
      type: 'products/addProductAfterSecond',
      payload: {
        name: 'zpp',
        id: Math.random() * 100
      }
    })
  }
  return (
    <>
      <h2>List of Products</h2>
      <ProductList onDelete={handleDelete} products={products} onAdd={handleAdd}></ProductList>
    </>
  )
}

export default connect(({ products}) => ({products}))(Products)