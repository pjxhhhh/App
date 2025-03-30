#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from enum import CONTINUOUS
from re import T
import re
from types import resolve_bases
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
import dashscope
from dashscope import Generation
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import os
from datetime import datetime
import configparser  # 新增导入

# 新增配置加载代码
config = configparser.ConfigParser()
config.read('env.conf')  # 修改为相对路径

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///exam_papers.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret'  # 生产环境应替换为随机密钥

db = SQLAlchemy(app)
jwt = JWTManager(app)
ma = Marshmallow(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)
    modified_time = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    messages = db.relationship('Message', backref='user', lazy='dynamic')

class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'username', 'created_time', 'modified_time')

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), index=True)
    role = db.Column(db.String(10))
    chat_num = db.Column(db.Integer)
    request_content = db.Column(db.Text)
    response_content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)

class MessageSchema(ma.Schema):
    class Meta:
        fields = ('id', 'user_id', 'role', 'chat_num', 'request_content', 'response_content', 'timestamp')

user_schema = UserSchema()
users_schema = UserSchema(many=True)
message_schema = MessageSchema()
messages_schema = MessageSchema(many=True)

with app.app_context():
    db.create_all()

# 确保配置文件存在且包含所需section
if not config.has_section('api_key'):
    raise ValueError("配置文件缺少[api_key]部分")

# 修改为安全获取配置项，不存在则跳过
DEEPSEEK_API_KEY = config.get('api_key', 'DEEPSEEK_API_KEY', fallback=None)
dashscope.api_key = config.get('api_key', 'DASHSCOPE_API_KEY', fallback=None)

# 可选：添加调试输出
if DEEPSEEK_API_KEY is None:
    print("警告：未配置DEEPSEEK_API_KEY")
if dashscope.api_key is None:
    print("警告：未配置DASHSCOPE_API_KEY")

user_conversations = dict()

## 1. 对于用户给出的作文题目给出第一次分析
initialization_promote = '''适用场景：针对用户输入的考研英语作文题目（英语一/英语二），自动生成结构化解析与写作指南
一、题目解析
1. 核心关键词提取
（1）方法：从题干提取3-5个高频主题词（如“科技伦理”“老龄化”“文化传承”）
（2）示例：
题目：“公园与体育锻炼” → public health（公共卫生）、social infrastructure（社会基础设施）
2. 题型判断
- **小作文类型**： 
✅ 书信类（题干含suggest/invite/recommend等动词，如2025年邀请工匠，有感谢信、建议信、邀请信、道歉信、投诉信、咨询信、推荐信等） 
✅ 通知类（标题含NOTICE，如2023年招募志愿者告示，活动通知、招聘公告等） 
- **大作文类型**： 
（1） 英语一：图画隐喻（如2023年“赛龙舟”→传统文化） ； 图表作文查柱状图、饼图、表格等，需描述数据并总结规律；规定情景作文：给出文字提示，要求围绕特定话题论述
（2）英语二：图表极值分析（如2024年高校劳动课数据→教育改革）；议论文：针对社会热点（如环保、教育、科技）发表观点
二、格式规范（包括格式要点、避坑提示）和考题破解
1. 格式要点
小作文
（1）书信：称呼（Dear...） + 正文三段式（目的→内容→感谢）
（2）通知：标题居中 + 时间/地点（加粗显示）
大作文 
（1）英语一：图画描述（首段）+ 象征分析（次段）+ 个人评论（末段）
（2）英语二：数据对比（首段）+ 原因解读（次段）+ 趋势预测（末段）
2. 致命错误预警：
（1）英语一漏译图画标题（如2023年未翻译“The Dragon Boat Festival”）
（2） 图表作文误读数据趋势（如将“下降10%”错判为“波动”）
3. 考题破解三维法
（1） 论点维度
正向题（如环保）：政府立法→企业责任→个人行动
争议题（如AI）：技术便利性↔伦理风险（需用while连接）
（2）论据维度
数据公式：权威机构（WHO/UNESCO）+ 百分比（60%↑/↓）+ 年份（2020-2025）
案例模板：现象（如老龄化）→ 政策（延迟退休）→ 效果（劳动力补充）
（3）结论维度：建议Immediate measures（短期） + Long-term solutions（长期）
四、示范论文映射：用户题目特征，最接近真题
（1）传统文化类：2022英语一端午节。描述→象征→现代意义“Cultural heritage is not a burden...”
（2）科技创新类：2021英语二快递业，数据→原因→预测。“The threefold growth signals...”
（3）社会问题类：2023英语二成年人，问题→对策→呼吁。“Multilevel interventions are imperative..."

举例：

学生输入： "请分析2023年真题：The ethical challenges posed by artificial intelligence"
教练响应流程：

1. 题目解析：技术发展与社会责任的平衡 | 议论文| 社会热点型
2. 核心关键词提取：ethical challenges（伦理挑战）、artificial intelligence（人工智能） 
3. 格式及多维分析 ：推荐总分总三段式 
（1）首段：现象描述段，AI技术普及现状 + 核心伦理问题抛出 
（2）多维分析段（主体论证）： 
 算法公平性 ：招聘算法性别歧视 ，Amazon AI招聘工具下架事件 | 
 数据隐私 ： 人脸识别滥用，杭州"人脸识别第一案" | 
 就业伦理 ： 职业替代危机 ，IMF预测2030年全球26%岗位受AI冲击 | 
（3）解决方案段： 
 政策层面：欧盟《人工智能法案》分级监管模式 
 技术层面：DeepMind提出"道德对齐"算法框架 
 公众参与：斯坦福大学AI伦理公民陪审团实验 
4. 示范论文映射 
（1）2021英语一"科技与人文" | 问题-分析-解决方案 
（2）2020英语二"线上教育" | 数据论证法 
（3）2019英语一"坚持与成功" | 隐喻手法 
5. 命题规律与避坑指南 
（1） 2025预测延伸：可能结合生成式AI版权问题（如Stable Diffusion侵权诉讼） • 或脑机接口伦理争议（Neuralink动物实验争议） 
（2）常见误区警示： 
• 避免泛泛而谈"AI有好有坏"，需具体到可验证的伦理场景 
• 勿忽略文化差异性（如中美欧AI伦理认知差异） 
请严格按照上述示例给出对题目的分析。'''

