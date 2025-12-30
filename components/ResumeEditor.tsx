
import React, { useState } from 'react';
import { ResumeData, ResumeSection, EducationItem, ExperienceItem, SectionType, ResumePage, ExperiencePoint, PersonalInfoItem } from '../types';
import { 
  Plus, Trash2, Sparkles, Briefcase, 
  GraduationCap, User as UserIcon, ArrowUp, ArrowDown, 
  Wand2, X, Loader2, CopyPlus, GripVertical, FileText, Send
} from 'lucide-react';
import { parseResumeFromText } from '../services/geminiService';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleMagicParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setParseError('');
    try {
      const parsedData = await parseResumeFromText(rawText);
      if (parsedData) {
        onChange({
          ...data,
          personal: parsedData.personal || data.personal,
          pages: parsedData.pages || data.pages
        });
        setIsMagicImportOpen(false);
        setRawText('');
      }
    } catch (err: any) {
      const errorMsg = err?.message || '解析失败，请检查文本内容或 API Key 设置。';
      setParseError(errorMsg);
      console.error("Parse error details:", err);
    } finally {
      setIsParsing(false);
    }
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
      {/* AI 解析入口按钮 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-xl shadow-blue-100">
        <h3 className="font-bold flex items-center gap-2 mb-1 text-base"><Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" /> AI 快速解析</h3>
        <p className="text-xs text-blue-100 mb-4 opacity-90 leading-relaxed">粘贴旧简历文本，AI 自动为你分类填充到各个板块。</p>
        <button 
          onClick={() => setIsMagicImportOpen(true)} 
          className="w-full bg-white text-blue-600 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors active:scale-95"
        >
          开始智能解析
        </button>
      </div>

      {/* AI 解析弹窗 (Modal) */}
      {isMagicImportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isParsing && setIsMagicImportOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl"><Sparkles className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">AI 简历智能解析</h2>
                  <p className="text-xs text-gray-400">支持自由格式的简历文本提取</p>
                </div>
              </div>
              <button onClick={() => setIsMagicImportOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">粘贴简历原始文本</label>
              <textarea 
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="例如：
张小可，可瓦大学会计学学士...
曾任职于xxx会计师事务所，负责审计工作..."
                className="w-full h-64 p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none text-sm leading-relaxed resize-none custom-scrollbar"
              ></textarea>
              
              {parseError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs flex items-center gap-2">
                  <X className="w-4 h-4" /> {parseError}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setIsMagicImportOpen(false)} 
                disabled={isParsing}
                className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={handleMagicParse}
                disabled={isParsing || !rawText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在提取...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>立即解析</span>
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
