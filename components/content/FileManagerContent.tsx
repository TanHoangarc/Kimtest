
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

const FileManagerContent: React.FC<FileManagerContentProps> = ({ back }) => {
    const [files, setFiles] = useState<BlobFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    
    // Preview Modal State
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'other'>('other');

    const fetchFiles = async () => {
        setIsLoading(true);
        setStatus({ type: 'info', message: 'Đang tải danh sách file...' });
        
        const apiEndpoint = '/api/store';

        try {
            // Use POST instead of GET to avoid query parameter routing issues (404s)
            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list' })
            });

            if (res.ok) {
                const data = await res.json();
                // Filter out the JSON database files to prevent accidental deletion
                const validFiles = (data.files || []).filter((f: BlobFile) => !f.pathname.startsWith('db/'));
                setFiles(validFiles);
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
                setFiles(prev => prev.filter(f => f.url !== file.url));
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
        success: 'text-green-600 bg-green-100 border-green-300',
        error: 'text-red-600 bg-red-100 border-red-300',
        info: 'text-blue-600 bg-blue-100 border-blue-300',
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <p className="text-gray-600">Quản lý tất cả các file đã tải lên Vercel Blob.</p>
                <button 
                    onClick={fetchFiles} 
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium transition-colors"
                >
                    <span className={`${isLoading ? 'animate-spin' : ''}`}>🔄</span>
                    {isLoading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {status && <div className={`p-3 rounded-md border ${statusColor[status.type]}`}>{status.message}</div>}

            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-3 font-semibold">Tên File (Path)</th>
                                <th className="p-3 font-semibold">Kích thước</th>
                                <th className="p-3 font-semibold">Ngày tải lên</th>
                                <th className="p-3 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.url} className="border-b hover:bg-gray-50 last:border-0">
                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 break-all">{file.pathname}</span>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 truncate max-w-xs">{file.url}</a>
                                        </div>
                                    </td>
                                    <td className="p-3 whitespace-nowrap">{formatSize(file.size)}</td>
                                    <td className="p-3 whitespace-nowrap">{new Date(file.uploadedAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                        <div className="flex justify-end items-center gap-2">
                                            <button 
                                                onClick={() => handlePreview(file)}
                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold"
                                            >
                                                Xem
                                            </button>
                                            <a 
                                                href={file.url} 
                                                download 
                                                className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold flex items-center"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                ⬇ Tải
                                            </a>
                                            <button 
                                                onClick={() => handleDelete(file)}
                                                className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {files.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">
                                        {status && status.type === 'error' ? 'Không thể kết nối API.' : 'Thư mục trống hoặc không có file nào (trừ file hệ thống).'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
                    <div className="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setPreviewUrl(null)} 
                            className="absolute top-2 right-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-full z-10"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-semibold mb-2">Xem trước</h3>
                        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 rounded border">
                            {previewType === 'image' && (
                                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain" />
                            )}
                            {previewType === 'pdf' && (
                                <iframe src={previewUrl} className="w-full h-[70vh]" title="PDF Preview"></iframe>
                            )}
                            {previewType === 'other' && (
                                <div className="text-center p-10">
                                    <p className="text-gray-500 mb-4">Không hỗ trợ xem trước định dạng này.</p>
                                    <a 
                                        href={previewUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Mở trong tab mới
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileManagerContent;
