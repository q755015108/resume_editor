
export type SectionType = 'education' | 'experience' | 'text';
export type TemplateId = 'classic' | 'modern' | 'sidebar';

export interface PersonalInfoItem {
  id: string;
  label: string;
  value: string;
}

export interface EducationItem {
  id: string;
  period: string;
  school: string;
  major: string;
  degree: string;
  gpa: string;
  courses: string;
}

export interface ExperiencePoint {
  id: string;
  subtitle: string;
  detail: string;
}

export interface ExperienceItem {
  id: string;
  period: string;
  organization: string;
  role: string;
  summary: string;
  points: ExperiencePoint[];
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  iconName: string;
  content: EducationItem[] | ExperienceItem[] | string;
}

export interface ResumePage {
  id: string;
  sections: ResumeSection[];
}

export interface ResumeData {
  templateId: TemplateId;
  personal: {
    name: string;
    photo: string;
    objective?: string;
    items: PersonalInfoItem[]; // 动态个人信息项
  };
  pages: ResumePage[];
}
