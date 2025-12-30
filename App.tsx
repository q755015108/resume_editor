
import React, { useState, useRef, useEffect } from 'react';
import ResumePreview from './components/ResumePreview';
import ResumeEditor from './components/ResumeEditor';
import { INITIAL_DATA } from './constants';
import { ResumeData, TemplateId } from './types';
import { 
  FileText, Printer, Loader2, Save, Upload, Download, 
  ZoomIn, ZoomOut, Maximize, RotateCcw, Layout as LayoutIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ResumeData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(0.8);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const element = document.getElementById('resume-pdf-content');
    if (!element) return;
    setIsExporting(true);
    const opt = {
      margin: 0,
      filename: `${data.personal.name}_简历.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const changeTemplate = (id: TemplateId) => {
    setData(prev => ({ ...prev, templateId: id }));
  };

  // 模版预览组件
  const TemplateThumbnail = ({ id }: { id: TemplateId }) => {
    if (id === 'classic') {
      return (
        <div className="w-full h-full bg-white p-2 flex flex-col gap-1.5 overflow-hidden">
          <div className="h-2 w-2/3 bg-gray-800 mx-auto rounded-full"></div>
          <div className="h-0.5 w-full bg-gray-200"></div>
          <div className="flex gap-1 justify-between">
            <div className="h-1 w-1/3 bg-gray-100 rounded"></div>
            <div className="h-1 w-1/3 bg-gray-100 rounded"></div>
          </div>
          <div className="mt-1 h-1.5 w-1/4 bg-gray-800 rounded"></div>
          <div className="h-0.5 w-full bg-gray-200"></div>
          <div className="space-y-1">
            <div className="h-1 w-full bg-gray-100 rounded"></div>
            <div className="h-1 w-5/6 bg-gray-100 rounded"></div>
          </div>
        </div>
      );
    }
    if (id === 'modern') {
      return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden">
          <div className="h-1/3 bg-slate-50 p-2 flex items-center justify-between">
             <div className="space-y-1 w-1/2">
                <div className="h-2 w-full bg-slate-800 rounded"></div>
                <div className="h-1 w-2/3 bg-slate-300 rounded"></div>
             </div>
             <div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white"></div>
          </div>
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-8 bg-slate-400 rounded-l-full"></div>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            <div className="pl-2 space-y-1">
              <div className="h-1 w-full bg-slate-50"></div>
              <div className="h-1 w-4/5 bg-slate-50"></div>
            </div>
          </div>
        </div>
      );
    }
    if (id === 'sidebar') {
      return (
        <div className="w-full h-full bg-white flex overflow-hidden">
          <div className="w-1/3 bg-[#3b4b72] p-1.5 flex flex-col gap-2">
            <div className="h-5 w-5 rounded-full bg-white/20 mx-auto"></div>
            <div className="h-1 w-full bg-white/20 rounded"></div>
            <div className="space-y-1">
              <div className="h-0.5 w-full bg-white/10 rounded"></div>
              <div className="h-0.5 w-2/3 bg-white/10 rounded"></div>
            </div>
          </div>
          <div className="flex-1 p-2 space-y-3">
            <div className="space-y-1">
              <div className="h-2.5 w-1/2 bg-gray-800 rounded"></div>
              <div className="h-1.5 w-1/3 bg-blue-100 rounded-full"></div>
            </div>
            <div className="space-y-1.5">
              <div className="h-1 w-full bg-gray-200 rounded"></div>
              <div className="h-1 w-full bg-gray-100 rounded"></div>
              <div className="h-1 w-3/4 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .preview-container {
          scroll-behavior: smooth;
        }
      `}</style>

      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedData = JSON.parse(event.target?.result as string);
            setData(importedData);
          } catch (err) { alert('解析失败'); }
        };
        reader.readAsText(file);
      }} />

      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-50 no-print shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-none">AI Resume Pro</h1>
            <p className="text-[10px] text-gray-400 mt-1 font-medium tracking-tighter uppercase">Professional Resume Builder</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex lg:hidden bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('editor')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>编辑</button>
            <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>预览</button>
          </div>
          
          <button 
            onClick={handleExport} 
            disabled={isExporting} 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>导出 PDF</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <div className={`
          flex-none w-full lg:w-[450px] xl:w-[500px] h-full overflow-y-auto 
          bg-white border-r border-gray-200 custom-scrollbar no-print
          ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}
        `}>
          <div className="p-6">
            <section className="mb-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <LayoutIcon className="w-3.5 h-3.5" /> 切换简历模版
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'classic', name: '经典简约' },
                  { id: 'modern', name: '财务职场' },
                  { id: 'sidebar', name: '侧栏开发' }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => changeTemplate(t.id as TemplateId)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${data.templateId === t.id ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <div className="w-full aspect-[3/4] rounded-lg shadow-sm mb-1 border border-gray-100 overflow-hidden bg-gray-50">
                      <TemplateThumbnail id={t.id as TemplateId} />
                    </div>
                    <span className={`text-[11px] font-bold ${data.templateId === t.id ? 'text-blue-600' : 'text-gray-500'}`}>{t.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <ResumeEditor data={data} onChange={setData} />
          </div>
        </div>

        <div className={`
          flex-1 h-full overflow-hidden flex flex-col bg-slate-200/60
          ${activeTab === 'editor' ? 'hidden lg:flex' : 'flex'}
          relative
        `}>
          <div className="shrink-0 w-full p-4 flex justify-center no-print pointer-events-none absolute top-0 left-0 right-0 z-40">
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-xl flex items-center gap-2 pointer-events-auto">
              <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="缩小"><ZoomOut className="w-4 h-4 text-slate-600" /></button>
              <div className="px-2 min-w-[50px] text-center text-xs font-black text-slate-700">{Math.round(zoom * 100)}%</div>
              <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="放大"><ZoomIn className="w-4 h-4 text-slate-600" /></button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button onClick={() => setZoom(0.8)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="重置"><RotateCcw className="w-4 h-4 text-slate-600" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-12 pt-20 preview-container print:p-0 print:overflow-visible print:bg-white">
            <div 
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'top center',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
              className="print:transform-none"
            >
              <ResumePreview data={data} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
