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
// 在全局作用域添加当前界面状态变量
let isOutlineAssistantActive = false;

// 修改模块切换函数
function switchModule(activeBtn, activeContent) {
  const allBtns = [questionAnalysisBtn, outlineAssistantBtn];
  const allContents = [questionAnalysisContent, outlineAssistantContent];

  allBtns.forEach(btn => btn.classList.remove('active'));
  allContents.forEach(content => content.style.display = 'none');

  activeBtn.classList.add('active');
  activeContent.style.display = 'block';
  
  // 更新当前界面状态
  isOutlineAssistantActive = activeBtn.id === 'outline-assistant-btn';
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

      // 检查文本是否为空
      if (!originalText) {
        alert('请输入需要优化的内容');
        return;
      }

      const paragraph = textarea.id.replace('writing-input-', ''); // 获取段落编号

      console.log('原始文本:', originalText);
      console.log('段落编号:', paragraph);

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
        // 调用优化接口
        const response = await fetch('http://localhost:5000/optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            analysis: "你可以按照“描述图片与图表简要介绍插图中的场景，包括公园的环境、锻炼的人们",
            paragraph: originalText,
            user_name: 'current_user'
          })
        });

        if (!response.ok) {
          throw new Error(data.error || '优化请求失败');
        }

        const data = await response.json();
        const optimized_text = data.output.text;
        console.log("接口调用成功 2: ", data)

        clearTimeout(timeoutId);
        loadingOverlay.style.display = 'none';
        
        // 使用marked渲染优化结果
        if (typeof marked === 'undefined') {
            await loadMarked();
        }
        document.getElementById('optimized-text').innerHTML = marked.parse(optimized_text);
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initOptimize();
});

// 提交按钮点击事件
document.getElementById('submit-btn').addEventListener('click', async () => {
    const input = document.getElementById('user-input-text');
    const input_content = input.value.trim();
    
    // 更新用户输入显示区域
    document.getElementById('user-input-display').textContent = input_content;
    
    if (!input_content) {
        alert('请输入内容...');
        return;
    }
    
    // 根据当前界面状态选择结果元素
    const resultElement = isOutlineAssistantActive 
        ? document.getElementById('outline-result') 
        : document.getElementById('question-result');
    // resultElement.textContent = '疯狂思考中......';
    // resultElement.classList.add('loading-animation');

    // 清空输入框
    input.value = '';

    try {
        if (isOutlineAssistantActive) {
            await requestAnalyze(input_content, resultElement);
        } else {
            await requestInitialization(input_content, resultElement);
        }
    } catch (error) {
        resultElement.classList.remove('loading-animation');
        resultElement.innerHTML = `<div class="error-message">请求失败: ${error.message}</div>`;
    }
});

// 请求题目解析接口
async function requestInitialization(input, resultElement) {
    const response = await fetch('http://localhost:5000/initialization', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            topic: input,
            user_name: 'current_user'
        })
    });

    console.log('HTTP状态码:', response.status);

    const data = await response.json();
    console.log('完整响应数据:', data);
    
    if (data?.status_code === 200 && data?.output?.text) {
        resultElement.classList.remove('loading-animation');
        if (typeof marked === 'undefined') {
            await loadMarked();
        }
        resultElement.innerHTML = marked.parse(data.output.text);
    } else {
        throw new Error(data?.error_code || '无效的响应结构');
    }
}

