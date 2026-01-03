# 简历分析任务 - API 调用分析

## 📊 调用次数总结

**一次简历分析任务 = 1 次大模型 API 调用**

## 🔄 完整流程

### 用户操作流程
1. 用户选择模式（信息提取 / 智能优化）
2. 用户输入内容（文本/图片 + 可选的岗位描述）
3. 点击"生成简历"或"优化简历"按钮
4. 前端调用 `generateResumeContent()` 函数
5. 函数内部发起 **1 次** HTTP POST 请求到 Gemini API
6. 接收响应并解析 JSON
7. 更新前端界面

---

## 📥 输入（Request）

### API 端点
```
POST https://yunwu.ai/v1beta/models/gemini-3-flash-preview:generateContent
```

### 请求头
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer sk-JKj8yYYz1tXcUdug3Tn1ubd1esBwKaLmNMMdBHZT7Y4MCwP8"
}
```

### 请求体结构

#### 1. systemInstruction（系统指令）

**模式 A：信息提取模式**（当没有岗位描述时）
```typescript
{
  "systemInstruction": {
    "parts": [
      {
        "text": "你是一个极其精准的简历信息提取引擎。请分析以下简历原始文本或图片，将其转换为 JSON 结构。

规则：
1. 识别个人信息。注意：姓名(name)和求职意向(objective)是固定字段，其他信息（如电话、邮箱、出生地、生日等）请全部放入 items 数组中，每个项包含 id, label, value。
2. 教育经历(education)：提取学校、专业、时间、GPA等。
3. 工作/项目经历(experience)：必须包含 organization, role, period, summary 和 points (带有 subtitle 和 detail)。
4. 必须输出合法 JSON，所有 ID 使用随机字符串。
5. 严禁输出任何 Markdown 标签（如 ```json、**、# 等）。
6. 严禁输出任何解释性文字、思考过程或注释。
7. 只输出纯 JSON，第一行必须是 {，最后一行必须是 }。

输出 JSON 结构参考：
{...完整的JSON结构示例...}"
      }
    ]
  }
}
```

**模式 B：智能优化模式**（当有岗位描述时）
```typescript
{
  "systemInstruction": {
    "parts": [
      {
        "text": "你是一个专业的简历优化专家。请根据目标岗位描述，优化用户的简历内容，使其更匹配目标岗位。

规则：
1. 分析岗位描述中的关键要求（技能、经验、学历等）
2. 优化简历内容，突出与岗位匹配的部分
3. 调整求职意向(objective)使其更贴合目标岗位
4. 优化工作/项目经历描述，使用岗位描述中的关键词
5. 保持原有信息的真实性，只进行优化和调整
6. 必须输出合法 JSON，所有 ID 使用随机字符串
7. 严禁输出任何 Markdown 标签（如 ```json、**、# 等）
8. 严禁输出任何解释性文字、思考过程或注释
9. 只输出纯 JSON，第一行必须是 {，最后一行必须是 }"
      }
    ]
  }
}
```

#### 2. contents（用户输入内容）

**场景 1：纯文本输入（信息提取）**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "文本内容：\n\"\"\"\n姓名：张三\n学校：北京大学\n专业：计算机科学与技术\n...\n\"\"\"\n\n请按照规则提取并转换为 JSON 格式。"
        }
      ]
    }
  ]
}
```

**场景 2：图片输入（信息提取）**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "base64编码的图片数据..."
          }
        },
        {
          "text": "请识别图片中的简历内容，并按照规则提取并转换为 JSON 格式。\n\n补充信息：\n\"\"\"\n（如果有补充文本）\n\"\"\""
        }
      ]
    }
  ]
}
```

**场景 3：图片 + 文本（信息提取）**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "base64编码的图片数据..."
          }
        },
        {
          "text": "请识别图片中的简历内容，并按照规则提取并转换为 JSON 格式。\n\n补充信息：\n\"\"\"\n用户输入的补充文本\n\"\"\""
        }
      ]
    }
  ]
}
```

