
import React, { useState } from 'react';
import { ResumeData, ResumeSection, EducationItem, ExperienceItem, SectionType, ResumePage, ExperiencePoint, PersonalInfoItem } from '../types';
import { 
  Plus, Trash2, Sparkles, Briefcase, 
  GraduationCap, User as UserIcon, ArrowUp, ArrowDown, 
  Wand2, X, Loader2, CopyPlus, GripVertical, FileText, Send, Upload, Image as ImageIcon
} from 'lucide-react';
import { generateResumeContent } from '../services/resumeService';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [isAutoFillOpen, setIsAutoFillOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [mode, setMode] = useState<'extract' | 'optimize'>('extract'); // 'extract': 信息提取, 'optimize': 智能优化
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const handleAutoFill = async () => {
    // 验证输入
    if (mode === 'extract') {
      if (!userInput.trim() && !uploadedImage) {
        setGenerateError('请上传简历图片或输入基本信息');
        return;
      }
    } else {
      if (!userInput.trim() && !uploadedImage) {
        setGenerateError('请上传简历图片或输入当前简历内容');
        return;
      }
      if (!jobDescription.trim()) {
        setGenerateError('请输入目标岗位描述');
        return;
      }
    }

    setIsGenerating(true);
    setGenerateError('');

    try {
      const generatedData = await generateResumeContent(
        userInput, 
        uploadedImage || undefined,
        mode === 'optimize' ? jobDescription : undefined
      );
      
      if (generatedData) {
        // 合并生成的数据，但忽略 photo（照片由用户上传）
        const { photo, ...personalWithoutPhoto } = generatedData.personal || {};
        onChange({
          ...data,
          personal: {
            ...data.personal,
            ...personalWithoutPhoto,
            // 保留用户已有的照片，如果没有则使用默认值
            photo: data.personal.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=320&auto=format&fit=crop',
            items: generatedData.personal?.items || data.personal.items
          },
          pages: generatedData.pages || data.pages
        });
        
        setIsAutoFillOpen(false);
        setUserInput('');
        setJobDescription('');
        setUploadedImage(null);
      }
    } catch (err: any) {
      setGenerateError(err.message || '生成失败，请稍后重试');
      console.error('生成简历失败:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUploadForOCR = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小（限制为 10MB，OCR需要更大的图片）
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }

    // 读取文件并转换为 base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setUploadedImage(result);
      }
    };
    reader.onerror = () => {
      alert('图片读取失败，请重试');
    };
    reader.readAsDataURL(file);
  };

  const updatePersonalField = (field: 'name' | 'objective' | 'photo', value: string) => {
    onChange({ ...data, personal: { ...data.personal, [field]: value } });
  };

  const updatePersonalInfoItem = (id: string, field: 'label' | 'value', val: string) => {
    const newItems = data.personal.items.map(item => 
      item.id === id ? { ...item, [field]: val } : item
    );
    onChange({ ...data, personal: { ...data.personal, items: newItems } });
  };

  const addPersonalInfoItem = () => {
    const newItem: PersonalInfoItem = { id: `pi-${Date.now()}`, label: '新项目', value: '' };
    onChange({ ...data, personal: { ...data.personal, items: [...data.personal.items, newItem] } });
  };

  const removePersonalInfoItem = (id: string) => {
    onChange({ ...data, personal: { ...data.personal, items: data.personal.items.filter(i => i.id !== id) } });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小（限制为 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    // 读取文件并转换为 base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updatePersonalField('photo', result);
      }
    };
    reader.onerror = () => {
      alert('图片读取失败，请重试');
    };
    reader.readAsDataURL(file);
  };

  const addSectionToPage = (pageIdx: number, type: SectionType) => {
    const newPages = [...data.pages];
    const newId = `sec-${Date.now()}`;
    const section: ResumeSection = {
      id: newId,
      type,
      title: type === 'education' ? '教育背景' : type === 'experience' ? '实习经历' : '其他板块',
      iconName: type === 'education' ? 'GraduationCap' : type === 'experience' ? 'Briefcase' : 'FileText',
      content: type === 'education' ? [] : type === 'experience' ? [] : ''
    };
    newPages[pageIdx].sections.push(section);
    onChange({ ...data, pages: newPages });
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* AI 一键填写入口 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-xl shadow-blue-100">
        <h3 className="font-bold flex items-center gap-2 mb-1 text-base">
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" /> AI 一键填写
        </h3>
        <p className="text-xs text-blue-100 mb-4 opacity-90 leading-relaxed">
          输入你的基本信息（姓名、学校、专业、工作经历等），AI 将自动为你生成完整的简历内容。
        </p>
        <button 
          onClick={() => setIsAutoFillOpen(true)} 
          className="w-full bg-white text-blue-600 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors active:scale-95"
        >
          开始一键填写
        </button>
      </div>

      {/* AI 一键填写弹窗 */}
      {isAutoFillOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isGenerating && setIsAutoFillOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">AI 智能简历助手</h2>
                  <p className="text-xs text-gray-400">
                    {mode === 'extract' ? '上传图片或输入信息，AI 将自动生成完整简历' : '根据岗位描述，AI 将智能优化你的简历'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAutoFillOpen(false)} 
                disabled={isGenerating}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {/* 模式选择 */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => {
                    setMode('extract');
                    setJobDescription('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'extract'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  信息提取
                </button>
                <button
                  onClick={() => setMode('optimize')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'optimize'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  智能优化
                </button>
              </div>

              {mode === 'extract' ? (
                <>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    上传简历图片或输入基本信息
                  </label>
                  
                  {/* 图片上传 */}
                  <div className="mb-4">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={handleImageUploadForOCR}
                      className="hidden"
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600"
                      disabled={isGenerating}
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span>{uploadedImage ? '已上传图片，点击重新上传' : '上传简历图片（支持识别）'}</span>
                    </button>
                    {uploadedImage && (
                      <div className="mt-2 relative">
                        <img 
                          src={uploadedImage} 
                          alt="上传的简历图片" 
                          className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 mb-3 text-center">或</div>

                  {/* 文本输入 */}
                  <textarea 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="例如：
姓名：张三
学校：北京大学
专业：计算机科学与技术
学历：本科
工作经历：曾在腾讯公司担任前端开发工程师，负责微信小程序开发..."
                    className="w-full h-48 p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none text-sm leading-relaxed resize-none custom-scrollbar"
                    disabled={isGenerating}
                  ></textarea>
                </>
              ) : (
                <>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    当前简历内容
                  </label>
                  
                  {/* 图片上传 */}
                  <div className="mb-4">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={handleImageUploadForOCR}
                      className="hidden"
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600"
                      disabled={isGenerating}
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span>{uploadedImage ? '已上传简历图片，点击重新上传' : '上传当前简历图片（可选）'}</span>
                    </button>
                    {uploadedImage && (
                      <div className="mt-2 relative">
                        <img 
                          src={uploadedImage} 
                          alt="上传的简历图片" 
                          className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <textarea 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="输入当前简历内容，或留空（如果已上传图片）..."
                    className="w-full h-32 p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none text-sm leading-relaxed resize-none custom-scrollbar mb-4"
                    disabled={isGenerating}
                  ></textarea>

                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    目标岗位描述
                  </label>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="例如：
职位：前端开发工程师
要求：
- 3年以上前端开发经验
- 熟悉 React、Vue 等框架
- 有移动端开发经验
- 熟悉 TypeScript..."
                    className="w-full h-48 p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none text-sm leading-relaxed resize-none custom-scrollbar"
                    disabled={isGenerating}
                  ></textarea>
                </>
              )}
              
              {generateError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs flex items-center gap-2">
                  <X className="w-4 h-4" /> {generateError}
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 text-xs">
                <p className="font-semibold mb-1">💡 提示：</p>
                {mode === 'extract' ? (
                  <ul className="list-disc list-inside space-y-1 text-blue-500">
                    <li>可以上传简历图片，AI 会自动识别图片中的内容</li>
                    <li>也可以直接输入文本信息，信息越详细，生成的简历越准确</li>
                    <li>AI 会根据你提供的信息智能补充其他内容</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-blue-500">
                    <li>上传当前简历图片或输入简历内容</li>
                    <li>输入目标岗位描述，AI 会根据岗位要求优化简历</li>
                    <li>优化后的简历会更匹配目标岗位，提高通过率</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setIsAutoFillOpen(false)} 
                disabled={isGenerating}
                className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={handleAutoFill}
                disabled={isGenerating || (mode === 'extract' ? !userInput.trim() && !uploadedImage : (!userInput.trim() && !uploadedImage) || !jobDescription.trim())}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'extract' ? '正在识别...' : '正在优化...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>{mode === 'extract' ? '生成简历' : '优化简历'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 个人核心信息编辑区 */}
      <section className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-blue-600" /> 个人核心信息
        </h3>
        <div className="space-y-4">
          {/* 头像上传 */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">个人照片</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {data.personal.photo ? (
                  <img 
                    src={data.personal.photo} 
                    alt="个人照片" 
                    className="w-24 h-32 object-cover border-2 border-gray-200 rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>上传照片</span>
                </button>
                {data.personal.photo && (
                  <button
                    onClick={() => updatePersonalField('photo', '')}
                    className="mt-2 text-xs text-red-500 hover:text-red-700"
                  >
                    删除照片
                  </button>
                )}
                <p className="text-[10px] text-gray-400 mt-1">支持 JPG、PNG 格式，最大 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">姓名 (固定位置)</label>
              <input value={data.personal.name} onChange={(e) => updatePersonalField('name', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">求职意向</label>
              <input value={data.personal.objective} onChange={(e) => updatePersonalField('objective', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">其他信息项 (可增删改题目)</label>
            {data.personal.items.map((item) => (
              <div key={item.id} className="flex gap-2 items-center">
                <input 
                  value={item.label} 
                  onChange={(e) => updatePersonalInfoItem(item.id, 'label', e.target.value)}
                  placeholder="项名"
                  className="w-1/3 px-2 py-1.5 bg-gray-100 border-none rounded text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                />
                <input 
                  value={item.value} 
                  onChange={(e) => updatePersonalInfoItem(item.id, 'value', e.target.value)}
                  placeholder="内容"
                  className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={() => removePersonalInfoItem(item.id)} className="p-1.5 text-red-300 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button 
              onClick={addPersonalInfoItem}
              className="w-full py-1.5 border border-dashed border-gray-300 rounded text-[10px] text-gray-400 hover:bg-gray-50"
            >
              + 添加信息项 (如：微信号、居住地等)
            </button>
          </div>
        </div>
      </section>

      {/* 页面内容编辑区 */}
      {data.pages?.map((page, pIdx) => (
        <div key={page.id} className="space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">PAGE {pIdx + 1} 板块内容</h3>
          </div>
          
          {page.sections?.map((sec, sIdx) => (
            <div key={sec.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white rounded shadow-sm">
                    {sec.type === 'education' ? <GraduationCap className="w-4 h-4 text-blue-500" /> : <Briefcase className="w-4 h-4 text-blue-500" />}
                  </div>
                  <input 
                    value={sec.title} 
                    onChange={(e) => {
                      const newPages = [...data.pages];
                      newPages[pIdx].sections[sIdx].title = e.target.value;
                      onChange({ ...data, pages: newPages });
                    }} 
                    className="bg-transparent font-bold text-gray-800 text-sm outline-none border-b border-transparent focus:border-blue-400" 
                  />
                </div>
                <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {
                    const newPages = [...data.pages];
                    newPages[pIdx].sections = newPages[pIdx].sections.filter((_, i) => i !== sIdx);
                    onChange({ ...data, pages: newPages });
                  }} className="p-1 hover:bg-red-100 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {sec.type === 'education' && Array.isArray(sec.content) && (
                <div className="space-y-3">
                  {(sec.content as EducationItem[]).map((edu, eIdx) => (
                    <div key={edu.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm space-y-2 relative group/item">
                      <button onClick={() => {
                        const newPages = [...data.pages];
                        (newPages[pIdx].sections[sIdx].content as EducationItem[]).splice(eIdx, 1);
                        onChange({ ...data, pages: newPages });
                      }} className="absolute -top-2 -right-2 bg-white text-red-400 p-1 rounded-full shadow-sm border border-gray-100 hidden group-hover/item:block"><X className="w-3 h-3"/></button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="时间" value={edu.period} onChange={(e) => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as EducationItem[])[eIdx].period = e.target.value;
                          onChange({ ...data, pages: newPages });
                        }} className="text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                        <input placeholder="院校名称" value={edu.school} onChange={(e) => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as EducationItem[])[eIdx].school = e.target.value;
                          onChange({ ...data, pages: newPages });
                        }} className="text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                      <input placeholder="专业名称" value={edu.major} onChange={(e) => {
                        const newPages = [...data.pages];
                        (newPages[pIdx].sections[sIdx].content as EducationItem[])[eIdx].major = e.target.value;
                        onChange({ ...data, pages: newPages });
                      }} className="text-xs p-1.5 border rounded w-full focus:ring-1 focus:ring-blue-500 outline-none" />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="GPA" value={edu.gpa} onChange={(e) => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as EducationItem[])[eIdx].gpa = e.target.value;
                          onChange({ ...data, pages: newPages });
                        }} className="text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                        <input placeholder="主修课程" value={edu.courses} onChange={(e) => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as EducationItem[])[eIdx].courses = e.target.value;
                          onChange({ ...data, pages: newPages });
                        }} className="text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => {
                    const newPages = [...data.pages];
                    (newPages[pIdx].sections[sIdx].content as EducationItem[]).push({ id: `e-${Date.now()}`, period: '', school: '', major: '', degree: '', gpa: '', courses: '' });
                    onChange({ ...data, pages: newPages });
                  }} className="w-full py-1.5 border border-dashed rounded text-[10px] text-gray-400 hover:bg-gray-50 transition-colors">+ 添加教育经历项</button>
                </div>
              )}

              {sec.type === 'experience' && Array.isArray(sec.content) && (
                <div className="space-y-3">
                  {(sec.content as ExperienceItem[]).map((exp, eIdx) => (
                    <div key={exp.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm space-y-2 relative group/item">
                      <button onClick={() => {
                        const newPages = [...data.pages];
                        (newPages[pIdx].sections[sIdx].content as ExperienceItem[]).splice(eIdx, 1);
                        onChange({ ...data, pages: newPages });
                      }} className="absolute -top-2 -right-2 bg-white text-red-400 p-1 rounded-full shadow-sm border border-gray-100 hidden group-hover/item:block"><X className="w-3 h-3"/></button>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <input placeholder="时间" value={exp.period} onChange={(e) => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as ExperienceItem[])[eIdx].period = e.target.value;
                          onChange({ ...data, pages: newPages });
                        }} className="text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                        <input placeholder="机构/公司" value={exp.organization} onChange={(e) => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as ExperienceItem[])[eIdx].organization = e.target.value;
                          onChange({ ...data, pages: newPages });
                        }} className="text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                        <input placeholder="职位" value={exp.role} onChange={(e) => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as ExperienceItem[])[eIdx].role = e.target.value;
                          onChange({ ...data, pages: newPages });
                        }} className="text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                      
                      <textarea 
                        placeholder="总述" 
                        value={exp.summary} 
                        onChange={(e) => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as ExperienceItem[])[eIdx].summary = e.target.value;
                          onChange({ ...data, pages: newPages });
                        }}
                        className="text-[10px] w-full p-1.5 border rounded bg-gray-50 h-10 outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      <div className="space-y-1.5">
                        {exp.points?.map((pt, pIdxInner) => (
                          <div key={pt.id} className="flex gap-1 group/pt">
                            <input placeholder="标题" value={pt.subtitle} onChange={(e) => {
                              const newPages = [...data.pages];
                              (newPages[pIdx].sections[sIdx].content as ExperienceItem[])[eIdx].points[pIdxInner].subtitle = e.target.value;
                              onChange({ ...data, pages: newPages });
                            }} className="text-[10px] p-1 border rounded w-1/4 focus:ring-1 focus:ring-blue-500 outline-none" />
                            <input placeholder="细节" value={pt.detail} onChange={(e) => {
                              const newPages = [...data.pages];
                              (newPages[pIdx].sections[sIdx].content as ExperienceItem[])[eIdx].points[pIdxInner].detail = e.target.value;
                              onChange({ ...data, pages: newPages });
                            }} className="text-[10px] p-1 border rounded flex-1 focus:ring-1 focus:ring-blue-500 outline-none" />
                            <button onClick={() => {
                              const newPages = [...data.pages];
                              (newPages[pIdx].sections[sIdx].content as ExperienceItem[])[eIdx].points.splice(pIdxInner, 1);
                              onChange({ ...data, pages: newPages });
                            }} className="text-gray-300 hover:text-red-400 opacity-0 group-hover/pt:opacity-100"><X className="w-3 h-3"/></button>
                          </div>
                        ))}
                        <button onClick={() => {
                          const newPages = [...data.pages];
                          (newPages[pIdx].sections[sIdx].content as ExperienceItem[])[eIdx].points.push({ id: `pt-${Date.now()}`, subtitle: '', detail: '' });
                          onChange({ ...data, pages: newPages });
                        }} className="text-[10px] text-blue-400 hover:underline">+ 增加要点</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => {
                    const newPages = [...data.pages];
                    (newPages[pIdx].sections[sIdx].content as ExperienceItem[]).push({ id: `exp-${Date.now()}`, period: '', organization: '', role: '', summary: '', points: [{ id: `pt-${Date.now()}`, subtitle: '', detail: '' }] });
                    onChange({ ...data, pages: newPages });
                  }} className="w-full py-1.5 border border-dashed rounded text-[10px] text-gray-400 hover:bg-gray-50">+ 添加经历项</button>
                </div>
              )}

              {sec.type === 'text' && (
                <textarea 
                  value={sec.content as string} 
                  onChange={(e) => {
                    const newPages = [...data.pages];
                    newPages[pIdx].sections[sIdx].content = e.target.value;
                    onChange({ ...data, pages: newPages });
                  }} 
                  className="w-full text-xs p-3 border rounded h-32 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <button onClick={() => addSectionToPage(pIdx, 'education')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> 教育背景</button>
            <button onClick={() => addSectionToPage(pIdx, 'experience')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> 工作经历</button>
            <button onClick={() => addSectionToPage(pIdx, 'text')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> 纯文本块</button>
          </div>
        </div>
      ))}
      
      <button onClick={() => onChange({ ...data, pages: [...data.pages, { id: `page-${Date.now()}`, sections: [] }] })} className="w-full py-5 border-2 border-dashed border-blue-100 rounded-2xl flex items-center justify-center gap-2 text-blue-300 font-bold hover:bg-blue-50 transition-all">
        <CopyPlus className="w-5 h-5" /> <span>增加一页</span>
      </button>
    </div>
  );
};

export default ResumeEditor;
