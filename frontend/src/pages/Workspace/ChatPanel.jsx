import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, message, Collapse } from 'antd';
import { SendOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

export default () => {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [outline, setOutline] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const handleSubmit = async () => {
    if (!inputMsg.trim()) return;

    setLoading(true);
    try {
      const newMsg = { role: 'user', content: inputMsg };
      setMessages(prev => [...prev, newMsg]);
      
      const response = await fetch('http://localhost:5000/analyze_essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'current_user',
          topic: '当前作文题目',
          message: inputMsg
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        analysis: data.analysis
      }]);
      
      if (data.analysis?.outline) {
        setOutline(data.analysis.outline);
      }

    } catch (err) {
      message.error('对话请求失败: ' + err.message);
    } finally {
      setInputMsg('');
      setLoading(false);
    }
  };

  return (
    <Card title="AI考研作文助手" bordered={false}>
      <Collapse defaultActiveKey={['guidance']} ghost>
        <Panel header="写作引导系统" key="guidance">
          <div className="chat-messages" style={{ height: 400, overflowY: 'auto' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`message-${msg.role}`} style={{ margin: '8px 0' }}>
                <div style={{ fontWeight: 'bold' }}>{msg.role === 'user' ? '你' : '助手'}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                {msg.analysis && (
                  <Collapse bordered={false}>
                    <Panel header="详细分析" key="analysis">
                      <pre>{JSON.stringify(msg.analysis, null, 2)}</pre>
                    </Panel>
                  </Collapse>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <Input.TextArea
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onPressEnter={e => {
              if (e.shiftKey) return;
              e.preventDefault();
              handleSubmit();
            }}
            placeholder="输入作文题目或内容（Shift+Enter换行）"
            autoSize={{ minRows: 2, maxRows: 6 }}
          />

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={loading}
              style={{ marginRight: 8 }}
            >
              提交
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => setOutline('')}>
              重新生成
            </Button>
            <Button icon={<SearchOutlined />} onClick={() => message.info('联网搜索功能待实现')}>
              实时数据
            </Button>
          </div>
        </Panel>

        {outline && (
          <Panel header="生成大纲" key="outline">
            <pre style={{ whiteSpace: 'pre-wrap' }}>{outline}</pre>
          </Panel>
        )}
      </Collapse>
    </Card>
  );
};