import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { invoicesService, InvoiceItem } from '../../services/invoices.service';
import { customersService, Customer } from '../../services/customers.service';
import { itemsService, Item } from '../../services/items.service';
import ManageTDSModal from './ManageTDSModal';
import ManageTCSModal from './ManageTCSModal';

interface Location {
  id: string;
  name: string;
  address?: string;
}

interface Salesperson {
  id: string;
  name: string;
  email: string;
}

interface TDSTax {
  id: string;
  name: string;
  rate: number;
  section: string;
  status: 'Active' | 'Inactive';
}

interface TCSTax {
  id: string;
  name: string;
  rate: number;
  natureOfCollection: string;
  status: 'Active' | 'Inactive';
}

const NewInvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([
    { id: '1', name: 'Zaheer', email: 'mohd.Zaheer@gmail.com' },
    { id: '2', name: 'ssss', email: 'sss@gmail.com' },
    { id: '3', name: 'serdty', email: 'esrty@gmail.com' }
  ]);
  const [locations] = useState<Location[]>([
    { id: '1', name: 'Head Office', address: 'Karnataka, Bangalore, Karnataka, India - 560001' }
  ]);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);
  const [showAddSalespersonForm, setShowAddSalespersonForm] = useState(false);
  const [newSalesperson, setNewSalesperson] = useState({ name: '', email: '' });
  const [salespersonSearch, setSalespersonSearch] = useState('');
  const [showTDSModal, setShowTDSModal] = useState(false);
  const [selectedTDSTax, setSelectedTDSTax] = useState<string>('');
  const [showTCSModal, setShowTCSModal] = useState(false);
  const [selectedTCSTax, setSelectedTCSTax] = useState<string>('');

  // TDS Tax Options (matching Zoho Inventory)
  const [tdsTaxes, setTdsTaxes] = useState<TDSTax[]>([
    { id: '1', name: 'Commission or Brokerage [2%]', rate: 2, section: 'Section 194 H', status: 'Active' },
    { id: '2', name: 'Commission or Brokerage (Reduced) [3.75%]', rate: 3.75, section: 'Section 194 H', status: 'Active' },
    { id: '3', name: 'Dividend [10%]', rate: 10, section: 'Section 194', status: 'Active' },
    { id: '4', name: 'Dividend (Reduced) [7.5%]', rate: 7.5, section: 'Section 194', status: 'Active' },
    { id: '5', name: 'Other Interest than securities [10%]', rate: 10, section: 'Section 194 A', status: 'Active' },
    { id: '6', name: 'Other Interest than securities (Reduced) [7.5%]', rate: 7.5, section: 'Section 194 A', status: 'Active' },
    { id: '7', name: 'Payment of contractors for Others [2%]', rate: 2, section: 'Section 194 C', status: 'Active' },
    { id: '8', name: 'Payment of contractors for Others (Reduced) [1.5%]', rate: 1.5, section: 'Section 194 C', status: 'Active' },
    { id: '9', name: 'Payment of contractors HUF/Indiv [1%]', rate: 1, section: 'Section 194 C', status: 'Active' },
    { id: '10', name: 'Payment of contractors HUF/Indiv (Reduced) [0.75%]', rate: 0.75, section: 'Section 194 C', status: 'Active' },
    { id: '11', name: 'Professional Fees [10%]', rate: 10, section: 'Section 194J', status: 'Active' },
    { id: '12', name: 'Professional Fees (Reduced) [7.5%]', rate: 7.5, section: 'Section 194J', status: 'Active' },
    { id: '13', name: 'Rent on land or furniture etc [10%]', rate: 10, section: 'Section 194I', status: 'Active' },
    { id: '14', name: 'Rent on land or furniture etc (Reduced) [7.5%]', rate: 7.5, section: 'Section 194I', status: 'Active' },
    { id: '15', name: 'Technical Fees (2%) [2%]', rate: 2, section: 'Section 194J', status: 'Active' },
  ]);

  const handleAddTax = (newTax: TDSTax) => {
    setTdsTaxes([...tdsTaxes, newTax]);
  };

  // TCS Tax Options
  const [tcsTaxes, setTcsTaxes] = useState<TCSTax[]>([]);

  const handleAddTCSTax = (newTax: TCSTax) => {
    setTcsTaxes([...tcsTaxes, newTax]);
    // Auto-select the newly added tax
    setSelectedTCSTax(newTax.id);
    setFormData({ ...formData, tds_tcs_rate: newTax.rate });
  };

  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_email: '',
    invoice_number: '',
    auto_invoice_number: true,
    order_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'due_on_receipt',
    salesperson_id: '',
    salesperson_name: '',
    location_id: '',
    subject: '',
    discount_type: 'percentage' as 'percentage' | 'amount',
    discount_value: 0,
    tds_tcs_type: '',
    tds_tcs_rate: 0,
    adjustment: 0,
    notes: '',
    terms_and_conditions: '',
    status: 'draft',
    customer_notes: ''
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      item_id: '',
      item_name: '',
      account: 'Sales',
      description: '',
      quantity: 1,
      unit_of_measurement: 'pcs',
      rate: 0,
      amount: 0,
      stock_on_hand: 0
    }
  ]);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    if (!isEditMode) {
      generateInvoiceNumber();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode && id) {
      fetchInvoiceDetails();
    }
  }, [isEditMode, id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await invoicesService.getInvoiceById(id!);
      if (response.success && response.data) {
        const invoice = response.data;

        // Map invoice data to form data
        setFormData({
          customer_id: invoice.customer_id || '',
          customer_name: invoice.customer_name || '',
          customer_email: invoice.customer_email || '',
          invoice_number: invoice.invoice_number || '',
          auto_invoice_number: false, // Turn off auto for edit
          order_number: invoice.order_number || '',
          invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
          payment_terms: invoice.payment_terms || 'due_on_receipt',
          salesperson_id: invoice.salesperson_id || '',
          salesperson_name: invoice.salesperson_name || '',
          location_id: invoice.location_id || '',
          subject: invoice.subject || '',
          discount_type: invoice.discount_type || 'percentage',
          discount_value: invoice.discount_value || 0,
          tds_tcs_type: invoice.tds_tcs_type || '',
          tds_tcs_rate: invoice.tds_tcs_rate || 0,
          adjustment: invoice.adjustment || 0,
          notes: invoice.notes || '',
          terms_and_conditions: invoice.terms_and_conditions || '',
          status: invoice.status || 'draft',
          customer_notes: invoice.customer_notes || ''
        });

        // Map items
        if (invoice.items && invoice.items.length > 0) {
          setInvoiceItems(invoice.items.map((item: any) => ({
            item_id: item.item_id || '',
            item_name: item.item_name || '',
            account: item.account || 'Sales',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_of_measurement: item.unit_of_measurement || 'pcs',
            rate: item.rate || 0,
            amount: item.amount || 0,
            stock_on_hand: item.stock_on_hand || 0
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      alert('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getAllCustomers({ isActive: true });
      const apiResponse = response.data;
      if (apiResponse.success && apiResponse.data) {
        setCustomers(apiResponse.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemsService.getAllItems({ isActive: true });
      const apiResponse = response.data;
      if (apiResponse.success && apiResponse.data) {
        setItems(apiResponse.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const generateInvoiceNumber = async () => {
    if (formData.auto_invoice_number) {
      try {
        const response = await invoicesService.generateInvoiceNumber();
        if (response.success && response.data) {
          setFormData(prev => ({ ...prev, invoice_number: response.data.invoice_number }));
        }
      } catch (error) {
        console.error('Error generating invoice number:', error);
        // Fallback invoice number
        setFormData(prev => ({ ...prev, invoice_number: `INV-${String(Date.now()).slice(-6)}` }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-calculate due date based on payment terms
    if (name === 'payment_terms' && formData.invoice_date) {
      const invoiceDate = new Date(formData.invoice_date);
      let daysToAdd = 0;

      switch (value) {
        case 'net_15':
          daysToAdd = 15;
          break;
        case 'net_30':
          daysToAdd = 30;
          break;
        case 'net_45':
          daysToAdd = 45;
          break;
        case 'net_60':
          daysToAdd = 60;
          break;
        default:
          daysToAdd = 0;
      }

      if (daysToAdd > 0) {
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        setFormData(prev => ({ ...prev, due_date: dueDate.toISOString().split('T')[0] }));
      } else {
        setFormData(prev => ({ ...prev, due_date: formData.invoice_date }));
      }
    }
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCustomerId = e.target.value;

    if (selectedCustomerId) {
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.customer_name,
          customer_email: selectedCustomer.email || '',
          payment_terms: selectedCustomer.payment_terms || 'due_on_receipt'
        }));
      }
    } else {
      // Clear customer selection
      setFormData(prev => ({
        ...prev,
        customer_id: '',
        customer_name: '',
        customer_email: '',
        payment_terms: 'due_on_receipt'
      }));
    }
  };

  const handleSalespersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const salespersonId = e.target.value;
    const selectedSalesperson = salespersons.find(s => s.id === salespersonId);

    setFormData(prev => ({
      ...prev,
      salesperson_id: salespersonId,
      salesperson_name: selectedSalesperson?.name || ''
    }));
  };

  const handleAddSalesperson = () => {
    if (newSalesperson.name && newSalesperson.email) {
      const newId = String(salespersons.length + 1);
      const newPerson = {
        id: newId,
        name: newSalesperson.name,
        email: newSalesperson.email
      };

      setSalespersons([...salespersons, newPerson]);
      setNewSalesperson({ name: '', email: '' });
      setShowAddSalespersonForm(false);

      // Auto-select the newly added salesperson
      setFormData(prev => ({
        ...prev,
        salesperson_id: newId,
        salesperson_name: newPerson.name
      }));

      setShowSalespersonModal(false);
    }
  };

  const filteredSalespersons = salespersons.filter(person =>
    person.name.toLowerCase().includes(salespersonSearch.toLowerCase()) ||
    person.email.toLowerCase().includes(salespersonSearch.toLowerCase())
  );

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceItems];

    // Ensure value is never undefined - convert to empty string or 0 based on field type
    let processedValue = value;
    if (value === undefined || value === null) {
      if (field === 'quantity' || field === 'rate' || field === 'amount' || field === 'stock_on_hand') {
        processedValue = 0;
      } else {
        processedValue = '';
      }
    }

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: processedValue
    };

    // If item selected, populate details
    if (field === 'item_id' && value) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index].item_name = selectedItem.item_name || '';
        updatedItems[index].rate = selectedItem.unit_price || 0;
        updatedItems[index].unit_of_measurement = selectedItem.unit_of_measurement || 'pcs';
        updatedItems[index].description = selectedItem.description || '';
        updatedItems[index].stock_on_hand = selectedItem.current_stock || 0;
      }
    }

    // Calculate amount
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = (updatedItems[index].quantity || 0) * (updatedItems[index].rate || 0);
    }

    setInvoiceItems(updatedItems);
  };

  const addItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        item_id: '',
        item_name: '',
        account: 'Sales',
        description: '',
        quantity: 1,
        unit_of_measurement: 'pcs',
        rate: 0,
        amount: 0,
        stock_on_hand: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (formData.discount_type === 'percentage') {
      return (subtotal * formData.discount_value) / 100;
    }
    return formData.discount_value;
  };

  const calculateTax = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount();
    if (formData.tds_tcs_type && formData.tds_tcs_rate) {
      return (afterDiscount * formData.tds_tcs_rate) / 100;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax + formData.adjustment;
  };

  const checkStockAvailability = () => {
    const outOfStock: string[] = [];

    invoiceItems.forEach(item => {
      if (item.item_id && item.quantity > (item.stock_on_hand || 0)) {
        outOfStock.push(item.item_name);
      }
    });

    if (outOfStock.length > 0) {
      setOutOfStockItems(outOfStock);
      setShowStockWarning(true);
      return false;
    }

    return true;
  };

  const validateForm = () => {
    // Check for empty item names
    const hasEmptyItems = invoiceItems.some(item => !item.item_id && !item.item_name);
    if (hasEmptyItems) {
      alert('Enter the valid item name or description.');
      return false;
    }

    if (!formData.customer_name || formData.customer_name.trim() === '') {
      alert('Please enter or select a customer name.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (status: 'draft' | 'sent', skipStockCheck = false) => {
    if (!validateForm()) {
      return;
    }

    // Check stock availability for 'sent' status
    if (status === 'sent' && !skipStockCheck) {
      const stockAvailable = checkStockAvailability();
      if (!stockAvailable) {
        return; // Show stock warning modal
      }
    }

    setLoading(true);

    try {
      const subtotal = calculateSubtotal();
      const discount = calculateDiscount();
      const tax = calculateTax();
      const total = calculateTotal();

      // Build invoice data with correct field mapping
      const invoiceData: any = {
        customer_id: formData.customer_id || null,
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email || null,
        invoice_number: formData.invoice_number,
        order_number: formData.order_number || null,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        payment_terms: formData.payment_terms,
        salesperson_id: formData.salesperson_id || null,
        salesperson_name: formData.salesperson_name || null,
        subject: formData.subject || null,
        status: status,
        subtotal: Number(subtotal.toFixed(2)),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        discount_amount: Number(discount.toFixed(2)),
        tds_tcs_type: formData.tds_tcs_type || null,
        tds_tcs_rate: formData.tds_tcs_rate || null,
        tds_tcs_amount: Number(tax.toFixed(2)),
        adjustment: Number(formData.adjustment),
        total_amount: Number(total.toFixed(2)),
        customer_notes: formData.notes || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        items: invoiceItems
          .filter(item => (item.item_id || item.item_name) && item.quantity > 0)
          .map(item => ({
            item_id: item.item_id || null,
            item_name: item.item_name || '',
            account: item.account || 'Sales',
            description: item.description || null,
            quantity: Number(item.quantity),
            unit_of_measurement: item.unit_of_measurement || 'pcs',
            rate: Number(item.rate),
            amount: Number(item.amount.toFixed(2))
          }))
      };

      // Validate that we have at least one item
      if (invoiceData.items.length === 0) {
        alert('Please add at least one valid item to the invoice');
        setLoading(false);
        return;
      }

      console.log('Submitting invoice data:', invoiceData);

      let response;
      if (isEditMode && id) {
        response = await invoicesService.updateInvoice(id, invoiceData);
      } else {
        response = await invoicesService.createInvoice(invoiceData);
      }

      if (response.success) {
        navigate('/sales/invoices');
      } else {
        alert(response.message || `Failed to ${isEditMode ? 'update' : 'create'} invoice`);
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create invoice';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStockWarningAction = (action: 'proceed' | 'remove' | 'cancel') => {
    if (action === 'proceed') {
      setShowStockWarning(false);
      handleSubmit('sent', true);
    } else if (action === 'remove') {
      // Remove out of stock items
      const filteredItems = invoiceItems.filter(item =>
        !outOfStockItems.includes(item.item_name)
      );
      setInvoiceItems(filteredItems.length > 0 ? filteredItems : [{
        item_id: '',
        item_name: '',
        account: 'Sales',
        description: '',
        quantity: 1,
        unit_of_measurement: 'pcs',
        rate: 0,
        amount: 0,
        stock_on_hand: 0
      }]);
      setShowStockWarning(false);
    } else {
      setShowStockWarning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      {/* Manage Salespersons Modal */}
      {showSalespersonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">
                Manage Salespersons
              </h3>
              <button
                onClick={() => {
                  setShowSalespersonModal(false);
                  setShowAddSalespersonForm(false);
                  setNewSalesperson({ name: '', email: '' });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search Salesperson"
                value={salespersonSearch}
                onChange={(e) => setSalespersonSearch(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Add New Salesperson Button */}
            {!showAddSalespersonForm && (
              <button
                onClick={() => setShowAddSalespersonForm(true)}
                className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                New Salesperson
              </button>
            )}

            {/* Add New Salesperson Form */}
            {showAddSalespersonForm && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Add New Salesperson</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSalesperson.name}
                      onChange={(e) => setNewSalesperson({ ...newSalesperson, name: e.target.value })}
                      placeholder="Enter salesperson name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newSalesperson.email}
                      onChange={(e) => setNewSalesperson({ ...newSalesperson, email: e.target.value })}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSalesperson}
                      disabled={!newSalesperson.name || !newSalesperson.email}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowAddSalespersonForm(false);
                        setNewSalesperson({ name: '', email: '' });
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Salespersons Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      SALESPERSON NAME
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      EMAIL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSalespersons.map((person) => (
                    <tr
                      key={person.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          salesperson_id: person.id,
                          salesperson_name: person.name
                        }));
                        setShowSalespersonModal(false);
                      }}
                    >
                      <td className="px-4 py-3 text-slate-800">{person.name}</td>
                      <td className="px-4 py-3 text-slate-600">{person.email}</td>
                    </tr>
                  ))}
                  {filteredSalespersons.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                        No salespersons found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Warning Modal */}
      {showStockWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Stock Availability Warning
                </h3>
                <p className="text-slate-600 mb-4">
                  The following items will go out of stock:
                </p>
                <ul className="list-disc list-inside mb-4 text-slate-700">
                  {outOfStockItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <p className="text-slate-600 mb-6">
                  Are you sure about this?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStockWarningAction('proceed')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Proceed
                  </button>
                  <button
                    onClick={() => handleStockWarningAction('remove')}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Remove Items
                  </button>
                  <button
                    onClick={() => handleStockWarningAction('cancel')}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/sales/invoices')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{isEditMode ? 'Edit Invoice' : 'New Invoice'}</h1>
            <p className="text-slate-600 mt-1">{isEditMode ? 'Update existing invoice details' : 'Create a new invoice for your customer'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Customer & Invoice Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleCustomerSelect}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customer_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Invoice# <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  disabled={formData.auto_invoice_number}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                  required
                />
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="auto_invoice_number"
                    checked={formData.auto_invoice_number}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  Auto
                </label>
              </div>
            </div>
          </div>

          {/* Order Number & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Order Number
              </label>
              <input
                type="text"
                name="order_number"
                value={formData.order_number}
                onChange={handleInputChange}
                placeholder="e.g., 35467"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Terms & Salesperson */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Terms
              </label>
              <select
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="net_15">Net 15</option>
                <option value="net_30">Net 30</option>
                <option value="net_45">Net 45</option>
                <option value="net_60">Net 60</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Salesperson
                </label>
                <button
                  type="button"
                  onClick={() => setShowSalespersonModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Manage Salespersons
                </button>
              </div>
              <select
                name="salesperson_id"
                value={formData.salesperson_id}
                onChange={handleSalespersonChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select or Add Salesperson</option>
                {salespersons.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Email subject line"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Item Table</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Item Details</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Account</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Rate</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Stock</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Amount</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr key={index} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
                        >
                          <option value="">Select Item</option>
                          {items.map(i => (
                            <option key={i.id} value={i.id}>{i.item_name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.account}
                          onChange={(e) => handleItemChange(index, 'account', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option>Sales</option>
                          <option>Income</option>
                          <option>Other Income</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity || 0}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.rate || 0}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${item.stock_on_hand === 0 ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                          {item.stock_on_hand ? item.stock_on_hand.toFixed(2) : '0.00'} {item.unit_of_measurement}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{item.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          disabled={invoiceItems.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addItem}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add another line
            </button>
          </div>

          {/* Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Notes visible to customer"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Terms */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  name="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter payment terms and conditions"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-700">Sub Total</span>
                <span className="font-medium text-slate-900">{calculateSubtotal().toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">Discount</span>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-center"
                  />
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="px-2 py-1 border border-slate-300 rounded text-sm"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">₹</option>
                  </select>
                </div>
                <span className="font-medium text-slate-900">{calculateDiscount().toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tds_tcs_type"
                      value="TDS"
                      checked={formData.tds_tcs_type === 'TDS'}
                      onChange={handleInputChange}
                      className="text-blue-600"
                    />
                    <label className="text-sm text-slate-700">TDS</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tds_tcs_type"
                      value="TCS"
                      checked={formData.tds_tcs_type === 'TCS'}
                      onChange={handleInputChange}
                      className="text-blue-600"
                    />
                    <label className="text-sm text-slate-700">TCS</label>
                  </div>
                  {formData.tds_tcs_type === 'TDS' && (
                    <select
                      value={selectedTDSTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'manage_tds') {
                          setShowTDSModal(true);
                          setSelectedTDSTax('');
                        } else {
                          setSelectedTDSTax(value);
                          const tax = tdsTaxes.find(t => t.id === value);
                          if (tax) {
                            setFormData({ ...formData, tds_tcs_rate: tax.rate });
                          }
                        }
                      }}
                      className="px-3 py-1.5 border border-slate-300 rounded-md text-sm min-w-[200px]"
                    >
                      <option value="">Select a Tax</option>
                      <optgroup label="Taxes">
                        {tdsTaxes.map(tax => (
                          <option key={tax.id} value={tax.id}>
                            {tax.name}
                          </option>
                        ))}
                      </optgroup>
                      <option value="manage_tds" className="text-blue-600 font-medium">
                        ⚙ Manage TDS
                      </option>
                    </select>
                  )}
                  {formData.tds_tcs_type === 'TCS' && (
                    <select
                      value={selectedTCSTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'manage_tcs') {
                          setShowTCSModal(true);
                          setSelectedTCSTax('');
                        } else {
                          setSelectedTCSTax(value);
                          const tax = tcsTaxes.find(t => t.id === value);
                          if (tax) {
                            setFormData({ ...formData, tds_tcs_rate: tax.rate });
                          }
                        }
                      }}
                      className="px-3 py-1.5 border border-slate-300 rounded-md text-sm min-w-[200px]"
                    >
                      <option value="">Select a Tax</option>
                      {tcsTaxes.length > 0 ? (
                        <optgroup label="Taxes">
                          {tcsTaxes.map(tax => (
                            <option key={tax.id} value={tax.id}>
                              {tax.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <option value="" disabled>No TCS Taxes Available</option>
                      )}
                      <option value="manage_tcs" className="text-blue-600 font-medium">
                        ⚙ Manage TCS
                      </option>
                    </select>
                  )}
                </div>
                <span className="font-medium text-slate-900">
                  {formData.tds_tcs_type && `${formData.tds_tcs_type === 'TDS' ? '-' : ''}${calculateTax().toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">Adjustment</span>
                  <input
                    type="number"
                    name="adjustment"
                    value={formData.adjustment}
                    onChange={(e) => setFormData({ ...formData, adjustment: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-sm text-center"
                  />
                </div>
                <span className="font-medium text-slate-900">{formData.adjustment.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900">{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={() => navigate('/sales/invoices')}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              className="flex items-center gap-2 px-6 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              disabled={loading || !formData.customer_name}
            >
              <Save size={18} />
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit('sent')}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              disabled={loading || !formData.customer_name}
            >
              <Send size={18} />
              Save and Send
            </button>
          </div>
        </div>
      </div>

      {/* Manage TDS Modal */}
      <ManageTDSModal
        isOpen={showTDSModal}
        onClose={() => setShowTDSModal(false)}
        taxes={tdsTaxes}
        onAddTax={handleAddTax}
      />

      <ManageTCSModal
        isOpen={showTCSModal}
        onClose={() => setShowTCSModal(false)}
        taxes={tcsTaxes}
        onAddTax={handleAddTCSTax}
      />
    </div>
  );
};

export default NewInvoiceForm;
