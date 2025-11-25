
import React, { useState, useEffect } from 'react';

interface BlobFile {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: string;
}

interface FileManagerContentProps {
    back: () => void;
}

const FOLDERS = ['CVHC', 'MBL', 'DONE'];

// Modern Folder Icon Component
const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-yellow-400 drop-shadow-md group-hover:scale-110 transition-transform duration-300">
        <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
    </svg>
);

const FileManagerContent: React.FC<FileManagerContentProps> = ({ back }) => {
    const [allFiles, setAllFiles] = useState<BlobFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

    // Preview Modal State
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'other'>('other');

    const fetchFiles = async () => {
        setIsLoading(true);
        setStatus({ type: 'info', message: 'Đang tải danh sách file...' });
        
        const apiEndpoint = '/api/store';

        try {
            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list' })
            });

            if (res.ok) {
                const data = await res.json();
                // Filter out the JSON database files to prevent accidental deletion
                const validFiles = (data.files || []).filter((f: BlobFile) => !f.pathname.startsWith('db/'));
                setAllFiles(validFiles);
                setStatus(null);
            } else {
                let errorMsg = `Lỗi ${res.status}`;
                try {
                    const errorData = await res.json();
                    if (errorData.details) {
                        errorMsg += `: ${errorData.details}`;
                    } else if (errorData.error) {
                        errorMsg += `: ${errorData.error}`;
                    }
                } catch (e) {
                    // ignore json parse error
                }
                throw new Error(`${errorMsg} (tại ${apiEndpoint})`);
            }
        } catch (error) {
            console.error(error);
            const e = error as Error;
            setStatus({ type: 'error', message: e.message || 'Lỗi kết nối server.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleDelete = async (file: BlobFile) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn file: ${file.pathname}?`)) {
            return;
        }

        setStatus({ type: 'info', message: 'Đang xóa file...' });
        try {
            const res = await fetch('/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: file.url }),
            });

            if (res.ok) {
                setAllFiles(prev => prev.filter(f => f.url !== file.url));
                setStatus({ type: 'success', message: 'Đã xóa file thành công.' });
            } else {
                const err = await res.json();
                throw new Error(err.details || 'Lỗi khi xóa file.');
            }
        } catch (error) {
            const e = error as Error;
            setStatus({ type: 'error', message: e.message });
        }
    };

    const handleForceDownload = async (file: BlobFile) => {
        setDownloadingUrl(file.url);
        setStatus({ type: 'info', message: `Đang tải xuống ${file.pathname}...` });
        
        try {
            const response = await fetch(file.url);
            if (!response.ok) throw new Error("Không thể tải file từ server.");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Extract filename from pathname
            const filename = file.pathname.split('/').pop() || 'downloaded_file';
            a.download = filename;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setStatus({ type: 'success', message: 'Tải xuống hoàn tất.' });
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Lỗi tải xuống. Vui lòng thử lại.' });
        } finally {
            setDownloadingUrl(null);
        }
    };

    const handlePreview = (file: BlobFile) => {
        const ext = file.pathname.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
            setPreviewType('image');
        } else if (ext === 'pdf') {
            setPreviewType('pdf');
        } else {
            setPreviewType('other');
        }
        setPreviewUrl(file.url);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const statusColor = {
        success: 'text-green-300 bg-green-500/20 border-green-500/50',
        error: 'text-red-300 bg-red-500/20 border-red-500/50',
        info: 'text-blue-300 bg-blue-500/20 border-blue-500/50',
    };

    // --- RENDER LOGIC ---

    // 1. Filter files based on current folder
    const displayedFiles = currentFolder 
        ? allFiles.filter(f => f.pathname.startsWith(`${currentFolder}/`))
        : [];

    return (
        <div className="space-y-6 relative min-h-[500px]">
            {/* NAVIGATION HEADER */}
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setCurrentFolder(null)}
                        className={`font-semibold transition-colors flex items-center gap-2 ${!currentFolder ? 'text-green-300 underline' : 'text-gray-400 hover:text-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                        Thư mục gốc
                    </button>
                    {currentFolder && (
                        <>
                            <span className="text-gray-500">/</span>
                            <span className="font-bold text-white text-lg tracking-wide">{currentFolder}</span>
                        </>
                    )}
                </div>
                <button 
                    onClick={fetchFiles} 
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors text-white border border-white/20"
                >
                    <span className={`${isLoading ? 'animate-spin' : ''}`}>🔄</span>
                    {isLoading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {status && <div className={`p-4 rounded-xl border backdrop-blur-md shadow-lg ${statusColor[status.type]}`}>{status.message}</div>}

            {!currentFolder ? (
                // --- FOLDER VIEW ---
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {FOLDERS.map(folder => {
                        const count = allFiles.filter(f => f.pathname.startsWith(`${folder}/`)).length;
                        return (
                            <div 
                                key={folder}
                                onClick={() => setCurrentFolder(folder)}
                                className="bg-white/5 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/10 cursor-pointer hover:bg-white/10 hover:-translate-y-2 transition-all flex flex-col items-center text-center group"
                            >
                                <FolderIcon />
                                <h3 className="text-2xl font-bold text-white mt-4">{folder}</h3>
                                <p className="text-gray-400 text-sm mt-2">{count} files</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // --- FILE LIST VIEW ---
                <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/10 text-green-300 uppercase">
                                <tr>
                                    <th className="p-4 font-bold">Tên File</th>
                                    <th className="p-4 font-bold">Kích thước</th>
                                    <th className="p-4 font-bold">Ngày tải lên</th>
                                    <th className="p-4 font-bold text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-200">
                                {displayedFiles.map((file) => (
                                    <tr key={file.url} className="border-b border-white/10 hover:bg-white/5 transition-colors last:border-0 group">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    <span className="font-medium text-white break-all hover:text-green-300 transition-colors cursor-default">
                                                        {file.pathname.replace(`${currentFolder}/`, '')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap font-mono text-gray-400">{formatSize(file.size)}</td>
                                        <td className="p-4 whitespace-nowrap text-gray-400">{new Date(file.uploadedAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handlePreview(file)}
                                                    className="p-2 text-blue-400 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
                                                    title="Xem trước"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleForceDownload(file)}
                                                    disabled={downloadingUrl === file.url}
                                                    className="p-2 text-green-400 hover:text-white hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Tải xuống"
                                                >
                                                    {downloadingUrl === file.url ? <span className="animate-spin h-5 w-5 block border-2 border-current border-t-transparent rounded-full"></span> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(file)}
                                                    className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {displayedFiles.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-gray-500 bg-white/5">
                                            <p className="mb-2 text-2xl">🗑️</p>
                                            Thư mục này trống.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
                    <div className="bg-gray-900 rounded-2xl p-2 w-full max-w-5xl max-h-[95vh] flex flex-col relative border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 mb-2">
                             <h3 className="text-white font-semibold">Xem trước</h3>
                             <button 
                                onClick={() => setPreviewUrl(null)} 
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto flex items-center justify-center bg-black/50 rounded-xl relative">
                            {previewType === 'image' && (
                                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                            )}
                            {previewType === 'pdf' && (
                                <iframe src={previewUrl} className="w-full h-[80vh] rounded-lg" title="PDF Preview"></iframe>
                            )}
                            {previewType === 'other' && (
                                <div className="text-center p-10">
                                    <p className="text-gray-400 mb-6">Không hỗ trợ xem trước định dạng này.</p>
                                    <a 
                                        href={previewUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold"
                                    >
                                        Mở trong tab mới
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default FileManagerContent;
