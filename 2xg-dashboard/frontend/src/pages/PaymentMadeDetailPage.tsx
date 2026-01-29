
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Printer,
    Calendar,
    User,
    FileText,
    CreditCard,
    CheckCircle,
    Clock
} from 'lucide-react';
import { paymentsService, PaymentMade } from '../services/payments.service';

const PaymentMadeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [payment, setPayment] = useState<PaymentMade | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPaymentDetails();
    }, [id]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);
            const response = await paymentsService.getPaymentById(id!);
            if (response.success && response.data) {
                setPayment(response.data);
            } else {
                console.error('Failed to fetch payment:', response.message);
            }
        } catch (error) {
            console.error('Error fetching payment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this payment?')) {
            try {
                await paymentsService.deletePayment(id!);
                navigate('/purchases/payments-made');
            } catch (error) {
                console.error('Error deleting payment:', error);
                alert('Failed to delete payment');
            }
        }
    };

    const handlePrint = () => {
        window.print();
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Payment not found</h2>
                    <button
                        onClick={() => navigate('/purchases/payments-made')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Back to Payments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 print:hidden">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/purchases/payments-made')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{payment.payment_number}</h1>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                                        {payment.status === 'completed' && <CheckCircle size={14} />}
                                        {payment.status === 'pending' && <Clock size={14} />}
                                        <span className="capitalize">{payment.status}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Print"
                            >
                                <Printer size={20} className="text-gray-600" />
                            </button>
                            <button
                                onClick={() => navigate(`/purchases/payments-made/edit/${id}`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Edit size={16} />
                                Edit
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
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                Payment Information
                            </h2>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Vendor Name</p>
                                    <p className="font-medium text-lg text-gray-900 flex items-center gap-2">
                                        <User size={16} className="text-gray-400" />
                                        {payment.vendor_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                                    <p className="font-bold text-xl text-green-600">
                                        {formatCurrency(payment.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Payment Date</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-400" />
                                        {formatDate(payment.payment_date)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Payment Mode</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <CreditCard size={16} className="text-gray-400" />
                                        {payment.payment_mode}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Reference Number</p>
                                    <p className="font-medium text-gray-900">
                                        {payment.reference_number || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Payment ID</p>
                                    <p className="font-medium text-gray-900 text-sm font-mono">
                                        {payment.id}
                                    </p>
                                </div>
                            </div>

                            {payment.notes && (
                                <div className="mt-6 pt-6 border-t">
                                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                                        {payment.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Summary */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b">
                                    <span className="text-gray-600">Amount Paid</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
                                </div>
                                {payment.bank_charges > 0 && (
                                    <div className="flex justify-between items-center pb-4 border-b">
                                        <span className="text-gray-600">Bank Charges</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(payment.bank_charges)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-gray-900">Total Outflow</span>
                                    <span className="font-bold text-xl text-blue-600">
                                        {formatCurrency(payment.amount + (payment.bank_charges || 0))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                            <h3 className="text-blue-800 font-semibold mb-2">Help & Support</h3>
                            <p className="text-sm text-blue-600 mb-4">
                                Need help with this payment record? Contact the finance team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentMadeDetailPage;
