
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function polishContent(text: string, type: 'bullet' | 'summary' | 'education'): Promise<string> {
  if (!process.env.API_KEY) return text;
  
  const systemInstructions = {
    bullet: "你是一名资深的职业咨询顾问。请将以下简历描述进行专业化润色，使用具有结果导向（Result-oriented）的语言，多用量化词汇，保持语言精炼。直接输出文字，不要包含解释。",
    summary: "你是一名资深的职业咨询顾问。请将以下自我评价进行专业化润色，使其更具逻辑性，突显个人核心竞争力。保持在150字左右。",
    education: "润色教育背景描述，突显学术成就和核心技能。"
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: text,
      config: {
        systemInstruction: systemInstructions[type],
        temperature: 0.7,
      },
    });
    
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
}

export async function parseResumeFromText(rawText: string): Promise<any> {
  if (!process.env.API_KEY) throw new Error("API Key is missing");

  const prompt = `
    你是一个极其精准的简历信息提取引擎。请分析以下简历原始文本，将其转换为 JSON 结构。
    
    文本内容：
    """
    ${rawText}
    """

    规则：
    1. 识别个人信息。注意：姓名(name)和求职意向(objective)是固定字段，其他信息（如电话、邮箱、出生地、生日等）请全部放入 items 数组中，每个项包含 id, label, value。
    2. 教育经历(education)：提取学校、专业、时间、GPA等。
    3. 工作/项目经历(experience)：必须包含 organization, role, period, summary 和 points (带有 subtitle 和 detail)。
    4. 必须输出合法 JSON，所有 ID 使用随机字符串。
    
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
            { "id": "s1", "type": "education", "title": "教育背景", "iconName": "GraduationCap", "content": [...] },
            { "id": "s2", "type": "experience", "title": "实习经历", "iconName": "Briefcase", "content": [...] }
          ]
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("AI Parse Error:", error);
    throw error;
  }
}