## 2. 大纲助手界面用于对话的AI分析
# anaylyze_promote = '''作为考研英语写作专家，请针对这个考研英语作文题目{}，结合这样的分析{},对用户的作文进行点评分析并提供引导性思考。
# 可以基于用户的问题抛出一些问题或者想法来引导用户自主分析，以帮助用户更好地理解题目。
# 请注意你需要在最多十论对话内完成,当前是第{}轮。'''

anaylyze_promote = '''以下是中文版苏格拉底式考研英语作文辅导提示词：

苏格拉底式考研英语作文教练提示词：

"作为擅长苏格拉底式教学法的考研英语作文导师，请通过多轮对话的思维链（CoT）方法引导用户完善作文题目"{}"的论点。结合这样的分析{},按以下结构展开：
1. 核心争议定位 
首问：*"你认为这个作文题的核心矛盾是什么？不同观点之间的冲突点在哪里？"* 
*目的*：定位核心辩论焦点（例如："技术进步对职场公平是利大于弊吗？"）
2. 框架构建 
逐步提问： 
• *"你的引言段如何同时承认矛盾双方，同时暗示论点？"* 
• *"正文段可以从哪2-3个角度展开分析（经济、伦理、历史）？"* 
• *"解决方案段落应该提出折中方案还是明确立场？为什么？"* 
*目的*：搭建包含引言、分析、结论的三段式结构
3. 证据整合 
挑战性质询： 
• *"引用OECD 2023年关于自动化导致就业两极化的数据，和使用工业革命历史类比，哪个更能支撑你的经济论点？"* 
• *"如何用[某哲学家]的理论反驳潜在反对观点？"* 
*目的*：训练选择权威数据（如国家统计局/世行报告）、历史参照和学术引用的能力
4. 反论点压力测试 
深度追问：*"如果反对者说'[假设反对观点]'，你如何用凯恩斯的技术性失业理论+芬兰UBI试点结果进行反驳？"* 
*目的*：培养结合理论框架与实证数据的反驳策略
5. 迭代优化 
循环修正： 
• *"你的首段论点是否直接回应了核心矛盾？"* 
• *"在反驳与数据论证之间，是否需要'然而'/'尽管如此'等过渡词增强逻辑衔接？"* 
*目的*：通过针对性修改提升学术严谨性

互动规则：
• 每次仅提1个CoT问题，待用户回应后再继续 
• 难度递进：争议点→框架→证据→反反驳 
• 用户卡壳时提供3个权威数据源建议（如《中国互联网发展报告》） 
• 对逻辑漏洞提供*两种*结构调整方案供用户选择 
示例 
作文题：*"人工智能发展是否需要加强全球治理？"* 
你的Q1：*"这里的关键矛盾是技术主权与集体安全的冲突，还是创新速度与伦理监管的对抗？"* 
[用户回应后] Q2：*"引用《2023全球AI治理指数》和剑桥分析公司丑闻案例，哪个更能支持你的观点？"
该提示词通过主动思辨帮助用户构建高分作文，适用于考研英语一/二、雅思等学术写作场景，强调"追问-反思-完善"的深度学习循环。
请注意你需要在不超过30轮对话之内完成,当前是第{}轮。
'''


