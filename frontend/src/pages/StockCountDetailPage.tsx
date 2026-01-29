import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Printer,
    Calendar,
    User,
    MapPin,
    CheckCircle,
    Clock,
    Package
} from 'lucide-react';
import { stockCountService, StockCount } from '../services/stockCount.service';

const StockCountDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [stockCount, setStockCount] = useState<StockCount | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStockCountDetails();
    }, [id]);

    const fetchStockCountDetails = async () => {
        try {
            setLoading(true);
            const data = await stockCountService.getStockCountById(id!);
            if (data) {
                setStockCount(data);
            } else {
                console.error('Stock count not found');
            }
        } catch (error) {
            console.error('Error fetching stock count:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this stock count?')) {
            try {
                await stockCountService.deleteStockCount(id!);
                navigate('/items/stock-count');
            } catch (error) {
                console.error('Error deleting stock count:', error);
                alert('Failed to delete stock count');
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!stockCount) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Stock Count not found</h2>
                    <button
                        onClick={() => navigate('/items/stock-count')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Back to Stock Counts
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
                                onClick={() => navigate('/items/stock-count')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{stockCount.stockCountNumber}</h1>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(stockCount.status)}`}>
                                        {stockCount.status === 'Completed' && <CheckCircle size={14} />}
                                        {stockCount.status === 'In Progress' && <Clock size={14} />}
                                        <span className="capitalize">{stockCount.status}</span>
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
                                onClick={() => navigate(`/items/stock-count/edit/${id}`)}
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
                                <Package size={20} className="text-blue-600" />
                                Count Details
                            </h2>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Description</p>
                                    <p className="font-medium text-gray-900">{stockCount.description}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Date Created</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-400" />
                                        {formatDate(stockCount.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Location</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <MapPin size={16} className="text-gray-400" />
                                        {stockCount.location}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <User size={16} className="text-gray-400" />
                                        {stockCount.assignTo}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    Items ({stockCount.items.length})
                                </h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Item Name</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">SKU</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Current Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {stockCount.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.sku}</td>
                                            <td className="px-6 py-4 text-right text-gray-900">{item.currentStock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                    <span className="text-gray-600">Total Items</span>
                                    <span className="font-medium text-gray-900">{stockCount.items.length}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-600">Status</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(stockCount.status)}`}>
                                        {stockCount.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockCountDetailPage;
