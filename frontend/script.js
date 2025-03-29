// 获取导航栏元素
const questionAnalysisNav = document.getElementById('question-analysis');
const essayEditorNav = document.getElementById('essay-editor');
const myNotesNav = document.getElementById('my-notes');

// 获取模块元素
const questionAnalysisInterface = document.getElementById('question-analysis-interface');
const essayEditorModule = document.getElementById('essay-editor-module');
const myNotesModule = document.getElementById('my-notes-module');

// 显示指定模块并隐藏其他模块
function showModule(module) {
  questionAnalysisInterface.style.display = 'none';
  essayEditorModule.style.display = 'none';
  myNotesModule.style.display = 'none';
  module.style.display = 'flex';
}

// 导航栏点击事件
questionAnalysisNav.addEventListener('click', () => showModule(questionAnalysisInterface));
essayEditorNav.addEventListener('click', () => showModule(essayEditorModule));
myNotesNav.addEventListener('click', () => showModule(myNotesModule));

// 历史会话区搜索功能
const searchInput = document.getElementById('search-input');
const sessionList = document.getElementById('session-list');

searchInput.addEventListener('input', function () {
  const searchText = this.value.toLowerCase();
  const sessions = sessionList.querySelectorAll('.session');
  sessions.forEach(session => {
    const title = session.dataset.title.toLowerCase();
    if (title.includes(searchText)) {
      session.style.display = 'block';
    } else {
      session.style.display = 'none';
    }
  });
});

// 模块切换功能
const questionAnalysisBtn = document.getElementById('question-analysis-btn');
const outlineAssistantBtn = document.getElementById('outline-assistant-btn');

// 获取模块内容
const questionAnalysisContent = document.getElementById('question-analysis-content');
const outlineAssistantContent = document.getElementById('outline-assistant-content');

// 切换模块内容和导航按钮状态
function switchModule(activeBtn, activeContent) {
  const allBtns = [questionAnalysisBtn, outlineAssistantBtn];
  const allContents = [questionAnalysisContent, outlineAssistantContent];

  allBtns.forEach(btn => btn.classList.remove('active'));
  allContents.forEach(content => content.style.display = 'none');

  activeBtn.classList.add('active');
  activeContent.style.display = 'block';
}

// 绑定点击事件
questionAnalysisBtn.addEventListener('click', () => {
  switchModule(questionAnalysisBtn, questionAnalysisContent);
});

outlineAssistantBtn.addEventListener('click', () => {
  switchModule(outlineAssistantBtn, outlineAssistantContent);
});

// 用户输入提交功能
const userInputText = document.getElementById('user-input-text');
const imageUpload = document.getElementById('image-upload');
const modelSelect = document.getElementById('model-select');
const searchOnline = document.getElementById('search-online');
const submitBtn = document.getElementById('submit-btn');

submitBtn.addEventListener('click', function () {
  const inputText = userInputText.value;
  const selectedModel = modelSelect.value;
  // 这里可以添加处理输入文本、图片和模型选择的逻辑
  console.log('输入文本:', inputText);
  console.log('选择的模型:', selectedModel);
});

userInputText.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitBtn.click();
  }
});

// 模拟提交作文函数
function submitEssay(index) {
  console.log(`提交作文段落 ${index}`);
}

// 模拟保存作文函数
function saveEssay(index) {
  console.log(`保存作文段落 ${index}`);
}

// 初始化优化功能
function initOptimize() {
  const optimizeButtons = document.querySelectorAll('[id^="ai-optimize-"]');
  const modal = document.getElementById('optimize-modal');
  const loadingOverlay = document.getElementById('loading-overlay');
  const cancelBtn = document.getElementById('cancel-btn');
  let timeoutId;

  optimizeButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const textarea = btn.closest('.writing-section').querySelector('textarea');
      const originalText = textarea.value;

      // 显示弹窗
      modal.style.display = 'block';
      document.getElementById('original-text').textContent = originalText;

      // 显示加载状态
      loadingOverlay.style.display = 'flex';

      // 设置超时
      timeoutId = setTimeout(() => {
        loadingOverlay.style.display = 'none';
        alert('优化请求超时，请稍后重试');
      }, 10000); // 10秒超时

      try {
        // 调用AI优化服务
        const optimizedText = await callAIOptimizeService(originalText);
        clearTimeout(timeoutId);

        // 显示优化结果
        loadingOverlay.style.display = 'none';
        showDiff(originalText, optimizedText);
      } catch (error) {
        clearTimeout(timeoutId);
        loadingOverlay.style.display = 'none';
        alert('优化失败：' + error.message);
      }
    });
  });

  // 取消按钮
  cancelBtn.addEventListener('click', () => {
    clearTimeout(timeoutId);
    loadingOverlay.style.display = 'none';
    alert('优化已取消');
  });

  // 关闭弹窗
  modal.querySelector('.close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // 点击外部关闭
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// 显示文本差异
function showDiff(original, optimized) {
  const diff = Diff.diffWords(original, optimized);
  const originalHtml = [];
  const optimizedHtml = [];

  diff.forEach(part => {
    const value = part.value.replace(/\n/g, '<br>');
    if (part.added) {
      optimizedHtml.push(`<span class="diff-added">${value}</span>`);
    } else if (part.removed) {
      originalHtml.push(`<span class="diff-removed">${value}</span>`);
    } else {
      originalHtml.push(value);
      optimizedHtml.push(value);
    }
  });

  document.getElementById('original-text').innerHTML = originalHtml.join('');
  document.getElementById('optimized-text').innerHTML = optimizedHtml.join('');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initOptimize();
});

