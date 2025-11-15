
import React from 'react';

interface TemplateContentProps {
  back: () => void;
}

const TemplateContent: React.FC<TemplateContentProps> = ({ back }) => {
  const downloadTemplate = () => {
    window.open("https://docs.google.com/document/d/1gKMJ2esew1PFhHRX8UedmxEGZhVxN-fh/export?format=docx", "_blank");
  };

  return (
    <div className="space-y-4">
      <iframe src="https://docs.google.com/document/d/1gKMJ2esew1PFhHRX8UedmxEGZhVxN-fh/preview" className="w-full h-96 rounded-lg border"></iframe>
      <div>
        <button onClick={downloadTemplate} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition mr-4">
          ⬇ Tải xuống file
        </button>
      </div>
    </div>
  );
};

export default TemplateContent;