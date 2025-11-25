
import React, { useState, useRef } from 'react';

// Declare PDFLib global variable loaded from CDN in index.html
declare const PDFLib: any;

interface AiToolContentProps {
  back: () => void;
}

type ToolType = 'ocr' | 'split' | 'unlock';

const AiToolContent: React.FC<AiToolContentProps> = ({ back }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('ocr');

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTool('ocr')}
          className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${
            activeTool === 'ocr'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🖼️ Chuyển hình ảnh thành văn bản
        </button>
        <button
          onClick={() => setActiveTool('split')}
          className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${
            activeTool === 'split'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ✂️ Tách file PDF
        </button>
        <button
          onClick={() => setActiveTool('unlock')}
          className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${
            activeTool === 'unlock'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔓 Unlock PDF
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg min-h-[400px]">
        {activeTool === 'ocr' && <OcrTool />}
        {activeTool === 'split' && <SplitPdfTool />}
        {activeTool === 'unlock' && <UnlockPdfTool />}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: OCR TOOL (Existing Logic) ---
const OcrTool: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(''); // State for custom API key
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Vui lòng chỉ chọn file hình ảnh (JPG, PNG, WEBP).');
        return;
    }
    // Limit to 3MB because Base64 encoding increases size by ~33%, potentially exceeding 4MB server limit.
    if (file.size > 3 * 1024 * 1024) {
        setError('File quá lớn. Vui lòng chọn ảnh dưới 3MB để đảm bảo AI xử lý tốt.');
        return;
    }
    setError(null);
    setFileType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setExtractedText('');
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleExtractText = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const base64Data = selectedImage.split(',')[1];
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                imageBase64: base64Data, 
                mimeType: fileType,
                apiKey: customApiKey.trim() // Pass the custom API key if provided
            }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.details || 'Không thể xử lý hình ảnh.');
        }
        const data = await response.json();
        setExtractedText(data.text || 'Không tìm thấy văn bản nào trong ảnh.');
    } catch (err) {
        console.error(err);
        const e = err as Error;
        setError(`Lỗi: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (extractedText) {
        navigator.clipboard.writeText(extractedText);
        alert('Đã sao chép văn bản vào bộ nhớ tạm!');
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setExtractedText('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
            {/* Custom API Key Input */}
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm">
                <label className="block font-semibold text-yellow-800 mb-1">Google Gemini API Key (Tùy chọn)</label>
                <input 
                    type="password" 
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Nhập API Key của bạn nếu Server chưa cấu hình..."
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 outline-none text-gray-700 bg-white"
                />
                <p className="text-xs text-yellow-700 mt-1">
                    Nếu bạn gặp lỗi "Chưa cấu hình API Key", hãy nhập key của bạn vào đây. 
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline ml-1 font-bold">Lấy Key tại đây</a>
                </p>
            </div>

             <div 
                className={`border-2 border-dashed rounded-lg transition-all duration-200 bg-gray-50 text-center relative group py-2
                    ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" id="ai-image-upload" />
                <label htmlFor="ai-image-upload" className="cursor-pointer flex items-center justify-center gap-3 w-full px-4">
                    <span className="text-xl text-gray-500 group-hover:text-indigo-600 transition-colors">{isDragging ? '📂' : '📸'}</span>
                    <span className="font-semibold text-gray-700 text-sm group-hover:text-indigo-600 transition-colors">{isDragging ? 'Thả file ngay' : (selectedImage ? 'Thay đổi ảnh' : 'Kéo thả / Chọn ảnh')}</span>
                </label>
            </div>
            {error && <div className="p-2 text-sm bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
            {selectedImage && (
                <div className="border rounded-lg overflow-hidden bg-black/5">
                    <img src={selectedImage} alt="Preview" className="w-full h-auto max-h-[300px] object-contain mx-auto" />
                </div>
            )}
            <div className="flex gap-2">
                <button onClick={handleExtractText} disabled={!selectedImage || isLoading} className="flex-1 py-2 px-4 bg-indigo-600 text-white font-bold rounded-md shadow-sm hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm">
                    {isLoading ? <><span className="animate-spin">✨</span> Đang xử lý...</> : '⚡ Chuyển thành văn bản'}
                </button>
                {selectedImage && <button onClick={handleClear} disabled={isLoading} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold text-sm">Xóa</button>}
            </div>
        </div>
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="font-semibold text-gray-700 text-sm">Kết quả văn bản:</label>
                {extractedText && <button onClick={handleCopy} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">📋 Sao chép</button>}
            </div>
            <div className="relative">
                <textarea value={extractedText} onChange={(e) => setExtractedText(e.target.value)} placeholder="Văn bản trích xuất sẽ hiển thị tại đây..." className="w-full h-[400px] p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white font-mono text-sm leading-relaxed" />
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                            <div className="animate-bounce text-3xl mb-2">🤖</div>
                            <p className="text-indigo-600 font-semibold text-sm">AI đang đọc hình ảnh...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

// --- SUB-COMPONENT: SPLIT PDF TOOL ---
interface PageItem {
    index: number;
    originalName: string;
    customName: string;
}

const SplitPdfTool: React.FC = () => {
    const [mode, setMode] = useState<'range' | 'individual'>('range');
    const [file, setFile] = useState<File | null>(null);
    const [pageRange, setPageRange] = useState('');
    const [outputName, setOutputName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Individual mode state
    const [loadedPdfDoc, setLoadedPdfDoc] = useState<any>(null);
    const [pageList, setPageList] = useState<PageItem[]>([]);
    
    // Preview state
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f && f.type === 'application/pdf') {
            setFile(f);
            setStatus(null);
            
            // Default name for Range mode
            setOutputName(f.name.replace('.pdf', '') + '_split');

            // Load for Individual mode
            if (mode === 'individual') {
                setIsProcessing(true);
                try {
                    const arrayBuffer = await f.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                    setLoadedPdfDoc(pdfDoc);
                    
                    const count = pdfDoc.getPageCount();
                    const pages: PageItem[] = [];
                    const baseName = f.name.replace('.pdf', '');
                    for (let i = 0; i < count; i++) {
                        pages.push({
                            index: i,
                            originalName: `Page ${i + 1}`,
                            customName: `${baseName}_page_${i + 1}`
                        });
                    }
                    setPageList(pages);
                } catch (error) {
                    console.error(error);
                    setStatus({ type: 'error', message: 'Không thể đọc file PDF.' });
                } finally {
                    setIsProcessing(false);
                }
            }
        } else if (f) {
            setStatus({ type: 'error', message: 'Vui lòng chọn file PDF.' });
        }
    };

    // Mode Switch Handler
    const handleModeSwitch = (newMode: 'range' | 'individual') => {
        setMode(newMode);
        setFile(null);
        setStatus(null);
        setPageList([]);
        setLoadedPdfDoc(null);
        setPageRange('');
        setOutputName('');
    };

    // --- RANGE SPLIT LOGIC ---
    const handleSplitRange = async () => {
        if (!file || !pageRange || !outputName) {
            setStatus({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin.' });
            return;
        }

        setIsProcessing(true);
        setStatus(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            const newPdfDoc = await PDFLib.PDFDocument.create();

            const pagesToKeep = new Set<number>();
            const parts = pageRange.split(',').map(p => p.trim());

            for (const part of parts) {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    if (!isNaN(start) && !isNaN(end)) {
                        for (let i = start; i <= end; i++) {
                            if (i >= 1 && i <= totalPages) pagesToKeep.add(i - 1);
                        }
                    }
                } else {
                    const p = Number(part);
                    if (!isNaN(p) && p >= 1 && p <= totalPages) {
                        pagesToKeep.add(p - 1);
                    }
                }
            }

            const indices = Array.from(pagesToKeep).sort((a, b) => a - b);
            
            if (indices.length === 0) {
                throw new Error('Không có trang nào hợp lệ được chọn.');
            }

            const copiedPages = await newPdfDoc.copyPages(pdfDoc, indices);
            copiedPages.forEach((page: any) => newPdfDoc.addPage(page));

            const pdfBytes = await newPdfDoc.save();
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${outputName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setStatus({ type: 'success', message: 'Đã tách và tải xuống thành công!' });

        } catch (error) {
            console.error(error);
            const e = error as Error;
            setStatus({ type: 'error', message: `Lỗi: ${e.message}` });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- INDIVIDUAL SPLIT LOGIC ---
    const handleNameChange = (index: number, newName: string) => {
        setPageList(prev => {
            const newList = [...prev];
            newList[index] = { ...newList[index], customName: newName };
            return newList;
        });
    };

    const handleDownloadSinglePage = async (pageItem: PageItem) => {
        if (!loadedPdfDoc) return;
        
        try {
            const newPdfDoc = await PDFLib.PDFDocument.create();
            const [copiedPage] = await newPdfDoc.copyPages(loadedPdfDoc, [pageItem.index]);
            newPdfDoc.addPage(copiedPage);
            
            const pdfBytes = await newPdfDoc.save();
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            // Ensure .pdf extension
            const filename = pageItem.customName.toLowerCase().endsWith('.pdf') 
                ? pageItem.customName 
                : `${pageItem.customName}.pdf`;
                
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tải trang này.');
        }
    };
    
    const handlePreviewPage = async (pageItem: PageItem) => {
        if (!loadedPdfDoc) return;
        setPreviewLoading(true);
        setPreviewUrl(null);

        try {
            const newPdfDoc = await PDFLib.PDFDocument.create();
            // Copy only the selected page
            const [copiedPage] = await newPdfDoc.copyPages(loadedPdfDoc, [pageItem.index]);
            newPdfDoc.addPage(copiedPage);
            
            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (error) {
            console.error(error);
            alert('Không thể tạo bản xem trước.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 p-4">
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800">
                <p>Công cụ tách trang PDF và lưu thành file mới ngay trên trình duyệt.</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex justify-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="splitMode" 
                        checked={mode === 'range'} 
                        onChange={() => handleModeSwitch('range')}
                        className="w-4 h-4 text-indigo-600"
                    />
                    <span className="font-semibold">Tách theo khoảng (Range)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="splitMode" 
                        checked={mode === 'individual'} 
                        onChange={() => handleModeSwitch('individual')}
                        className="w-4 h-4 text-indigo-600"
                    />
                    <span className="font-semibold">Tách từng trang (Individual)</span>
                </label>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        1. Chọn file PDF gốc {mode === 'individual' ? '(Tự động phân tích trang)' : ''}
                    </label>
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                </div>

                {mode === 'range' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">2. Trang cần tách (Ví dụ: 1, 3-5, 8)</label>
                            <input 
                                type="text" 
                                value={pageRange}
                                onChange={(e) => setPageRange(e.target.value)}
                                placeholder="Nhập số trang..."
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">3. Tên file mới (Không cần đuôi .pdf)</label>
                            <input 
                                type="text" 
                                value={outputName}
                                onChange={(e) => setOutputName(e.target.value)}
                                placeholder="Nhập tên file..."
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleSplitRange}
                            disabled={isProcessing || !file}
                            className="w-full py-2 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Tách và Tải xuống'}
                        </button>
                    </>
                )}

                {mode === 'individual' && pageList.length > 0 && (
                    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-100 p-2 font-semibold text-gray-700 grid grid-cols-[60px_1fr_80px_100px] gap-2 text-center text-sm">
                            <div>Trang</div>
                            <div>Tên File Mới</div>
                            <div>Xem</div>
                            <div>Tải</div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {pageList.map((page, idx) => (
                                <div key={page.index} className="grid grid-cols-[60px_1fr_80px_100px] gap-2 p-2 border-b last:border-0 items-center hover:bg-gray-50 transition-colors">
                                    <div className="text-center font-bold text-gray-500">{idx + 1}</div>
                                    <input 
                                        type="text" 
                                        value={page.customName}
                                        onChange={(e) => handleNameChange(idx, e.target.value)}
                                        className="p-1 border rounded px-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                                    />
                                    <div className="text-center">
                                         <button 
                                            onClick={() => handlePreviewPage(page)}
                                            disabled={previewLoading}
                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                            title="Xem trước trang này"
                                        >
                                            👁️ Xem
                                        </button>
                                    </div>
                                    <div className="text-center">
                                        <button 
                                            onClick={() => handleDownloadSinglePage(page)}
                                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                        >
                                            ⬇ Tải về
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {status && (
                    <div className={`p-3 rounded-md text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status.message}
                    </div>
                )}
            </div>
            
            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={closePreview}>
                    <div className="bg-white rounded-lg p-4 w-full max-w-2xl max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-lg">Xem trước</h3>
                             <button onClick={closePreview} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
                        </div>
                        <div className="flex-1 bg-gray-100 border rounded-lg overflow-hidden">
                             <iframe src={previewUrl} className="w-full h-[70vh]" title="PDF Page Preview"></iframe>
                        </div>
                    </div>
                </div>
            )}
            
            {previewLoading && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
                        <span className="animate-spin text-xl">⏳</span>
                        <span>Đang tạo bản xem trước...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: UNLOCK PDF TOOL ---
const UnlockPdfTool: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f && f.type === 'application/pdf') {
            setFile(f);
            setStatus(null);
        } else if (f) {
            setStatus({ type: 'error', message: 'Vui lòng chọn file PDF.' });
        }
    };

    const handleUnlock = async () => {
        if (!file) {
            setStatus({ type: 'error', message: 'Vui lòng chọn file PDF.' });
            return;
        }

        setIsProcessing(true);
        setStatus(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            
            // Try loading. If encrypted, pdf-lib throws error if password not provided or wrong.
            // If encrypted with owner password but no user password, it might just open.
            // If user password needed, we pass it.
            
            let pdfDoc;
            try {
                // First try without password (for owner-locked files that open for reading)
                pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            } catch (e) {
                // If failed, try with password
                try {
                     pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { password: password });
                } catch (e2) {
                     throw new Error('Mật khẩu không đúng hoặc file bị mã hóa quá mạnh.');
                }
            }

            // Saving automatically removes encryption unless specifically re-encrypted
            const pdfBytes = await pdfDoc.save();
            
            // Download
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${file.name.replace('.pdf', '')}_unlocked.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setStatus({ type: 'success', message: 'Đã mở khóa và tải xuống thành công!' });

        } catch (error) {
            console.error(error);
            const e = error as Error;
            setStatus({ type: 'error', message: `Lỗi: ${e.message}` });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4">
             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                <p>Công cụ gỡ bỏ mật khẩu và quyền hạn chế (in ấn, copy) của file PDF.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Chọn file PDF bị khóa</label>
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">2. Mật khẩu (Nếu file yêu cầu mật khẩu để mở)</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu (để trống nếu không có)"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nếu bạn có thể mở file để xem nhưng không in/copy được, hãy để trống ô mật khẩu.</p>
                </div>

                {status && (
                    <div className={`p-3 rounded-md text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status.message}
                    </div>
                )}

                <button
                    onClick={handleUnlock}
                    disabled={isProcessing || !file}
                    className="w-full py-2 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Đang xử lý...' : 'Mở khóa và Tải xuống'}
                </button>
            </div>
        </div>
    );
};

export default AiToolContent;