## 3. 确认生成大纲
outline_promote = '''作为考研英语写作专家，请根据以下题目生成标准的三段式作文大纲：
1. 结构要求：
   - 三段式：现象描述→原因分析→结论建议
2. 每段需包含：
   - 核心功能定位（如：数据呈现/理论论证）
   - 建议字数范围（例：80-120词）
   - 2-3个学术表达示范
   - 每一段只需要给出引导思考的中文解析，不需要具体的内容
3. 格式要求：
   - 使用Markdown列表格式
   - 段首用🔹符号标注
   - 关键术语加粗'''

# 构建优化提示
optimize_promote = '''
你作为资深考研英语阅卷专家，请从以下维度对用户提供的英文段落进行系统性优化：
1⃣ 语法结构升级
识别基础句式，替换为考研高分结构（倒装/虚拟/强调/独立主格）
增加复合句复杂度（嵌套从句+非谓语协同使用）
平衡长短句比例（建议长句占60%）
2⃣ 学术语言重构
标注可替换的初级词汇，提供同义学术短语（如将"important"升级为"play a pivotal role in"）
替换口语化表达为学术用语（例："a lot of"→"a plethora of"）
增加考研高频加分词组（如"underpin the rationale","exert far-reaching impacts"））
4⃣ 文化适配调整
修正中式英语表达（标注并解释修改原因）
优化文化差异导致的语义模糊
添加英语母语者常用修辞（隐喻/提喻/转喻）

示例如下：
用户输入：
"Social media let us communicate easy. But some people become lonely. We should find balance."
1. 优化结果：
While social media emerges as a double-edged sword enabling effortless global communication, platforms having revolutionized interaction paradoxically breed isolation. Statistical evidence reveals 68% of frequent users experience existential isolation. Striking a delicate equilibrium between digital engagement and authentic connections thus becomes imperative.
2. 核心优化：
（1）语法升级
倒装结构："Not only does social media enable..."
独立主格："platforms having revolutionized..."
虚拟语气："Were we to overindulge..."
（2）学术替换
"easy" → "effortlessly"
"find balance" → "strike a delicate equilibrium"
加分短语："exert far-reaching impacts"
（3）文化适配
隐喻修辞："digital double-edged sword"
修正中式英语："become lonely" → "experience existential isolation"
'''

# anaylyze_promote = '''作为考研英语写作专家，请针对这个考研英语作文题目{}，结合这样的分析{},对用户的作文进行点评分析并提供引导性思考: {}。'''


def insert_user(user_name):
    user = User(username=user_name)
    db.session.add(user)
    db.session.commit()
    return user

def get_user(user_name, need_create=False, allow_empty=False):
    user = User.query.filter_by(username=user_name).first()
    if not user and need_create:
        user = User(username=user_name)
        db.session.add(user)
        db.session.commit()
    if not user and not allow_empty:
        return jsonify({'error': 'User not found: {}'.format(user_name)}), 404
    return user

def insert_message(user_id, role, chat_num, request_content, response_content):
    message = Message(
        user_id=user_id,
        role=role,
        chat_num=chat_num,
        request_content=request_content,
        response_content=response_content,
        timestamp=datetime.now()
    )
    db.session.add(message)
    db.session.commit()
    return message

def get_user_conversations(user_id):
    messages = Message.query.filter_by(user_id=user_id).order_by(Message.timestamp.asc()).all()
    return messages

