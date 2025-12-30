
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

  const systemInstruction = `你是一个 JSON 生成器。你的唯一任务是输出有效的 JSON 对象。不要输出任何解释、说明、markdown 代码块、注释或其他文字。只输出纯 JSON，第一行必须是 {，最后一行必须是 }。`;

  // 构建完整的 JSON 示例
  const jsonExample = {
    personal: {
      name: "张三",
      objective: "财务助理",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=320&auto=format&fit=crop",
      items: [
        { id: "pi-1", label: "手机号码", value: "13000000000" },
        { id: "pi-2", label: "电子邮箱", value: "zhangsan@example.com" }
      ]
    },
    pages: [
      {
        id: "page-1",
        sections: [
          {
            id: "sec-1",
            type: "education",
            title: "教育背景",
            iconName: "GraduationCap",
            content: [
              {
                id: "edu-1",
                period: "2021.09-2025.06",
                school: "某某大学",
                major: "会计学专业",
                degree: "学士",
                gpa: "3.6"
              }
            ]
          },
          {
            id: "sec-2",
            type: "experience",
            title: "实习经历",
            iconName: "Briefcase",
            content: [
              {
                id: "exp-1",
                period: "2024.01-2024.06",
                organization: "某某公司",
                role: "财务助理",
                summary: "",
                points: [
                  {
                    id: "p1",
                    subtitle: "财务处理",
                    detail: "负责日常财务数据处理"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const prompt = `将以下简历文本转换为 JSON 格式。严格按照下面的 JSON 结构输出，不要添加任何解释文字。

简历文本：
${rawText}

必须输出的 JSON 结构（直接复制这个结构并填充数据）：
${JSON.stringify(jsonExample, null, 2)}

重要规则：
1. 只输出 JSON，不要任何其他文字
2. 第一行必须是 {
3. 最后一行必须是 }
4. 不要使用 markdown 代码块
5. 不要添加注释或解释`;

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
    console.log("Raw API response preview:", jsonText.substring(0, 2000)); // 打印前2000个字符用于调试
    
    // 方法1: 如果响应被包裹在代码块中，提取出来
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
      console.log("从代码块中提取 JSON");
    } else {
      // 方法2: 使用更智能的 JSON 提取 - 找到所有可能的 JSON 对象
      const jsonCandidates: Array<{text: string, score: number}> = [];
      
      // 找到所有 { 的位置
      const openBraces: number[] = [];
      for (let i = 0; i < jsonText.length; i++) {
        if (jsonText[i] === '{') {
          openBraces.push(i);
        }
      }
      
      console.log(`找到 ${openBraces.length} 个可能的 JSON 起始位置`);
      
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
          let score = 0;
          
          // 评分系统：符合要求的 JSON 得分更高
          // 1. 必须包含引号（说明是 JSON 格式）
          if (candidate.includes('"')) score += 10;
          // 2. 包含必要的字段
          if (candidate.includes('"personal"')) score += 30;
          if (candidate.includes('"pages"')) score += 30;
          if (candidate.includes('"name"')) score += 10;
          if (candidate.includes('"sections"')) score += 10;
          // 3. 长度要足够（至少 200 字符，说明是完整的 JSON）
          if (candidate.length > 200) score += 20;
          if (candidate.length > 500) score += 20;
          if (candidate.length > 1000) score += 20;
          // 4. 不能包含占位符
          if (!candidate.includes('{...}') && 
              !candidate.match(/\{[^}]*\.\.\.[^}]*\}/) &&
              !candidate.match(/\.\.\.[^}]*\}/)) {
            score += 10;
          }
          // 5. 包含数组结构（说明是完整的结构）
          if (candidate.includes('[') && candidate.includes(']')) score += 10;
          
          // 如果得分足够高，尝试预解析
          if (score >= 40) {
            try {
              JSON.parse(candidate);
              // 如果能解析，额外加分
              score += 100;
              jsonCandidates.push({text: candidate, score});
              console.log(`找到可解析的 JSON 候选，得分: ${score}, 长度: ${candidate.length}`);
            } catch (e) {
              // 不能解析，但可能可以修复，仍然加入候选
              jsonCandidates.push({text: candidate, score});
              console.log(`找到 JSON 候选（需修复），得分: ${score}, 长度: ${candidate.length}`);
            }
          }
        }
      }
      
      // 选择得分最高的候选 JSON
      if (jsonCandidates.length > 0) {
        jsonCandidates.sort((a, b) => b.score - a.score);
        jsonText = jsonCandidates[0].text;
        console.log(`选择了得分 ${jsonCandidates[0].score} 的 JSON 候选，长度: ${jsonText.length}`);
      } else {
        // 如果还是找不到，尝试从第一个 { 到最后一个 }
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = jsonText.substring(firstBrace, lastBrace + 1);
          console.log("使用第一个 { 到最后一个 } 之间的文本，长度:", jsonText.length);
        } else {
          // 如果连 { 和 } 都找不到，尝试在整个响应中搜索 JSON 关键字
          // 有时候 JSON 可能被埋在很多文字中
          const hasPersonal = jsonText.includes('"personal"') || jsonText.includes("personal");
          const hasPages = jsonText.includes('"pages"') || jsonText.includes("pages");
          
          if (hasPersonal || hasPages) {
            // 尝试找到包含这些关键字的最长 JSON 片段
            // 从包含 "personal" 的位置开始，向前找 {，向后找 }
            const personalIndex = jsonText.search(/["']personal["']/i);
            if (personalIndex !== -1) {
              // 向前找最近的 {
              let startIdx = personalIndex;
              while (startIdx > 0 && jsonText[startIdx] !== '{') {
                startIdx--;
              }
              // 向后找匹配的 }
              if (jsonText[startIdx] === '{') {
                let braceCount = 0;
                let endIdx = startIdx;
                for (let i = startIdx; i < jsonText.length; i++) {
                  if (jsonText[i] === '{') braceCount++;
                  if (jsonText[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      endIdx = i;
                      break;
                    }
                  }
                }
                if (endIdx > startIdx) {
                  jsonText = jsonText.substring(startIdx, endIdx + 1);
                  console.log("通过关键字搜索找到 JSON，长度:", jsonText.length);
                }
              }
            }
          }
          
          // 如果还是找不到，抛出错误
          if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
            throw new Error(`API 响应中没有找到有效的 JSON 对象。响应内容: ${responseText.substring(0, 1000)}...`);
          }
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
    if (!jsonText || !jsonText.startsWith('{') || !jsonText.endsWith('}')) {
      // 如果提取的文本不是以 { 开头，尝试找到第一个 {
      if (!jsonText.startsWith('{')) {
        const firstBrace = jsonText.indexOf('{');
        if (firstBrace !== -1) {
          jsonText = jsonText.substring(firstBrace);
          // 找到匹配的最后一个 }
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
      
      // 再次验证
      if (!jsonText || !jsonText.startsWith('{') || !jsonText.endsWith('}')) {
        throw new Error(`API 返回的不是有效的 JSON 格式。返回内容: ${responseText.substring(0, 500)}...`);
      }
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
