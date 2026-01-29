import { useState } from 'react';
import { ArrowLeft, User, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customersService } from '../../services/customers.service';

const NewCustomerForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('other-details');

  const [formData, setFormData] = useState({
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    companyName: '',
    displayName: '',
    email: '',
    workPhone: '',
    mobile: '',
    pan: '',
    isMsmeRegistered: false,
    currency: 'INR- Indian Rupee',
    paymentTerms: 'Due on Receipt',
    // Address
    attention: '',
    country: 'India',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    fax: '',
    // Bank Details
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branch: '',
    // Remarks
    remarks: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customerData = {
        salutation: formData.salutation,
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.companyName,
        display_name: formData.displayName || `${formData.firstName} ${formData.lastName}`.trim() || formData.companyName,
        email: formData.email || undefined,
        work_phone: formData.workPhone || undefined,
        mobile: formData.mobile || undefined,
        pan: formData.pan || undefined,
        is_msme_registered: formData.isMsmeRegistered,
        currency: formData.currency,
        payment_terms: formData.paymentTerms,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        postal_code: formData.postalCode || undefined,
        notes: formData.remarks || undefined
      };

      console.log('Sending customer data:', customerData);
      const response = await customersService.createCustomer(customerData);
      console.log('Customer API Response:', response);

      // Axios response structure: response.data = { success: boolean, data: Customer }
      if (response.data.success && response.data.data) {
        navigate('/sales/customers');
      } else {
        const errorMsg = response.data.error || 'Failed to create customer. Please try again.';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Error creating customer:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create customer. Please try again.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/sales/customers');
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-semibold text-gray-800">New Customer</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

          {/* Primary Contact */}
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-medium text-gray-700">
                Primary Contact
              </label>
              <div className="col-span-9 grid grid-cols-3 gap-4">
                <select
                  name="salutation"
                  value={formData.salutation}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Miss.">Miss.</option>
                  <option value="Dr.">Dr.</option>
                </select>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-medium text-gray-700">
                Company Name
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder=""
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-medium text-red-500">
                Display Name<span>*</span>
              </label>
              <div className="col-span-9">
                <select
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select or type to add</option>
                  {formData.firstName && <option value={formData.firstName}>{formData.firstName}</option>}
                  {formData.companyName && <option value={formData.companyName}>{formData.companyName}</option>}
                </select>
              </div>
            </div>

            {/* Email Address */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="col-span-9">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder=""
                />
              </div>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-medium text-gray-700">
                Phone
              </label>
              <div className="col-span-9 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Work Phone</label>
                  <div className="flex gap-2">
                    <select className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>+91</option>
                    </select>
                    <input
                      type="tel"
                      name="workPhone"
                      value={formData.workPhone}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Work Phone"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mobile</label>
                  <div className="flex gap-2">
                    <select className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>+91</option>
                    </select>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mobile"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex gap-6 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('other-details')}
                className={`pb-3 px-1 font-medium text-sm ${
                  activeTab === 'other-details'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Other Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('address')}
                className={`pb-3 px-1 font-medium text-sm ${
                  activeTab === 'address'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Address
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contact-persons')}
                className={`pb-3 px-1 font-medium text-sm ${
                  activeTab === 'contact-persons'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Contact Persons
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bank-details')}
                className={`pb-3 px-1 font-medium text-sm ${
                  activeTab === 'bank-details'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Bank Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('remarks')}
                className={`pb-3 px-1 font-medium text-sm ${
                  activeTab === 'remarks'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Remarks
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6 space-y-4">
              {activeTab === 'other-details' && (
                <>
                  {/* PAN */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      PAN
                    </label>
                    <div className="col-span-9">
                      <input
                        type="text"
                        name="pan"
                        value={formData.pan}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* MSME Registered */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      MSME Registered?
                    </label>
                    <div className="col-span-9">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isMsmeRegistered"
                          checked={formData.isMsmeRegistered}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">This customer is MSME registered</span>
                      </label>
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <div className="col-span-9">
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="INR- Indian Rupee">INR- Indian Rupee</option>
                        <option value="USD- US Dollar">USD- US Dollar</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      Payment Terms
                    </label>
                    <div className="col-span-9">
                      <select
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Net 60">Net 60</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'address' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Billing Address</h3>

                    {/* Attention */}
                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                      <label className="col-span-3 text-sm font-medium text-gray-700">
                        Attention
                      </label>
                      <div className="col-span-9">
                        <input
                          type="text"
                          name="attention"
                          value={formData.attention}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder=""
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                      <label className="col-span-3 text-sm font-medium text-gray-700">
                        Country/Region
                      </label>
                      <div className="col-span-9">
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                        </select>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-12 gap-4 items-start mb-4">
                      <label className="col-span-3 text-sm font-medium text-gray-700 pt-2">
                        Address
                      </label>
                      <div className="col-span-9">
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Street 1"
                        />
                      </div>
                    </div>

                    {/* City */}
                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                      <label className="col-span-3 text-sm font-medium text-gray-700">
                        City
                      </label>
                      <div className="col-span-9">
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder=""
                        />
                      </div>
                    </div>

                    {/* State */}
                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                      <label className="col-span-3 text-sm font-medium text-gray-700">
                        State
                      </label>
                      <div className="col-span-9">
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Select or type to add"
                        />
                      </div>
                    </div>

                    {/* Postal Code */}
                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                      <label className="col-span-3 text-sm font-medium text-gray-700">
                        Pin Code
                      </label>
                      <div className="col-span-9">
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder=""
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                      <label className="col-span-3 text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <div className="col-span-9">
                        <div className="flex gap-2">
                          <select className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>+91</option>
                          </select>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fax */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <label className="col-span-3 text-sm font-medium text-gray-700">
                        Fax Number
                      </label>
                      <div className="col-span-9">
                        <input
                          type="text"
                          name="fax"
                          value={formData.fax}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contact-persons' && (
                <div className="text-center py-8 text-gray-500">
                  <p>Contact persons functionality coming soon</p>
                  <p className="text-sm mt-2">You can add multiple contact persons for this customer</p>
                </div>
              )}

              {activeTab === 'bank-details' && (
                <>
                  {/* Account Holder Name */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      Account Holder Name
                    </label>
                    <div className="col-span-9">
                      <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      Account Number
                    </label>
                    <div className="col-span-9">
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* IFSC Code */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      IFSC Code
                    </label>
                    <div className="col-span-9">
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Bank Name */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      Bank Name
                    </label>
                    <div className="col-span-9">
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Branch */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-3 text-sm font-medium text-gray-700">
                      Branch
                    </label>
                    <div className="col-span-9">
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder=""
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'remarks' && (
                <div className="grid grid-cols-12 gap-4">
                  <label className="col-span-3 text-sm font-medium text-gray-700">
                    Remarks
                  </label>
                  <div className="col-span-9">
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any additional notes about this customer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCustomerForm;