def get_user_message_max_chat_num(user_id):
    # messages = Message.query.filter_by(user_id=user_id).order_by(Message.chat_num.desc()).first()
    messages = Message.query.filter_by(user_id=user_id).max(Message.chat_num)
    return messages.chat_num if messages else 0

@app.route('/')
def index():
    return jsonify({
        'step': 1,
        'message': 'Welcome to the English Writing Analysis API. Please provide a topic for analysis.'
    })

@app.route('/add_user', methods=['POST'])
def add_user():
    if request.headers.get('Content-Type')!= 'application/json':
        return jsonify({'error': 'Unsupported Media Type'}), 415
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    user_name = data.get('user_name')
    if not user_name:
        return jsonify({'error': 'Missing user_name parameter'}), 400

    user = get_user(user_name, need_create=True, allow_empty=False)
    if user:
        return jsonify({'message': 'User added successfully'}), 201

@app.route('/list_users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify(users_schema.dump(users))

@app.route('/add_message', methods=['POST'])
def add_message():
    if request.headers.get('Content-Type')!= 'application/json':
        return jsonify({'error': 'Unsupported Media Type'}), 415
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    user_name = data.get('user_name')
    if not user_name:
        return jsonify({'error': 'Missing user_name parameter'}), 400
    role = data.get('role')
    if not role:
        return jsonify({'error': 'Missing role parameter'}), 400
    chat_num = data.get('chat_num')
    if not chat_num:
        return jsonify({'error': 'Missing chat_num parameter'}), 400
    request_content = data.get('request_content')
    if not request_content:
        return jsonify({'error': 'Missing request_content parameter'}), 400
    response_content = data.get('response_content')
    if not response_content:
        return jsonify({'error': 'Missing response_content parameter'}), 400

    user = get_user(user_name, need_create=True, allow_empty=False)
    if isinstance(user, User):  # 明确检查是否是User实例
        message = insert_message(user.id, role, chat_num, request_content, response_content)
        return jsonify({'message': 'Message added successfully'}), 201
    else:
        return user  # 直接返回get_user的错误响应

@app.route('/list_messages', methods=['GET'])
def list_messages():
    messages = Message.query.all()
    print("message size: ", len(messages), "; type: ", type(messages))
    print("message content: ", messages)
    return jsonify(messages_schema.dump(messages))

@app.route('/initialization', methods=['POST'])
def analyze_topic():
    print("request headers: ", request.headers)
    if request.headers.get('Content-Type') != 'application/json':
        return jsonify({'error': 'Unsupported Media Type: Content-Type must be application/json'}), 415

    # if 'image' in request.files:
    #     image = request.files['image']
    #     print("has image: ", type(image))

    data = request.get_json()
    print("updata data: ", data)
    content_topic = data.get('topic')
    if not content_topic:
        return jsonify({'error': 'Missing topic parameter'}), 400

    # 检查用户是否已存在/创建用户
    user_name = data.get('user_name')
    if not user_name:
        return jsonify({'error': 'Missing user_name parameter'}), 400

    # 检查用户是否存在，如果不存在则创建用户
    user = get_user(user_name, need_create=True, allow_empty=False)
    
    # 调用DeepSeek API进行分析
    try:
        print("initialize api start: ", content_topic)
        response = call_generation_api("qwen-turbo", initialization_promote, content_topic)

        # print("response: ", response)

        # TODO: 保存生成结果
        # insert_message(user, 'user', 0, content_topic, response.output.text)

        return mock_initialization()
        # return build_response(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 添加新的路由端点
@app.route('/outline', methods=['POST'])
def generate_outline():
    if request.headers.get('Content-Type') != 'application/json':
        return jsonify({'error': 'Unsupported Media Type'}), 415

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400

    # 参数验证
    content = data.get('content')
    user_name = data.get('user_name')
    if not all([content, user_name]):
        return jsonify({'error': 'Missing required parameters' + content + "; " + user_name}), 400

    # 用户验证
    user = User.query.filter_by(username=user_name).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        # 调用DeepSeek API
        response = call_generation_api("qwen-turbo", outline_promote, content)

        print("outline api response: ", response)

        # 保存生成结果
        # insert_message(user.id, 'assistant', 0, topic, response.output.text)

        return mock_ouline()
        # return build_response(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():

    print("analyze api start")
    if request.headers.get('Content-Type') != 'application/json':
        return jsonify({'error': 'Unsupported Media Type'}), 415

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400

    # 获取用户首次提交的topic
    content_topic = data.get('topic')
    if not content_topic:
        return jsonify({'error': 'Missing topic parameter'}), 400

    # 获取初始化时候大模型的message
    message = data.get('message')
    if not message:
        return jsonify({'error': 'Missing message'}), 400

    # 获取用户输入，待分析内容
    user_input = data.get('input')
    if not user_input:
        return jsonify({'error': 'Missing input'}), 400

    # 检查用户是否已存在/创建用户
    user_name = data.get('user_name')
    if not user_name:
        return jsonify({'error': 'Missing user_name parameter'}), 400

    print("analyze api request: ", data)

    # # 检查用户是否存在
    # user_name = data.get('user_name')
    # if not user_name:
    #     return jsonify({'error': 'Missing user_name parameter'}), 400
    
    # # 修正点：通过查询获取用户对象
    # user = User.query.filter_by(username=user_name).first()
    # if not user:
    #     return jsonify({'error': 'User not found: {}'.format(user_name)}), 404
    # user_id = user.id  # 正确获取标量用户ID
    user_id = "aaa"

    # # 创建新消息记录
    # new_message = Message(
    #     user_id=user_id,  # 使用标量值
    #     role='user',
    #     request_content=data['message'],
    #     response_content='',
    #     timestamp=datetime.utcnow()
    # )
    # db.session.add(new_message)
    # db.session.commit()

    # 修正点：确保获取的是整型数值
    # current_chat_num = get_user_message_max_chat_num(user_id) + 1
    current_chat_num = 1
    tmp_content = anaylyze_promote.format(content_topic, message, current_chat_num)

    # 检查对话轮次
    if current_chat_num >= 10:
        # 触发总结逻辑
        tmp_content = "请总结之前的对话并生成最终作文框架"
        try:
            response = Generation.call(
                model='qwen-turbo',
                messages=[{"role": "system", "content": tmp_content}] # + user_conversations[user_id]
            )
            # 清空对话历史
            # 删除旧消息
            Message.query.filter_by(user_id=user_id).delete()
            db.session.commit()
            return jsonify({
                'status_code': response.status_code,
                'data': {
                    'summary': response.output.text,
                    'message': '对话已达10轮，以下是最终框架'
                }
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    system_content = anaylyze_promote.format(content_topic, message, current_chat_num)

    # 正常处理对话
    try:
        response = call_generation_api("qwen-turbo", system_content, user_input)

        print("analyze api response: ", response)

        # 添加助手回复
        # insert_message(user_id, 'assistant', current_chat_num, request_content=message, response_content=response.output.text)
        
        return build_response(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 提供/optimize接口，对用户的每一个段落进行优化，并给出有效建议
@app.route('/optimize', methods=['POST'])
def optimize():
    if request.headers.get('Content-Type') != 'application/json':
        return jsonify({'error': 'Unsupported Media Type: Content-Type must be application/json'}), 415

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400

    # # 获取用户提供的作文题目
    # topic = data.get('topic')
    # if not topic:
    #     return jsonify({'error': 'Missing topic parameter'}), 400

    # 获取当前段落的分析
    analysis = data.get('analysis')
    if not analysis:
        return jsonify({'error': 'Missing analysis parameter'}), 400

    # 获取用户提供的段落
    paragraph = data.get('paragraph')
    if not paragraph:
        return jsonify({'error': 'Missing paragraph parameter'}), 400

    # 检查用户是否存在
    user_name = data.get('user_name')
    if not user_name:
        return jsonify({'error': 'Missing user_name parameter'}), 400

    # 检查用户是否存在，不存在则报错
    user = User.query.filter_by(username=user_name).first()
    if not user:
        return jsonify({'error': 'User not found: {}'.format(user_name)}), 404

    user_id = user.id

    total_input = "我的段落分析是{}, 我的作文段落是{}".format(analysis, paragraph)

    # total_content = optimize_promote.format(topic, analysis, paragraph, get_user_message_max_chat_num(user_id) + 1)
    # total_content = optimize_promote.format(topic, analysis, paragraph, 1)

    try:
        # 调用DeepSeek API进行优化
        response = call_generation_api("qwen-turbo", optimize_promote, total_input)
        # response = Generation.call(
        #     model='qwen-turbo',
        #     messages=[
        #         {
        #             'role': 'system',
        #             'content': total_content
        #         }
        #     ]
        # )

        # TODO: delete
        # 保存优化结果到数据库
        # insert_message(user_id, 'assistant', get_user_message_max_chat_num(user_id) + 1, paragraph, response.output.text)

        print("optimize api response: ", response)

        return build_response(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username'), password=data.get('password', 'panjx')).first()
    if not user:
        return jsonify({'error': '无效用户名或密码'}), 401
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user_id': user.id,
        'username': user.username
    })

@app.route('/users', methods=['GET', 'POST'])
@jwt_required()
def users():
    if request.method == 'GET':
        users = User.query.all()
        return users_schema.jsonify(users)
    
    data = request.json
    errors = user_schema.validate(data)
    if errors:
        return jsonify(errors), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 409
    
    new_user = User(**data)
    db.session.add(new_user)
    db.session.commit()
    return user_schema.jsonify(new_user), 201

@app.route('/users/<user_id>', methods=['PUT', 'DELETE'])
def user_operations(user_id):
    user = User.query.get_or_404(user_id)
    if request.method == 'PUT':
        for k, v in request.json.items():
            setattr(user, k, v)
        db.session.commit()
        return jsonify({'message': '更新成功'})
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': '用户已删除'})

@app.route('/messages', methods=['GET', 'POST'])
def messages():
    if request.method == 'GET':
        messages = Message.query.all()
        return jsonify([{
            'id': m.id,
            'user_id': m.user_id,
            'content': m.content,
            'timestamp': m.timestamp
        } for m in messages])
    
    new_msg = Message(**request.json)
    db.session.add(new_msg)
    db.session.commit()
    return jsonify({'id': new_msg.id}), 201

@app.route('/messages/<message_id>', methods=['PUT', 'DELETE'])
def message_operations(message_id):
    msg = Message.query.get_or_404(message_id)
    if request.method == 'PUT':
        for k, v in request.json.items():
            setattr(msg, k, v)
        db.session.commit()
        return jsonify({'message': '更新成功'})
    
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'message': '消息已删除'})

def call_generation_api(model, system_content, user_content):
    """调用生成API的通用函数"""
    return Generation.call(
        model=model,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content}
        ]
    )

