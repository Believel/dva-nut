import React from 'react';
import PropTypes from 'prop-types';
import { Table, Popconfirm, Button, Space } from 'antd'

const ProductList = (props) => {
  const { onDelete, products, onAdd, onPromiseAdd } = props
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name'
    },
    {
      title: '操作',
      render: (text, record) => {
        return (
          <Popconfirm title="是否删除？" onConfirm={() => onDelete(record.id)}>
            <Button>删除</Button>
          </Popconfirm>
        )
      }
    }
  ]
  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={onAdd}>添加</Button>
        <Button onClick={onPromiseAdd}>延迟1秒添加</Button>
      </Space>
      <Table dataSource={products} columns={columns} rowKey="id" >
      </Table>
    </>
  );
};

ProductList.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired
};

export default ProductList;
