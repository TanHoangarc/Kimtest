
import React from 'react';
import Calendar from './Calendar';
import DefaultContent from './content/DefaultContent';
import TariffContent from './content/TariffContent';
import HandbookContent from './content/HandbookContent';
import PoliciesContent from './content/PoliciesContent';
import TemplateContent from './content/TemplateContent';
import JobSearchContent from './content/JobSearchContent';
import SubmissionContent from './content/SubmissionContent';
import { ViewType } from '../types';

interface MainContentProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const viewConfig: Record<ViewType, { title: string; component: React.FC<{ back: () => void; }> }> = {
  default: { title: 'Documents', component: DefaultContent },
  tariff: { title: 'Tariff Vietnam', component: TariffContent },
  handbook: { title: 'Tài khoản Kimberry', component: HandbookContent },
  policies: { title: 'Hồ sơ Hoàn cược', component: PoliciesContent },
  template: { title: 'File mẫu CVHC', component: TemplateContent },
  marketing: { title: 'Tra cứu Job', component: JobSearchContent },
  submission: { title: 'Nộp hồ sơ', component: SubmissionContent },
};

const MainContent: React.FC<MainContentProps> = ({ activeView, setActiveView }) => {
  const backToDefault = () => setActiveView('default');
  const { title, component: ContentComponent } = viewConfig[activeView];
  
  const showDefault = activeView === 'default';

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
      <section className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#184d47] border-b-2 border-[#a8d0a2] pb-2 mb-4">
          {showDefault ? viewConfig.default.title : title}
        </h2>
        
        {showDefault && <DefaultContent back={backToDefault} />}
        {!showDefault && <ContentComponent back={backToDefault} />}

      </section>
      <aside className="w-full lg:w-96">
        <Calendar />
      </aside>
    </div>
  );
};

export default MainContent;
