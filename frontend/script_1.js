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

  document.getElementById('cancel-btn').addEventListener('click', function() {
    // 关闭弹窗
    document.getElementById('optimize-modal').style.display = 'none';
    // 清空内容
    document.getElementById('original-text').innerText = '';
    document.getElementById('optimized-text').innerText = '';
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

// 提交按钮点击事件
document.getElementById('submit-btn').addEventListener('click', async () => {
    const input = document.getElementById('user-input-text');
    const topic = input.value.trim();
    
    if (!topic) {
        alert('请输入作文题目');
        return;
    }

    // 新增加载提示
    const resultElement = document.getElementById('question-result');
    resultElement.textContent = '疯狂思考中......';
    resultElement.classList.add('loading-animation');

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
        
        // 添加数据结构校验
        if (data?.status_code === 200 && data?.output?.text) {
            resultElement.classList.remove('loading-animation');
            // 确保marked.js已加载
            if (typeof marked === 'undefined') {
                await loadMarked();
            }
            resultElement.innerHTML = marked.parse(data.output.text);
        } else {
            throw new Error(data?.error_code || '无效的响应结构');
        }
        
    } catch (error) {
        resultElement.classList.remove('loading-animation');
        console.error('完整错误信息:', {
            error: error.message,
            stack: error.stack
        });
        resultElement.innerHTML = `<div class="error-message">请求失败: ${error.message}</div>`;
    }
});

// 动态加载marked.js
async function loadMarked() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('加载marked.js失败'));
        document.head.appendChild(script);
    });
}

// 在DOM加载完成后添加事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 获取按钮和模块元素
    const outlineBtn = document.getElementById('generate-outline-btn');
    const questionAnalysisBtn = document.getElementById('question-analysis-btn');
    const outlineAssistantBtn = document.getElementById('outline-assistant-btn');
    const questionContent = document.getElementById('question-analysis-content');
    const outlineContent = document.getElementById('outline-assistant-content');

    // 下一步按钮点击事件
    outlineBtn.addEventListener('click', () => {
        // 切换到"大纲助手"标签
        outlineAssistantBtn.click();
        
        // 显示欢迎消息
        document.querySelector('#outline-assistant-content .welcome-message').style.display = 'block';
    });

    // 题目解析按钮点击事件
    questionAnalysisBtn.addEventListener('click', () => {
        questionAnalysisBtn.classList.add('active');
        outlineAssistantBtn.classList.remove('active');
        questionContent.style.display = 'block';
        outlineContent.style.display = 'none';
    });

    // 大纲助手按钮点击事件
    outlineAssistantBtn.addEventListener('click', () => {
        outlineAssistantBtn.classList.add('active');
        questionAnalysisBtn.classList.remove('active');
        outlineContent.style.display = 'block';
        questionContent.style.display = 'none';
    });
});

// 初始化评分系统
const scoreModal = document.getElementById('score-modal');
const smartScoreBtn = document.getElementById('smart-score-btn');
const closeBtn = scoreModal.querySelector('.close-btn');

// 打开评分弹窗
smartScoreBtn.addEventListener('click', () => {
  scoreModal.style.display = 'block';
  generateScoreReport();
});

// 关闭评分弹窗
closeBtn.addEventListener('click', () => {
  scoreModal.style.display = 'none';
});

// 生成评分报告
function generateScoreReport() {
  // 获取作文内容
  const essayContent = getEssayContent();
  
  // 调用评分API
  fetch('/api/score-essay', {
    method: 'POST',
    body: JSON.stringify({ content: essayContent })
  })
  .then(response => response.json())
  .then(data => {
    // 更新总分
    document.getElementById('total-score').textContent = data.totalScore;
    
    // 绘制雷达图
    drawRadarChart(data.dimensions);
    
    // 生成缺陷列表
    renderDefectList(data.defects);
    
    // 生成优化建议
    renderSuggestions(data.suggestions);
  });
}

// 绘制雷达图
function drawRadarChart(dimensions) {
  const ctx = document.getElementById('score-radar').getContext('2d');
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: dimensions.map(d => d.name),
      datasets: [{
        data: dimensions.map(d => d.score),
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: '#2196F3',
        borderWidth: 2
      }]
    },
    options: {
      scale: {
        min: 0,
        max: 6
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const dim = dimensions[context.dataIndex];
              return `${dim.name}: ${dim.score}\n${dim.details}`;
            }
          }
        }
      }
    }
  });
}

// 生成缺陷列表
function renderDefectList(defects) {
  const list = document.getElementById('defect-items');
  list.innerHTML = defects.map(defect => `
    <li>
      <a href="#paragraph-${defect.paragraph}">段落 ${defect.paragraph}</a>
      <p>${defect.description}</p>
    </li>
  `).join('');
}

// 生成优化建议
function renderSuggestions(suggestions) {
  const container = document.querySelector('.suggestion-cards');
  container.innerHTML = suggestions.map(s => `
    <div class="suggestion-card">
      <h5>${s.title}</h5>
      <p>${s.description}</p>
    </div>
  `).join('');
}

// 优化弹窗功能
const optimizeModal = document.getElementById('optimize-modal');
const originalText = document.getElementById('original-text');
const optimizedText = document.getElementById('optimized-text');
const replaceBtn = document.getElementById('replace-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const favoriteBtn = document.getElementById('favorite-btn');

// 显示优化弹窗
function showOptimizeModal(originalContent) {
  originalText.textContent = originalContent;
  optimizeModal.style.display = 'block';
  generateOptimizedContent(originalContent);
}

// 生成优化内容
function generateOptimizedContent(originalContent) {
  fetch('/api/optimize', {
    method: 'POST',
    body: JSON.stringify({ content: originalContent })
  })
  .then(response => response.json())
  .then(data => {
    optimizedText.innerHTML = highlightKeywords(data.optimizedText);
  });
}

// 高亮关键词
function highlightKeywords(text) {
  const keywords = ['however', 'therefore', 'moreover'];
  return text.split(' ').map(word => {
    return keywords.includes(word.toLowerCase()) ? 
      `<span class="keyword">${word}</span>` : word;
  }).join(' ');
}

// 替换原文
replaceBtn.addEventListener('click', () => {
  const writingInput = document.querySelector('.writing-section textarea');
  writingInput.value = optimizedText.textContent;
  optimizeModal.style.display = 'none';
});

// 重新生成
regenerateBtn.addEventListener('click', () => {
  generateOptimizedContent(originalText.textContent);
});

// 收藏优化方案
favoriteBtn.addEventListener('click', () => {
  const optimizedContent = optimizedText.textContent;
  saveToFavorites(optimizedContent);
});

function saveToFavorites(content) {
  // 保存到收藏库的逻辑
}

