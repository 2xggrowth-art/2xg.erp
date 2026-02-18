import React, { useState, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, X, Plus, Edit2, ShoppingCart, Package, Trash2, Check, Printer, Clock, DollarSign, TrendingUp, MapPin, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { customersService, Customer, CreateCustomerData } from '../services/customers.service';
import { itemsService, Item } from '../services/items.service';
import { salespersonService, Salesperson } from '../services/salesperson.service';
import { invoicesService } from '../services/invoices.service';
import { posSessionsService, PosSession } from '../services/pos-sessions.service';
import { binLocationService } from '../services/binLocation.service';
import SplitPaymentModal from '../components/pos/SplitPaymentModal';

// Define the shape of a Cart Item
interface BinAllocation {
  bin_location_id: string;
  bin_code: string;
  location_name: string;
  quantity: number;
}

interface AvailableBin {
  bin_id: string;
  bin_code: string;
  location_name: string;
  stock: number;
}

interface CartItem {
  id: string;
  item_id: string;
  name: string;
  sku: string;
  tax_rate: number;
  qty: number;
  rate: number;
  cost_price: number;
  bin_allocations?: BinAllocation[];
  available_bins?: AvailableBin[];
}

interface HeldCart {
  id: string;
  items: CartItem[];
  customer: Customer | null;
  timestamp: Date;
}

type TabType = 'newsale' | 'sessions';

const PosCreate: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('newsale');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);
  const [showManageSalespersonModal, setShowManageSalespersonModal] = useState(false);
  const [showAddSalespersonForm, setShowAddSalespersonForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [salespersonSearch, setSalespersonSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [phoneNumberFromSearch, setPhoneNumberFromSearch] = useState('');
  const [newSalesperson, setNewSalesperson] = useState({ name: '', email: '' });
  const [activeHeldCartId, setActiveHeldCartId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [activeSession, setActiveSession] = useState<PosSession | null>(null);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [startSessionData, setStartSessionData] = useState({
    register: 'billing desk',
    opened_by: '',
    opening_balance: 0,
  });
  const [closeSessionData, setCloseSessionData] = useState({
    closing_balance: 0,
    cash_in: 0,
    cash_out: 0,
  });

  // Cash movement states
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [cashMovementType, setCashMovementType] = useState<'in' | 'out'>('in');
  const [cashMovementAmount, setCashMovementAmount] = useState<number>(0);
  const [cashMovementLoading, setCashMovementLoading] = useState(false);

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'Cash' | 'HDFC' | 'ICICI' | 'BAJAJ/ICICI' | 'D/B CREDIT CARD / EM' | 'CREDIT SALE' | ''>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Discount states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Delivery option states
  const [deliveryOption, setDeliveryOption] = useState<'self_pickup' | 'delivery'>('self_pickup');
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showBillSuccess, setShowBillSuccess] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  const [newCustomer, setNewCustomer] = useState<CreateCustomerData>({
    display_name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: 'Karnataka',
    gstin: '',
    payment_terms: 'Due on Receipt',
  });
  const [gstTreatment, setGstTreatment] = useState<'Consumer' | 'Registered'>('Consumer');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsService.getAllItems();
      // Handle both possible response structures (array or object with data property)
      const itemsData = response.data?.data || response.data || [];
      if (Array.isArray(itemsData)) {
        setItems(itemsData);
      } else {
        console.error('Unexpected items data format:', itemsData);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchSalespersons();
    fetchSessions();
    fetchActiveSession();
  }, []);

  // Check for active session when on newsale tab (only after session check completes)
  useEffect(() => {
    if (sessionChecked && activeTab === 'newsale' && !activeSession && !showStartSessionModal) {
      setShowStartSessionModal(true);
    }
  }, [activeTab, activeSession, sessionChecked]);

  const fetchSalespersons = () => {
    try {
      const allSalespersons = salespersonService.getAllSalespersons();
      setSalespersons(allSalespersons);
    } catch (error) {
      console.error('Error fetching salespersons:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await posSessionsService.getAllSessions();
      if (response.success) {
        setSessions(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const response = await posSessionsService.getActiveSession();
      if (response.success) {
        setActiveSession(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching active session:', err);
    } finally {
      setSessionChecked(true);
    }
  };

  const handleStartSession = async () => {
    if (!startSessionData.opened_by.trim()) {
      alert('Please enter who is opening the session');
      return;
    }

    try {
      setSessionLoading(true);
      const response = await posSessionsService.startSession(startSessionData);
      if (response.success) {
        setActiveSession(response.data);
        setShowStartSessionModal(false);
        setStartSessionData({ register: 'billing desk', opened_by: '', opening_balance: 0 });
        fetchSessions();
        alert('Session started successfully!');
      }
    } catch (error: any) {
      console.error('Error starting session:', error);
      alert(error.response?.data?.error || 'Failed to start session');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    try {
      setSessionLoading(true);
      const response = await posSessionsService.closeSession(activeSession.id, {
        closing_balance: closeSessionData.closing_balance,
        cash_in: activeSession.cash_in,
        cash_out: activeSession.cash_out,
      });
      if (response.success) {
        setActiveSession(null);
        setShowCloseSessionModal(false);
        setCloseSessionData({ closing_balance: 0, cash_in: 0, cash_out: 0 });
        fetchSessions();
        alert('Session closed successfully!');
      }
    } catch (error: any) {
      console.error('Error closing session:', error);
      alert(error.response?.data?.error || 'Failed to close session');
    } finally {
      setSessionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleRateChange = (id: string, newRate: string) => {
    const updatedCart = cart.map((item) => {
      if (item.id === id) {
        const numericRate = parseFloat(newRate) || 0;
        return { ...item, rate: numericRate };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const handleQtyChange = (id: string, newQty: string) => {
    const updatedCart = cart.map((item) => {
      if (item.id === id) {
        const numericQty = parseInt(newQty) || 0;
        // Update bin allocation quantity if single bin assigned
        if (item.bin_allocations && item.bin_allocations.length === 1) {
          return {
            ...item,
            qty: numericQty,
            bin_allocations: [{ ...item.bin_allocations[0], quantity: numericQty }]
          };
        }
        return { ...item, qty: numericQty };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearch('');
  };

  const handleSelectItem = async (item: Item) => {
    if (item.current_stock <= 0) {
      alert('Stock is not available');
      return;
    }

    // Fetch bin locations for this item
    let itemBins: AvailableBin[] = [];
    try {
      const binResponse = await binLocationService.getBinLocationsForItem(item.id);
      if (binResponse.success && binResponse.data && binResponse.data.length > 0) {
        itemBins = binResponse.data.map((b: any) => ({
          bin_id: b.bin_id,
          bin_code: b.bin_code,
          location_name: b.location_name,
          stock: b.quantity
        }));
      }
    } catch (error) {
      console.error('Error fetching bin locations:', error);
    }

    const cartItem: CartItem = {
      id: `cart-${Date.now()}-${item.id}`,
      item_id: item.id,
      name: item.item_name,
      sku: item.sku,
      tax_rate: item.tax_rate,
      qty: 1,
      rate: item.unit_price,
      cost_price: item.cost_price,
      available_bins: itemBins.length > 0 ? itemBins : undefined,
      bin_allocations: itemBins.length === 1 ? [{
        bin_location_id: itemBins[0].bin_id,
        bin_code: itemBins[0].bin_code,
        location_name: itemBins[0].location_name,
        quantity: 1
      }] : undefined
    };
    setCart([...cart, cartItem]);
    setShowItemModal(false);
    setItemSearch('');
  };

  const handleBinChange = (cartItemId: string, binId: string) => {
    setCart(cart.map(item => {
      if (item.id !== cartItemId) return item;
      if (!binId) {
        return { ...item, bin_allocations: undefined };
      }
      const bin = item.available_bins?.find(b => b.bin_id === binId);
      if (!bin) return item;
      return {
        ...item,
        bin_allocations: [{
          bin_location_id: bin.bin_id,
          bin_code: bin.bin_code,
          location_name: bin.location_name,
          quantity: item.qty
        }]
      };
    }));
  };

  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await customersService.createCustomer(newCustomer);
      if (response.data.success && response.data.data) {
        const createdCustomer = response.data.data;
        setCustomers([createdCustomer, ...customers]);
        setSelectedCustomer(createdCustomer);
        setShowAddCustomerModal(false);
        setNewCustomer({
          display_name: '',
          mobile: '',
          email: '',
          address: '',
          city: '',
          state: 'Karnataka',
          gstin: '',
          company_name: '',
          payment_terms: 'Due on Receipt',
        });
        setGstTreatment('Consumer');
        setPhoneNumberFromSearch('');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddCustomerWithPhone = () => {
    setNewCustomer({
      ...newCustomer,
      mobile: phoneNumberFromSearch,
    });
    setShowCustomerModal(false);
    setShowAddCustomerModal(true);
  };

  const handleHoldCart = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add items before holding.');
      return;
    }
    const heldCart: HeldCart = {
      id: `held-${Date.now()}`,
      items: [...cart],
      customer: selectedCustomer,
      timestamp: new Date(),
    };
    setHeldCarts([...heldCarts, heldCart]);
    setCart([]);
    setSelectedCustomer(null);
    setSelectedSalesperson(null);
    setActiveHeldCartId(null);
    alert('Cart held successfully!');
  };

  const handleRecallCart = (heldCart: HeldCart) => {
    setCart([...heldCart.items]);
    setSelectedCustomer(heldCart.customer);
    setActiveHeldCartId(heldCart.id);
  };

  const handleDeleteHeldCart = (id: string) => {
    setHeldCarts(heldCarts.filter(cart => cart.id !== id));
    if (activeHeldCartId === id) {
      setActiveHeldCartId(null);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear everything?')) {
      setCart([]);
      setSelectedCustomer(null);
      setSelectedSalesperson(null);
      setActiveHeldCartId(null);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.mobile?.includes(customerSearch) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    item.is_active !== false &&
    (item.item_name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.sku?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.barcode?.includes(itemSearch) ||
    item.color?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.variant?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.size?.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  const filteredSalespersons = salespersons.filter(salesperson =>
    salesperson.name?.toLowerCase().includes(salespersonSearch.toLowerCase()) ||
    salesperson.email?.toLowerCase().includes(salespersonSearch.toLowerCase())
  );

  const handleSelectSalesperson = (salesperson: Salesperson) => {
    setSelectedSalesperson(salesperson);
    setShowSalespersonModal(false);
    setSalespersonSearch('');
  };

  const handleAddSalesperson = () => {
    if (newSalesperson.name.trim() && newSalesperson.email.trim()) {
      const addedSalesperson = salespersonService.addSalesperson(newSalesperson);
      setSalespersons([...salespersons, addedSalesperson]);
      setNewSalesperson({ name: '', email: '' });
      setShowAddSalespersonForm(false);
      alert('Salesperson added successfully!');
    } else {
      alert('Please fill in both name and email');
    }
  };

  const handleDeleteSalesperson = (id: string) => {
    if (window.confirm('Are you sure you want to delete this salesperson?')) {
      const deleted = salespersonService.deleteSalesperson(id);
      if (deleted) {
        setSalespersons(salespersons.filter(sp => sp.id !== id));
        if (selectedSalesperson?.id === id) {
          setSelectedSalesperson(null);
        }
        alert('Salesperson deleted successfully!');
      }
    }
  };

  const handlePaymentClick = (mode: 'Cash' | 'HDFC' | 'ICICI' | 'BAJAJ/ICICI' | 'D/B CREDIT CARD / EM' | 'CREDIT SALE') => {
    if (!activeSession) {
      alert('Please start a session before making sales');
      setShowStartSessionModal(true);
      return;
    }

    if (cart.length === 0) {
      alert('Please add items to the cart first');
      return;
    }

    setSelectedPaymentMode(mode);

    // Initialize paid amount to total for non-credit sales
    if (mode !== 'CREDIT SALE') {
      setPaidAmount(total);
    } else {
      setPaidAmount(0); // For credit sale, start with 0
    }

    // Cash payment doesn't need reference number
    if (mode === 'Cash') {
      handleProcessPayment(mode, '', total);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleProcessPayment = async (mode: string, refNumber: string, amountPaid: number) => {
    try {
      setProcessingPayment(true);

      // Generate invoice number
      const invoiceNumberRes = await invoicesService.generateInvoiceNumber();
      const invoiceNumber = invoiceNumberRes.data?.invoice_number || `INV-${Date.now()}`;

      // Calculate balance due
      const balanceDue = total - amountPaid;

      // Determine invoice status based on payment
      let invoiceStatus: 'paid' | 'partially_paid' | 'sent';
      let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';

      if (amountPaid >= total) {
        invoiceStatus = 'paid';
        paymentStatus = 'Paid';
      } else if (mode === 'CREDIT SALE') {
        // Credit sale is always partially paid (even if 0 paid now)
        invoiceStatus = 'partially_paid';
        paymentStatus = amountPaid > 0 ? 'Partially Paid' : 'Unpaid';
      } else if (amountPaid > 0) {
        invoiceStatus = 'partially_paid';
        paymentStatus = 'Partially Paid';
      } else {
        invoiceStatus = 'sent';
        paymentStatus = 'Unpaid';
      }

      // Prepare invoice data
      const invoiceData = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.customer_name || 'Walk-in Customer',
        customer_email: selectedCustomer?.email || null,
        invoice_number: invoiceNumber,
        order_number: refNumber || null,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        payment_terms: 'Due on Receipt',
        salesperson_id: selectedSalesperson?.id || null,
        salesperson_name: selectedSalesperson?.name || null,
        discount_type: discountType as 'percentage' | 'amount',
        discount_value: discountValue,
        tds_tcs_type: null,
        tds_tcs_rate: 0,
        adjustment: 0,
        sub_total: subtotal,
        total_amount: total,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        status: invoiceStatus,
        payment_status: paymentStatus,
        subject: 'POS',  // Mark this as a POS transaction
        pos_session_id: activeSession?.id || null,
        customer_notes: `Payment Mode: ${mode}${refNumber ? `\nReference Number: ${refNumber}` : ''}${discountValue > 0 ? `\nDiscount: ${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`} (-₹${discountAmount.toFixed(2)})` : ''}${deliveryOption === 'delivery' ? '\nDelivery: Delivery' : '\nDelivery: Self Pickup'}${mode === 'CREDIT SALE' ? `\nAmount Paid: ₹${amountPaid.toFixed(2)}\nBalance Due: ₹${balanceDue.toFixed(2)}` : ''}`,
        terms_and_conditions: null,
        items: cart.map(item => ({
          item_id: item.item_id,
          item_name: item.name,
          account: 'Sales',
          description: `SKU: ${item.sku}`,
          quantity: item.qty,
          unit_of_measurement: 'pcs',
          rate: item.rate,
          amount: item.qty * item.rate,
          stock_on_hand: 0,
          bin_allocations: item.bin_allocations || undefined
        }))
      };

      // Create invoice
      const response = await invoicesService.createInvoice(invoiceData);

      if (response.success) {
        setGeneratedInvoice({
          ...invoiceData,
          id: response.data?.id,
          paymentMode: mode,
          referenceNumber: refNumber,
          amountPaid: amountPaid,
          balanceDue: balanceDue,
          createdAt: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        });
        setShowPaymentModal(false);
        setShowBillSuccess(true);
        setReferenceNumber('');
        setPaidAmount(0);

        // Update session sales
        if (activeSession) {
          try {
            await posSessionsService.updateSessionSales(activeSession.id, total);
            // Update local active session state
            setActiveSession(prev => prev ? { ...prev, total_sales: prev.total_sales + total } : null);
          } catch (err) {
            console.error('Error updating session sales:', err);
          }
        }

        // Refresh items to update stock levels
        fetchItems();
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSplitPaymentComplete = async (payments: any[], totalPaid: number) => {
    try {
      setProcessingPayment(true);

      // Generate invoice number
      const invoiceNumberRes = await invoicesService.generateInvoiceNumber();
      const invoiceNumber = invoiceNumberRes.data?.invoice_number || `INV-${Date.now()}`;

      // Credit Sale entries are not actual payments received - they are deferred
      const creditAmount = payments
        .filter((p: any) => p.mode === 'CREDIT SALE')
        .reduce((sum: number, p: any) => sum + p.amount, 0);
      const actualPaid = totalPaid - creditAmount;

      // Calculate balance due (amount not actually received)
      const balanceDue = total - actualPaid;

      // Determine invoice status based on actual payment received
      let invoiceStatus: 'paid' | 'partially_paid' | 'sent';
      let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';

      if (actualPaid >= total) {
        invoiceStatus = 'paid';
        paymentStatus = 'Paid';
      } else if (creditAmount > 0 || actualPaid < total) {
        // Has credit sale component or not fully paid = partially paid
        invoiceStatus = 'partially_paid';
        paymentStatus = actualPaid > 0 ? 'Partially Paid' : 'Unpaid';
      } else {
        invoiceStatus = 'sent';
        paymentStatus = 'Unpaid';
      }

      // Build payment details string
      const paymentDetails = payments.map((p, i) =>
        `Payment ${i + 1}: ${p.mode} - ₹${p.amount.toFixed(2)}${p.reference ? ` (Ref: ${p.reference})` : ''}${p.note ? `\n  Note: ${p.note}` : ''}`
      ).join('\n');

      // Prepare invoice data
      const invoiceData = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.customer_name || 'Walk-in Customer',
        customer_email: selectedCustomer?.email || null,
        invoice_number: invoiceNumber,
        order_number: null,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        payment_terms: 'Due on Receipt',
        salesperson_id: selectedSalesperson?.id || null,
        salesperson_name: selectedSalesperson?.name || null,
        discount_type: discountType as 'percentage' | 'amount',
        discount_value: discountValue,
        tds_tcs_type: null,
        tds_tcs_rate: 0,
        adjustment: 0,
        sub_total: subtotal,
        total_amount: total,
        amount_paid: actualPaid,
        balance_due: balanceDue,
        status: invoiceStatus,
        payment_status: paymentStatus,
        subject: 'POS',  // Mark this as a POS transaction
        pos_session_id: activeSession?.id || null,
        customer_notes: `SPLIT PAYMENT (${payments.length} payments)\n${paymentDetails}${discountValue > 0 ? `\nDiscount: ${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`} (-₹${discountAmount.toFixed(2)})` : ''}${deliveryOption === 'delivery' ? '\nDelivery: Delivery' : '\nDelivery: Self Pickup'}${balanceDue > 0 ? `\n\nAmount Received: ₹${actualPaid.toFixed(2)}${creditAmount > 0 ? `\nCredit Sale: ₹${creditAmount.toFixed(2)}` : ''}\nBalance Due: ₹${balanceDue.toFixed(2)}` : ''}`,
        terms_and_conditions: null,
        items: cart.map(item => ({
          item_id: item.item_id,
          item_name: item.name,
          account: 'Sales',
          description: `SKU: ${item.sku}`,
          quantity: item.qty,
          unit_of_measurement: 'pcs',
          rate: item.rate,
          amount: item.qty * item.rate,
          stock_on_hand: 0,
          bin_allocations: item.bin_allocations || undefined
        }))
      };

      // Create invoice
      const response = await invoicesService.createInvoice(invoiceData);

      if (response.success) {
        setGeneratedInvoice({
          ...invoiceData,
          id: response.data?.id,
          paymentMode: `SPLIT (${payments.length} payments)`,
          referenceNumber: '',
          amountPaid: actualPaid,
          balanceDue: balanceDue,
          splitPayments: payments,
          createdAt: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        });
        setShowSplitPaymentModal(false);
        setShowBillSuccess(true);

        // Update session sales
        if (activeSession) {
          try {
            await posSessionsService.updateSessionSales(activeSession.id, total);
            // Update local active session state
            setActiveSession(prev => prev ? { ...prev, total_sales: prev.total_sales + total } : null);
          } catch (err) {
            console.error('Error updating session sales:', err);
          }
        }

        // Refresh items to update stock levels
        fetchItems();
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Split payment processing error:', error);
      alert('Failed to process split payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCompleteBill = () => {
    // Clear everything and start fresh
    setCart([]);
    setSelectedCustomer(null);
    setSelectedSalesperson(null);
    setActiveHeldCartId(null);
    setShowBillSuccess(false);
    setGeneratedInvoice(null);
    setDiscountType('percentage');
    setDiscountValue(0);
    setDeliveryOption('self_pickup');
  };

  const handlePrintBill = () => {
    // Small delay to ensure the print section is fully rendered
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleCashMovement = async () => {
    if (!activeSession || cashMovementAmount <= 0) return;
    try {
      setCashMovementLoading(true);
      const response = await posSessionsService.recordCashMovement(
        activeSession.id,
        cashMovementType,
        cashMovementAmount
      );
      if (response.success && response.data) {
        setActiveSession(response.data);
        setShowCashMovementModal(false);
        setCashMovementAmount(0);
        alert(`Cash ${cashMovementType === 'in' ? 'In' : 'Out'} of ₹${cashMovementAmount} recorded successfully`);
      }
    } catch (error: any) {
      console.error('Error recording cash movement:', error);
      alert(error.response?.data?.error || 'Failed to record cash movement');
    } finally {
      setCashMovementLoading(false);
    }
  };

  useEffect(() => {
    const isPhoneNumber = /^\d{10}$/.test(customerSearch);
    if (isPhoneNumber) {
      setPhoneNumberFromSearch(customerSearch);
    } else {
      setPhoneNumberFromSearch('');
    }
  }, [customerSearch]);

  const subtotal = cart.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const discountAmount = discountType === 'percentage'
    ? (subtotal * discountValue / 100)
    : discountValue;
  const total = Math.max(0, subtotal - discountAmount);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
            display: block !important;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
          }
          #print-section table {
            display: table !important;
          }
          #print-section tr {
            display: table-row !important;
          }
          #print-section td, #print-section th {
            display: table-cell !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>

      {/* Hidden Print Section */}
      {generatedInvoice && (
        <div id="print-section" style={{ display: 'none' }}>
          <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
              <h1 style={{ margin: '0', fontSize: '32px', color: '#333' }}>2XG Business Suite</h1>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>INVOICE</p>
              <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>#{generatedInvoice.invoice_number}</p>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>{generatedInvoice.createdAt}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>CUSTOMER DETAILS</h3>
                <p style={{ margin: '3px 0', fontSize: '16px', fontWeight: 'bold' }}>{generatedInvoice.customer_name}</p>
                {selectedCustomer?.mobile && <p style={{ margin: '3px 0', fontSize: '12px' }}>Mobile: {selectedCustomer.mobile}</p>}
                {selectedCustomer?.email && <p style={{ margin: '3px 0', fontSize: '12px' }}>Email: {selectedCustomer.email}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>PAYMENT DETAILS</h3>
                <p style={{ margin: '3px 0', fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>Mode: {generatedInvoice.paymentMode}</p>
                {generatedInvoice.referenceNumber && <p style={{ margin: '3px 0', fontSize: '12px' }}>Ref: {generatedInvoice.referenceNumber}</p>}
                {generatedInvoice.salesperson_name && <p style={{ margin: '3px 0', fontSize: '12px' }}>Salesperson: {generatedInvoice.salesperson_name}</p>}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #333' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>ITEM</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>QTY</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>RATE</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {generatedInvoice.items.map((item: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{item.item_name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{item.quantity}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>₹{item.rate.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold' }}>₹{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', marginBottom: '40px' }}>
              <div style={{ display: 'inline-block', textAlign: 'left', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', minWidth: '250px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #333' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>TOTAL:</span>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#22c55e' }}>₹{generatedInvoice.total_amount.toFixed(2)}</span>
                </div>
                {generatedInvoice.paymentMode === 'CREDIT SALE' && generatedInvoice.balanceDue > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>Paid:</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e' }}>₹{generatedInvoice.amountPaid.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>Balance Due:</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f97316' }}>₹{generatedInvoice.balanceDue.toFixed(2)}</span>
                    </div>
                    <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#f97316', textAlign: 'center', fontWeight: 'bold' }}>CREDIT SALE - PENDING</p>
                  </>
                ) : (
                  <p style={{ margin: '0', fontSize: '11px', color: '#666', textAlign: 'center' }}>PAID</p>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#666' }}>
              <p style={{ margin: '5px 0' }}>Thank you for your business!</p>
              <p style={{ margin: '5px 0' }}>Powered by 2XG Business Suite</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
        {/* Left Section: Product Entry */}
        <div className="flex-grow flex flex-col border-r border-gray-200 bg-white">
          {/* Header Tabs - Held Carts and Sessions */}
          <div className="flex bg-gray-100 text-xs border-b border-gray-200 overflow-x-auto">
            {/* Current Active Tab */}
            <div
              className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer ${activeTab === 'newsale' && !activeHeldCartId
                  ? 'bg-white border-t-2 border-blue-500'
                  : 'border-r border-gray-200'
                }`}
              onClick={() => setActiveTab('newsale')}
            >
              <Plus size={12} className={activeTab === 'newsale' && !activeHeldCartId ? "text-blue-500" : "text-gray-500"} />
              <span className={activeTab === 'newsale' && !activeHeldCartId ? "font-medium" : "text-gray-600"}>Sale</span>
              {activeTab === 'newsale' && !activeHeldCartId && cart.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[10px]">{cart.length}</span>
              )}
            </div>

            {/* Held Cart Tabs */}
            {heldCarts.map((heldCart) => (
              <div
                key={heldCart.id}
                onClick={() => handleRecallCart(heldCart)}
                className={`px-4 py-2.5 flex items-center gap-2 border-r border-gray-200 cursor-pointer hover:bg-white transition-colors ${activeHeldCartId === heldCart.id ? 'bg-white border-t-2 border-blue-500' : 'opacity-60 hover:opacity-100'
                  }`}
              >
                <ShoppingCart size={12} className="text-gray-500" />
                <span className="font-medium">
                  {heldCart.customer?.customer_name || 'Guest'} ({heldCart.items.length})
                </span>
                <X
                  size={12}
                  className="ml-1 cursor-pointer hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteHeldCart(heldCart.id);
                  }}
                />
              </div>
            ))}

            {/* Sessions Tab */}
            <div
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2.5 flex items-center gap-2 border-r border-gray-200 cursor-pointer hover:bg-white transition-colors ${activeTab === 'sessions' ? 'bg-white border-t-2 border-blue-500' : 'opacity-60 hover:opacity-100'
                }`}
            >
              <Clock size={12} className="text-gray-500" />
              <span className="font-medium">Sessions</span>
            </div>

            {/* Session Status Indicator */}
            <div className="ml-auto flex items-center gap-2 px-4">
              {activeSession ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs text-green-700 font-medium">
                    Session: {activeSession.session_number}
                  </span>
                  <button
                    onClick={() => { setCashMovementType('in'); setCashMovementAmount(0); setShowCashMovementModal(true); }}
                    className="ml-2 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors flex items-center gap-1"
                  >
                    <ArrowDownCircle size={12} />
                    Cash In
                  </button>
                  <button
                    onClick={() => { setCashMovementType('out'); setCashMovementAmount(0); setShowCashMovementModal(true); }}
                    className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors flex items-center gap-1"
                  >
                    <ArrowUpCircle size={12} />
                    Cash Out
                  </button>
                  <button
                    onClick={() => setShowCloseSessionModal(true)}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                  >
                    End Session
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-xs text-red-700 font-medium">No Active Session</span>
                  <button
                    onClick={() => setShowStartSessionModal(true)}
                    className="ml-2 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                  >
                    Start Session
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeTab === 'newsale' ? (
            <>

              {/* Item Search Input - Inline */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white relative z-20">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type here or scan an item to add [F10]"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Inline Dropdown Results */}
                {itemSearch && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-lg max-h-[400px] overflow-y-auto z-50 mx-6 mt-1">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <p className="text-sm">No items found</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className="p-3 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg cursor-pointer transition-colors flex justify-between items-center group"
                          >
                            <div>
                              <div className="font-semibold text-gray-800 text-sm group-hover:text-blue-700">{item.item_name}</div>
                              {(item.color || item.variant || item.size) && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {[item.color, item.variant, item.size].filter(Boolean).join(' | ')}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-0.5">
                                SKU: {item.sku} {item.barcode ? `| Barcode: ${item.barcode}` : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900 group-hover:text-blue-700">₹{item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                              <div className="text-xs text-gray-500">
                                Stock: <span className={item.current_stock > 0 ? 'text-green-600 font-medium' : 'text-red-500'}>{item.current_stock}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Table Header */}
              {cart.length > 0 && (
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 border-b border-gray-200 bg-gray-50">
                  <div className="col-span-1">S.NO.</div>
                  <div className="col-span-5">NAME</div>
                  <div className="col-span-1 text-center">QTY.</div>
                  <div className="col-span-2 text-right">RATE</div>
                  <div className="col-span-2 text-right">AMOUNT</div>
                  <div className="col-span-1"></div>
                </div>
              )}

              {/* Cart Items or Empty State */}
              <div className="flex-grow overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="relative mb-6">
                      <ShoppingCart size={80} strokeWidth={1.5} className="text-gray-300" />
                      <Plus size={24} className="absolute -top-2 -right-2 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-500">Yet to add items to the cart!</h3>
                    <p className="text-sm text-gray-400">Search or scan items to add them to your cart</p>
                  </div>
                ) : (
                  <>
                    {cart.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="col-span-1 text-sm text-gray-600">{index + 1}</div>
                        <div className="col-span-5">
                          <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            SKU: {item.sku} | Tax: {item.tax_rate}%
                          </div>
                          {item.available_bins && item.available_bins.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin size={10} className="text-blue-500" />
                              {item.available_bins.length === 1 ? (
                                <span className="text-xs text-blue-600">{item.available_bins[0].bin_code}</span>
                              ) : (
                                <select
                                  value={item.bin_allocations?.[0]?.bin_location_id || ''}
                                  onChange={(e) => handleBinChange(item.id, e.target.value)}
                                  className="text-xs text-blue-600 bg-transparent border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                >
                                  <option value="">Select Bin</option>
                                  {item.available_bins.map(b => (
                                    <option key={b.bin_id} value={b.bin_id}>
                                      {b.bin_code} - {b.location_name}{b.stock > 0 ? ` (${b.stock} pcs)` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="col-span-1 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleQtyChange(item.id, e.target.value)}
                            className="w-16 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="flex items-center justify-end bg-gray-50 rounded border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-2">
                            <span className="text-xs text-gray-500 mr-1">₹</span>
                            <input
                              type="number"
                              value={item.rate || ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => handleRateChange(item.id, e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-right text-sm text-gray-800 p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 text-right text-sm font-semibold text-gray-800">
                          ₹{(item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                <button
                  onClick={handleClearCart}
                  className="px-4 py-2 bg-red-50 border border-red-300 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <X size={14} /> Clear All [F6]
                </button>
                <button
                  onClick={handleHoldCart}
                  disabled={cart.length === 0}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Package size={14} /> Hold Cart [F7]
                </button>
              </div>
            </>
          ) : (
            /* Sessions View */
            <div className="flex-1 overflow-auto p-6">
              {/* Sessions Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">POS Sessions</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your point of sale sessions</p>
                </div>
                {!activeSession && (
                  <button
                    onClick={() => setShowStartSessionModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Start New Session
                  </button>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Register
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opened By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opened At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Closed At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Sales
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Clock className="w-12 h-12 mb-3" />
                            <p className="text-lg font-medium">No sessions found</p>
                            <p className="text-sm mt-1">Start a new session to begin</p>
                            <button
                              onClick={() => setShowStartSessionModal(true)}
                              className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              Start Session
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session) => (
                        <tr
                          key={session.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/sales/pos/sessions/${session.id}`)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:underline">
                            {session.session_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {session.register}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {session.opened_by}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(session.opened_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {session.closed_at
                              ? new Date(session.closed_at).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                            {formatCurrency(session.total_sales)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${session.status === 'In-Progress'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {session.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {session.status === 'In-Progress' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSession(session);
                                    setShowCloseSessionModal(true);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                                  title="Close Session"
                                >
                                  Close Session
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/sales/pos/sessions/${session.id}`);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                                title="View Details"
                              >
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Session Summary Stats */}
                {sessions.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Total Sessions</div>
                            <div className="text-xl font-bold text-gray-800">{sessions.length}</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Active Sessions</div>
                            <div className="text-xl font-bold text-green-600">
                              {sessions.filter(s => s.status === 'In-Progress').length}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Closed Sessions</div>
                            <div className="text-xl font-bold text-gray-600">
                              {sessions.filter(s => s.status === 'Closed').length}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Total Revenue</div>
                            <div className="text-xl font-bold text-purple-600">
                              {formatCurrency(sessions.reduce((sum, s) => sum + s.total_sales, 0))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-[420px] flex flex-col bg-white border-l border-gray-200">
          <div className="p-5 space-y-5">
            {selectedCustomer ? (
              <div className="flex justify-between items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-blue-700">
                      {selectedCustomer.customer_name?.toUpperCase()}
                    </div>
                    {selectedCustomer.mobile && (
                      <div className="text-xs text-gray-600 mt-1">{selectedCustomer.mobile}</div>
                    )}
                    {selectedCustomer.current_balance && selectedCustomer.current_balance > 0 && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        Outstanding: ₹{selectedCustomer.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 text-gray-500">
                  <Edit2 size={14} className="cursor-pointer hover:text-blue-600 transition-colors" />
                  <X size={14} className="cursor-pointer hover:text-red-600 transition-colors" onClick={() => setSelectedCustomer(null)} />
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <User size={16} /> Customer [F9]
              </button>
            )}

            <div className="h-px bg-gray-200"></div>

            {selectedSalesperson && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Salesperson</div>
                    <div className="text-sm font-bold text-green-700">
                      {selectedSalesperson.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{selectedSalesperson.email}</div>
                  </div>
                  <X
                    size={14}
                    className="cursor-pointer hover:text-red-600 transition-colors text-gray-500"
                    onClick={() => setSelectedSalesperson(null)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm font-medium text-gray-600">
              <button
                onClick={() => setShowDiscountModal(true)}
                className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors ${discountValue > 0 ? 'bg-green-50 text-green-700 border border-green-200' : ''}`}
              >
                {discountValue > 0
                  ? `Discount: ${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`} (-₹${discountAmount.toFixed(2)})`
                  : 'Discount [Alt+Shift+P]'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowDeliveryDropdown(!showDeliveryDropdown)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors ${deliveryOption === 'delivery' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`}
                >
                  {deliveryOption === 'delivery' ? 'Delivery: Delivery' : 'Delivery: Self Pickup'} [Alt+Shift+D]
                </button>
                {showDeliveryDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => { setDeliveryOption('self_pickup'); setShowDeliveryDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors text-sm ${deliveryOption === 'self_pickup' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
                    >
                      Self Pickup
                    </button>
                    <button
                      onClick={() => { setDeliveryOption('delivery'); setShowDeliveryDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors text-sm ${deliveryOption === 'delivery' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
                    >
                      Delivery
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowSalespersonModal(true)}
                className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Salesperson [Shift+F10]
              </button>
            </div>
          </div>

          <div className="mt-auto p-5 bg-gray-50 border-t border-gray-200">
            <div className="mb-5">
              <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                <span>Subtotal ({cart.length} items, {totalQty} qty)</span>
                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600 mb-1">
                  <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`})</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between items-end mt-2">
                <div className="text-xl font-bold text-gray-800">Total</div>
                <div className="text-3xl font-bold text-gray-900">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePaymentClick('Cash')}
                disabled={cart.length === 0 || processingPayment}
                className="col-span-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm uppercase transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingPayment ? 'Processing...' : 'Cash [F1]'}
              </button>
              <button
                onClick={() => handlePaymentClick('HDFC')}
                disabled={cart.length === 0 || processingPayment}
                className="py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                HDFC BANK [F2]
              </button>
              <button
                onClick={() => handlePaymentClick('ICICI')}
                disabled={cart.length === 0 || processingPayment}
                className="py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ICICI BANK [F3]
              </button>
              <button
                onClick={() => handlePaymentClick('BAJAJ/ICICI')}
                disabled={cart.length === 0 || processingPayment}
                className="py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                BAJAJ / ICICI BANK
              </button>
              <button
                onClick={() => handlePaymentClick('CREDIT SALE')}
                disabled={cart.length === 0 || processingPayment}
                className="py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Credit Sale [F4]
              </button>
              <button
                onClick={() => handlePaymentClick('D/B CREDIT CARD / EM')}
                disabled={cart.length === 0 || processingPayment}
                className="py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                D/B CREDIT CARD / EM
              </button>
              <button
                onClick={() => setShowSplitPaymentModal(true)}
                disabled={cart.length === 0 || processingPayment}
                className="py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                More... [F12]
              </button>
            </div>
          </div>
        </div>

        {/* Customer Search Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[550px] max-h-[650px] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Select Customer</h2>
                <button onClick={() => { setShowCustomerModal(false); setCustomerSearch(''); }}>
                  <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              <div className="p-5 border-b border-gray-200">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, mobile, or email..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-3">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <User size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm mb-4">No customers found</p>
                    {phoneNumberFromSearch && (
                      <p className="text-xs text-blue-600">Searched number: {phoneNumberFromSearch}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-4 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="font-semibold text-gray-800 text-sm">{customer.customer_name}</div>
                        <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                          {customer.mobile && <div>Mobile: {customer.mobile}</div>}
                          {customer.email && <div>Email: {customer.email}</div>}
                        </div>
                        {customer.current_balance && customer.current_balance > 0 && (
                          <div className="text-xs text-orange-600 mt-2 font-medium">
                            Outstanding: ₹{customer.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-gray-200">
                <button
                  onClick={handleOpenAddCustomerWithPhone}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Add New Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Salesperson Search Modal */}
        {showSalespersonModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[550px] max-h-[650px] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Select Salesperson</h2>
                <button onClick={() => { setShowSalespersonModal(false); setSalespersonSearch(''); }}>
                  <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              <div className="p-5 border-b border-gray-200">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={salespersonSearch}
                    onChange={(e) => setSalespersonSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-3">
                {filteredSalespersons.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <User size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm mb-4">No salesperson found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSalespersons.map((salesperson) => (
                      <div
                        key={salesperson.id}
                        onClick={() => handleSelectSalesperson(salesperson)}
                        className="p-4 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="font-semibold text-gray-800 text-sm">{salesperson.name}</div>
                        <div className="text-xs text-gray-500 mt-1.5">
                          Email: {salesperson.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowSalespersonModal(false);
                    setShowManageSalespersonModal(true);
                  }}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Manage Salesperson
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Salesperson Modal */}
        {showManageSalespersonModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
                <h2 className="text-2xl font-bold text-gray-800">Manage Salespersons</h2>
                <button onClick={() => { setShowManageSalespersonModal(false); setShowAddSalespersonForm(false); setNewSalesperson({ name: '', email: '' }); }}>
                  <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>

              <div className="p-6">
                {!showAddSalespersonForm ? (
                  <>
                    <div className="mb-4">
                      <button
                        onClick={() => setShowAddSalespersonForm(true)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Add New Salesperson
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">All Salespersons</h3>
                      {salespersons.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <User size={48} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No salespersons added yet</p>
                        </div>
                      ) : (
                        salespersons.map((sp) => (
                          <div key={sp.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div>
                              <div className="font-semibold text-gray-800">{sp.name}</div>
                              <div className="text-sm text-gray-500">{sp.email}</div>
                            </div>
                            <button
                              onClick={() => handleDeleteSalesperson(sp.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Add New Salesperson</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={newSalesperson.name}
                        onChange={(e) => setNewSalesperson({ ...newSalesperson, name: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. john@example.com"
                        value={newSalesperson.email}
                        onChange={(e) => setNewSalesperson({ ...newSalesperson, email: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-3 pt-5 border-t border-gray-200">
                      <button
                        onClick={() => { setShowAddSalespersonForm(false); setNewSalesperson({ name: '', email: '' }); }}
                        className="flex-1 px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddSalesperson}
                        className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Reference Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[500px] shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Payment Details - {selectedPaymentMode}</h2>
                <button onClick={() => { setShowPaymentModal(false); setReferenceNumber(''); }}>
                  <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Customer:</span>
                      <span className="text-sm font-bold text-gray-800">
                        {selectedCustomer?.customer_name || 'Walk-in Customer'}
                      </span>
                    </div>
                    {selectedCustomer?.mobile && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Mobile:</span>
                        <span className="text-sm font-bold text-gray-800">{selectedCustomer.mobile}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200">
                      <span className="text-base font-medium text-gray-700">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {selectedPaymentMode === 'CREDIT SALE' ? (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paid Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            min="0"
                            max={total}
                            step="0.01"
                            placeholder="Enter amount paid"
                            value={paidAmount || ''}
                            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the amount paid now (can be 0 for full credit)
                        </p>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Remaining Amount
                        </label>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Balance Due:</span>
                            <span className="text-xl font-bold text-orange-600">
                              ₹{(total - (paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reference Number (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Enter transaction reference (if any)"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Number {selectedPaymentMode !== 'Cash' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="Enter transaction reference number"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the bank transaction reference or approval code
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowPaymentModal(false); setReferenceNumber(''); }}
                    disabled={processingPayment}
                    className="flex-1 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleProcessPayment(selectedPaymentMode, referenceNumber, paidAmount)}
                    disabled={processingPayment || (!referenceNumber && selectedPaymentMode !== 'Cash' && selectedPaymentMode !== 'CREDIT SALE')}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingPayment ? 'Processing...' : 'Complete Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bill Success Modal */}
        {showBillSuccess && generatedInvoice && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex flex-col items-center p-8 border-b border-gray-200 bg-gradient-to-br from-green-50 to-blue-50">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <Check size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Bill Created Successfully!</h2>
                <p className="text-gray-600">Invoice #{generatedInvoice.invoice_number}</p>
              </div>

              <div className="p-6">
                {/* Customer & Payment Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase">Customer Details</h3>
                    <p className="text-sm font-bold text-gray-800">{generatedInvoice.customer_name}</p>
                    {selectedCustomer?.mobile && (
                      <p className="text-xs text-gray-600 mt-1">{selectedCustomer.mobile}</p>
                    )}
                    {selectedCustomer?.email && (
                      <p className="text-xs text-gray-600">{selectedCustomer.email}</p>
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase">Payment Details</h3>
                    <p className="text-sm font-bold text-green-700">{generatedInvoice.paymentMode}</p>
                    {generatedInvoice.referenceNumber && (
                      <p className="text-xs text-gray-600 mt-1">Ref: {generatedInvoice.referenceNumber}</p>
                    )}
                    <p className="text-xs text-gray-600">{generatedInvoice.createdAt}</p>
                  </div>
                </div>

                {/* Salesperson Details */}
                {generatedInvoice.salesperson_name && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <h3 className="text-xs font-bold text-gray-600 mb-1 uppercase">Salesperson</h3>
                    <p className="text-sm font-bold text-purple-700">{generatedInvoice.salesperson_name}</p>
                  </div>
                )}

                {/* Items Table */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Items</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">ITEM</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">QTY</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">RATE</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {generatedInvoice.items.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-800">{item.item_name}</td>
                            <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-800">
                              ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-gray-700">Total Amount:</span>
                    <span className="text-3xl font-bold text-green-600">
                      ₹{generatedInvoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {generatedInvoice.paymentMode === 'CREDIT SALE' && generatedInvoice.balanceDue > 0 && (
                    <>
                      <div className="border-t border-gray-300 pt-3 mt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Amount Paid:</span>
                          <span className="text-lg font-semibold text-green-600">
                            ₹{generatedInvoice.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Balance Due:</span>
                          <span className="text-lg font-semibold text-orange-600">
                            ₹{generatedInvoice.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="bg-orange-100 border border-orange-300 rounded px-3 py-2 text-center">
                          <span className="text-sm font-bold text-orange-700">CREDIT SALE - PAYMENT PENDING</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePrintBill}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Printer size={18} /> Print Bill
                  </button>
                  <button
                    onClick={handleCompleteBill}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
                  >
                    New Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
                <h2 className="text-2xl font-bold text-gray-800">Add Customer</h2>
                <button onClick={() => { setShowAddCustomerModal(false); setPhoneNumberFromSearch(''); setGstTreatment('Consumer'); }}>
                  <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              <form onSubmit={handleCreateCustomer} className="p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Personal Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Smith"
                        value={newCustomer.display_name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, display_name: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9999999999"
                        value={newCustomer.mobile}
                        onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                      <input
                        type="email"
                        placeholder="e.g. customername@domain.com"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Address</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                      <input
                        type="text"
                        placeholder="#House/Apartment no., Street name"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          placeholder="Area name"
                          value={newCustomer.city}
                          onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <select
                          value={newCustomer.state}
                          onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Karnataka">Karnataka</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Gujarat">Gujarat</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Tax Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Treatment <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={gstTreatment}
                      onChange={(e) => {
                        const value = e.target.value as 'Consumer' | 'Registered';
                        setGstTreatment(value);
                        if (value === 'Consumer') {
                          setNewCustomer({ ...newCustomer, gstin: '', company_name: '' });
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Consumer">Consumer</option>
                      <option value="Registered">Registered Business - Regular</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowAddCustomerModal(false); setPhoneNumberFromSearch(''); setGstTreatment('Consumer'); }}
                    className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Split Payment Modal */}
        <SplitPaymentModal
          isOpen={showSplitPaymentModal}
          onClose={() => setShowSplitPaymentModal(false)}
          totalAmount={total}
          customerName={selectedCustomer?.customer_name || 'Walk-in Customer'}
          customerMobile={selectedCustomer?.mobile}
          onComplete={handleSplitPaymentComplete}
        />

        {/* Cash Movement Modal */}
        {showCashMovementModal && activeSession && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[400px] shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  {cashMovementType === 'in' ? 'Cash In' : 'Cash Out'}
                </h3>
                <button onClick={() => setShowCashMovementModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5">
                <div className="mb-4 text-sm text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>Current Cash In:</span>
                    <span className="font-medium text-green-600">₹{activeSession.cash_in.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Cash Out:</span>
                    <span className="font-medium text-orange-600">₹{activeSession.cash_out.toFixed(2)}</span>
                  </div>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashMovementAmount || ''}
                  onChange={(e) => setCashMovementAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
                <button
                  onClick={() => setShowCashMovementModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCashMovement}
                  disabled={cashMovementLoading || cashMovementAmount <= 0}
                  className={`px-4 py-2 rounded-lg text-white transition ${
                    cashMovementType === 'in'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } disabled:opacity-50`}
                >
                  {cashMovementLoading ? 'Processing...' : `Record Cash ${cashMovementType === 'in' ? 'In' : 'Out'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Session Modal */}
        {showStartSessionModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[450px] shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Start New Session</h2>
                <button onClick={() => setShowStartSessionModal(false)}>
                  <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Register Name
                  </label>
                  <input
                    type="text"
                    value={startSessionData.register}
                    onChange={(e) => setStartSessionData({ ...startSessionData, register: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="billing desk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opened By <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={startSessionData.opened_by}
                    onChange={(e) => setStartSessionData({ ...startSessionData, opened_by: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Cash Balance
                  </label>
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent px-4">
                    <span className="text-gray-500">₹</span>
                    <input
                      type="number"
                      value={startSessionData.opening_balance}
                      onChange={(e) => setStartSessionData({ ...startSessionData, opening_balance: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-transparent border-none px-2 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowStartSessionModal(false)}
                  disabled={sessionLoading}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartSession}
                  disabled={sessionLoading || !startSessionData.opened_by.trim()}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sessionLoading ? 'Starting...' : 'Start Session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Session Modal */}
        {showCloseSessionModal && activeSession && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[500px] shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Close Session</h2>
                <button onClick={() => setShowCloseSessionModal(false)}>
                  <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Session:</span>
                      <span className="ml-2 font-semibold text-gray-800">{activeSession.session_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Register:</span>
                      <span className="ml-2 font-semibold text-gray-800">{activeSession.register}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Opened By:</span>
                      <span className="ml-2 font-semibold text-gray-800">{activeSession.opened_by}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Sales:</span>
                      <span className="ml-2 font-semibold text-green-600">{formatCurrency(activeSession.total_sales)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opening Balance
                    </label>
                    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2.5">
                      <span className="text-gray-500">₹</span>
                      <span className="ml-2 text-gray-700">{activeSession.opening_balance.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cash In
                    </label>
                    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2.5">
                      <span className="text-gray-500">₹</span>
                      <span className="ml-2 text-gray-700">{activeSession.cash_in.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Cash Balance
                  </label>
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent px-4">
                    <span className="text-gray-500">₹</span>
                    <input
                      type="number"
                      value={closeSessionData.closing_balance}
                      onChange={(e) => setCloseSessionData({ ...closeSessionData, closing_balance: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-transparent border-none px-2 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-0"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Once closed, this session cannot be reopened. All sales have been recorded.
                  </p>
                </div>
              </div>
              <div className="p-5 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowCloseSessionModal(false)}
                  disabled={sessionLoading}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseSession}
                  disabled={sessionLoading}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {sessionLoading ? 'Closing...' : 'Close Session'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[400px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Apply Discount</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="text-sm text-gray-500 mb-4">
                Subtotal: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setDiscountType('amount')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${discountType === 'amount' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Amount (₹)
                </button>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
              </label>
              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : subtotal}
                step="0.01"
                value={discountValue || ''}
                onChange={(e) => {
                  let val = parseFloat(e.target.value) || 0;
                  if (discountType === 'percentage' && val > 100) val = 100;
                  if (discountType === 'amount' && val > subtotal) val = subtotal;
                  setDiscountValue(val);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                autoFocus
              />
              {discountValue > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span className="text-green-700 font-medium">-₹{(discountType === 'percentage' ? (subtotal * discountValue / 100) : discountValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-800 mt-1">
                    <span>New Total:</span>
                    <span>₹{Math.max(0, subtotal - (discountType === 'percentage' ? (subtotal * discountValue / 100) : discountValue)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => { setDiscountValue(0); setShowDiscountModal(false); }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Remove Discount
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PosCreate;