// 请求大纲分析接口
// 添加对话消息到聊天容器
function addChatMessage(role, content) {
    const container = document.getElementById('outline-chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;
    
    const header = document.createElement('h4');
    header.textContent = role === 'user' ? '你的问题' : 'AI回复';
    
    const contentPre = document.createElement('pre');
    contentPre.textContent = content;
    
    messageDiv.appendChild(header);
    messageDiv.appendChild(contentPre);
    container.appendChild(messageDiv);
    
    // 滚动到底部
    container.scrollTop = container.scrollHeight;
}

// 修改requestAnalyze函数
async function requestAnalyze(input, resultElement, showUserMessage = true) {
    // 检查是否有问题解析结果
    question_result = document.getElementById('question-result').textContent
    if (question_result == "") {
        alert("请先完成题目解析")
        throw new Error("请先完成题目解析");
    }

    // 先显示用户消息
    if (showUserMessage) {
        addChatMessage('user', input);
    }

    try {
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                topic: "请结合当前的环境分析一下人工智能对未来就业的影响",
                message: question_result,
                input: input,
                user_name: 'current_user'
            })
        });
        
        const data = await response.json();
        console.log('完整响应数据:', data);
        
        if (data?.status_code === 200 && data?.output?.text) {
            // 显示AI回复
            addChatMessage('ai', data.output.text);
        } else {
            throw new Error(data?.error_code || '无效的响应结构');
        }
        return true;
    } catch (error) {
        addChatMessage('ai', `请求失败: ${error.message}`);
    }
}

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
    // 默认显示题目解析栏
    document.getElementById('question-analysis-interface').style.display = 'flex';
    document.getElementById('question-analysis-content').style.display = 'block';
    document.getElementById('question-analysis-btn').classList.add('active');
    
    // 获取按钮和模块元素
    const outlineBtn = document.getElementById('generate-outline-btn');
    const questionAnalysisBtn = document.getElementById('question-analysis-btn');
    const outlineAssistantBtn = document.getElementById('outline-assistant-btn');
    const questionContent = document.getElementById('question-analysis-content');
    const outlineContent = document.getElementById('outline-assistant-content');

    // 下一步按钮点击事件
    outlineBtn.addEventListener('click', async () => {
        try {
            // 清空聊天对话框
            document.getElementById('outline-chat-container').innerHTML = '';

            // 发起空输入的分析请求
            await requestAnalyze('请开始逐步引导我进行苏格拉底式思考', document.getElementById('outline-result'), false);

            // console.log('分析结果:', result);

            // 切换到"大纲助手"标签
            outlineAssistantBtn.click();
        } catch (error) {
            addChatMessage('ai', `自动分析失败: ${error.message}`);
        }
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

// 绑定生成最终大纲按钮的点击事件
document.getElementById('generate-final-outline-btn').addEventListener('click', async function() {
    try {
        // 获取合并后的内容：用户输入显示 + 题目解析结果
        const userInput = document.getElementById('user-input-display').textContent;
        const questionResult = document.getElementById('question-result').textContent;
        const combinedContent = `${userInput}\n\n${questionResult}`;

        console.log('合并后的内容:', combinedContent);
        
        const user_name = 'current_user'; // 这里应该从登录状态获取实际用户名
        
        // 调用/outline接口
        const response = await fetch('http://localhost:5000/outline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: combinedContent,
                user_name: user_name
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // 解析返回的大纲内容
            const outlineText = result.output.text;

            console.log('生成的大纲:', outlineText);
            
            // 使用正则表达式分割大纲内容
            const sections = outlineText.split(/🔹\s*\*{2}[^\*]+\*{2}/g).slice(1);

            console.log('分割后的大纲段落:', sections.length);

            if (typeof marked === 'undefined') {
              await loadMarked();
            }
            
            // 更新三个段落的内容
            if (sections.length >= 1) {
              console.log('更新第一段内容:', sections[0]);
                document.querySelector('#essay-editor-module .editor-group:nth-child(1) .outline-section .outline-content').innerHTML = 
                    marked.parse(sections[0].trim());
            }
            if (sections.length >= 2) {
              console.log('更新第一段内容:', sections[1]);
                document.querySelector('#essay-editor-module .editor-group:nth-child(2) .outline-section .outline-content').innerHTML = 
                    // sections[1].replace(/\*\*[^\*]+\*\*|`/g, '').trim();
                    marked.parse(sections[1].trim());
            }
            if (sections.length >= 3) {
              console.log('更新第一段内容:', sections[2]);
                document.querySelector('#essay-editor-module .editor-group:nth-child(3) .outline-section .outline-content').innerHTML = 
                    // sections[2].replace(/\*\*[^\*]+\*\*|`/g, '').trim();
                    marked.parse(sections[2].trim());
            }
            
            // 显示作文编辑模块
            document.getElementById('essay-editor-module').style.display = 'block';
            document.getElementById('question-analysis-interface').style.display = 'none';
        } else {
            alert('生成大纲失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('生成大纲失败:', error);
        alert('生成大纲失败，请重试');
    }
});

// 智能评分

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
  const optimizedText = document.getElementById('optimized-text');
  const writingInput = document.querySelector('.writing-section textarea');

  console.log('优化后的内容:', optimizedText.textContent)
  
  // 添加确认弹窗
  if (confirm('确定要用优化后的内容替换原文吗？')) {
    writingInput.value = optimizedText.textContent;
    optimizeModal.style.display = 'none';
  }
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