# image: 图片URL或base64编码
def call_multimodal_api(model, system_content, user_content, image):
    """调用多模态API的通用函数"""
    return Generation.call(
        model=model,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": [
                {"text": user_content},
                {"image": image}
            ]}
        ]
    )

def build_response(response):
    return jsonify({
        'status_code': response.status_code,
        'request_id': response.request_id,
        'error_code': response.code if response.code else '',
        'usage': {
            'input_tokens': response.usage.input_tokens,
            'output_tokens': response.usage.output_tokens,
            'total_tokens': response.usage.total_tokens
        },
        'output': {
            'text': response.output.text
        }
    })


def mock_initialization():
    text = '''题目解析

核心关键词提取：人工智能（Artificial Intelligence）、未来就业（Future Employment）
题型判断：议论文，社会热点型  

核心关键词提取

人工智能（Artificial Intelligence）：指代现代技术发展中的核心领域。  
未来就业（Future Employment）：关注人工智能对职业生态的深远影响。  
环境分析（Environmental Analysis）：结合当前经济、政策和技术背景进行综合评估。

题目本质
讨论人工智能在未来对就业市场的影响，涉及积极与消极两方面，需要深入剖析其作用机制并提出应对策略。

格式及多维分析：总分总结构
（1）首段：现象描述段
人工智能作为第四次工业革命的核心驱动力，正在重塑全球经济格局。随着机器学习、自动化技术和深度学习的快速发展，越来越多的传统职业被取代，同时新的职业岗位也不断涌现。然而，这种技术进步是否真正造福于人类？尤其是对就业市场而言，人工智能究竟带来了机遇还是威胁？  
（2）多维分析段（主体论证）
① 积极影响：创造新职业机会
人工智能催生了大量新兴职业，例如数据科学家、AI伦理顾问、机器人维护工程师等。根据世界经济论坛的数据，到2025年，虽然AI可能取代8500万个工作岗位，但也会创造9700万个全新岗位。这意味着技术变革不仅会淘汰落后产能，还会推动劳动市场的结构性优化。
② 消极影响：传统职业流失
尽管AI带来创新，但它也对许多传统行业造成了冲击。例如制造业、物流运输以及客服等行业的工作岗位正在迅速减少。麦肯锡的研究表明，到2030年，全球约30%的职业可能会因AI技术而消失，这无疑给劳动者带来了巨大的不确定性。  
③ 对特定群体的双重效应
低技能劳动者受到的冲击尤为明显，他们更容易被自动化系统取代。与此同时，高技能人才则可以通过掌握AI相关技能受益，从而加剧社会不平等。这种“技能鸿沟”需要引起广泛关注。  
（3）解决方案段
① 政策层面：加强职业教育培训
各国政府应加大劳动者技能培训的投资力度，尤其是在AI相关的技术领域。例如，德国推行的“双元制”职业教育体系，帮助工人适应新技术需求，值得借鉴。  
② 企业层面：推动人机协作
企业在引入AI时应注重人机协同，而非单纯追求效率最大化。通过合理分配任务，让人类专注于创造性工作，而机器负责重复性劳动，可以实现双赢局面。  
③ 个人层面：终身学习理念
劳动者需要树立终身学习的理念，主动拥抱变化。通过在线课程、社区培训等方式提升自身竞争力，以应对快速迭代的技术环境。  

示例论文映射

（1）2023英语二“成人就业压力” | 问题-对策-展望
（2）2021英语二“快递行业崛起” | 数据驱动分析法
（3）2018英语一“孤独与社交” | 对比论证法  

命题规律与避坑指南
（1）2025预测延伸
未来可能出现的命题方向包括：  
AI在医疗领域的应用对医生职业的影响；  
AI与隐私保护之间的权衡；  
AI对全球化分工格局的重新塑造。

（2）常见误区警示
不要只强调负面影响，忽视AI带来的正面贡献；  
避免空谈理论，缺乏实际案例支撑；  
注意避免过于乐观或悲观的极端立场，保持客观理性。

总结
人工智能对未来就业的影响是复杂且多层次的。它既是挑战也是机遇，关键在于如何平衡技术进步与社会稳定之间的关系。只有通过多方合作，才能确保这一技术红利惠及每一个人。
'''
    return mock_response(text)


