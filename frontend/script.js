// 获取导航栏元素
const questionAnalysisNav = document.getElementById('question-analysis');
const essayEditorNav = document.getElementById('essay-editor');
const myNotesNav = document.getElementById('my-notes');

// 获取模块元素
const questionAnalysisModule = document.getElementById('question-analysis-module');
const essayEditorModule = document.getElementById('essay-editor-module');
const myNotesModule = document.getElementById('my-notes-module');

// 显示指定模块并隐藏其他模块
function showModule(module) {
  questionAnalysisModule.style.display = 'none';
  essayEditorModule.style.display = 'none';
  myNotesModule.style.display = 'none';
  module.style.display = 'block';
}

// 导航栏点击事件
questionAnalysisNav.addEventListener('click', () => showModule(questionAnalysisModule));
essayEditorNav.addEventListener('click', () => showModule(essayEditorModule));
myNotesNav.addEventListener('click', () => showModule(myNotesModule));

// 历史会话搜索功能
const searchInput = document.getElementById('search-input');
const sessionList = document.getElementById('session-list');
const sessions = sessionList.querySelectorAll('.session');

searchInput.addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase();
  sessions.forEach(session => {
    const title = session.dataset.title.toLowerCase();
    if (title.includes(searchTerm)) {
      session.style.display = 'block';
    } else {
      session.style.display = 'none';
    }
  });
});

// 会话记录点击跳转功能
sessions.forEach(session => {
  session.addEventListener('click', function () {
    const title = this.dataset.title;
    // 这里可以添加跳转到对应内容的逻辑
    console.log(`跳转到 ${title} 的内容`);
  });
});

// 用户输入区提交功能
const userTextInput = document.getElementById('user-text-input');
const userImageInput = document.getElementById('user-image-input');
const submitButton = document.getElementById('submit-button');

submitButton.addEventListener('click', async () => {
  const input = document.getElementById('user-text-input');
  const topic = input.value.trim();
  
  if (!topic) {
      alert('请输入作文题目');
      return;
  }

  try {
      const response = await fetch('http://localhost:5000/initialization', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
              topic: topic,
              user_name: 'current_user'
          })
      });
      
      // 新增响应状态日志
      console.log('HTTP状态码:', response.status);
      
      const data = await response.json();
      console.log('完整响应数据:', data);
      
      // 修改点1：添加数据结构校验
      if (data?.status_code === 200 && data?.output?.text) {
          const resultElement = document.getElementById('analysis-result');
          // 修改点2：保留原始格式并自动换行
          resultElement.innerHTML = data.output.text.replace(/\n/g, '<br>');
      } else if (data?.error_code) {
          throw new Error(`后端错误: ${data.error_code}`);
      } else {
          throw new Error('无效的响应结构');
      }
      
  } catch (error) {
      // 修改点3：增强错误日志
      console.error('完整错误信息:', {
          error: error.message,
          responseStatus: response?.status,
          requestId: data?.request_id
      });
      alert(`操作失败: ${error.message}`);
  }
});

// 题目解析模块功能
const questionInput = document.getElementById('question-input');
const analyzeQuestionBtn = document.getElementById('analyze-question');
const questionResult = document.getElementById('question-result');
const generateOutlineBtn = document.getElementById('generate-outline');
const outlineResult = document.getElementById('outline-result');

// 标签切换功能
document.querySelectorAll('.tab-item').forEach(tab => {
  tab.addEventListener('click', function() {
    // 移除所有激活状态
    document.querySelectorAll('.tab-item, .tab-content').forEach(el => {
      el.classList.remove('active');
    });
    
    // 激活当前标签及对应内容
    this.classList.add('active');
    const target = document.getElementById(this.dataset.target);
    target.classList.add('active');
  });
});