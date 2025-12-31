// API 地址
const API_URL = 'https://yunwu.ai/v1beta/models/gemini-3-flash-preview:generateContent';
const API_KEY = 'sk-JKj8yYYz1tXcUdug3Tn1ubd1esBwKaLmNMMdBHZT7Y4MCwP8';

// 调用 API 生成简历内容
export async function generateResumeContent(userInput: string): Promise<any> {
  const systemInstruction = `你是一个极其精准的简历信息提取引擎。请分析以下简历原始文本，将其转换为 JSON 结构。

规则：
1. 识别个人信息。注意：姓名(name)和求职意向(objective)是固定字段，其他信息（如电话、邮箱、出生地、生日等）请全部放入 items 数组中，每个项包含 id, label, value。
2. 教育经历(education)：提取学校、专业、时间、GPA等。
3. 工作/项目经历(experience)：必须包含 organization, role, period, summary 和 points (带有 subtitle 和 detail)。
4. 必须输出合法 JSON，所有 ID 使用随机字符串。
5. 严禁输出任何 Markdown 标签（如 \`\`\`json、**、# 等）。
6. 严禁输出任何解释性文字、思考过程或注释。
7. 只输出纯 JSON，第一行必须是 {，最后一行必须是 }。

输出 JSON 结构参考：
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
            text: `文本内容：\n"""\n${userInput}\n"""\n\n请按照规则提取并转换为 JSON 格式。`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,  // 降低温度，更严格遵循指令
      topP: 0.95,
      responseMimeType: 'application/json',  // 强制 JSON 格式
      maxOutputTokens: 16384,  // 确保有足够空间输出完整 JSON
      thinkingBudget: 0  // 禁用思考过程，直接输出结果
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
    
    // 调试：打印完整的 API 响应结构
    console.log('=== API 完整响应结构 ===');
    console.log('响应 keys:', Object.keys(data));
    console.log('candidates 数量:', data.candidates?.length);
    if (data.candidates && data.candidates[0]) {
      console.log('candidate[0] keys:', Object.keys(data.candidates[0]));
      console.log('candidate[0] 完整内容:', JSON.stringify(data.candidates[0], null, 2));
    }
    console.log('========================');
    
    // 解析响应
    if (data.candidates && data.candidates[0]) {
      // 检查是否有思考过程（thinking）
      let text = '';
      
      // 优先获取 content，如果没有则尝试获取其他字段
      if (data.candidates[0].content && data.candidates[0].content.parts) {
        const parts = data.candidates[0].content.parts;
        console.log('parts 数量:', parts.length);
        
        // 遍历所有 parts，找到非思考过程的文本（thought: false 或没有 thought 字段）
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          console.log(`part[${i}]:`, {
            hasText: !!part.text,
            textLength: part.text?.length || 0,
            thought: part.thought,
            textPreview: part.text?.substring(0, 100)
          });
          
          // 如果这个 part 不是思考过程（thought 为 false 或 undefined），使用它
          if (part.text && (part.thought === false || part.thought === undefined)) {
            text = part.text;
            console.log(`✅ 找到非思考过程的文本，使用 part[${i}]`);
            break;
          }
        }
        
        // 如果没找到非思考过程的文本，尝试使用最后一个 part（通常是实际输出）
        if (!text && parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          if (lastPart.text) {
            text = lastPart.text;
            console.log('⚠️ 使用最后一个 part 作为文本');
          }
        }
        
        // 如果还是没找到，使用第一个 part（向后兼容）
        if (!text && parts.length > 0 && parts[0].text) {
          text = parts[0].text;
          console.log('⚠️ 使用第一个 part 作为文本');
        }
      }
      
      // 检查是否有 groundingMetadata 或其他字段包含 JSON
      if (!text && data.candidates[0].groundingMetadata) {
        console.log('找到 groundingMetadata:', data.candidates[0].groundingMetadata);
      }
      
      // 检查是否有其他可能的文本字段
      if (!text) {
        // 尝试查找所有可能的文本字段
        const candidate = data.candidates[0];
        for (const key in candidate) {
          if (typeof candidate[key] === 'string' && candidate[key].length > 100) {
            console.log(`找到可能的文本字段 ${key}:`, candidate[key].substring(0, 200));
            text = candidate[key];
            break;
          }
        }
      }
      
      // 如果响应中包含思考过程，尝试提取实际的 JSON
      // 思考过程通常在 "Thought Process" 或类似标记之后
      // 实际的 JSON 可能在响应的后半部分
      
      // 如果文本包含思考过程标记，尝试找到 JSON 部分
      if (text.includes('Thought Process') || text.includes('**Thought')) {
        // 尝试找到 JSON 部分：查找最后一个 { 开始的内容
        const lastBraceIndex = text.lastIndexOf('{');
        if (lastBraceIndex !== -1) {
          // 从最后一个 { 开始提取
          text = text.substring(lastBraceIndex);
        } else {
          // 如果找不到 {，尝试查找 JSON 关键字
          const jsonKeywords = ['"personal"', '"pages"', '"name"'];
          for (const keyword of jsonKeywords) {
            const keywordIndex = text.indexOf(keyword);
            if (keywordIndex !== -1) {
              // 向前查找最近的 {
              let braceIndex = keywordIndex;
              while (braceIndex > 0 && text[braceIndex] !== '{') {
                braceIndex--;
              }
              if (braceIndex >= 0 && text[braceIndex] === '{') {
                text = text.substring(braceIndex);
                break;
              }
            }
          }
        }
      }
      
      if (!text) {
        throw new Error('API 响应中没有找到文本内容');
      }
      
      // 调试：打印完整的 API 响应
      console.log('=== API 完整响应 ===');
      console.log('响应长度:', text.length);
      console.log('前500字符:', text.substring(0, 500));
      console.log('后500字符:', text.substring(Math.max(0, text.length - 500)));
      console.log('包含 ** 标记:', text.includes('**'));
      console.log('包含 ``` 标记:', text.includes('```'));
      console.log('包含 JSON 代码块:', text.includes('```json'));
      console.log('第一个 { 位置:', text.indexOf('{'));
      console.log('最后一个 } 位置:', text.lastIndexOf('}'));
      console.log('==================');
      
      // 提取 JSON（可能被包裹在代码块中或包含 Markdown）
      let jsonText = text.trim();
      
      // 方法0: 完全移除 photo 字段（照片由用户上传，AI 返回的 photo 字段完全不需要）
      // 使用最简单直接的方法：找到 "photo": 然后删除到下一个字段之前的所有内容
      // 先处理完整的 photo 字段（有闭合引号和逗号）
      jsonText = jsonText.replace(/"photo"\s*:\s*"[^"]*"\s*,?\s*/g, '');
      // 再处理被截断的 photo 字段（没有闭合引号，直接到 "items"）
      jsonText = jsonText.replace(/"photo"\s*:\s*"https:[^"]*?(?=\s*"items")/g, '');
      jsonText = jsonText.replace(/"photo"\s*:\s*"[^"]*?(?=\s*"items"|\s*"pages"|,|\n|\})/g, '');
      // 最后处理任何剩余的 photo 字段
      jsonText = jsonText.replace(/"photo"\s*:\s*[^,}\n]+/g, '');
      
      // 方法1: 移除可能的 markdown 代码块标记
      jsonText = jsonText.replace(/^```json\s*/g, '');
      jsonText = jsonText.replace(/^```\s*/g, '');
      jsonText = jsonText.replace(/```\s*$/g, '');
      jsonText = jsonText.trim();
      
      // 方法2: 移除 Markdown 格式标记（**、*、# 等）
      jsonText = jsonText.replace(/\*\*/g, ''); // 移除 **加粗**
      jsonText = jsonText.replace(/\*([^*]+)\*/g, '$1'); // 移除 *斜体*
      jsonText = jsonText.replace(/^#+\s*/gm, ''); // 移除标题标记
      jsonText = jsonText.replace(/`([^`]+)`/g, '$1'); // 移除行内代码
      
      // 方法3: 提取第一个完整的 JSON 对象
      // 如果响应包含思考过程，尝试找到 JSON 部分
      // 思考过程通常以 "Thought Process" 或类似标记开始
      if (jsonText.includes('Thought Process') || jsonText.includes('**Thought')) {
        // 尝试找到 JSON 关键字，然后向前查找 {
        const jsonKeywords = ['"personal"', '"pages"', '"name"', '"objective"'];
        let jsonStartIndex = -1;
        
        for (const keyword of jsonKeywords) {
          const keywordIndex = jsonText.indexOf(keyword);
          if (keywordIndex !== -1) {
            // 向前查找最近的 {
            let braceIndex = keywordIndex;
            while (braceIndex > 0 && jsonText[braceIndex] !== '{') {
              braceIndex--;
            }
            if (braceIndex >= 0 && jsonText[braceIndex] === '{') {
              jsonStartIndex = braceIndex;
              break;
            }
          }
        }
        
        if (jsonStartIndex !== -1) {
          jsonText = jsonText.substring(jsonStartIndex);
        } else {
          // 如果找不到关键字，尝试找到最后一个 {
          const lastBrace = jsonText.lastIndexOf('{');
          if (lastBrace !== -1) {
            jsonText = jsonText.substring(lastBrace);
          }
        }
      }
      
      // 找到第一个 { 的位置
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace === -1) {
        // 如果还是找不到，尝试查找其他可能的 JSON 标记
        const possibleJsonStart = jsonText.search(/\{[^}]*"personal"/);
        if (possibleJsonStart !== -1) {
          jsonText = jsonText.substring(possibleJsonStart);
        } else {
          throw new Error('响应中没有找到 JSON 对象。响应内容：' + jsonText.substring(0, 200));
        }
      }
      
      // 从第一个 { 开始，找到匹配的最后一个 }
      // 注意：这里要找的是最外层的闭合括号，不是第一个匹配的
      let braceCount = 0;
      let lastBrace = -1;
      for (let i = firstBrace; i < jsonText.length; i++) {
        if (jsonText[i] === '{') braceCount++;
        if (jsonText[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            lastBrace = i;
            break;
          }
        }
      }
      
      if (lastBrace === -1) {
        // 如果找不到匹配的闭合括号，尝试使用最后一个 }
        lastBrace = jsonText.lastIndexOf('}');
        if (lastBrace === -1) {
          throw new Error('JSON 对象不完整，缺少闭合括号');
        }
        console.warn('⚠️ 未找到匹配的闭合括号，使用最后一个 }');
      }
      
      const extractedJson = jsonText.substring(firstBrace, lastBrace + 1);
      console.log('提取的 JSON 长度:', extractedJson.length);
      console.log('提取的 JSON 前200字符:', extractedJson.substring(0, 200));
      console.log('提取的 JSON 后200字符:', extractedJson.substring(Math.max(0, extractedJson.length - 200)));
      jsonText = extractedJson;
      
      // 方法4: 清理可能的注释和多余内容
      // 移除 JSON 中不应该存在的注释（虽然标准 JSON 不支持注释）
      jsonText = jsonText.replace(/\/\/.*$/gm, ''); // 移除单行注释
      jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, ''); // 移除多行注释
      
      // 方法5: 清理控制字符和修复常见问题
      // 移除控制字符（除了必要的空白字符）
      jsonText = jsonText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // 修复常见的 JSON 错误
      // 1. 移除尾随逗号
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
      
      // 2. 修复单引号为双引号（仅在键和字符串值中，但要小心处理已经转义的引号）
      // 先处理已经转义的单引号
      jsonText = jsonText.replace(/\\'/g, '__ESCAPED_SINGLE_QUOTE__');
      // 然后替换未转义的单引号
      jsonText = jsonText.replace(/'/g, '"');
      // 恢复转义的单引号
      jsonText = jsonText.replace(/__ESCAPED_SINGLE_QUOTE__/g, "\\'");
      
      // 3. 修复可能的换行符在字符串中（应该转义为 \n）
      // 这个比较复杂，先尝试解析，如果失败再处理
      
      // 方法6: 尝试解析，如果失败则尝试修复
      let result;
      try {
        result = JSON.parse(jsonText);
      } catch (parseError: any) {
        console.warn('JSON 解析失败，尝试修复...', parseError.message);
        
        // 尝试找到错误位置
        let errorPos = -1;
        const errorMatch = parseError.message.match(/position (\d+)/);
        if (errorMatch) {
          errorPos = parseInt(errorMatch[1]);
          const start = Math.max(0, errorPos - 100);
          const end = Math.min(jsonText.length, errorPos + 100);
          console.warn('错误位置附近的文本:', jsonText.substring(start, end));
        }
        
        // 尝试修复常见问题
        try {
          let fixedJson = jsonText;
          
          // 1. 完全移除 photo 字段（照片由用户上传，AI 返回的 photo 字段完全不需要）
          fixedJson = fixedJson.replace(/"photo"\s*:\s*"[^"]*"\s*,?\s*/g, ''); // 完整的 photo 字段
          fixedJson = fixedJson.replace(/"photo"\s*:\s*"[^"]*?(?=\s*"items"|\s*"pages"|,|\n|\})/g, ''); // 被截断的 photo 字段
          fixedJson = fixedJson.replace(/"photo"\s*:\s*[^,}\n]+\s*,?\s*/g, ''); // 任何其他格式的 photo 字段
          
          // 3. 移除所有控制字符（除了必要的空白字符）
          fixedJson = fixedJson.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
          
          // 4. 修复可能的尾随逗号
          fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
          
          // 5. 修复可能的缺失逗号
          fixedJson = fixedJson.replace(/(\})\s*(\{)/g, '$1,$2');
          fixedJson = fixedJson.replace(/(\})\s*(")/g, '$1,$2');
          fixedJson = fixedJson.replace(/(\])\s*(\{)/g, '$1,$2');
          
          // 6. 修复字符串值中的未转义换行符
          fixedJson = fixedJson.replace(/(:\s*")([^"]*?)(\n)([^"]*?)(")/g, (match, p1, p2, p3, p4, p5) => {
            // 将字符串中的换行符转义
            return p1 + p2 + '\\n' + p4 + p5;
          });
          
          result = JSON.parse(fixedJson);
          console.log('✅ JSON 修复成功');
        } catch (secondError: any) {
          console.warn('JSON 修复失败，尝试部分解析...', secondError.message);
          
          // 如果修复失败，尝试提取部分可用数据
          try {
            // 尝试提取 personal 部分
            const personalMatch = jsonText.match(/"personal"\s*:\s*\{([^}]*"name"[^}]*"objective"[^}]*"items"[^\}]*)\}/);
            const pagesMatch = jsonText.match(/"pages"\s*:\s*\[([\s\S]*)\]/);
            
            if (personalMatch || pagesMatch) {
              // 构建一个最小可用的 JSON 结构
              result = {
                personal: {
                  name: jsonText.match(/"name"\s*:\s*"([^"]+)"/)?.[1] || data.personal?.name || '姓名',
                  objective: jsonText.match(/"objective"\s*:\s*"([^"]+)"/)?.[1] || data.personal?.objective || '',
                  photo: jsonText.match(/"photo"\s*:\s*"([^"]+)"/)?.[1] || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=320&auto=format&fit=crop',
                  items: []
                },
                pages: data.pages || []
              };
              
              // 尝试提取 items
              const itemsMatch = jsonText.match(/"items"\s*:\s*\[([\s\S]*?)\]/);
              if (itemsMatch) {
                try {
                  const itemsJson = '[' + itemsMatch[1] + ']';
                  result.personal.items = JSON.parse(itemsJson);
                } catch (e) {
                  console.warn('无法解析 items，使用空数组');
                }
              }
              
              // 尝试提取 pages（简化处理）
              if (pagesMatch) {
                try {
                  // 只提取第一个 page 的基本结构
                  const firstPageMatch = jsonText.match(/"pages"\s*:\s*\[\s*\{([\s\S]*?)\}\s*\]/);
                  if (firstPageMatch) {
                    // 这里可以进一步解析，但为了简单起见，先返回基本结构
                    result.pages = data.pages || [{
                      id: 'page-1',
                      sections: []
                    }];
                  }
                } catch (e) {
                  console.warn('无法解析 pages，使用现有数据');
                }
              }
              
              console.log('⚠️ 使用部分解析结果，部分数据可能不完整');
              return result;
            }
          } catch (partialError: any) {
            console.error('部分解析也失败:', partialError);
          }
          
          // 如果所有方法都失败，至少返回一个基本结构，不抛错
          console.warn('⚠️ JSON 解析完全失败，返回空结构');
          result = {
            personal: {
              ...data.personal,
              name: jsonText.match(/"name"\s*:\s*"([^"]+)"/)?.[1] || data.personal.name,
              objective: jsonText.match(/"objective"\s*:\s*"([^"]+)"/)?.[1] || data.personal.objective
            },
            pages: data.pages || []
          };
        }
      }
      
      return result;
    }
    
    throw new Error('API 返回格式不正确：没有找到 candidates');
  } catch (error: any) {
    console.error('生成简历失败:', error);
    throw new Error(error.message || '生成简历失败，请稍后重试');
  }
}

