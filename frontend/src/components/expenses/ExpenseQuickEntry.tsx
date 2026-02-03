import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Image,
  X,
  ArrowLeft,
  ChevronRight,
  Check,
  Plus,
  List,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  Edit2
} from 'lucide-react';
import { expensesService, type Expense, type ExpenseCategory } from '../../services/expenses.service';
import NumericKeypad from './NumericKeypad';
import CategoryIconGrid from './CategoryIconGrid';
import SwipeToSubmit from './SwipeToSubmit';

type Step = 'capture' | 'amount' | 'category' | 'payment' | 'review' | 'success';

const AUTO_APPROVAL_THRESHOLD = 2000; // INR

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', icon: Banknote, color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'Debit Card', label: 'Debit', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'Credit Card', label: 'Credit', icon: CreditCard, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'Bank Transfer', label: 'Bank', icon: Building2, color: 'text-gray-600', bgColor: 'bg-gray-100' },
] as const;

const ExpenseQuickEntry = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Step state
  const [step, setStep] = useState<Step>('capture');

  // Form data
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [amount, setAmount] = useState('0');
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Result state
  const [createdExpense, setCreatedExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await expensesService.getExpenseCategories();
        const data = response.data?.data || response.data || response || [];
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const triggerHaptic = (duration: number = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  // File handling
  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only images and PDFs allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Max 5MB allowed.');
        return;
      }

      setCapturedImage(file);
      setError(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }

      triggerHaptic(20);
      setStep('amount');
    }
  };

  const handleSkipCapture = () => {
    triggerHaptic(10);
    setStep('amount');
  };

  // Amount handling
  const handleDigit = (digit: string) => {
    setAmount(prev => {
      if (prev === '0') return digit;
      if (prev.length >= 8) return prev; // Max 8 digits
      return prev + digit;
    });
  };

  const handleDelete = () => {
    setAmount(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setAmount('0');
  };

  // Category selection
  const handleCategorySelect = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    triggerHaptic(10);
    // Auto-advance after short delay
    setTimeout(() => setStep('payment'), 150);
  };

  // Payment method selection
  const handlePaymentSelect = (method: string) => {
    setPaymentMethod(method);
    triggerHaptic(10);
    // Auto-advance after short delay
    setTimeout(() => setStep('review'), 150);
  };

  // Submit expense
  const handleSubmit = async () => {
    if (!selectedCategory || !paymentMethod || parseFloat(amount) <= 0) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const expenseData: Partial<Expense> = {
        category_id: selectedCategory.id,
        expense_item: notes || selectedCategory.category_name,
        amount: parseFloat(amount),
        payment_mode: paymentMethod as Expense['payment_mode'],
        expense_date: new Date().toISOString().split('T')[0],
        paid_by_id: 'c749c5f6-aee0-4191-8869-0e98db3c09ec', // Default user
        paid_by_name: 'Admin User',
        branch: 'Head Office',
        description: notes || undefined
      };

      const response = await expensesService.createExpense(expenseData as any, capturedImage);
      const created = response.data || response;
      setCreatedExpense(created);
      triggerHaptic(50);
      setStep('success');
    } catch (err: any) {
      console.error('Error creating expense:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  // Navigation helpers
  const goBack = () => {
    triggerHaptic(10);
    switch (step) {
      case 'amount':
        setStep('capture');
        break;
      case 'category':
        setStep('amount');
        break;
      case 'payment':
        setStep('category');
        break;
      case 'review':
        setStep('payment');
        break;
      default:
        navigate('/expenses');
    }
  };

  const goToStep = (targetStep: Step) => {
    triggerHaptic(10);
    setStep(targetStep);
  };

  const resetAndAddAnother = () => {
    setCapturedImage(null);
    setImagePreview(null);
    setAmount('0');
    setSelectedCategory(null);
    setPaymentMethod('');
    setNotes('');
    setCreatedExpense(null);
    setError(null);
    setStep('capture');
  };

  const isAutoApproved = parseFloat(amount) < AUTO_APPROVAL_THRESHOLD;

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 'capture':
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button onClick={() => navigate('/expenses')} className="p-2 -ml-2">
                <X size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Add Expense</h1>
              <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Capture Receipt</h2>
                <p className="text-gray-500">Take a photo or select from gallery</p>
              </div>

              {/* Camera button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <Camera size={36} />
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileCapture}
                className="hidden"
              />

              {/* Gallery button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 text-gray-700 font-medium active:bg-gray-200 transition-colors"
              >
                <Image size={20} />
                <span>Choose from Gallery</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileCapture}
                className="hidden"
              />

              {/* Skip option */}
              <button
                onClick={handleSkipCapture}
                className="text-gray-400 text-sm underline mt-4"
              >
                Skip - No receipt
              </button>
            </div>
          </div>
        );

      case 'amount':
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button onClick={goBack} className="p-2 -ml-2">
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Enter Amount</h1>
              <div className="w-10" />
            </div>

            {/* Receipt preview */}
            {imagePreview && (
              <div className="p-4 flex justify-center">
                <img
                  src={imagePreview}
                  alt="Receipt"
                  className="h-24 rounded-lg shadow-md object-cover"
                />
              </div>
            )}

            {/* Amount display */}
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <span className="text-gray-500 text-lg mb-2">INR</span>
              <div className="text-5xl font-bold text-gray-900 tracking-tight">
                {parseFloat(amount).toLocaleString('en-IN')}
              </div>
              {parseFloat(amount) > 0 && parseFloat(amount) < AUTO_APPROVAL_THRESHOLD && (
                <span className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  Will be auto-approved
                </span>
              )}
            </div>

            {/* Keypad */}
            <div className="bg-gray-50 border-t border-gray-200">
              <NumericKeypad
                onDigit={handleDigit}
                onDelete={handleDelete}
                onClear={handleClear}
              />
            </div>

            {/* Continue button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setStep('category')}
                disabled={parseFloat(amount) <= 0}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        );

      case 'category':
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button onClick={goBack} className="p-2 -ml-2">
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Select Category</h1>
              <div className="w-10" />
            </div>

            {/* Amount summary */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 text-center">
              <span className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(amount).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Category grid */}
            <div className="flex-1 overflow-y-auto">
              <CategoryIconGrid
                categories={categories}
                onSelect={handleCategorySelect}
                selectedId={selectedCategory?.id}
                maxCategories={6}
              />
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button onClick={goBack} className="p-2 -ml-2">
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Payment Method</h1>
              <div className="w-10" />
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="text-gray-600">{selectedCategory?.category_name}</span>
              <span className="text-xl font-bold text-gray-900">
                ₹{parseFloat(amount).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Payment methods */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const IconComponent = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => handlePaymentSelect(method.id)}
                      className={`
                        flex flex-col items-center gap-3 p-5 rounded-xl border-2
                        transition-all active:scale-95
                        ${isSelected
                          ? `border-blue-500 ${method.bgColor} ring-2 ring-blue-500`
                          : 'border-gray-200 bg-white'
                        }
                      `}
                    >
                      <div className={`w-12 h-12 rounded-full ${method.bgColor} flex items-center justify-center`}>
                        <IconComponent size={24} className={method.color} />
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notes field */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What was this expense for?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button onClick={goBack} className="p-2 -ml-2">
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Review & Submit</h1>
              <div className="w-10" />
            </div>

            {/* Summary card */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Receipt preview */}
                {imagePreview && (
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Receipt"
                      className="h-32 rounded-lg shadow object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="p-4 space-y-4">
                  {/* Amount */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Amount</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{parseFloat(amount).toLocaleString('en-IN')}
                      </span>
                      {isAutoApproved && (
                        <span className="block text-xs text-green-600 mt-1">Auto-approved</span>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Category</span>
                    <button
                      onClick={() => goToStep('category')}
                      className="flex items-center gap-1 text-gray-900 font-medium"
                    >
                      {selectedCategory?.category_name}
                      <Edit2 size={14} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Payment */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment</span>
                    <button
                      onClick={() => goToStep('payment')}
                      className="flex items-center gap-1 text-gray-900 font-medium"
                    >
                      {paymentMethod}
                      <Edit2 size={14} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Notes */}
                  {notes && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500">Notes</span>
                      <span className="text-gray-900 text-right max-w-[60%]">{notes}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Date</span>
                    <span className="text-gray-900">
                      {new Date().toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Swipe to submit */}
            <div className="p-4 border-t border-gray-200">
              <SwipeToSubmit
                onSubmit={handleSubmit}
                disabled={loading}
                label="Swipe to Submit"
                successLabel="Submitted!"
              />
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col h-full items-center justify-center p-8">
            {/* Success animation */}
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-bounce">
              <Check size={48} className="text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Expense Added!</h2>
            <p className="text-gray-500 text-center mb-4">
              {createdExpense?.expense_number}
            </p>

            {/* Status pill */}
            <div className={`
              px-4 py-2 rounded-full text-sm font-semibold mb-8
              ${createdExpense?.approval_status === 'Approved'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
              }
            `}>
              {createdExpense?.approval_status === 'Approved'
                ? 'Auto-Approved'
                : 'Pending Approval'
              }
            </div>

            {/* Amount */}
            <div className="text-3xl font-bold text-gray-900 mb-8">
              ₹{parseFloat(amount).toLocaleString('en-IN')}
            </div>

            {/* Actions */}
            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={resetAndAddAnother}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                <span>Add Another</span>
              </button>
              <button
                onClick={() => navigate('/expenses')}
                className="w-full py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <List size={20} />
                <span>View All Expenses</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {renderStep()}
    </div>
  );
};

export default ExpenseQuickEntry;
