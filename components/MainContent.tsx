
import React from 'react';
import Calendar from './Calendar';
import DefaultContent from './content/DefaultContent';
import TariffContent from './content/TariffContent';
import HandbookContent from './content/HandbookContent';
import PoliciesContent from './content/PoliciesContent';
import TemplateContent from './content/TemplateContent';
import JobSearchContent from './content/JobSearchContent';
import SubmissionContent from './content/SubmissionContent';
import AdminPanelContent from './content/AdminPanelContent';
import DataEntryContent from './content/DataEntryContent';
import MblPaymentContent from './content/MblPaymentContent';
import FileManagerContent from './content/FileManagerContent';
import AiToolContent from './content/AiToolContent';
import { ViewType } from '../types';
import BackButton from './BackButton';

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
  submission: { title: 'Nộp hồ sơ hoàn cược', component: SubmissionContent },
  admin: { title: 'Quản lý Người dùng', component: AdminPanelContent },
  dataEntry: { title: 'Nhập liệu & Cập nhật Job', component: DataEntryContent },
  mblPayment: { title: 'Thanh toán MBL', component: MblPaymentContent },
  fileManager: { title: 'Quản lý File Storage', component: FileManagerContent },
  aiTool: { title: 'Công cụ Xử lý PDF', component: AiToolContent },
};

const MainContent: React.FC<MainContentProps> = ({ activeView, setActiveView }) => {
  const backToDefault = () => setActiveView('default');
  const { title, component: ContentComponent } = viewConfig[activeView];
  
  const showDefault = activeView === 'default';

  return (
    <div className="mt-4">
      {/* Hero Title Section - Moved outside grid to span full width above columns */}
      <div className="py-6 mb-4">
          <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-md mb-2 leading-tight">
            {title}
          </h2>
          {showDefault && (
              <p className="text-xl text-green-200 font-light max-w-2xl">
                Hệ thống quản lý và tra cứu thông tin vận tải biển.
              </p>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
        {/* LEFT COLUMN: Main Content Card */}
        <div className="flex flex-col gap-6">
            {/* Glass Card Content */}
            <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl p-6 md:p-10 text-gray-100">
              {/* Glossy highlight effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                <span className="text-sm font-semibold tracking-wider text-green-300 uppercase">
                   {showDefault ? 'Thông tin chung' : 'Thông tin'}
                </span>
                {!showDefault && <BackButton onClick={backToDefault} />}
              </div>
              
              <div className="glass-content-wrapper">
                  <ContentComponent back={backToDefault} />
              </div>
            </section>
        </div>

        {/* RIGHT COLUMN: Sidebar (Calendar, etc.) */}
        <aside className="w-full flex flex-col gap-6">
          <Calendar />
          {/* You could add more widgets here like 'Quick Stats' or 'Recent Activity' */}
        </aside>
      </div>

      <style>{`
        /* Styles to ensure text inside the glass card is readable */
        .glass-content-wrapper p, 
        .glass-content-wrapper li, 
        .glass-content-wrapper span, 
        .glass-content-wrapper div {
            color: #f3f4f6; /* gray-100 */
        }
        .glass-content-wrapper strong, 
        .glass-content-wrapper b, 
        .glass-content-wrapper h3, 
        .glass-content-wrapper h4 {
            color: #ffffff;
        }
        .glass-content-wrapper input,
        .glass-content-wrapper select,
        .glass-content-wrapper textarea {
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            border-color: rgba(255, 255, 255, 0.2);
        }
        .glass-content-wrapper input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        .glass-content-wrapper table th {
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
        }
        .glass-content-wrapper table td {
            border-color: rgba(255, 255, 255, 0.1);
        }
        .glass-content-wrapper tr:hover td {
            background-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default MainContent;