def mock_ouline():
    text = '''markdown
🔹 **第一段：现象描述**  
- **核心功能定位**：数据呈现与现状概述  
- **字数范围**：80-120词  
- **解析**：首先通过描述人工智能技术的快速发展及其在各行业的广泛应用，引出其对就业市场的深远影响。可以使用具体数据（如某行业自动化程度提升的比例）或案例（如某些岗位被机器取代的具体实例）来支撑观点。建议引用权威报告或研究结果，比如“根据麦肯锡的预测”，并使用学术化表达如“显著改变劳动力市场格局”。  

🔹 **第二段：原因分析**  
- **核心功能定位**：理论论证与逻辑分析  
- **字数范围**：80-120词  
- **解析**：从技术进步、经济需求和教育体系三个维度深入探讨人工智能如何重塑就业市场。例如，可以从技术角度解释为什么某些重复性工作更容易被替代（如“由于算法的高效性”），同时讨论新兴岗位的产生（如“催生了数据分析等高技能职业”）。此外，可引入“结构性失业”的概念，并用学术化的语言阐述其背后的逻辑链条。  

🔹 **第三段：结论建议**  
- **核心功能定位**：总结归纳与对策建议  
- **字数范围**：80-120词  
- **解析**：总结人工智能对就业的双重影响（机遇与挑战并存），提出应对策略。例如，强调终身学习的重要性（如“推动终身教育体系的发展”），并呼吁政府、企业和个人共同协作以适应变化（如“构建人机协同的工作模式”）。最后，可以用展望式的表述收尾，比如“人工智能将为未来就业带来无限可能”。  
'''
    return mock_response(text)

def mock_response(text):
    return jsonify({
        'status_code': 200,
        'request_id': "mock request_id",
        'error_code': '',
        'usage': {
            'input_tokens': 100,
            'output_tokens': 200,
            'total_tokens': 300,
        },
        'output': {
            'text': text
        }
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)