import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { expensesService, type Expense, type ExpenseCategory } from '../../services/expenses.service';

const NewExpenseForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    category_id: '',
    expense_item: '',
    description: '',
    amount: 0,
    payment_mode: 'Cash',
    payment_voucher_number: '',
    remarks: '',
    expense_date: new Date().toISOString().split('T')[0],
    paid_by_id: 'c749c5f6-aee0-4191-8869-0e98db3c09ec', // Default user ID
    paid_by_name: 'Admin User',
    branch: 'Head Office'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await expensesService.getExpenseCategories();
      const categoriesData = response.data?.data || response.data || response;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and PDFs are allowed.');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
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

    // Validate required fields
    if (!formData.category_id || !formData.expense_item || !formData.amount || formData.amount <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    setLoading(true);
    try {
      const response = await expensesService.createExpense(formData as any, selectedFile);
      const createdExpense = response.data || response;

      alert(`Expense created successfully!\nExpense Number: ${createdExpense.expense_number}\nAmount: ₹${formData.amount.toLocaleString()}`);
      navigate('/expenses');
    } catch (error: any) {
      console.error('Error creating expense:', error);
      alert(error.response?.data?.error || error.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Expenses</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Expense</h1>
          <p className="text-gray-600 mt-1">Record a new business expense</p>
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
                <option value="Admin User">Admin User</option>
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

            {/* Upload Voucher */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Voucher/Receipt
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
              onClick={() => navigate('/expenses')}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={20} />
              <span>{loading ? 'Saving...' : 'Save Expense'}</span>
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Note:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• All expenses require approval before being finalized</li>
            <li>• Upload vouchers/receipts for better record keeping (coming soon)</li>
            <li>• Ensure all amounts are accurate and payment modes are correct</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NewExpenseForm;
