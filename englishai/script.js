// 在EssayAssistant类中新增案例数据
class EssayAssistant {
    constructor() {
        // 新增按钮事件绑定
        this.bindInitializationEvent();
    }

    // 新增事件绑定方法
    bindInitializationEvent() {
        const btn = document.querySelector('.btn-initialization');
        btn.addEventListener('click', () => {
            const input = document.getElementById('essay-topic');
            if (!input.value.trim()) {
                this.showValidationError();
                return;
            }
            this.startAnalysis(input.value);
        });
    }

    // 新增验证错误提示
    showValidationError() {
        const inputGroup = document.querySelector('.input-core');
        inputGroup.classList.add('error');
        setTimeout(() => inputGroup.classList.remove('error'), 2000);
    }

    // 新增分析流程
    async startAnalysis(topic) {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = '<div class="loader"></div>正在生成分析报告...';
        document.body.appendChild(loading);
    
        try {
            const response = await fetch('http://localhost:5000/initialization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, user_name: 'current_user' })
            });
            
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
    
            const data = await response.json();
            
            // 修复1：正确获取分析卡片容器
            const analysisCard = document.querySelector('.analysis-card');
            
            // 修复2：更新题目显示
            analysisCard.querySelector('.meta-item h4').textContent = `题目：${topic}`;
            
            // 修复3：正确填充分析内容
            analysisCard.querySelector('.analysis-meta pre').textContent = data.data.analysis;
    
            // 显示成功提示
            this.showToast('解析成功！', 'success');
        } catch (error) {
            console.error('解析失败:', error);
            this.showToast(`解析失败: ${error.message}`, 'error');
        } finally {
            // 确保移除加载状态
            loading.remove();
        }
    }

    // 新增提示方法
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
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
}

// 初始化实例
document.addEventListener('DOMContentLoaded', () => {
    new EssayAssistant();
});