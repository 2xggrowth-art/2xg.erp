import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { customersService, Customer, CreateCustomerData } from '../services/customers.service';
import { itemsService, Item } from '../services/items.service';
import { salespersonService, Salesperson } from '../services/salesperson.service';
import { invoicesService } from '../services/invoices.service';
import { posSessionsService, PosSession } from '../services/pos-sessions.service';
import { binLocationService } from '../services/bin-locations.service';
import { posCodesService } from '../services/pos-codes.service';
import { printerService } from '../services/printer.service';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// POS Sub-components
import { CartItem, HeldCart, AvailableBin, TabType } from '../components/pos/posTypes';
import HeldCartsTabs from '../components/pos/HeldCartsTabs';
import ProductSearch from '../components/pos/ProductSearch';
import CartItemsList from '../components/pos/CartItemsList';
import SessionsView from '../components/pos/SessionsView';
import InvoicesTab from '../components/pos/InvoicesTab';
import ReturnTab from '../components/pos/ReturnTab';
import SessionTab from '../components/pos/SessionTab';
import CartPanel from '../components/pos/CartPanel';
import CartItemDetailPopup from '../components/pos/CartItemDetailPopup';
import PosModals from '../components/pos/PosModals';
import PosBinPicker from '../components/pos/PosBinPicker';

// ─── Types ───────────────────────────────────────────────────────

type PaymentMode = 'Cash' | 'HDFC' | 'ICICI' | 'BAJAJ/ICICI' | 'D/B CREDIT CARD / EM' | 'CREDIT SALE' | '';

interface GeneratedInvoice {
  id?: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  salesperson_id: string | null;
  salesperson_name: string | null;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  subtotal: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  payment_status: string;
  pos_session_id: string | null;
  customer_notes: string;
  items: Array<{
    item_id: string;
    item_name: string;
    account: string;
    description: string;
    quantity: number;
    unit_of_measurement: string;
    rate: number;
    amount: number;
    stock_on_hand: number;
    bin_allocations?: Array<{ bin_location_id: string; quantity: number }>;
  }>;
  paymentMode: string;
  referenceNumber: string;
  amountPaid: number;
  balanceDue: number;
  splitPayments?: Array<{ mode: string; amount: number; reference?: string; note?: string }>;
  createdAt: string;
}

// ─── Component ───────────────────────────────────────────────────