**场景 4：智能优化模式（文本 + 岗位描述）**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "当前简历内容：\n\"\"\"\n用户输入的简历内容\n\"\"\"\n\n目标岗位描述：\n\"\"\"\n用户输入的岗位描述\n\"\"\"\n\n请根据岗位描述优化简历内容，使其更匹配目标岗位。输出优化后的 JSON 格式。"
        }
      ]
    }
  ]
}
```

**场景 5：智能优化模式（图片 + 岗位描述）**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "base64编码的图片数据..."
          }
        },
        {
          "text": "当前简历内容：\n\"\"\"\n（从图片中识别）\n\"\"\"\n\n目标岗位描述：\n\"\"\"\n用户输入的岗位描述\n\"\"\"\n\n请根据岗位描述优化简历内容，使其更匹配目标岗位。输出优化后的 JSON 格式。"
        }
      ]
    }
  ]
}
```

#### 3. generationConfig（生成配置）
```json
{
  "generationConfig": {
    "temperature": 0.1,
    "topP": 0.95,
    "responseMimeType": "application/json",
    "maxOutputTokens": 16384,
    "thinkingBudget": 0
  }
}
```

---

## 📤 输出（Response）

### API 响应结构

#### 成功响应
```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "text": "{\"personal\":{\"name\":\"张三\",\"objective\":\"前端开发工程师\",...}}",
            "thought": false  // 或 true（如果有思考过程）
          }
        ]
      },
      "finishReason": "STOP",
      "safetyRatings": [...]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 1234,
    "candidatesTokenCount": 5678,
    "totalTokenCount": 6912
  }
}
```

#### 响应解析流程

1. **提取文本内容**
   - 从 `data.candidates[0].content.parts` 中查找 `thought: false` 的 part
   - 如果所有 part 都有 `thought: true`，使用最后一个 part
   - 提取 `part.text` 字段

2. **清理和修复 JSON**
   - 移除 `photo` 字段（照片由用户上传，不需要 AI 生成）
   - 移除 Markdown 代码块标记（```json、```）
   - 移除 Markdown 格式标记（**、*、#、`）
   - 提取第一个完整的 JSON 对象（从第一个 `{` 到匹配的最后一个 `}`）
   - 移除控制字符
   - 修复常见 JSON 错误（尾随逗号、缺失逗号等）

3. **解析 JSON**
   ```typescript
   const result = JSON.parse(cleanedJsonText);
   ```

4. **返回数据结构**
   ```typescript
   {
     "personal": {
       "name": "姓名",
       "objective": "求职意向",
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
             "content": [...]
           },
           {
             "id": "s2",
             "type": "experience",
             "title": "工作经历",
             "iconName": "Briefcase",
             "content": [...]
           }
         ]
       }
     ]
   }
   ```

---

## 📋 调用场景总结

| 场景 | 模式 | 输入类型 | API 调用次数 | 输入内容 |
|------|------|---------|-------------|---------|
| 1 | 信息提取 | 纯文本 | 1次 | 文本内容 |
| 2 | 信息提取 | 图片 | 1次 | 图片（base64） |
| 3 | 信息提取 | 图片+文本 | 1次 | 图片（base64）+ 补充文本 |
| 4 | 智能优化 | 文本+岗位描述 | 1次 | 简历文本 + 岗位描述 |
| 5 | 智能优化 | 图片+岗位描述 | 1次 | 图片（base64）+ 岗位描述 |

---

## 💡 关键点

1. **单次调用**：无论哪种场景，都只调用 1 次 API
2. **多模态支持**：支持文本和图片同时输入（在同一个请求中）
3. **模式切换**：通过 `systemInstruction` 和用户输入内容来区分信息提取和智能优化模式
4. **JSON 强制输出**：通过 `responseMimeType: 'application/json'` 强制输出 JSON 格式
5. **思考过程过滤**：通过 `thinkingBudget: 0` 禁用思考过程，但仍需在响应解析时过滤 `thought: true` 的 parts
6. **客户端修复**：由于 API 可能返回不完美的 JSON，在客户端进行了大量的清理和修复工作

---

## 🔧 优化建议

### 当前实现
- ✅ 单次调用，效率高
- ✅ 支持多模态输入
- ✅ 客户端有完善的错误处理和 JSON 修复机制

### 可能的优化方向
1. **缓存机制**：相同输入可以缓存结果
2. **流式输出**：如果 API 支持，可以使用流式输出提升用户体验
3. **重试机制**：API 调用失败时的自动重试
4. **部分解析**：如果完整 JSON 解析失败，尝试部分解析并返回可用数据

