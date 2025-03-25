// 获取按钮和模块容器元素
const loadQuestionAnalysisBtn = document.getElementById('load-question-analysis');
const loadOutlineAssistantBtn = document.getElementById('load-outline-assistant');
const moduleContainer = document.getElementById('module-container');

// 加载题目解析模块的函数
function loadQuestionAnalysis() {
  moduleContainer.innerHTML = '<h3>题目解析模块</h3><p>这里是题目解析的多维度分析内容。</p>';
}

// 加载大纲助手模块的函数
function loadOutlineAssistant() {
  moduleContainer.innerHTML = '<h3>大纲助手模块</h3><p>这里是大纲助手的多维度分析内容。</p>';
}

// 为按钮添加点击事件监听器
loadQuestionAnalysisBtn.addEventListener('click', loadQuestionAnalysis);
loadOutlineAssistantBtn.addEventListener('click', loadOutlineAssistant);

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

submitButton.addEventListener('click', function () {
  const text = userTextInput.value;
  const file = userImageInput.files[0];
  if (text) {
    console.log('用户输入的文本:', text);
  }
  if (file) {
    console.log('用户上传的图片:', file.name);
  }
});

// 题目解析模块功能
const questionInput = document.getElementById('question-input');
const analyzeQuestionBtn = document.getElementById('analyze-question');
const questionResult = document.getElementById('question-result');
const generateOutlineBtn = document.getElementById('generate-outline');
const outlineResult = document.getElementById('outline-result');

analyzeQuestionBtn.addEventListener('click', () => {
  const question = questionInput.value;
  // 模拟题型分析结果
  const analysisResult = {
    type: '议论文',
    frequency: '30%',
    topicCorrelation: '0.8'
  };
  questionResult.innerHTML = `
    <p>题型: ${analysisResult.type}</p>
    <p>历年出现频率: ${analysisResult.frequency}</p>
    <pResult.frequency}</p>
    <p
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