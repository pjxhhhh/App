#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from re import T
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
import dashscope
from dashscope import Generation
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import os
from datetime import datetime

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

# DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', 'sk-f06f42694798425bb1171b1fae730b58')

dashscope.api_key = 'sk-d998dcc59c7349be944c4ca2aabcb6f2'

user_conversations = dict()

initialization_promote = '''作为考研英语写作专家，请按以下步骤指导用户：
1. **题型判断** 
   - 根据输入题目判断属于：现象分析型/观点对比型/问题解决型/图表描述型
   - 给出近10年同类真题举例（如：2023年"人工智能伦理"→现象分析型）
2. **分析维度拆解**
   - 核心概念定义：用2种方式解释题目关键词
   - 论证坐标系构建：
     * 横向维度：技术/经济/文化/伦理 
     * 纵向维度：个人/社会/全球
   - 数据支撑点：建议引用的权威报告/历史事件
3. **互动引导流程**
   按思维链(CoT)逐步提问：
   Q1: "你认为本题最关键的争议点是什么？" → 定位核心矛盾
   Q2: "如果反对者说...你会如何反驳？" → 训练批判思维
   Q3: "用OECD的数据支撑哪个论点更有说服力？" → 实证思维
4. **大纲优化检查**
   - 结构完整性：对比2020-2024年高分范文框架
   - 逻辑漏洞检测：使用"主张→论据→反证"三角验证法
   - 学术化升级：将口语化表达替换为学术词汇（如把important→paramount）
5. **语言提升建议**'''

# 在初始化提示词之后添加大纲生成提示
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
optimize_promote = '''作为考研英语写作专家，请针对这个考研英语作文题目{}，结合这样的分析{},对用户的作文进行点评分析并提供引导性思考: {}。
可以基于用户的问题抛出一些问题或者想法来引导用户自主分析，以帮助用户更好地理解题目。
请注意你需要在最多十论对话内完成,当前是第{}轮。'''

anaylyze_promote = '''作为考研英语写作专家，请针对这个考研英语作文题目{}，结合这样的分析{},对用户的作文进行点评分析并提供引导性思考: {}。'''


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

@app.route('/initialization', methods=['POST'])
def analyze_topic():
    print("request headers: ", request.headers)
    if request.headers.get('Content-Type') != 'application/json':
        return jsonify({'error': 'Unsupported Media Type: Content-Type must be application/json'}), 415

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
        response = Generation.call(
            model='qwen-turbo',
            messages=[
                {
                    'role': 'system',
                    'content': initialization_promote
                },
                {
                    'role': 'user',
                    'content': content_topic
                }
            ]
        )

        print("response: ", response)

        # TODO: 保存生成结果
        # insert_message(user, 'user', 0, content_topic, response.output.text)

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
        response = Generation.call(
            model='qwen-turbo',
            messages=[
                {"role": "system", "content": outline_promote},
                {"role": "user", "content": content}
            ]
        )

        # 保存生成结果
        # insert_message(user.id, 'assistant', 0, topic, response.output.text)

        return jsonify({
            'status_code': response.status_code,
            'request_id': response.request_id,
            'usage': {
                'input_tokens': response.usage.input_tokens,
                'output_tokens': response.usage.output_tokens,
                'total_tokens': response.usage.total_tokens
            },
            'output': {
                'text': response.output.text,
                'structure_type': '三段式' if '三段' in response.output.text else '四段式'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    if request.headers.get('Content-Type') != 'application/json':
        return jsonify({'error': 'Unsupported Media Type'}), 415

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400

    # 获取用户message
    message = data.get('message')
    if not message:
        return jsonify({'error': 'Missing message'}), 400

    # 检查用户是否存在
    user_name = data.get('user_name')
    if not user_name:
        return jsonify({'error': 'Missing user_name parameter'}), 400
    
    # 修正点：通过查询获取用户对象
    user = User.query.filter_by(username=user_name).first()
    if not user:
        return jsonify({'error': 'User not found: {}'.format(user_name)}), 404
    user_id = user.id  # 正确获取标量用户ID

    # 创建新消息记录
    new_message = Message(
        user_id=user_id,  # 使用标量值
        role='user',
        request_content=data['message'],
        response_content='',
        timestamp=datetime.utcnow()
    )
    db.session.add(new_message)
    db.session.commit()

    # 修正点：确保获取的是整型数值
    current_chat_num = get_user_message_max_chat_num(user_id) + 1
    tmp_content = anaylyze_promote.format(message, current_chat_num)

    # 检查对话轮次
    if current_chat_num >= 10:
        # 触发总结逻辑
        tmp_content = "请总结之前的对话并生成最终作文框架"
        try:
            response = Generation.call(
                model='qwen-turbo',
                messages=[{"role": "system", "content": tmp_content}] + user_conversations[user_id]
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

    # 正常处理对话
    try:
        response = Generation.call(
            model='qwen-turbo',
            messages=[{"role": "system", "content": tmp_content}] + user_conversations[user_id]
        )
        # 添加助手回复
        # 保存助手回复
        insert_message(user_id, 'assistant', current_chat_num, request_content=message, response_content=response.output.text)
        
        return jsonify({
            'status_code': response.status_code,
            'output': {
                'text': response.output.text,
                'current_round': len(user_conversations[user_id])
            }
        })
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

    # 获取用户提供的作文题目
    topic = data.get('topic')
    if not topic:
        return jsonify({'error': 'Missing topic parameter'}), 400

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

    # total_content = optimize_promote.format(topic, analysis, paragraph, get_user_message_max_chat_num(user_id) + 1)
    total_content = optimize_promote.format(topic, analysis, paragraph, 1)

    try:
        # 调用DeepSeek API进行优化
        response = Generation.call(
            model='qwen-turbo',
            messages=[
                {
                    'role': 'system',
                    'content': total_content
                }
            ]
        )

        # TODO: delete
        # 保存优化结果到数据库
        # insert_message(user_id, 'assistant', get_user_message_max_chat_num(user_id) + 1, paragraph, response.output.text)

        print("optimize api response: ", response)

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


if __name__ == '__main__':
    app.run(debug=True, port=5000)