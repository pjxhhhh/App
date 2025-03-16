import React, { useState, useEffect } from 'react';
import { Card, Timeline, Input, Button } from 'antd';
import { openDB } from 'idb';

const initializeDB = async () => {
  return openDB('EssayDB', 1, {
    upgrade(db) {
      db.createObjectStore('essays', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('versions', { keyPath: ['essayId', 'version'] });
    },
  });
};

export default () => {
  const [searchText, setSearchText] = useState('');
  const [versions, setVersions] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    initializeDB().then(database => setDb(database));
  }, []);

  const loadVersions = async () => {
    if (db) {
      const tx = db.transaction('versions');
      const store = tx.objectStore('versions');
      const allVersions = await store.getAll();
      setVersions(allVersions);
    }
  };

  return (
    <Card title="历史版本管理" bordered={false}>
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="输入关键词搜索历史版本"
          onSearch={value => console.log('搜索:', value)}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>
      
      <Timeline mode="left" style={{ marginTop: 20 }}>
        {versions.map(version => (
          <Timeline.Item
            key={`${version.essayId}-${version.version}`}
            label={new Date(version.timestamp).toLocaleString()}
          >
            <div style={{ cursor: 'pointer' }}>
              <span style={{ marginRight: 8 }}>版本 {version.version}</span>
              <Button size="small" onClick={() => console.log('恢复版本', version)}>
                恢复
              </Button>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};