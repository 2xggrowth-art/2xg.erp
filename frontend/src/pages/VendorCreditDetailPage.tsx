import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Trash2,
    Printer,
    Calendar,
    Building2,
    Package,
    DollarSign,
    FileText,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';
import { vendorCreditsService, VendorCredit } from '../services/vendor-credits.service';
import { openVendorCreditPDFInNewTab } from '../utils/pdfGenerators/vendorCreditPDF';

const VendorCreditDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [credit, setCredit] = useState<VendorCredit | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');

    useEffect(() => {
        fetchCreditDetails();
    }, [id]);

    const fetchCreditDetails = async () => {
        try {
            setLoading(true);
            const response = await vendorCreditsService.getVendorCreditById(id!);
            if (response.success && response.data) {
                setCredit(response.data);
            } else {
                console.error('Failed to fetch vendor credit:', response.message);
                setCredit(null);
            }
        } catch (error) {
            console.error('Error fetching vendor credit:', error);
            setCredit(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <FileText size={16} />, label: 'Draft' },
            open: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock size={16} />, label: 'Open' },
            closed: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={16} />, label: 'Closed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={16} />, label: 'Cancelled' },
        };
        return configs[status] || configs.draft;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this vendor credit?')) {
            try {
                await vendorCreditsService.deleteVendorCredit(id!);
                navigate('/purchases/vendor-credits');
            } catch (error) {
                console.error('Error deleting vendor credit:', error);
                alert('Failed to delete vendor credit');
            }
        }
    };

    const handleDownloadPDF = () => {
        if (credit) {
            try {
                openVendorCreditPDFInNewTab(credit);
            } catch (error) {
                console.error('Error generating PDF', error);
                alert('Failed to generate PDF');
            }
        }
    };

    const lineItems = credit?.items || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!credit) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Vendor Credit not found</h2>
                    <button
                        onClick={() => navigate('/purchases/vendor-credits')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Back to Vendor Credits
                    </button>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(credit.status);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/purchases/vendor-credits')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{credit.credit_number}</h1>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                                        {statusConfig.icon}
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {credit.reference_number && `Ref: ${credit.reference_number}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownloadPDF}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Download/Print PDF"
                            >
                                <Printer size={20} className="text-gray-600" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-4 border-b -mb-4">
                        {['details', 'notes'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-4 px-1 font-medium capitalize transition-colors ${activeTab === tab
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div id="credit-content" className="max-w-7xl mx-auto px-6 py-6">
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Vendor Info */}
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building2 size={20} className="text-blue-600" />
                                    Vendor Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Vendor Name</p>
                                        <p className="font-medium text-gray-900">{credit.vendor_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium text-gray-900">{credit.vendor_email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium text-gray-900">{credit.vendor_phone || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-6 border-b">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Package size={20} className="text-blue-600" />
                                        Credit Items ({lineItems.length})
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {lineItems.map((item, index) => (
                                                <tr key={item.id || index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-900">{item.item_name}</p>
                                                        {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-900">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.rate)}</td>
                                                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Credit Summary */}
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign size={20} className="text-blue-600" />
                                    Credit Summary
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-900">{formatCurrency(credit.subtotal)}</span>
                                    </div>
                                    {credit.tax_amount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tax</span>
                                            <span className="text-gray-900">{formatCurrency(credit.tax_amount)}</span>
                                        </div>
                                    )}
                                    {credit.adjustment !== 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Adjustment</span>
                                            <span className="text-gray-900">{formatCurrency(credit.adjustment)}</span>
                                        </div>
                                    )}
                                    <hr />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Credit</span>
                                        <span className="text-blue-600">{formatCurrency(credit.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>Amount Used</span>
                                        <span>{formatCurrency(credit.amount_used || 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-orange-600 text-lg">
                                        <span>Balance</span>
                                        <span>{formatCurrency(credit.balance || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar size={20} className="text-purple-600" />
                                    Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Credit Date</p>
                                        <p className="font-medium text-gray-900">{formatDate(credit.credit_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Order Number</p>
                                        <p className="font-medium text-gray-900">{credit.order_number || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Created At</p>
                                        <p className="font-medium text-gray-900">{new Date(credit.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes & Attachments</h3>
                        <div className="prose max-w-none text-gray-700">
                            <p>{credit.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorCreditDetailPage;
