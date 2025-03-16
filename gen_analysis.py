import dashscope
from dashscope import Generation

# 设置你的阿里云 DashScope API 密钥
dashscope.api_key = 'sk-d998dcc59c7349be944c4ca2aabcb6f2'

def get_essay_analysis_and_framework(topic):
    prompt = "请对考研英语作文题目 '{}' 进行解读，并给出作文框架。".format(topic)
    try:
        response = Generation.call(
            model='qwen-turbo',
            prompt=prompt
        )
        if response.status_code == 200:
            return response.output.text.strip()
        else:
            return f"调用失败，状态码: {response.status_code}, 错误信息: {response.code}"
    except Exception as e:
        return f"发生错误: {e}"

if __name__ == "__main__":
    topic = input("请输入考研英语作文题目: ")
    result = get_essay_analysis_and_framework(topic)
    print(result)