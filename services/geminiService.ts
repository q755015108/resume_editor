
const API_BASE_URL = 'https://yunwu.ai/v1beta'; // 注意：你提供的地址有双斜杠，已修正
const MODEL_ID = 'gemini-3-flash-preview';

// 调用 yunwu.ai API
async function callYunwuAI(prompt: string, systemInstruction?: string, options?: {
  temperature?: number;
  responseMimeType?: string;
}) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const url = `${API_BASE_URL}/models/${MODEL_ID}:generateContent`;
  
  const requestBody: any = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{
        text: systemInstruction
      }]
    };
  }

  if (options?.temperature !== undefined) {
    requestBody.generationConfig = {
      temperature: options.temperature
    };
  }

  if (options?.responseMimeType) {
    if (!requestBody.generationConfig) {
      requestBody.generationConfig = {};
    }
    requestBody.generationConfig.responseMimeType = options.responseMimeType;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      error: errorData
    }));
  }

  const data = await response.json();
  
  // 解析响应
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    const text = data.candidates[0].content.parts[0].text;
    return text;
  }
  
  throw new Error("Invalid response format from API");
}

export async function polishContent(text: string, type: 'bullet' | 'summary' | 'education'): Promise<string> {
  if (!process.env.API_KEY) return text;
  
  const systemInstructions = {
    bullet: "你是一名资深的职业咨询顾问。请将以下简历描述进行专业化润色，使用具有结果导向（Result-oriented）的语言，多用量化词汇，保持语言精炼。直接输出文字，不要包含解释。",
    summary: "你是一名资深的职业咨询顾问。请将以下自我评价进行专业化润色，使其更具逻辑性，突显个人核心竞争力。保持在150字左右。",
    education: "润色教育背景描述，突显学术成就和核心技能。"
  };

  try {
    const result = await callYunwuAI(text, systemInstructions[type], {
      temperature: 0.7
    });
    return result?.trim() || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
}

export async function parseResumeFromText(rawText: string): Promise<any> {
  if (!process.env.API_KEY) throw new Error("API Key is missing");

  const systemInstruction = `你是一个简历解析器。你的任务是将简历文本转换为 JSON 格式。你必须只输出有效的 JSON 对象，不要任何解释、说明、代码块标记或其他文字。直接输出 JSON，不要使用 markdown 代码块。`;

  const prompt = `将以下简历文本转换为 JSON 格式：

${rawText}

输出要求：
- 个人信息：name（姓名）、objective（求职意向）是固定字段，其他信息放入 items 数组，每个项包含 id, label, value
- 教育经历：type="education", title="教育背景", iconName="GraduationCap", content 包含学校、专业、时间、GPA等
- 工作经历：type="experience", title="实习经历"或"工作经历", iconName="Briefcase", content 包含 organization, role, period, summary 和 points (subtitle, detail)
- 所有 ID 使用随机字符串
- 必须输出有效的 JSON 对象，不要任何其他文字

JSON 结构：
{"personal":{"name":"","objective":"","photo":"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=320&auto=format&fit=crop","items":[]},"pages":[{"id":"","sections":[]}]}`;

  try {
    // 检查 API Key
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing. Please check environment variable GEMINI_API_KEY.");
    }
    
    console.log("Calling Yunwu AI with model:", MODEL_ID);
    const responseText = await callYunwuAI(prompt, systemInstruction, {
      responseMimeType: "application/json",
      temperature: 0.1
    });

    if (!responseText) {
      throw new Error("API returned empty response");
    }

    // 清理响应文本，提取 JSON 部分
    let jsonText = responseText.trim();
    
    console.log("Raw API response:", jsonText.substring(0, 300)); // 打印前300个字符用于调试
    
    // 方法1: 如果响应被包裹在代码块中，提取出来
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      // 方法2: 查找第一个完整的 JSON 对象（从 { 开始到匹配的 } 结束）
      let braceCount = 0;
      let startIndex = -1;
      for (let i = 0; i < jsonText.length; i++) {
        if (jsonText[i] === '{') {
          if (startIndex === -1) startIndex = i;
          braceCount++;
        } else if (jsonText[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            jsonText = jsonText.substring(startIndex, i + 1);
            break;
          }
        }
      }
      
      // 方法3: 如果还是找不到，尝试正则匹配（贪婪匹配，找到最长的 JSON 对象）
      if (startIndex === -1 || braceCount !== 0) {
        // 从后往前找最后一个 }
        const lastBraceIndex = jsonText.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          // 从最后一个 } 往前找第一个 {
          const firstBraceIndex = jsonText.lastIndexOf('{', lastBraceIndex);
          if (firstBraceIndex !== -1) {
            jsonText = jsonText.substring(firstBraceIndex, lastBraceIndex + 1);
          }
        }
      }
    }
    
    // 移除可能的 markdown 格式标记和多余文本
    jsonText = jsonText.replace(/^\*\*.*?\*\*\s*/g, ''); // 移除 **Building** 这样的标记
    jsonText = jsonText.replace(/^```json\s*/g, ''); // 移除开头的 ```json
    jsonText = jsonText.replace(/```\s*$/g, ''); // 移除结尾的 ```
    jsonText = jsonText.trim();
    
    // 如果还是没有找到 JSON，尝试从第一个 { 开始提取
    if (!jsonText.startsWith('{')) {
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace !== -1) {
        jsonText = jsonText.substring(firstBrace);
        // 找到最后一个匹配的 }
        let braceCount = 0;
        let endIndex = -1;
        for (let i = 0; i < jsonText.length; i++) {
          if (jsonText[i] === '{') braceCount++;
          if (jsonText[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i;
              break;
            }
          }
        }
        if (endIndex !== -1) {
          jsonText = jsonText.substring(0, endIndex + 1);
        }
      }
    }

    console.log("Extracted JSON text:", jsonText.substring(0, 500)); // 打印前500个字符用于调试

    // 验证是否是有效的 JSON
    if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
      throw new Error(`API 返回的不是有效的 JSON 格式。返回内容: ${responseText.substring(0, 300)}...`);
    }

    const result = JSON.parse(jsonText);
    return result;
  } catch (error: any) {
    console.error("AI Parse Error Details:", error);
    
    // 提取详细的错误信息
    let errorMessage = "解析失败，请检查文本内容或 API Key 设置。";
    
    if (error?.message) {
      errorMessage += ` 错误详情: ${error.message}`;
    }
    
    if (error?.status || error?.statusCode) {
      errorMessage += ` 状态码: ${error.status || error.statusCode}`;
    }
    
    if (error?.response) {
      errorMessage += ` 响应: ${JSON.stringify(error.response)}`;
    }
    
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    throw new Error(errorMessage);
  }
}
