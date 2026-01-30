import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BrandManufacturerUploadModalProps {
    onClose: () => void;
    onUpload: (data: { brands: any[], manufacturers: any[] }) => Promise<any>;
    onDownloadTemplate?: () => void;
}

const BrandManufacturerUploadModal: React.FC<BrandManufacturerUploadModalProps> = ({
    onClose,
    onUpload,
    onDownloadTemplate
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'validating' | 'uploading' | 'complete' | 'error'>('idle');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setStatus('validating');

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

                    if (jsonData.length === 0) {
                        setError('No data found in the file.');
                        setStatus('error');
                        return;
                    }

                    const brands: any[] = [];
                    const manufacturers: any[] = [];
                    const seenBrands = new Set();
                    const seenManufacturers = new Set();

                    jsonData.forEach(row => {
                        // Parse BRAND column
                        const brandName = row['BRAND'] || row['Brand'] || row['brand'];
                        if (brandName && typeof brandName === 'string' && brandName.trim() !== '') {
                            const trimmed = brandName.trim();
                            if (!seenBrands.has(trimmed.toLowerCase())) {
                                brands.push({ name: trimmed });
                                seenBrands.add(trimmed.toLowerCase());
                            }
                        }

                        // Parse MANUFACTURES column
                        const mfrName = row['MANUFACTURES'] || row['Manufactures'] || row['manufactures'] || row['MANUFACTURER'] || row['Manufacturer'];
                        if (mfrName && typeof mfrName === 'string' && mfrName.trim() !== '') {
                            const trimmed = mfrName.trim();
                            if (!seenManufacturers.has(trimmed.toLowerCase())) {
                                manufacturers.push({ name: trimmed });
                                seenManufacturers.add(trimmed.toLowerCase());
                            }
                        }
                    });

                    if (brands.length === 0 && manufacturers.length === 0) {
                        setError('No valid "BRAND" or "MANUFACTURES" columns found.');
                        setStatus('error');
                        return;
                    }

                    setStatus('uploading');
                    const response = await onUpload({ brands, manufacturers });
                    setResult(response);
                    setStatus('complete');

                } catch (err: any) {
                    console.error('Parsing error:', err);
                    setError('Failed to parse file. Please ensure it is a valid Excel file.');
                    setStatus('error');
                }
            };
            reader.readAsBinaryString(file);

        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed');
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Import Brands & Manufacturers</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Template Download */}
                    {onDownloadTemplate && (
                        <button
                            onClick={onDownloadTemplate}
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1 mb-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Download Template (Excel)
                        </button>
                    )}

                    {status !== 'complete' ? (
                        <>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-600">
                                        {file ? file.name : 'Click to select Excel file'}
                                    </span>
                                </label>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || status === 'uploading'}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {status === 'uploading' ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Upload'
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Import Successful</h4>
                            <p className="text-sm text-gray-600 mb-6">
                                Successfully uploaded data.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandManufacturerUploadModal;
