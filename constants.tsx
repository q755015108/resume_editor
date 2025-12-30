
import { ResumeData } from './types';

export const INITIAL_DATA: ResumeData = {
  templateId: 'classic',
  personal: {
    name: "简历",
    objective: "财务助理 / 后端开发工程师",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=320&auto=format&fit=crop",
    items: [
      { id: "pi-1", label: "出生年月", value: "2003年3月" },
      { id: "pi-2", label: "毕业院校", value: "简历佳大学" },
      { id: "pi-3", label: "手机号码", value: "13066668888" },
      { id: "pi-4", label: "电子邮箱", value: "755015108@qq.com" },
      { id: "pi-5", label: "居住城市", value: "北京市" }
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
              school: "简历佳大学",
              major: "会计学专业",
              degree: "学士",
              gpa: "3.6 (专业前10%)",
              courses: "财务会计，管理会计，财务管理，审计学，税法，经济法，会计信息系统，统计学。"
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
              period: "2025.02-2025.05",
              organization: "简历佳会计师事务所",
              role: "审计助理",
              summary: "",
              points: [
                {
                  id: "p1",
                  subtitle: "审计执行",
                  detail: "协助完成审计工作：参与3家中小型企业年度财务报表审计项目，负责货币资金、应收账款、存货等科目的审计程序执行。"
                },
                {
                  id: "p2",
                  subtitle: "数据核对",
                  detail: "运用 Excel 函数（VLOOKUP、SUMIF等）对企业提供的财务数据与原始凭证进行交叉核对，保证财务数据准确性。"
                },
                {
                  id: "p3",
                  subtitle: "报告撰写",
                  detail: "协助撰写审计报告：根据审计结果，协助项目负责人整理审计发现的问题。"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
