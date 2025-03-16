from flask import Flask, request, jsonify
import dashscope
from dashscope import Generation
import sqlite3
from fuzzywuzzy import fuzz
import re

# 题型分类关键词库
QUESTION_TYPES = {
    "社会现象分析类": ["社会", "现象", "影响", "原因"],
    "图表描述类": ["图表", "数据", "趋势", "百分比"],
    "观点对比类": ["观点", "讨论", "利弊", "对比"]
}

# 动态题型判断
def dynamic_question_classification(topic):
    topic_keywords = re.findall(r'[\w\u4e00-\u9fa5]+', topic)
    scores = {}
    for qtype, keywords in QUESTION_TYPES.items():
        scores[qtype] = sum(1 for kw in keywords if kw in topic_keywords)
    return max(scores, key=scores.get)

# 题型频率计算
def calculate_question_frequency(qtype):
    conn = connect_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM exam_papers WHERE question_type=?", (qtype,))
    count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM exam_papers")
    total = c.fetchone()[0]
    conn.close()
    return f"{round(count/(total or 1)*100)}%"

# 语义相关性计算
def calculate_semantic_correlation(topic):
    # 此处可替换为实际语义相似度模型
    return round(fuzz.token_sort_ratio(topic, '典型社会现象')/100, 2)

app = Flask(__name__)

# 设置你的阿里云 DashScope API 密钥
dashscope.api_key = 'sk-d998dcc59c7349be944c4ca2aabcb6f2'

# 存储每个用户的对话历史
user_conversations = {}

# 连接真题数据库
def connect_db():
    conn = sqlite3.connect('exam_papers.db')
    return conn

# 初始化真题数据库
def init_db():
    conn = connect_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS exam_papers
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                 year INTEGER,
                 topic TEXT,
                 model_essay TEXT)''')
    conn.commit()
    conn.close()

# 插入真题数据
def insert_paper(year, topic, model_essay):
    conn = connect_db()
    c = conn.cursor()
    c.execute("INSERT INTO exam_papers (year, topic, model_essay) VALUES (?,?,?)", (year, topic, model_essay))
    conn.commit()
    conn.close()

# 查询真题数据
def query_papers(topic, similarity_threshold=0.5):
    conn = connect_db()
    conn.create_function('text_similarity', 2, lambda a,b: fuzz.token_sort_ratio(a,b)/100)
    c = conn.cursor()
    c.execute("""
        SELECT year, topic, model_essay, 
               text_similarity(topic, ?) as similarity
        FROM exam_papers 
        WHERE similarity > ?
        ORDER BY similarity DESC
        LIMIT 10
    """, (topic, similarity_threshold))
    papers = c.fetchall()
    conn.close()
    return [(year, topic, essay, similarity) for year, topic, essay, similarity in papers]

@app.route('/')
def index():
    return 'Hello, YYY!'

@app.route('/analyze_essay', methods=['POST'])
def analyze_essay():
    data = request.get_json()
    user_id = data.get('user_id')
    topic = data.get('topic')
    message = data.get('message')

    if not user_id or not topic or not message:
        return jsonify({"error": "Missing user_id, topic, or message"}), 400

    # 初始化或获取用户的对话历史
    if user_id not in user_conversations:
        prompt = f"请对考研英语作文题目 '{topic}' 进行解读，并给出作文框架。"
        user_conversations[user_id] = [{"role": "user", "content": prompt}]
    user_conversations[user_id].append({"role": "user", "content": message})

    print("user_id: ", user_id)
    print("message: ", message)
    print("user_conversations: ", user_conversations[user_id])

    try:
        response = Generation.call(
            model='qwen-turbo',
            messages=user_conversations[user_id]
        )
        print("response status_code: ", response.status_code)
        print("request_id: ", response.request_id)
        print("response: ", response)

        if response.status_code == 200:
            answer = response.output.text.strip()
            user_conversations[user_id].append({"role": "assistant", "content": answer})
            return jsonify({"answer": answer})
        else:
            return jsonify({"error": f"调用失败，状态码: {response.status_code}, 错误信息: {response.code}"}), 500
    except Exception as e:
        return jsonify({"error": f"发生错误: {str(e)}"}), 500

# 作文解析 API
@app.route('/essay_analysis', methods=['POST'])
def essay_analysis():
    data = request.get_json()
    topic = data.get('topic')
    if not topic:
        return jsonify({"error": "Missing topic"}), 400

    # 动态题型分析
    question_type = dynamic_question_classification(topic)
    frequency = calculate_question_frequency(question_type)
    correlation = calculate_semantic_correlation(topic)

    # 历年真题库
    papers = query_papers(topic)

    # 生成大纲
    prompt = f"请对考研英语作文题目 '{topic}' 进行苏格拉底式提问以生成作文框架。"
    try:
        response = Generation.call(
            model='qwen-turbo',
            messages=[{"role": "user", "content": prompt}]
        )
        if response.status_code == 200:
            outline = response.output.text.strip()
        else:
            outline = f"调用失败，状态码: {response.status_code}, 错误信息: {response.code}"
    except Exception as e:
        outline = f"发生错误: {str(e)}"

    return jsonify({
        "question_type": question_type,
        "frequency": frequency,
        "correlation": correlation,
        "papers": papers,
        "outline": outline
    })

if __name__ == '__main__':
    init_db()
    print("Server is running...")
    app.run(debug=True)