const PosCreate: React.FC = () => {
  const { orgSettings } = useOrgSettings();

  // ─── State ───────────────────────────────────────────────────

  // Tab and cart
  const [activeTab, setActiveTab] = useState<TabType>('newsale');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);

  // Modal visibility
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);
  const [showManageSalespersonModal, setShowManageSalespersonModal] = useState(false);
  const [showAddSalespersonForm, setShowAddSalespersonForm] = useState(false);

  // Data lists
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);

  // Search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [salespersonSearch, setSalespersonSearch] = useState('');

  // Loading
  const [loading, setLoading] = useState(false);

  // Held carts
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [activeHeldCartId, setActiveHeldCartId] = useState<string | null>(null);

  // New records
  const [phoneNumberFromSearch, setPhoneNumberFromSearch] = useState('');
  const [newSalesperson, setNewSalesperson] = useState({ name: '', email: '' });

  // Sessions
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
  const [denominations, setDenominations] = useState<{ note: number; count: number }[]>([
    { note: 500, count: 0 },
    { note: 200, count: 0 },
    { note: 100, count: 0 },
    { note: 50, count: 0 },
    { note: 20, count: 0 },
    { note: 10, count: 0 },
    { note: 5, count: 0 },
    { note: 2, count: 0 },
    { note: 1, count: 0 },
  ]);

  // Printer
  const [printerConnected, setPrinterConnected] = useState(false);

  // Cash movement
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [cashMovementType, setCashMovementType] = useState<'in' | 'out'>('in');
  const [cashMovementAmount, setCashMovementAmount] = useState<number>(0);
  const [cashMovementLoading, setCashMovementLoading] = useState(false);

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Cart item detail popup
  const [detailPopupItem, setDetailPopupItem] = useState<CartItem | null>(null);

  // Discount
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Delivery
  const [deliveryOption, setDeliveryOption] = useState<'self_pickup' | 'delivery' | null>('self_pickup');
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);

  // Processing
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showBillSuccess, setShowBillSuccess] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<GeneratedInvoice | null>(null);

  // POS Code lock
  const [posLocked, setPosLocked] = useState(false);
  const [posCodeInput, setPosCodeInput] = useState('');
  const [posEmployeeName, setPosEmployeeName] = useState('');
  const [posCodeError, setPosCodeError] = useState('');
  const [posCodeLoading, setPosCodeLoading] = useState(false);
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  // Hold/Recall/Print modals
  const [showHoldCartModal, setShowHoldCartModal] = useState(false);
  const [holdCartName, setHoldCartName] = useState('');
  const [showRecallCartModal, setShowRecallCartModal] = useState(false);
  const [showPrintOptionsModal, setShowPrintOptionsModal] = useState(false);

  // Bin picker
  const [showBinPicker, setShowBinPicker] = useState(false);
  const [binPickerItem, setBinPickerItem] = useState<{
    cartItemId: string;
    itemName: string;
    itemQty: number;
    bins: Array<{ bin_id: string; bin_code: string; location_name: string; quantity: number; unit_of_measurement: string }>;
  } | null>(null);

  // New customer form
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

  // ─── Refs ──────────────────────────────────────────────────────
  const lastSaleTimeRef = useRef<number>(Date.now());

  // ─── Data Fetching ─────────────────────────────────────────────

  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsData = await itemsService.getAllItems();
      if (Array.isArray(itemsData)) {
        setItems(itemsData);
      } else {
        console.error('Unexpected items data format:', itemsData);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getAllCustomers();
      if (Array.isArray(response.data)) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

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
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const response = await posSessionsService.getActiveSession();
      if (response.success && response.data) {
        setActiveSession(response.data);
        setPosLocked(true);
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
    } finally {
      setSessionChecked(true);
    }
  };

  const checkPrinterConnection = async () => {
    try {
      const printers = await printerService.listPrinters();
      setPrinterConnected(printers.length > 0);
    } catch {
      setPrinterConnected(false);
    }
  };

  // ─── Effects ───────────────────────────────────────────────────

  // Initial data load
  useEffect(() => {
    fetchItems();
    fetchCustomers();
    fetchSalespersons();
    fetchSessions();
    fetchActiveSession();
    checkPrinterConnection();

    // Poll printer status every 30 seconds
    const printerCheck = setInterval(checkPrinterConnection, 30000);
    return () => clearInterval(printerCheck);
  }, []);

  // Auto-show session start modal when no active session
  useEffect(() => {
    if (sessionChecked && activeTab === 'newsale' && !activeSession && !showStartSessionModal) {
      setShowStartSessionModal(true);
    }
  }, [activeTab, activeSession, sessionChecked]);

  // Set default register from org settings
  useEffect(() => {
    if (orgSettings?.default_register) {
      setStartSessionData(prev => ({
        ...prev,
        register: orgSettings.default_register || prev.register,
      }));
    }
  }, [orgSettings]);

  // Load held carts from localStorage
  useEffect(() => {
    try {
      const savedCarts = localStorage.getItem('pos_held_carts');
      if (savedCarts) {
        setHeldCarts(JSON.parse(savedCarts));
      }
    } catch (e) {
      console.error('Failed to load held carts:', e);
    }
  }, []);

  // Save held carts to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('pos_held_carts', JSON.stringify(heldCarts));
    } catch (e) {
      console.error('Failed to save held carts:', e);
    }
  }, [heldCarts]);

  // Inactivity timer - lock POS after 10 minutes of no sales
  const resetInactivityTimer = useCallback(() => {
    lastSaleTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (posLocked) return;
    lastSaleTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastSaleTimeRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT) {
        setPosLocked(true);
        setPosCodeInput('');
        setPosCodeError('');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [posLocked]);

  // Detect phone number in customer search
  useEffect(() => {
    const isPhoneNumber = /^\d{10}$/.test(customerSearch);
    setPhoneNumberFromSearch(isPhoneNumber ? customerSearch : '');
  }, [customerSearch]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handlePosCodeVerify = async () => {
    if (!posCodeInput.trim()) {
      setPosCodeError('Please enter your code');
      return;
    }
    setPosCodeLoading(true);
    setPosCodeError('');
    try {
      const res = await posCodesService.verifyCode(posCodeInput.trim());
      if (res.data) {
        setPosEmployeeName(res.data.employee_name);
        setPosLocked(false);
        setPosCodeInput('');
        setPosCodeError('');
      } else {
        setPosCodeError('Invalid code');
      }
    } catch (error: any) {
      setPosCodeError(error?.message || 'Invalid code');
    } finally {
      setPosCodeLoading(false);
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
        setStartSessionData({
          register: orgSettings?.default_register || 'billing desk',
          opened_by: '',
          opening_balance: 0,
        });
        fetchSessions();
        alert('Session started successfully!');
      }
    } catch (error: any) {
      console.error('Error starting session:', error);
      alert(error?.message || 'Failed to start session');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      setSessionLoading(true);
      const denominationTotal = denominations.reduce((sum, d) => sum + d.note * d.count, 0);
      const denomination_data = denominations
        .filter(d => d.count > 0)
        .map(d => ({ note: d.note, count: d.count, total: d.note * d.count }));

      const response = await posSessionsService.closeSession(activeSession.id, {
        closing_balance: denominationTotal || closeSessionData.closing_balance,
        cash_in: activeSession.cash_in,
        cash_out: activeSession.cash_out,
        closed_by: posEmployeeName || activeSession.opened_by,
        denomination_data,
      });

      if (response.success) {
        setActiveSession(null);
        setShowCloseSessionModal(false);
        setCloseSessionData({ closing_balance: 0, cash_in: 0, cash_out: 0 });
        setDenominations(denominations.map(d => ({ ...d, count: 0 })));
        fetchSessions();
        // In Electron, switch to sessions tab instead of navigating
        setActiveTab('sessions');
        alert('Session closed successfully!');
      }
    } catch (error: any) {
      console.error('Error closing session:', error);
      alert(error?.message || 'Failed to close session');
    } finally {
      setSessionLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleRateChange = (id: string, newRate: string) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        return { ...item, rate: parseFloat(newRate) || 0 };
      }
      return item;
    }));
  };

  const handleQtyChange = (id: string, newQty: string) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const numericQty = parseInt(newQty) || 0;
        if (item.bin_allocations && item.bin_allocations.length === 1) {
          return {
            ...item,
            qty: numericQty,
            bin_allocations: [{ ...item.bin_allocations[0], quantity: numericQty }],
          };
        }
        return { ...item, qty: numericQty };
      }
      return item;
    }));
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearch('');
  };

  const handleSelectItem = async (item: Item) => {
    let itemBins: AvailableBin[] = [];
    try {
      const binResponse = await binLocationService.getBinLocationsForItem(item.id);
      if (binResponse.success && binResponse.data && binResponse.data.length > 0) {
        itemBins = binResponse.data.map((b) => ({
          bin_id: b.bin_id,
          bin_code: b.bin_code,
          location_name: b.location_name,
          stock: b.quantity,
        }));
      }
    } catch (error) {
      console.error('Error fetching bin locations:', error);
    }

    const cartItemId = `cart-${Date.now()}-${item.id}`;

    const cartItem: CartItem = {
      id: cartItemId,
      item_id: item.id,
      name: item.item_name,
      sku: item.sku,
      tax_rate: item.tax_rate,
      qty: 1,
      rate: item.unit_price,
      cost_price: item.cost_price,
      available_bins: itemBins.length > 0 ? itemBins : undefined,
      bin_allocations: itemBins.length === 1
        ? [{
            bin_location_id: itemBins[0].bin_id,
            bin_code: itemBins[0].bin_code,
            location_name: itemBins[0].location_name,
            quantity: 1,
          }]
        : undefined,
    };
    setCart(prev => [...prev, cartItem]);
    setItemSearch('');

    // If multiple bins available, show bin picker
    if (itemBins.length > 1) {
      setBinPickerItem({
        cartItemId,
        itemName: item.item_name,
        itemQty: 1,
        bins: itemBins.map(b => ({
          bin_id: b.bin_id,
          bin_code: b.bin_code,
          location_name: b.location_name,
          quantity: b.stock,
          unit_of_measurement: 'pcs',
        })),
      });
      setShowBinPicker(true);
    }
  };

  const handleBinPickerSelect = (allocations: Array<{ bin_location_id: string; bin_code: string; location_name: string; quantity: number }>) => {
    if (!binPickerItem) return;
    setCart(prev => prev.map(item => {
      if (item.id === binPickerItem.cartItemId) {
        return { ...item, bin_allocations: allocations };
      }
      return item;
    }));
    setShowBinPicker(false);
    setBinPickerItem(null);
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
          quantity: item.qty,
        }],
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
      if (response.data) {
        const createdCustomer = response.data;
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

  const handleQuickAddCustomer = async (phone: string, name: string) => {
    try {
      const response = await customersService.createCustomer({
        display_name: name,
        mobile: phone,
        email: '',
        address: '',
        city: '',
        state: 'Karnataka',
        gstin: '',
        payment_terms: 'Due on Receipt',
      });
      if (response.data) {
        const createdCustomer = response.data;
        setCustomers([createdCustomer, ...customers]);
        setSelectedCustomer(createdCustomer);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer');
    }
  };

  const handleCartItemDetailApply = (updates: { serial_number?: string; rate: number; note?: string }) => {
    if (!detailPopupItem) return;
    setCart(prev => prev.map(item => {
      if (item.id === detailPopupItem.id) {
        return { ...item, serial_number: updates.serial_number, rate: updates.rate, note: updates.note };
      }
      return item;
    }));
    setDetailPopupItem(null);
  };

  const handleCartItemDetailRemove = () => {
    if (!detailPopupItem) return;
    setCart(prev => prev.filter(item => item.id !== detailPopupItem.id));
    setDetailPopupItem(null);
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
    setHeldCarts(heldCarts.filter(c => c.id !== id));
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

  // ─── Payment Handlers ─────────────────────────────────────────

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
    const missing: string[] = [];
    if (!selectedCustomer) missing.push('Customer');
    if (!selectedSalesperson) missing.push('Salesperson');
    if (!deliveryOption) missing.push('Delivery Option');
    if (missing.length > 0) {
      alert(`Please select: ${missing.join(', ')}`);
      return;
    }

    setSelectedPaymentMode(mode);
    if (mode !== 'CREDIT SALE') {
      setPaidAmount(total);
    } else {
      setPaidAmount(0);
    }

    if (mode === 'Cash') {
      handleProcessPayment(mode, '', total);
    } else {
      setShowPaymentModal(true);
    }
  };

  const buildInvoiceData = (
    invoiceNumber: string,
    mode: string,
    refNumber: string,
    amountPaid: number,
    balanceDue: number,
    invoiceStatus: string,
    paymentStatus: string,
    customerNotes: string,
  ) => {
    const cartTaxableTotal = cart.reduce((sum, item) => sum + (item.qty * item.rate), 0) - discountAmount;
    const posGstRate = 9;
    const posCgstAmount = (cartTaxableTotal * posGstRate) / 100;
    const posSgstAmount = (cartTaxableTotal * posGstRate) / 100;

    return {
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer?.customer_name || 'Walk-in Customer',
      customer_email: selectedCustomer?.email || null,
      customer_phone: selectedCustomer?.mobile || selectedCustomer?.phone || null,
      invoice_number: invoiceNumber,
      order_number: refNumber || null,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      payment_terms: 'Due on Receipt',
      salesperson_id: selectedSalesperson?.id || null,
      salesperson_name: selectedSalesperson?.name || null,
      discount_type: discountType as 'percentage' | 'amount',
      discount_value: discountValue,
      cgst_rate: posGstRate,
      cgst_amount: Number(posCgstAmount.toFixed(2)),
      sgst_rate: posGstRate,
      sgst_amount: Number(posSgstAmount.toFixed(2)),
      igst_rate: 0,
      igst_amount: 0,
      tax_amount: Number((posCgstAmount + posSgstAmount).toFixed(2)),
      place_of_supply: orgSettings?.place_of_supply || 'Karnataka (29)',
      supply_type: 'intra_state',
      customer_gstin: (selectedCustomer as any)?.gstin || null,
      tds_tcs_type: null,
      tds_tcs_rate: 0,
      adjustment: 0,
      subtotal: subtotal,
      total_amount: total,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      status: invoiceStatus,
      payment_status: paymentStatus,
      subject: 'POS',
      pos_session_id: activeSession?.id || null,
      customer_notes: customerNotes,
      terms_and_conditions: null,
      items: cart.map(item => ({
        item_id: item.item_id,
        item_name: item.name,
        account: 'Sales',
        description: `SKU: ${item.sku}${item.serial_number ? ` | S/N: ${item.serial_number}` : ''}${item.note ? ` | Note: ${item.note}` : ''}`,
        quantity: item.qty,
        unit_of_measurement: 'pcs',
        rate: item.rate,
        amount: item.qty * item.rate,
        stock_on_hand: 0,
        bin_allocations: item.bin_allocations || undefined,
      })),
    };
  };

  const handleProcessPayment = async (mode: string, refNumber: string, amountPaid: number) => {
    try {
      setProcessingPayment(true);

      // IPC handler generates the invoice number automatically during create
      const invoiceNumber = `INV-${Date.now()}`;
      const balanceDue = total - amountPaid;

      let invoiceStatus: string;
      let paymentStatus: string;

      if (amountPaid >= total) {
        invoiceStatus = 'paid';
        paymentStatus = 'Paid';
      } else if (mode === 'CREDIT SALE') {
        invoiceStatus = 'partially_paid';
        paymentStatus = amountPaid > 0 ? 'Partially Paid' : 'Unpaid';
      } else if (amountPaid > 0) {
        invoiceStatus = 'partially_paid';
        paymentStatus = 'Partially Paid';
      } else {
        invoiceStatus = 'sent';
        paymentStatus = 'Unpaid';
      }

      const customerNotes = [
        `Payment Mode: ${mode}`,
        refNumber ? `Reference Number: ${refNumber}` : '',
        discountValue > 0 ? `Discount: ${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`} (-₹${discountAmount.toFixed(2)})` : '',
        deliveryOption === 'delivery' ? 'Delivery: Delivery' : 'Delivery: Self Pickup',
        mode === 'CREDIT SALE' ? `Amount Paid: ₹${amountPaid.toFixed(2)}\nBalance Due: ₹${balanceDue.toFixed(2)}` : '',
        posEmployeeName ? `POS Operator: ${posEmployeeName}` : '',
      ].filter(Boolean).join('\n');

      const invoiceData = buildInvoiceData(
        invoiceNumber, mode, refNumber, amountPaid, balanceDue,
        invoiceStatus, paymentStatus, customerNotes,
      );

      const response = await invoicesService.createInvoice(invoiceData);

      if (response.success && response.data) {
        const createdInvoiceNumber = response.data.invoice_number || invoiceNumber;

        setGeneratedInvoice({
          ...invoiceData,
          id: response.data.id,
          invoice_number: createdInvoiceNumber,
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
            hour12: true,
          }),
        } as GeneratedInvoice);

        setShowPaymentModal(false);
        setShowBillSuccess(true);
        setReferenceNumber('');
        setPaidAmount(0);
        resetInactivityTimer();

        // Update session sales
        if (activeSession) {
          try {
            await posSessionsService.updateSessionSales(activeSession.id, total);
            setActiveSession(prev => prev ? { ...prev, total_sales: prev.total_sales + total } : null);
          } catch (err) {
            console.error('Error updating session sales:', err);
          }
        }

        // Refresh items for updated stock
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

  const handleSplitPaymentComplete = async (
    payments: Array<{ mode: string; amount: number; reference?: string; note?: string }>,
    totalPaid: number,
  ) => {
    try {
      setProcessingPayment(true);

      const invoiceNumber = `INV-${Date.now()}`;

      const creditAmount = payments
        .filter(p => p.mode === 'CREDIT SALE')
        .reduce((sum, p) => sum + p.amount, 0);
      const actualPaid = totalPaid - creditAmount;
      const balanceDue = total - actualPaid;

      let invoiceStatus: string;
      let paymentStatus: string;

      if (actualPaid >= total) {
        invoiceStatus = 'paid';
        paymentStatus = 'Paid';
      } else if (creditAmount > 0 || actualPaid < total) {
        invoiceStatus = 'partially_paid';
        paymentStatus = actualPaid > 0 ? 'Partially Paid' : 'Unpaid';
      } else {
        invoiceStatus = 'sent';
        paymentStatus = 'Unpaid';
      }

      const paymentDetails = payments.map((p, i) =>
        `Payment ${i + 1}: ${p.mode} - ₹${p.amount.toFixed(2)}${p.reference ? ` (Ref: ${p.reference})` : ''}${p.note ? `\n  Note: ${p.note}` : ''}`
      ).join('\n');

      const customerNotes = [
        `SPLIT PAYMENT (${payments.length} payments)`,
        paymentDetails,
        discountValue > 0 ? `Discount: ${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`} (-₹${discountAmount.toFixed(2)})` : '',
        deliveryOption === 'delivery' ? 'Delivery: Delivery' : 'Delivery: Self Pickup',
        balanceDue > 0 ? `\nAmount Received: ₹${actualPaid.toFixed(2)}${creditAmount > 0 ? `\nCredit Sale: ₹${creditAmount.toFixed(2)}` : ''}\nBalance Due: ₹${balanceDue.toFixed(2)}` : '',
        posEmployeeName ? `POS Operator: ${posEmployeeName}` : '',
      ].filter(Boolean).join('\n');

      const invoiceData = buildInvoiceData(
        invoiceNumber, `SPLIT (${payments.length})`, '', actualPaid, balanceDue,
        invoiceStatus, paymentStatus, customerNotes,
      );

      const response = await invoicesService.createInvoice(invoiceData);

      if (response.success && response.data) {
        const createdInvoiceNumber = response.data.invoice_number || invoiceNumber;

        setGeneratedInvoice({
          ...invoiceData,
          id: response.data.id,
          invoice_number: createdInvoiceNumber,
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
            hour12: true,
          }),
        } as GeneratedInvoice);

        setShowSplitPaymentModal(false);
        setShowBillSuccess(true);
        resetInactivityTimer();

        // Update session sales
        if (activeSession) {
          try {
            await posSessionsService.updateSessionSales(activeSession.id, total);
            setActiveSession(prev => prev ? { ...prev, total_sales: prev.total_sales + total } : null);
          } catch (err) {
            console.error('Error updating session sales:', err);
          }
        }

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

  // ─── Receipt Printing (Electron Native) ────────────────────────

  const generateReceiptHtml = (inv: GeneratedInvoice): string => {
    const itemsCount = inv.items.reduce((sum, i) => sum + i.quantity, 0);

    const discountLine = inv.discount_value > 0
      ? `<div class="total-row"><span class="total-label">Discount${inv.discount_type === 'percentage' ? ` (${inv.discount_value}%)` : ''}</span><span class="total-value">-₹${(inv.discount_type === 'percentage' ? (inv.subtotal * inv.discount_value / 100) : inv.discount_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>`
      : '';

    const cgstLine = inv.cgst_amount > 0
      ? `<div class="total-row"><span class="total-label">CGST (${inv.cgst_rate}%)</span><span class="total-value">₹${inv.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>`
      : '';

    const sgstLine = inv.sgst_amount > 0
      ? `<div class="total-row"><span class="total-label">SGST (${inv.sgst_rate}%)</span><span class="total-value">₹${inv.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>`
      : '';

    const itemRows = inv.items.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><div class="item-name">${item.item_name}</div>${item.description ? `<div class="item-sku">${item.description}</div>` : ''}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">₹${item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="right" style="font-weight:600">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const isCredit = inv.paymentMode === 'CREDIT SALE' && inv.balanceDue > 0;
    const paymentInfo = isCredit
      ? `<div class="payment-box">
          <div class="payment-row"><span>Payment Mode</span><span class="payment-mode" style="color:#f97316">${inv.paymentMode}</span></div>
          ${inv.referenceNumber ? `<div class="payment-row"><span>Reference No</span><span style="font-weight:600">${inv.referenceNumber}</span></div>` : ''}
          <div class="payment-row"><span>Amount Paid</span><span style="font-weight:600">₹${inv.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
          <div class="payment-row"><span>Balance Due</span><span style="font-weight:600;color:#f97316">₹${inv.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
        </div>
        <div class="paid-badge" style="color:#f97316">--- CREDIT SALE - PENDING ---</div>`
      : inv.splitPayments && inv.splitPayments.length > 0
        ? `<div class="payment-box">
            <div class="payment-row"><span>Payment</span><span class="payment-mode">SPLIT PAYMENT</span></div>
            ${inv.splitPayments.map((p, i) => `
              <div class="payment-row"><span>  ${i + 1}. ${p.mode}</span><span style="font-weight:600">₹${p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              ${p.reference ? `<div class="payment-row"><span style="padding-left:16px;font-size:10px">Ref: ${p.reference}</span><span></span></div>` : ''}
            `).join('')}
            <div class="payment-row" style="border-top:1px dashed #ccc;padding-top:4px;margin-top:4px"><span>Total Paid</span><span style="font-weight:600">₹${inv.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            ${inv.balanceDue > 0 ? `<div class="payment-row"><span>Balance Due</span><span style="font-weight:600;color:#f97316">₹${inv.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : ''}
          </div>
          <div class="paid-badge">${inv.balanceDue > 0 ? '--- PARTIALLY PAID ---' : '--- PAID ---'}</div>`
        : `<div class="payment-box">
            <div class="payment-row"><span>Payment Mode</span><span class="payment-mode">${inv.paymentMode}</span></div>
            ${inv.referenceNumber ? `<div class="payment-row"><span>Reference No</span><span style="font-weight:600">${inv.referenceNumber}</span></div>` : ''}
            <div class="payment-row"><span>Amount Paid</span><span style="font-weight:600">₹${inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
          </div>
          <div class="paid-badge">--- PAID ---</div>`;

    return `<!DOCTYPE html>
<html><head><title>Bill - ${inv.invoice_number}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;padding:20px;max-width:400px;margin:0 auto;font-size:13px;line-height:1.5;color:#111}
  .header{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px}
  .company-name{font-size:20px;font-weight:bold;letter-spacing:1px}
  .company-sub{font-size:11px;color:#555;margin-top:2px}
  .company-gstin{font-size:10px;color:#777;margin-top:2px}
  .bill-title{font-size:14px;font-weight:bold;margin-top:6px;letter-spacing:2px}
  .info-section{margin:10px 0}
  .info-row{display:flex;padding:2px 0}
  .info-label{width:120px;flex-shrink:0;color:#555}
  .info-value{flex:1;font-weight:600}
  .separator{border-top:1px dashed #999;margin:8px 0}
  .separator-bold{border-top:2px solid #000;margin:8px 0}
  .items-table{width:100%;border-collapse:collapse;margin:8px 0}
  .items-table thead th{text-align:left;font-size:11px;font-weight:bold;text-transform:uppercase;padding:6px 4px;border-bottom:1px solid #000;color:#333}
  .items-table thead th.right{text-align:right}
  .items-table thead th.center{text-align:center}
  .items-table tbody td{padding:5px 4px;font-size:12px;border-bottom:1px dashed #ddd;vertical-align:top}
  .items-table tbody td.right{text-align:right}
  .items-table tbody td.center{text-align:center}
  .item-name{font-weight:600;font-size:12px}
  .item-sku{font-size:10px;color:#777}
  .totals-section{margin:8px 0}
  .total-row{display:flex;justify-content:space-between;padding:3px 0}
  .total-label{color:#555;font-size:12px}
  .total-value{font-weight:600;font-size:12px}
  .grand-total{display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #000;border-bottom:2px solid #000;margin:6px 0}
  .grand-total-label{font-size:16px;font-weight:bold}
  .grand-total-value{font-size:16px;font-weight:bold}
  .payment-box{background:#f5f5f5;padding:8px 10px;border-radius:4px;margin:8px 0}
  .payment-row{display:flex;justify-content:space-between;padding:2px 0;font-size:12px}
  .payment-mode{font-weight:bold;color:#16a34a}
  .paid-badge{text-align:center;font-size:11px;font-weight:bold;color:#16a34a;letter-spacing:2px;margin:6px 0}
  .footer{text-align:center;margin-top:16px;padding-top:10px;border-top:1px dashed #999}
  .footer p{font-size:11px;color:#777;margin:3px 0}
  .footer .thank-you{font-size:13px;font-weight:bold;color:#333}
  @media print{body{padding:10px}}
</style></head>
<body>
  <div class="header">
    <div class="company-name">${orgSettings?.company_name || 'COMPANY NAME'}</div>
    <div class="company-sub">${orgSettings?.tagline || ''}</div>
    ${orgSettings?.gstin ? `<div class="company-gstin">GSTIN: ${orgSettings.gstin}</div>` : ''}
    <div class="bill-title">TAX INVOICE</div>
  </div>

  <div class="info-section">
    <div class="info-row"><span class="info-label">Invoice No</span><span class="info-value">: ${inv.invoice_number}</span></div>
    <div class="info-row"><span class="info-label">Date</span><span class="info-value">: ${inv.createdAt}</span></div>
    <div class="info-row"><span class="info-label">Customer</span><span class="info-value">: ${inv.customer_name}</span></div>
    ${inv.customer_phone ? `<div class="info-row"><span class="info-label">Mobile</span><span class="info-value">: ${inv.customer_phone}</span></div>` : ''}
    ${inv.salesperson_name ? `<div class="info-row"><span class="info-label">Salesperson</span><span class="info-value">: ${inv.salesperson_name}</span></div>` : ''}
  </div>

  <div class="separator-bold"></div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width:8%">#</th>
        <th style="width:42%">Item</th>
        <th class="center" style="width:12%">Qty</th>
        <th class="right" style="width:18%">Rate</th>
        <th class="right" style="width:20%">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="separator"></div>

  <div class="totals-section">
    <div class="total-row"><span class="total-label">Sub Total (${itemsCount} items)</span><span class="total-value">₹${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
    ${discountLine}
    ${cgstLine}
    ${sgstLine}
  </div>

  <div class="grand-total">
    <span class="grand-total-label">TOTAL</span>
    <span class="grand-total-value">₹${inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
  </div>

  ${paymentInfo}

  <div class="footer">
    <p class="thank-you">Thank you for your purchase!</p>
    <p>${orgSettings?.company_name ? `Visit us again at ${orgSettings.company_name}` : 'Visit us again!'}</p>
    ${activeSession ? `<p>Session: ${activeSession.session_number} | Register: ${activeSession.register}</p>` : ''}
  </div>
</body></html>`;
  };

  const handlePrintBill = async () => {
    if (!generatedInvoice) return;

    const receiptHtml = generateReceiptHtml(generatedInvoice);

    try {
      const result = await printerService.printReceipt({
        html: receiptHtml,
        printerName: localStorage.getItem('default_printer') || undefined,
        paperSize: localStorage.getItem('paper_size') || '80mm',
      });

      if (!result.success) {
        console.error('Print failed');
        alert('Failed to print receipt. Check printer connection.');
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print receipt. Check printer connection.');
    }

    // Try to open cash drawer
    try {
      await printerService.openCashDrawer();
    } catch {
      // Cash drawer open is best-effort
    }
  };

  const handleCompleteBill = () => {
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

  // ─── Cash Movement Handler ────────────────────────────────────

  const handleCashMovement = async () => {
    if (!activeSession || cashMovementAmount <= 0) return;
    try {
      setCashMovementLoading(true);
      const response = await posSessionsService.recordCashMovement(
        activeSession.id,
        cashMovementType,
        cashMovementAmount,
      );
      if (response.success && response.data) {
        setActiveSession(response.data);
        setShowCashMovementModal(false);
        setCashMovementAmount(0);
        alert(`Cash ${cashMovementType === 'in' ? 'In' : 'Out'} of ₹${cashMovementAmount} recorded successfully`);
      }
    } catch (error: any) {
      console.error('Error recording cash movement:', error);
      alert(error?.message || 'Failed to record cash movement');
    } finally {
      setCashMovementLoading(false);
    }
  };

  // ─── Computed Values ───────────────────────────────────────────

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.mobile?.includes(customerSearch) ||
    customer.phone?.includes(customerSearch) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    item.is_active !== false && (
      item.item_name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.sku?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.barcode?.includes(itemSearch) ||
      item.color?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.variant?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.size?.toLowerCase().includes(itemSearch.toLowerCase())
    )
  );

  const filteredSalespersons = salespersons.filter(salesperson =>
    salesperson.name?.toLowerCase().includes(salespersonSearch.toLowerCase()) ||
    salesperson.email?.toLowerCase().includes(salespersonSearch.toLowerCase())
  );

  const subtotal = cart.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const discountAmount = discountType === 'percentage'
    ? (subtotal * discountValue / 100)
    : discountValue;
  const total = Math.max(0, subtotal - discountAmount);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  // ─── Keyboard Shortcuts ───────────────────────────────────────

  const anyModalOpen = showCustomerModal || showAddCustomerModal || showSalespersonModal ||
    showManageSalespersonModal || showPaymentModal || showSplitPaymentModal || showBillSuccess ||
    showCashMovementModal || showStartSessionModal || showCloseSessionModal || showDiscountModal ||
    showBinPicker || !!detailPopupItem;

  const closeAllModals = () => {
    setShowCustomerModal(false);
    setShowAddCustomerModal(false);
    setShowSalespersonModal(false);
    setShowManageSalespersonModal(false);
    setShowPaymentModal(false);
    setShowSplitPaymentModal(false);
    setShowCashMovementModal(false);
    setShowStartSessionModal(false);
    setShowCloseSessionModal(false);
    setShowDiscountModal(false);
    setShowBinPicker(false);
    setShowDeliveryDropdown(false);
    setDetailPopupItem(null);
    setCustomerSearch('');
    setSalespersonSearch('');
    setReferenceNumber('');
  };

  const focusSearchBar = () => {
    const searchEl = document.querySelector<HTMLInputElement>('input[placeholder*="scan an item"]');
    searchEl?.focus();
  };

  useKeyboardShortcuts({
    onCashPayment: () => handlePaymentClick('Cash'),
    onHDFCPayment: () => handlePaymentClick('HDFC'),
    onICICIPayment: () => handlePaymentClick('ICICI'),
    onCreditSale: () => handlePaymentClick('CREDIT SALE'),
    onHoldCart: handleHoldCart,
    onClearCart: handleClearCart,
    onExchangeItems: () => {
      // Exchange items not available in standalone POS app
      alert('Exchange items not available in this version');
    },
    onCustomerSelect: () => {
      if (selectedCustomer) {
        setShowCustomerModal(true);
      } else {
        const searchEl = document.querySelector<HTMLInputElement>('input[placeholder*="phone or name"]');
        searchEl?.focus();
      }
    },
    onFocusSearch: focusSearchBar,
    onOpenCashDrawer: () => {
      printerService.openCashDrawer().catch(() => {
        alert('Failed to open cash drawer');
      });
    },
    onSplitPayment: () => {
      const missing: string[] = [];
      if (!selectedCustomer) missing.push('Customer');
      if (!selectedSalesperson) missing.push('Salesperson');
      if (!deliveryOption) missing.push('Delivery Option');
      if (missing.length > 0) {
        alert(`Please select: ${missing.join(', ')}`);
        return;
      }
      setShowSplitPaymentModal(true);
    },
    onEscape: anyModalOpen ? closeAllModals : undefined,
    onCtrlF: focusSearchBar,
  }, !posLocked && activeTab === 'newsale');

  // ─── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* POS Lock Overlay */}
      {posLocked && (
        <div className="fixed inset-0 bg-gray-900/90 dark:bg-black/90 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">POS Locked</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your employee code to continue</p>
              {posEmployeeName && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Last operator: {posEmployeeName}</p>
              )}
            </div>
            <div className="space-y-4">
              <input
                type="password"
                value={posCodeInput}
                onChange={(e) => { setPosCodeInput(e.target.value); setPosCodeError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePosCodeVerify(); }}
                placeholder="Enter code"
                autoFocus
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                maxLength={10}
              />
              {posCodeError && (
                <p className="text-red-500 dark:text-red-400 text-sm text-center">{posCodeError}</p>
              )}
              <button
                onClick={handlePosCodeVerify}
                disabled={posCodeLoading}
                className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posCodeLoading ? 'Verifying...' : 'Unlock POS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main POS Layout */}
      <div className="flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden h-full">

        {/* Left Section: Product Entry + Cart / Tab Views */}
        <div className="flex-grow flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

          {/* Held Carts Tab Bar + Session Bar */}
          <HeldCartsTabs
            activeTab={activeTab}
            activeHeldCartId={activeHeldCartId}
            heldCarts={heldCarts}
            cart={cart}
            activeSession={activeSession}
            onTabChange={setActiveTab}
            onRecallCart={handleRecallCart}
            onDeleteHeldCart={handleDeleteHeldCart}
            onCashIn={() => { setCashMovementType('in'); setCashMovementAmount(0); setShowCashMovementModal(true); }}
            onCashOut={() => { setCashMovementType('out'); setCashMovementAmount(0); setShowCashMovementModal(true); }}
            onEndSession={() => setShowCloseSessionModal(true)}
            onStartSession={() => setShowStartSessionModal(true)}
            formatCurrency={formatCurrency}
          />

          {/* Active Tab Content */}
          {activeTab === 'newsale' ? (
            <>
              <ProductSearch
                itemSearch={itemSearch}
                onSearchChange={setItemSearch}
                filteredItems={filteredItems}
                onSelectItem={handleSelectItem}
                printerConnected={printerConnected}
              />
              <CartItemsList
                cart={cart}
                onQtyChange={handleQtyChange}
                onRateChange={handleRateChange}
                onBinChange={handleBinChange}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onHoldCart={handleHoldCart}
                onExchangeItems={() => alert('Exchange items not available in this version')}
                onItemClick={setDetailPopupItem}
              />
            </>
          ) : activeTab === 'invoices' ? (
            <InvoicesTab sessionId={activeSession?.id} />
          ) : activeTab === 'returns' ? (
            <ReturnTab activeSessionId={activeSession?.id} />
          ) : activeTab === 'session-detail' ? (
            <SessionTab sessionId={activeSession?.id} activeSession={activeSession} formatCurrency={formatCurrency} />
          ) : (
            <SessionsView
              sessions={sessions}
              activeSession={activeSession}
              onStartSession={() => setShowStartSessionModal(true)}
              onCloseSession={(session) => { setActiveSession(session); setShowCloseSessionModal(true); }}
              onViewSession={() => { setActiveTab('session-detail'); }}
              formatCurrency={formatCurrency}
            />
          )}
        </div>

        {/* Right Sidebar: Cart Panel (420px) */}
        <CartPanel
          cart={cart}
          subtotal={subtotal}
          total={total}
          totalQty={totalQty}
          discountType={discountType}
          discountValue={discountValue}
          discountAmount={discountAmount}
          selectedCustomer={selectedCustomer}
          selectedSalesperson={selectedSalesperson}
          posEmployeeName={posEmployeeName}
          deliveryOption={deliveryOption}
          processingPayment={processingPayment}
          showDeliveryDropdown={showDeliveryDropdown}
          customers={customers}
          onCustomerClick={() => setShowCustomerModal(true)}
          onClearCustomer={() => setSelectedCustomer(null)}
          onSelectCustomer={handleSelectCustomer}
          onQuickAddCustomer={handleQuickAddCustomer}
          onSalespersonClick={() => setShowSalespersonModal(true)}
          onClearSalesperson={() => setSelectedSalesperson(null)}
          onDiscountClick={() => setShowDiscountModal(true)}
          onDeliveryToggle={() => setShowDeliveryDropdown(!showDeliveryDropdown)}
          onDeliverySelect={(option) => { setDeliveryOption(option); setShowDeliveryDropdown(false); }}
          onPaymentClick={handlePaymentClick}
          onSplitPayment={() => {
            const missing: string[] = [];
            if (!selectedCustomer) missing.push('Customer');
            if (!selectedSalesperson) missing.push('Salesperson');
            if (!deliveryOption) missing.push('Delivery Option');
            if (missing.length > 0) {
              alert(`Please select: ${missing.join(', ')}`);
              return;
            }
            setShowSplitPaymentModal(true);
          }}
          onLockPos={() => { setPosLocked(true); setPosCodeInput(''); }}
          onShowDeliveryChallanModal={() => {
            // Delivery challans not available in standalone POS app
            setDeliveryOption('delivery');
            setShowDeliveryDropdown(false);
          }}
        />
      </div>

      {/* All Modals (via PosModals component) */}
      <PosModals
        // Customer Search Modal
        showCustomerModal={showCustomerModal}
        customerSearch={customerSearch}
        filteredCustomers={filteredCustomers}
        phoneNumberFromSearch={phoneNumberFromSearch}
        onCustomerSearchChange={setCustomerSearch}
        onSelectCustomer={handleSelectCustomer}
        onCloseCustomerModal={() => { setShowCustomerModal(false); setCustomerSearch(''); }}
        onOpenAddCustomerWithPhone={handleOpenAddCustomerWithPhone}

        // Salesperson Search Modal
        showSalespersonModal={showSalespersonModal}
        salespersonSearch={salespersonSearch}
        filteredSalespersons={filteredSalespersons}
        onSalespersonSearchChange={setSalespersonSearch}
        onSelectSalesperson={handleSelectSalesperson}
        onCloseSalespersonModal={() => { setShowSalespersonModal(false); setSalespersonSearch(''); }}
        onOpenManageSalesperson={() => { setShowSalespersonModal(false); setShowManageSalespersonModal(true); }}

        // Manage Salesperson Modal
        showManageSalespersonModal={showManageSalespersonModal}
        showAddSalespersonForm={showAddSalespersonForm}
        salespersons={salespersons}
        newSalesperson={newSalesperson}
        onNewSalespersonChange={setNewSalesperson}
        onShowAddSalespersonForm={setShowAddSalespersonForm}
        onAddSalesperson={handleAddSalesperson}
        onDeleteSalesperson={handleDeleteSalesperson}
        onCloseManageSalespersonModal={() => { setShowManageSalespersonModal(false); setShowAddSalespersonForm(false); setNewSalesperson({ name: '', email: '' }); }}

        // Payment Reference Modal
        showPaymentModal={showPaymentModal}
        selectedPaymentMode={selectedPaymentMode}
        referenceNumber={referenceNumber}
        paidAmount={paidAmount}
        total={total}
        selectedCustomer={selectedCustomer}
        processingPayment={processingPayment}
        onReferenceNumberChange={setReferenceNumber}
        onPaidAmountChange={setPaidAmount}
        onProcessPayment={handleProcessPayment}
        onClosePaymentModal={() => { setShowPaymentModal(false); setReferenceNumber(''); }}

        // Bill Success Modal
        showBillSuccess={showBillSuccess}
        generatedInvoice={generatedInvoice}
        onPrintBill={handlePrintBill}
        onCompleteBill={handleCompleteBill}

        // Add Customer Modal
        showAddCustomerModal={showAddCustomerModal}
        newCustomer={newCustomer}
        gstTreatment={gstTreatment}
        loading={loading}
        onNewCustomerChange={setNewCustomer}
        onGstTreatmentChange={setGstTreatment}
        onCreateCustomer={handleCreateCustomer}
        onCloseAddCustomerModal={() => { setShowAddCustomerModal(false); setPhoneNumberFromSearch(''); setGstTreatment('Consumer'); }}

        // Cash Movement Modal
        showCashMovementModal={showCashMovementModal}
        activeSession={activeSession}
        cashMovementType={cashMovementType}
        cashMovementAmount={cashMovementAmount}
        cashMovementLoading={cashMovementLoading}
        onCashMovementAmountChange={setCashMovementAmount}
        onCashMovement={handleCashMovement}
        onCloseCashMovementModal={() => setShowCashMovementModal(false)}

        // Start Session Modal
        showStartSessionModal={showStartSessionModal}
        startSessionData={startSessionData}
        sessionLoading={sessionLoading}
        onStartSessionDataChange={setStartSessionData}
        onStartSession={handleStartSession}
        onCloseStartSessionModal={() => setShowStartSessionModal(false)}

        // Close Session Modal
        showCloseSessionModal={showCloseSessionModal}
        denominations={denominations}
        onDenominationsChange={setDenominations}
        onCloseSession={handleCloseSession}
        onCloseCloseSessionModal={() => setShowCloseSessionModal(false)}
        formatCurrency={formatCurrency}

        // Split Payment Modal
        showSplitPaymentModal={showSplitPaymentModal}
        onCloseSplitPaymentModal={() => setShowSplitPaymentModal(false)}
        onSplitPaymentComplete={handleSplitPaymentComplete}

        // Discount Modal
        showDiscountModal={showDiscountModal}
        discountType={discountType}
        discountValue={discountValue}
        subtotal={subtotal}
        onDiscountTypeChange={setDiscountType}
        onDiscountValueChange={setDiscountValue}
        onCloseDiscountModal={() => setShowDiscountModal(false)}
        onRemoveDiscount={() => { setDiscountValue(0); setShowDiscountModal(false); }}

        // POS Lock Modal (not used here since we handle lock inline, but required by interface)
        showPosLockModal={false}
        posCode=""
        posCodeError=""
        onPosCodeChange={() => {}}
        onVerifyPosCode={() => {}}
        onClosePosLockModal={() => {}}

        // Hold Cart Modal
        showHoldCartModal={showHoldCartModal}
        holdCartName={holdCartName}
        onHoldCartNameChange={setHoldCartName}
        onHoldCart={() => {
          if (cart.length === 0) return;
          const newHeldCart: HeldCart = {
            id: Date.now().toString(),
            items: [...cart],
            customer: selectedCustomer,
            timestamp: new Date(),
          };
          setHeldCarts(prev => [...prev, newHeldCart]);
          setCart([]);
          setSelectedCustomer(null);
          setHoldCartName('');
          setShowHoldCartModal(false);
        }}
        onCloseHoldCartModal={() => { setShowHoldCartModal(false); setHoldCartName(''); }}

        // Recall Cart Modal
        showRecallCartModal={showRecallCartModal}
        heldCarts={heldCarts}
        onRecallCart={(heldCart: HeldCart) => {
          setCart(heldCart.items);
          setSelectedCustomer(heldCart.customer);
          setHeldCarts(prev => prev.filter(c => c.id !== heldCart.id));
          setShowRecallCartModal(false);
        }}
        onDeleteHeldCart={(id: string) => {
          setHeldCarts(prev => prev.filter(c => c.id !== id));
        }}
        onCloseRecallCartModal={() => setShowRecallCartModal(false)}

        // Print Options Modal
        showPrintOptionsModal={showPrintOptionsModal}
        onClosePrintOptionsModal={() => setShowPrintOptionsModal(false)}
        onPrintWithOptions={async (printerName: string, paperSize: string) => {
          setShowPrintOptionsModal(false);
          localStorage.setItem('default_printer', printerName);
          localStorage.setItem('paper_size', paperSize);
        }}
      />

      {/* Cart Item Detail Popup */}
      {detailPopupItem && (
        <CartItemDetailPopup
          item={detailPopupItem}
          onApply={handleCartItemDetailApply}
          onRemove={handleCartItemDetailRemove}
          onClose={() => setDetailPopupItem(null)}
        />
      )}

      {/* Bin Picker Modal */}
      {binPickerItem && (
        <PosBinPicker
          isOpen={showBinPicker}
          onClose={() => { setShowBinPicker(false); setBinPickerItem(null); }}
          itemName={binPickerItem.itemName}
          itemQty={binPickerItem.itemQty}
          bins={binPickerItem.bins}
          onSelect={handleBinPickerSelect}
        />
      )}
    </>
  );
};

export default PosCreate;
