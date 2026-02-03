import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, AlertTriangle } from 'lucide-react';
import { expensesService, type Expense, type ExpenseCategory } from '../services/expenses.service';

const ExpenseEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [originalExpense, setOriginalExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    category_id: '',
    expense_item: '',
    description: '',
    amount: 0,
    payment_mode: 'Cash',
    payment_voucher_number: '',
    remarks: '',
    expense_date: '',
    paid_by_id: '',
    paid_by_name: '',
    branch: ''
  });

  useEffect(() => {
    if (id) {
      fetchExpenseAndCategories();
    }
  }, [id]);

  const fetchExpenseAndCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch expense and categories in parallel
      const [expenseResponse, categoriesResponse] = await Promise.all([
        expensesService.getExpenseById(id!),
        expensesService.getExpenseCategories()
      ]);

      const expense = expenseResponse.data || expenseResponse;
      const categoriesData = categoriesResponse.data?.data || categoriesResponse.data || categoriesResponse || [];

      // Check if expense can be edited
      if (expense.approval_status !== 'Pending') {
        setError('Only pending expenses can be edited');
        return;
      }

      setOriginalExpense(expense);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setFormData({
        category_id: expense.category_id || '',
        expense_item: expense.expense_item || '',
        description: expense.description || expense.notes || '',
        amount: expense.amount || 0,
        payment_mode: expense.payment_mode || 'Cash',
        payment_voucher_number: expense.payment_voucher_number || '',
        remarks: expense.remarks || '',
        expense_date: expense.expense_date?.split('T')[0] || '',
        paid_by_id: expense.paid_by_id || '',
        paid_by_name: expense.paid_by_name || '',
        branch: expense.branch || ''
      });
    } catch (err: any) {
      console.error('Error fetching expense:', err);
      setError(err.message || 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only images and PDFs are allowed.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id || !formData.expense_item || !formData.amount || formData.amount <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    setSaving(true);
    try {
      await expensesService.updateExpense(id!, formData, selectedFile);
      alert('Expense updated successfully!');
      navigate(`/expenses/${id}`);
    } catch (err: any) {
      console.error('Error updating expense:', err);
      alert(err.response?.data?.error || err.message || 'Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Expenses</span>
          </button>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-1">Cannot Edit Expense</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => navigate(`/expenses/${id}`)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                View Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/expenses/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Expense</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Expense</h1>
          <p className="text-gray-600 mt-1">
            {originalExpense?.expense_number}
          </p>
        </div>

        {/* Pending status notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle size={16} className="text-orange-600" />
          </div>
          <div>
            <p className="text-orange-800 font-medium">Pending Approval</p>
            <p className="text-orange-600 text-sm">
              This expense can be edited until it is approved or rejected
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expense Item */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Item/Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="expense_item"
                value={formData.expense_item}
                onChange={handleChange}
                required
                placeholder="e.g., Team Lunch, Office Supplies, Fuel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Payment Voucher Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Voucher Number
              </label>
              <input
                type="text"
                name="payment_voucher_number"
                value={formData.payment_voucher_number}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g., Head Office, Branch 1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Paid By Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid By
              </label>
              <input
                type="text"
                name="paid_by_name"
                value={formData.paid_by_name}
                onChange={handleChange}
                placeholder="Employee name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Additional Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details/Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add any additional details about this expense..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks/Notes
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={2}
                placeholder="Any internal notes or remarks..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Current Voucher */}
            {originalExpense?.voucher_file_name && !selectedFile && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Voucher/Receipt
                </label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    📎 {originalExpense.voucher_file_name}
                  </p>
                </div>
              </div>
            )}

            {/* Upload New Voucher */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {originalExpense?.voucher_file_name ? 'Replace Voucher/Receipt' : 'Upload Voucher/Receipt'}
              </label>

              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="voucher-upload"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="voucher-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-600 font-medium">Click to upload voucher/receipt</p>
                    <p className="text-xs text-gray-400 mt-1">Images (JPEG, PNG, GIF, WEBP) or PDF (Max 5MB)</p>
                  </label>
                </div>
              ) : (
                <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {filePreview ? (
                        <div className="mb-3">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="max-h-40 rounded border border-gray-300"
                          />
                        </div>
                      ) : (
                        <div className="mb-3 p-4 bg-white rounded border border-gray-300">
                          <p className="text-sm text-gray-600">📄 PDF Document</p>
                        </div>
                      )}
                      <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="ml-4 px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(`/expenses/${id}`)}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseEditPage;
