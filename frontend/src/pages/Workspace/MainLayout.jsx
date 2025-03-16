import React from 'react';
import { ProLayout } from '@ant-design/pro-layout';
import { Outlet } from 'react-router-dom';
import WorkspaceEditor from './WorkspaceEditor';
import ChatPanel from './ChatPanel';
import HistoryPanel from './HistoryPanel';

export default () => {
  return (
    <ProLayout
      layout="mix"
      splitMenus
      fixedHeader
      contentStyle={{ margin: 12 }}
      menu={{ locale: false }}
      routes={[
        {
          path: '/editor',
          name: '写作工作台',
          component: <WorkspaceEditor />,
        },
        {
          path: '/history',
          name: '历史版本',
          component: <HistoryPanel />,
        },
        {
          path: '/chat',
          name: 'AI对话',
          component: <ChatPanel />,
        },
      ]}
    >
      <Outlet />
    </ProLayout>
  );
};