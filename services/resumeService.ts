// API 地址
const API_URL = 'https://yunwu.ai/v1beta/models/gemini-3-flash-preview:generateContent';
const API_KEY = 'sk-JKj8yYYz1tXcUdug3Tn1ubd1esBwKaLmNMMdBHZT7Y4MCwP8';

// 调用 API 生成简历内容
export async function generateResumeContent(userInput: string): Promise<any> {
  const systemInstruction = `你是一个专业的简历生成助手。根据用户提供的基本信息，生成一份完整的简历数据。

要求：
1. 必须只输出有效的 JSON 格式，不要包含任何 Markdown 标签或解释性文字
2. 根据用户提供的信息，智能填充以下字段：
   - 个人信息（姓名、求职意向、联系方式等）
   - 教育背景（学校、专业、时间、GPA等）
   - 工作/实习经历（公司、职位、时间、工作内容等）
3. 如果用户信息不足，可以合理补充一些示例内容
4. 所有 ID 使用随机字符串
5. 工作经历要包含详细的要点描述

输出 JSON 结构：
{
  "personal": {
    "name": "姓名",
    "objective": "求职意向",
    "photo": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=320&auto=format&fit=crop",
    "items": [
      { "id": "1", "label": "手机号码", "value": "xxx" },
      { "id": "2", "label": "电子邮箱", "value": "xxx" }
    ]
  },
  "pages": [
    {
      "id": "p1",
      "sections": [
        {
          "id": "s1",
          "type": "education",
          "title": "教育背景",
          "iconName": "GraduationCap",
          "content": [
            {
              "id": "e1",
              "period": "2021.09-2025.06",
              "school": "学校名称",
              "major": "专业名称",
              "degree": "学士",
              "gpa": "3.6",
              "courses": "主要课程"
            }
          ]
        },
        {
          "id": "s2",
          "type": "experience",
          "title": "工作经历",
          "iconName": "Briefcase",
          "content": [
            {
              "id": "exp1",
              "period": "2024.01-2024.06",
              "organization": "公司名称",
              "role": "职位名称",
              "summary": "工作总述",
              "points": [
                {
                  "id": "p1",
                  "subtitle": "工作要点1",
                  "detail": "详细描述"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: systemInstruction
        }
      ]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `请根据以下信息生成简历：\n\n${userInput}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      responseMimeType: 'application/json'
    }
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 解析响应
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      
      // 提取 JSON（可能被包裹在代码块中）
      let jsonText = text.trim();
      
      // 移除可能的 markdown 代码块标记
      jsonText = jsonText.replace(/^```json\s*/g, '');
      jsonText = jsonText.replace(/^```\s*/g, '');
      jsonText = jsonText.replace(/```\s*$/g, '');
      jsonText = jsonText.trim();
      
      // 提取第一个完整的 JSON 对象
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      // 解析 JSON
      const result = JSON.parse(jsonText);
      return result;
    }
    
    throw new Error('API 返回格式不正确');
  } catch (error: any) {
    console.error('生成简历失败:', error);
    throw new Error(error.message || '生成简历失败，请稍后重试');
  }
}

