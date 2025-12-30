
import React from 'react';
import { ResumeData, ResumeSection, EducationItem, ExperienceItem, ResumePage } from '../types';
import * as Icons from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
  const getIcon = (name: string, className = "w-4 h-4 text-black") => {
    const IconComp = (Icons as any)[name] || Icons.FileText;
    return <IconComp className={className} />;
  };

  const renderSectionContent = (section: ResumeSection, isDark = false) => {
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const boldColor = isDark ? 'text-white' : 'text-black';

    switch (section.type) {
      case 'education':
        return Array.isArray(section.content) ? (section.content as EducationItem[]).map((edu) => (
          <div key={edu.id} className="mb-3 text-[13px]">
            <div className={`grid grid-cols-3 font-bold mb-1 ${boldColor} items-center`}>
              <span className="text-left">{edu.period}</span>
              <span className="text-center px-1">{edu.school}</span>
              <span className="text-right truncate">{edu.major || edu.degree}</span>
            </div>
            {edu.gpa && <div className={`${textColor} opacity-90`}>GPA: {edu.gpa}</div>}
            {edu.courses && <div className={`${textColor} opacity-90 leading-snug`}><span className="font-bold">主修课程:</span> {edu.courses}</div>}
          </div>
        )) : null;

      case 'experience':
        return Array.isArray(section.content) ? (section.content as ExperienceItem[]).map((exp) => (
          <div key={exp.id} className="mb-4 text-[13px]">
            <div className={`grid grid-cols-3 font-bold mb-1 ${boldColor} items-center`}>
              <span className="text-left">{exp.organization}</span>
              <span className="text-center px-1">{exp.role}</span>
              <span className="text-right">{exp.period}</span>
            </div>
            {exp.summary && <p className={`${textColor} italic mb-1 opacity-80`}>{exp.summary}</p>}
            <ul className={`list-disc ml-4 space-y-0.5 ${textColor}`}>
              {exp.points?.map((pt) => (
                <li key={pt.id} className="leading-snug">
                  <span className={`font-bold ${boldColor}`}>{pt.subtitle}：</span>{pt.detail}
                </li>
              ))}
            </ul>
          </div>
        )) : null;

      case 'text':
        return <p className={`text-[13px] ${textColor} leading-relaxed whitespace-pre-wrap`}>{section.content as string}</p>;

      default:
        return null;
    }
  };

  // --- 模版 A：经典款 (Classic) ---
  const renderClassic = (page: ResumePage, pageIdx: number) => (
    <div 
      key={page.id} 
      style={{ width: '210mm', minHeight: '297mm' }}
      className="bg-white p-[15mm] mx-auto shadow-2xl relative mb-8 print:shadow-none"
    >
      {pageIdx === 0 && (
        <header className="mb-8 flex justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold border-b-2 border-black pb-1 mb-4">{data.personal.name}</h1>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px]">
              {data.personal.items.map(item => (
                <div key={item.id} className="truncate">
                  <span className="font-bold">{item.label}:</span> {item.value}
                </div>
              ))}
              {data.personal.objective && <div className="col-span-2"><span className="font-bold">意向:</span> {data.personal.objective}</div>}
            </div>
          </div>
          {data.personal.photo && <img src={data.personal.photo} className="w-24 h-32 object-cover border ml-8" />}
        </header>
      )}
      {page.sections?.map(sec => (
        <section key={sec.id} className="mb-6">
          <div className="flex items-center gap-2 border-b-2 border-black mb-3 pb-1">
            {getIcon(sec.iconName)}
            <h2 className="text-lg font-bold uppercase tracking-wide">{sec.title}</h2>
          </div>
          {renderSectionContent(sec)}
        </section>
      ))}
    </div>
  );

  // --- 模版 B：现代横向（Modern - 财务风格） ---
  const renderModern = (page: ResumePage, pageIdx: number) => (
    <div 
      key={page.id} 
      style={{ width: '210mm', minHeight: '297mm' }}
      className="bg-white mx-auto shadow-2xl relative mb-8 print:shadow-none font-sans"
    >
      {pageIdx === 0 && (
        <header className="p-[15mm] pb-6 bg-slate-50 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-200/50 rounded-full translate-x-20 -translate-y-20"></div>
          
          <div className="relative z-10 flex-1">
            <div className="flex items-baseline gap-4 mb-6">
              <h1 className="text-4xl font-black tracking-tighter text-slate-800">{data.personal.name}</h1>
              {data.personal.objective && <span className="text-lg text-slate-500 font-medium">意向：{data.personal.objective}</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] text-slate-600">
              {data.personal.items.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="p-1 bg-slate-200 rounded-full">{getIcon('Info', 'w-3 h-3 text-slate-500')}</div> 
                  {item.label}：{item.value}
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 shrink-0">
            <img src={data.personal.photo} className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-lg" />
          </div>
        </header>
      )}
      <div className="p-[15mm] pt-2">
        {page.sections?.map(sec => (
          <section key={sec.id} className="mb-8">
            <div className="bg-slate-400 text-white px-6 py-1 rounded-l-full -ml-[15mm] mb-4 font-bold tracking-widest inline-block min-w-[120px]">
              {sec.title}
            </div>
            <div className="pl-2 border-l-2 border-slate-100 ml-2">
              {renderSectionContent(sec)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );

  // --- 模版 C：双栏侧边（Sidebar - 开发风格） ---
  const renderSidebar = (page: ResumePage, pageIdx: number) => (
    <div 
      key={page.id} 
      style={{ width: '210mm', minHeight: '297mm' }}
      className="bg-white mx-auto shadow-2xl flex relative mb-8 print:shadow-none"
    >
      <aside className="w-[60mm] bg-[#3b4b72] text-white p-6 shrink-0 flex flex-col gap-8">
        {pageIdx === 0 && (
          <>
            <div className="flex justify-center">
              <img src={data.personal.photo} className="w-28 h-28 object-cover rounded-full border-4 border-white/20 shadow-md" />
            </div>
            <section>
              <h3 className="text-xs font-bold border-b border-white/20 pb-1 mb-4 uppercase tracking-widest text-white/80">核心信息</h3>
              <div className="space-y-4 text-[11px] opacity-90 leading-relaxed">
                {data.personal.items.map(item => (
                  <div key={item.id}>
                    <div className="text-white/50 mb-0.5">{item.label}</div>
                    <div className="font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        {pageIdx > 0 && <div className="text-[10px] opacity-40 italic mt-auto text-center uppercase tracking-tighter">PAGE {pageIdx + 1}</div>}
      </aside>

      <main className="flex-1 p-10 bg-white">
        {pageIdx === 0 && (
          <header className="mb-10">
            <h1 className="text-4xl font-black text-[#1a1a1a] mb-2">{data.personal.name}</h1>
            {data.personal.objective && (
              <div className="inline-block bg-[#3b4b72]/10 text-[#3b4b72] px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                求职意向：{data.personal.objective}
              </div>
            )}
            <p className="text-xs text-gray-400 italic border-l-4 border-gray-100 pl-4">
              我追求卓越，擅长解决复杂问题。
            </p>
          </header>
        )}

        {page.sections?.map(sec => (
          <section key={sec.id} className="mb-8">
            <h2 className="text-lg font-black text-[#1a1a1a] mb-3 uppercase tracking-wider flex items-center gap-2">
              {sec.title}
              <div className="flex-1 h-[1px] bg-gray-100"></div>
            </h2>
            {renderSectionContent(sec)}
          </section>
        ))}
      </main>
    </div>
  );

  return (
    <div id="resume-pdf-content" className="resume-preview-wrapper print:bg-white pb-20">
      {data.pages?.map((page, idx) => {
        if (data.templateId === 'modern') return renderModern(page, idx);
        if (data.templateId === 'sidebar') return renderSidebar(page, idx);
        return renderClassic(page, idx);
      })}
    </div>
  );
};

export default ResumePreview;
