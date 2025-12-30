
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

  const systemInstruction = `你是一个简历解析器。你的任务是将简历文本转换为 JSON 格式。你必须只输出有效的 JSON 对象，不要任何解释、说明、代码块标记或其他文字。直接输出 JSON，不要使用 markdown 代码块。输出的第一行必须是 {，最后一行必须是 }。`;

  const prompt = `将以下简历文本转换为 JSON 格式。只输出 JSON，不要任何解释。

简历文本：
${rawText}

要求：
1. 个人信息：name（姓名）、objective（求职意向）是固定字段，其他信息放入 items 数组，每个项包含 id, label, value
2. 教育经历：type="education", title="教育背景", iconName="GraduationCap", content 包含学校、专业、时间、GPA等
3. 工作经历：type="experience", title="实习经历"或"工作经历", iconName="Briefcase", content 包含 organization, role, period, summary 和 points (subtitle, detail)
4. 所有 ID 使用随机字符串
5. 必须输出有效的 JSON 对象，第一行必须是 {，最后一行必须是 }

输出格式示例：
{"personal":{"name":"张三","objective":"财务助理","photo":"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=320&auto=format&fit=crop","items":[{"id":"pi-1","label":"手机号码","value":"13000000000"}]},"pages":[{"id":"page-1","sections":[{"id":"sec-1","type":"education","title":"教育背景","iconName":"GraduationCap","content":[]}]}]}`;

  try {
    // 检查 API Key
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing. Please check environment variable GEMINI_API_KEY.");
    }
    
    console.log("Calling Yunwu AI with model:", MODEL_ID);
    const responseText = await callYunwuAI(prompt, systemInstruction, {
      responseMimeType: "application/json",
      temperature: 0  // 降低到 0 以获得更确定性的输出
    });

    if (!responseText) {
      throw new Error("API returned empty response");
    }

    // 清理响应文本，提取 JSON 部分
    let jsonText = responseText.trim();
    
    console.log("Raw API response length:", jsonText.length);
    console.log("Raw API response preview:", jsonText.substring(0, 500)); // 打印前500个字符用于调试
    
    // 方法1: 如果响应被包裹在代码块中，提取出来
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      // 方法2: 使用更智能的 JSON 提取 - 找到所有可能的 JSON 对象，选择最长的
      const jsonCandidates: string[] = [];
      
      // 找到所有 { 的位置
      const openBraces: number[] = [];
      for (let i = 0; i < jsonText.length; i++) {
        if (jsonText[i] === '{') {
          openBraces.push(i);
        }
      }
      
      // 对每个 {，尝试找到匹配的 }
      for (const startIndex of openBraces) {
        let braceCount = 0;
        let endIndex = -1;
        for (let i = startIndex; i < jsonText.length; i++) {
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
          const candidate = jsonText.substring(startIndex, endIndex + 1);
          // 验证是否是有效的 JSON
          // 1. 必须包含引号（说明是 JSON 格式）
          // 2. 不能包含占位符如 {...} 或 ...
          // 3. 长度要足够（至少 50 字符）
          if (candidate.includes('"') && 
              candidate.length > 50 &&
              !candidate.includes('{...}') &&
              !candidate.match(/\{[^}]*\.\.\.[^}]*\}/) &&
              !candidate.match(/\.\.\.[^}]*\}/)) {
            // 尝试预解析，确保是有效的 JSON
            try {
              JSON.parse(candidate);
              jsonCandidates.push(candidate);
            } catch (e) {
              // 不是有效的 JSON，跳过
            }
          }
        }
      }
      
      // 选择最长的候选 JSON（通常是最完整的）
      if (jsonCandidates.length > 0) {
        jsonCandidates.sort((a, b) => b.length - a.length);
        jsonText = jsonCandidates[0];
      } else {
        // 如果还是找不到，尝试从第一个 { 到最后一个 }
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }
      }
    }
    
    // 移除可能的 markdown 格式标记和多余文本
    jsonText = jsonText.replace(/^\*\*.*?\*\*\s*/g, ''); // 移除 **Building** 这样的标记
    jsonText = jsonText.replace(/^```json\s*/g, ''); // 移除开头的 ```json
    jsonText = jsonText.replace(/```\s*$/g, ''); // 移除结尾的 ```
    jsonText = jsonText.trim();
    
    // 移除占位符（如 {...} 或 ...）
    jsonText = jsonText.replace(/\{[^}]*\.\.\.[^}]*\}/g, '{}'); // 替换 {...} 为 {}
    jsonText = jsonText.replace(/\.\.\.[^}]*\}/g, '}'); // 移除 ...} 这样的占位符

    console.log("Extracted JSON text length:", jsonText.length);
    console.log("Extracted JSON text preview:", jsonText.substring(0, 1000)); // 打印前1000个字符用于调试

    // 验证是否是有效的 JSON
    if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
      throw new Error(`API 返回的不是有效的 JSON 格式。返回内容: ${responseText.substring(0, 500)}...`);
    }
    
    // 验证 JSON 格式：检查基本的 JSON 结构
    if (!jsonText.includes('"personal"') || !jsonText.includes('"pages"')) {
      console.warn("警告：提取的 JSON 可能不完整，缺少必要的字段");
    }

    // 尝试解析 JSON，如果失败会抛出更详细的错误
    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError: any) {
      // 如果解析失败，尝试修复常见的 JSON 错误
      let fixedJson = jsonText;
      
      console.log("开始修复 JSON...");
      
      // 修复步骤1: 移除尾随逗号
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
      
      // 修复步骤2: 修复数组元素之间缺少逗号的问题
      // 匹配模式：] 后面直接跟 } 或 ]，中间可能有空白和换行
      // 这种情况通常意味着数组元素之间缺少逗号
      fixedJson = fixedJson.replace(/\](\s*)\}/g, ']$1}');
      fixedJson = fixedJson.replace(/\](\s*)\]/g, ']$1]');
      
      // 修复步骤3: 在对象或数组结束后，如果后面跟着另一个对象/数组，添加逗号
      // 匹配：} 或 ] 后面跟着 { 或 [，中间只有空白
      fixedJson = fixedJson.replace(/([}\]])(\s+)([{\[])/g, '$1,$2$3');
      
      // 修复步骤4: 修复数组元素之间缺少逗号（更精确的匹配）
      // 匹配：} 后面跟着 {，中间只有空白和换行，且都在数组内
      fixedJson = fixedJson.replace(/(\})\s*(\{)/g, (match, p1, p2, offset, string) => {
        // 检查这个 } 和 { 是否在同一个数组内
        const before = string.substring(0, offset);
        const after = string.substring(offset);
        const openBracesBefore = (before.match(/\{/g) || []).length;
        const closeBracesBefore = (before.match(/\}/g) || []).length;
        const openBracketsBefore = (before.match(/\[/g) || []).length;
        const closeBracketsBefore = (before.match(/\]/g) || []).length;
        
        // 如果 } 和 { 的数量不平衡，说明它们在同一个数组内
        if (openBracketsBefore > closeBracketsBefore) {
          return p1 + ',' + p2;
        }
        return match;
      });
      
      // 修复步骤5: 修复对象属性之间缺少逗号
      // 匹配：} 后面跟着 "，中间只有空白
      fixedJson = fixedJson.replace(/(\})\s*(")/g, '$1,$2');
      
      try {
        result = JSON.parse(fixedJson);
        console.log("JSON 修复成功");
      } catch (fixError: any) {
        // 如果修复后还是失败，尝试更激进的方法
        console.log("第一次修复失败，尝试更激进的修复...");
        
        // 更激进的修复：在 ] 和 } 之间添加逗号（如果它们在同一层级）
        let aggressiveFix = fixedJson;
        aggressiveFix = aggressiveFix.replace(/(\])\s*(\})/g, '$1,$2');
        aggressiveFix = aggressiveFix.replace(/(\})\s*(\[)/g, '$1,$2');
        
        try {
          result = JSON.parse(aggressiveFix);
          console.log("激进修复成功");
        } catch (aggressiveError: any) {
          // 如果还是失败，显示详细的错误信息
          const errorPosition = parseError.message.match(/position (\d+)/);
          if (errorPosition) {
            const pos = parseInt(errorPosition[1]);
            const start = Math.max(0, pos - 100);
            const end = Math.min(jsonText.length, pos + 100);
            const context = jsonText.substring(start, end);
            const lines = context.split('\n');
            const lineNumber = jsonText.substring(0, pos).split('\n').length;
            
            throw new Error(`JSON 解析失败: ${parseError.message}。\n错误位置: 第 ${lineNumber} 行，位置 ${pos}\n错误附近的文本:\n${context}`);
          } else {
            throw new Error(`JSON 解析失败: ${parseError.message}。提取的文本前500字符: ${jsonText.substring(0, 500)}...`);
          }
        }
      }
    }
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
