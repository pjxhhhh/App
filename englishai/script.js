class EssayAssistant {
    constructor() {
        this.dialogSteps = [
            "核心观点", "论证角度", "数据支撑", 
            "对比分析", "解决方案", "结论方向",
            "案例匹配", "词汇选择", "逻辑结构", "最终校验"
        ];
        this.currentStep = 0;
    }

    initDialogProcess() {
        document.querySelectorAll('.dialog-step').forEach((step, index) => {
            step.style.display = index === 0 ? 'block' : 'none';
        });
        
        document.querySelector('.btn-next').addEventListener('click', () => {
            this.goToNextStep();
        });
    }

    goToNextStep() {
        if (this.currentStep < 9) {
            // 更新进度条
            document.querySelectorAll('.dialog-process .step')
                [this.currentStep].classList.remove('active');
            
            this.currentStep++;
            
            // 显示下一步界面
            document.querySelectorAll('.dialog-step')
                .forEach(step => step.style.display = 'none');
            document.querySelectorAll('.dialog-step')
                [this.currentStep].style.display = 'block';
                
            document.querySelectorAll('.dialog-process .step')
                [this.currentStep].classList.add('active');
        } else {
            this.generateFinalOutline();
        }
    }

    initAnalysisSystem() {
        // 初始化频率图表
        this.renderFrequencyChart();
        
        // 绑定真题点击事件
        document.querySelectorAll('.analysis-meta li').forEach(li => {
            li.addEventListener('click', () => this.showFullEssay());
        });
    }

    renderFrequencyChart() {
        // 使用Chart.js实现柱状图
        const ctx = document.createElement('canvas');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['近1年', '近3年', '近5年'],
                datasets: [{
                    data: [15, 24, 19],
                    backgroundColor: '#2A5C9A'
                }]
            }
        });
        document.querySelector('.frequency-bar').appendChild(ctx);
    }
}

// 在EssayAssistant类中新增案例数据
class EssayAssistant {
    constructor() {
        // 新增模拟历史数据
        this.historyData = [...]; // 保持原有模拟数据不变
        
        // 新增初始化调用
        this.initDomElements();
        this.initEventListeners();
        this.initOCRProcessor();
        this.initHistoryPanel(); // 增加历史面板初始化
    }

    // 新增历史面板初始化
    initHistoryPanel() {
        const container = document.querySelector('.history-list');
        container.innerHTML = this.historyData.map(item => `
            <li class="history-item">
                <div class="history-meta">
                    <h4>${item.title}</h4>
                    <div class="type-time">
                        <span class="type-tag">${item.type}</span>
                        <time>${item.time}</time>
                    </div>
                </div>
            </li>
        `).join('');
    }

    // 修改后的搜索方法
    filterHistoryRecords(keyword) {
        document.querySelectorAll('.history-item').forEach(item => {
            const text = item.querySelector('h4').textContent + 
                       item.querySelector('.type-tag').textContent;
            item.style.display = text.includes(keyword) ? 'flex' : 'none';
        });
    }
    this.caseStudies = {
            "2023": {
                title: "城市绿化发展",
                type: "社会现象类",
                outline: [
                    "城市绿地面积变化趋势",
                    "心理健康与社区关系",
                    "立体绿化实施方案"
                ],
                samples: [
                    { title: "2023真题范文", similarity: 0.92 }
                ]
            }
        };
    }

    // 新增案例渲染方法
    renderCaseStudy(year = "2023") {
        const data = this.caseStudies[year];
        return `
            <div class="case-study-${year}">
                <h3>📚 ${year}真题案例</h3>
                <div class="outline-sample">
                    ${data.outline.map((item, index) => `
                        <div class="outline-step">
                            <span class="step-num">${index + 1}</span>
                            ${item}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}