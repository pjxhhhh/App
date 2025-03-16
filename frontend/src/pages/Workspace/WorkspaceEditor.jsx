import React, { useState } from 'react';
import ReactFlow, { Controls } from 'react-flow-renderer';
import { Button, Card } from 'antd';

export default () => {
  const [elements, setElements] = useState([
    {
      id: '1',
      type: 'input',
      data: { label: '引言段落' },
      position: { x: 100, y: 50 },
    },
    {
      id: '2',
      data: { label: '论点一' },
      position: { x: 100, y: 150 },
    },
  ]);

  const onConnect = (params) => setElements((els) => addEdge(params, els));
  const onDragStop = (event, node) => setElements((els) =>
    els.map(n => n.id === node.id ? { ...n, position: node.position } : n)
  );

  return (
    <Card title="写作逻辑编辑器" bordered={false}>
      <div style={{ height: 600 }}>
        <ReactFlow
          elements={elements}
          onConnect={onConnect}
          onNodeDragStop={onDragStop}
          snapToGrid={true}
          snapGrid={[15, 15]}
        >
          <Controls />
        </ReactFlow>
      </div>
      <Button type="primary" style={{ marginTop: 16 }}>
        保存当前结构
      </Button>
    </Card>
  );
};