import { useState, useEffect } from 'react';
import { 
  MapPin, Package, Truck, Clock, DollarSign, Info, AlertCircle, CheckCircle2, 
  AlertTriangle, ChevronDown, Plus, Trash2, FileText, Globe, Settings, Users, Pencil, Sparkles, Upload
} from 'lucide-react';
import { shipmentsStore } from '../../store/shipmentsStore';
import { suggestHSCode, validateAndCheckHSCode, getCurrencyByCountry } from '../../utils/validation';

const modes = ['Air', 'Sea', 'Road', 'Rail', 'Courier', 'Multimodal'];
const shipmentTypes = ['Domestic', 'International'];
const pickupTypes = ['Scheduled Pickup', 'Drop-off'];
const serviceLevels = ['Standard', 'Express', 'Economy', 'Freight'];
const incoterms = ['FOB', 'CIF', 'DDP', 'EXW', 'CPT', 'DAP'];
const billToOptions = ['Shipper', 'Consignee', 'ThirdParty'];
const paymentTimings = ['Prepaid', 'Collect', 'COD'];
const paymentMethods = ['Credit Card', 'Bank Transfer', 'Wire Transfer', 'Check'];
const currencies = ['USD', 'EUR', 'GBP', 'INR', 'CNY', 'JPY', 'CAD', 'AUD', 'SGD', 'CHF'];
const packageTypes = ['Box', 'Pallet', 'Crate', 'Bag', 'Case', 'Envelope'];
const uoms = ['kg', 'lb', 'pieces', 'meters', 'units', 'sets'];
const reasonsForExport = [
  'Sending a gift',
  'Commercial Trade',
  'Sample/Prototype',
  'Return/Repair',
  'Personal Effects',
  'Temporary Import',
  'Exhibition',
  'Other'
];

// Country options (code + full name) shown in selects
const countryOptions = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IT', name: 'Italy' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
];

// Country code to full name mapping for lookups
const countryNames = countryOptions.reduce((acc, { code, name }) => {
  acc[code] = name;
  return acc;
}, {});

const resolveCountryCode = (value) => {
  if (!value) return '';
  const codeList = countryOptions.map(c => c.code);
  if (codeList.includes(value)) return value;
  const match = countryOptions.find((c) => c.name.toLowerCase() === value.toLowerCase());
  return match ? match.code : value;
};

// Try multiple localStorage keys for profile data
const getStoredProfile = () => {
  const keys = ['userProfile', 'profile', 'shipperProfile'];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore parse errors and continue
    }
  }
  return null;
};
const CollapsibleSection = ({ title, isOpen, onToggle, children, icon: Icon }) => (
  <div className="border border-slate-200 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-slate-600" />}
        <h3 className="text-slate-900 font-semibold">{title}</h3>
      </div>
      <ChevronDown 
        className={`w-5 h-5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    {isOpen && (
      <div className="p-6 bg-white border-t border-slate-200 space-y-4">
        {children}
      </div>
    )}
  </div>
);

const InputField = ({ label, type = 'text', name, value, onChange, required = false, placeholder = '', disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label}
      {required && <span className="text-red-600">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false, disabled = false }) => {
  const normalize = (opt) => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return { value: opt.value ?? opt.code, label: opt.label ?? opt.name ?? opt.value ?? '' };
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-600">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
      >
        <option value="">-- Select {label} --</option>
        {options.map(opt => {
          const { value: val, label: lab } = normalize(opt);
          return (
            <option key={val} value={val}>{lab}</option>
          );
        })}
      </select>
    </div>
  );
};

const CheckboxField = ({ label, name, checked, onChange }) => (
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 border-slate-300 rounded focus:ring-blue-500"
    />
    <label className="text-sm font-medium text-slate-700">{label}</label>
  </div>
);

export function ShipmentForm({ shipment, onNavigate }) {
  // Initialize form data with default values for all array fields
  const [formData, setFormData] = useState(() => ({
    packages: [],
    products: [],
    documents: [],
    documentRequests: [],
    ...shipment
  }));
  const [profileCountry, setProfileCountry] = useState('');
  const [profileCurrency, setProfileCurrency] = useState('USD');
  const [profileData, setProfileData] = useState(null);
  const [shipperEditable, setShipperEditable] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basics: true,
    shipper: false,
    consignee: false,
    packages: false,
    service: false,
    documents: false,
  });
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [documentFiles, setDocumentFiles] = useState({});
  const [analyzingDocuments, setAnalyzingDocuments] = useState(false);
  const [errors, setErrors] = useState({});
  const [pricing, setPricing] = useState({
    basePrice: 2400,
    serviceCharge: 0,
    customsClearance: 450,
    insurance: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  // HS code suggestion + validation state (per-product)
  const [hsSuggestions, setHsSuggestions] = useState({});
  const [loadingHsSuggestions, setLoadingHsSuggestions] = useState({});
  const [hsValidation, setHsValidation] = useState({});
  const [selectedHsIndex, setSelectedHsIndex] = useState({});

  // Apply profile data into the form (used on load and when profile changes)
  const applyProfileToForm = (profile) => {
    const countryCode = resolveCountryCode(profile.countryCode || profile.country || '');
    const currency = countryCode ? getCurrencyByCountry(countryCode).code : 'USD';
    setProfileCountry(countryCode);
    setProfileCurrency(currency);
    setProfileData(profile);

    // Only overwrite locked fields when shipper is not being edited manually
    setFormData(prev => {
      const nextShipper = shipperEditable ? prev.shipper || {} : {
        ...prev.shipper,
        company: profile.companyName ?? prev.shipper?.company ?? '',
        contactName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || prev.shipper?.contactName || '',
        phone: profile.phone ?? prev.shipper?.phone ?? '',
        email: profile.email ?? prev.shipper?.email ?? '',
        address1: profile.addressLine1 ?? prev.shipper?.address1 ?? '',
        address2: profile.addressLine2 ?? prev.shipper?.address2 ?? '',
        city: profile.city ?? prev.shipper?.city ?? '',
        state: profile.state ?? prev.shipper?.state ?? '',
        postalCode: profile.pinCode ?? prev.shipper?.postalCode ?? '',
        country: prev.shipper?.country || countryCode,
        taxId: prev.shipper?.taxId || ''
      };

      const resolvedCurrency = prev.currency || currency;
      // Initialize packages if not present
      const updatedPackages = prev.packages && prev.packages.length > 0 ? prev.packages : [
        {
          id: `PKG-${Date.now()}`,
          type: '',
          length: '',
          width: '',
          height: '',
          dimUnit: 'cm',
          weight: '',
          weightUnit: 'kg',
          stackable: false,
          products: [],
        }
      ];

      return {
        ...prev,
        shipper: nextShipper,
        currency: resolvedCurrency,
        serviceLevel: prev.serviceLevel || 'Standard',
        packages: updatedPackages,
      };
    });
    setExpandedSections(prev => ({ ...prev, shipper: true, service: true, packages: true }));
  };

  // Auto-fill shipper info and currency from stored user profile on load
  useEffect(() => {
    if (shipment) return; // Don't override if editing existing shipment
    try {
      const profile = getStoredProfile();
      if (profile) applyProfileToForm(profile);
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment, shipperEditable]);

  // Listen for profile changes (storage events / tab visibility) to refresh shipper info
  useEffect(() => {
    if (shipment) return;
    const handleProfileRefresh = () => {
      try {
        const profile = getStoredProfile();
        if (profile) applyProfileToForm(profile);
      } catch (e) {
        // ignore
      }
    };

    const onStorage = (e) => {
      if (e.key === 'userProfile') handleProfileRefresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') handleProfileRefresh();
    };

    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [shipment, shipperEditable]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      // Ensure the array exists and is an array
      const currentArray = Array.isArray(prev[arrayName]) ? prev[arrayName] : [];
      const newArray = [...currentArray];
      
      // Ensure the item at index exists
      if (!newArray[index]) {
        newArray[index] = {};
      }
      
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName, template) => {
    setFormData(prev => {
      // Ensure the array exists and is an array
      const currentArray = Array.isArray(prev[arrayName]) ? prev[arrayName] : [];
      return {
        ...prev,
        [arrayName]: [...currentArray, template]
      };
    });
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => {
      // Ensure the array exists and is an array
      const currentArray = Array.isArray(prev[arrayName]) ? prev[arrayName] : [];
      return {
        ...prev,
        [arrayName]: currentArray.filter((_, i) => i !== index)
      };
    });
  };

  // Calculate pricing and customs value
  useEffect(() => {
    const serviceLevelMultiplier = {
      'Standard': 1.0,
      'Express': 1.5,
      'Economy': 0.8,
      'Freight': 0.7,
    };
    
    // Auto-calculate customs value from package products
    let calculatedCustomsValue = 0;
    if (formData.packages && Array.isArray(formData.packages)) {
      formData.packages.forEach(pkg => {
        if (pkg.products && Array.isArray(pkg.products)) {
          pkg.products.forEach(prod => {
            calculatedCustomsValue += parseFloat(prod.totalValue) || 0;
          });
        }
      });
    }
    
    // Update customs value in form data
    if (calculatedCustomsValue > 0 && formData.customsValue !== calculatedCustomsValue) {
      setFormData(prev => ({ ...prev, customsValue: calculatedCustomsValue }));
    }
    
    const customsValue = formData.customsValue || calculatedCustomsValue || 0;
    const basePrice = customsValue > 0 ? customsValue * 0.05 : 2400;
    const serviceCharge = basePrice * (serviceLevelMultiplier[formData.serviceLevel] || 1.0);
    const subtotal = basePrice + serviceCharge + pricing.customsClearance;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    setPricing({
      basePrice,
      serviceCharge,
      customsClearance: pricing.customsClearance,
      insurance: 0,
      subtotal,
      tax,
      total
    });
  }, [formData.packages, formData.customsValue, formData.serviceLevel]);

  // Trigger HS code suggestions when product name/description/category change
  useEffect(() => {
    if (!formData.products) return;

    formData.products.forEach(async (product) => {
      const productKey = product.id || '';
      const triggerText = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.trim();
      if (!triggerText || triggerText.length < 3) return;

      try {
        setLoadingHsSuggestions(prev => ({ ...prev, [productKey]: true }));
        const suggestions = await suggestHSCode(product.name || '', product.description || '');
        setHsSuggestions(prev => ({ ...prev, [productKey]: suggestions }));
      } catch (err) {
        console.error('HS suggestion error', err);
      } finally {
        setLoadingHsSuggestions(prev => ({ ...prev, [productKey]: false }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.products ? formData.products.map(p => `${p.name}|${p.description}|${p.category}`).join('||') : '']);

  // Validate HS codes when changed
  useEffect(() => {
    if (!formData.products) return;

    formData.products.forEach(async (product) => {
      const productKey = product.id || '';
      if (!product.hsCode || product.hsCode.trim().length < 4) return;
      try {
        const validation = await validateAndCheckHSCode(product.hsCode, formData.consignee?.country || formData.shipper?.country);
        setHsValidation(prev => ({ ...prev, [productKey]: validation }));
      } catch (err) {
        console.error('HS validation error', err);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.products ? formData.products.map(p => p.hsCode).join('||') : '', formData.consignee?.country, formData.shipper?.country]);

  // Keep currency and product origin in sync with selected shipper country
  useEffect(() => {
    const selectedCountry = formData.shipper?.country;
    if (!selectedCountry) return;
    const code = resolveCountryCode(selectedCountry);
    const desiredCurrency = getCurrencyByCountry(code).code;

    setProfileCountry(code);
    setProfileCurrency(desiredCurrency);

    // Normalize country code if user entered full name
    if (code !== selectedCountry) {
      setFormData(prev => ({
        ...prev,
        shipper: { ...prev.shipper, country: code }
      }));
      return;
    }

    setFormData(prev => {
      let updated = prev;
      if (prev.currency !== desiredCurrency) {
        updated = { ...updated, currency: desiredCurrency };
      }
      // Update origin country for products within packages
      if (prev.packages && Array.isArray(prev.packages)) {
        const updatedPackages = prev.packages.map(pkg => {
          if (pkg.products && Array.isArray(pkg.products)) {
            const updatedProducts = pkg.products.map(p => ({
              ...p,
              originCountry: p.originCountry || code
            }));
            return { ...pkg, products: updatedProducts };
          }
          return pkg;
        });
        updated = { ...updated, packages: updatedPackages };
      }
      return updated;
    });
  }, [formData.shipper?.country]);

  const validateForm = () => {
    const newErrors = {};
    
    // Reference ID removed from shipper UI — backend will generate if missing
    if (!formData.title) newErrors.title = 'Shipment title is required';
    if (!formData.mode) newErrors.mode = 'Mode is required';
    if (!formData.shipmentType) newErrors.shipmentType = 'Shipment type is required';
    if (!formData.shipper?.company) newErrors.shipperCompany = 'Shipper company is required';
    if (!formData.consignee?.company) newErrors.consigneeCompany = 'Consignee company is required';
    if (formData.packages?.length === 0) newErrors.packages = 'At least one package is required';
    
    // Check that each package has at least one product
    if (formData.packages && formData.packages.length > 0) {
      formData.packages.forEach((pkg, idx) => {
        if (!pkg.products || pkg.products.length === 0) {
          newErrors[`package${idx}Products`] = `Package ${idx + 1} must have at least one product`;
        }
      });
    }
    
    // Calculate and validate customs value
    let calculatedCustomsValue = 0;
    if (formData.packages && Array.isArray(formData.packages)) {
      formData.packages.forEach(pkg => {
        if (pkg.products && Array.isArray(pkg.products)) {
          pkg.products.forEach(prod => {
            calculatedCustomsValue += parseFloat(prod.totalValue) || 0;
          });
        }
      });
    }
    
    if (calculatedCustomsValue <= 0) {
      newErrors.customsValue = 'Customs value must be greater than 0. Please add products with values.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = () => {
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    // Prepare shipment object to save
    const updatedShipment = {
      ...formData,
      id: formData.id || `SHP-${Date.now()}`,
      referenceId: formData.referenceId || `REF-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'ai-review',
      updatedAt: new Date().toISOString(),
      createdAt: formData.createdAt || new Date().toISOString(),
    };

    // Ensure arrays exist
    updatedShipment.packages = updatedShipment.packages || [];
    updatedShipment.documents = updatedShipment.documents || {};
    
    // Ensure each package has products array
    updatedShipment.packages = updatedShipment.packages.map(pkg => ({
      ...pkg,
      products: pkg.products || []
    }));
    
    // Calculate customs value from packages
    let calculatedCustomsValue = 0;
    updatedShipment.packages.forEach(pkg => {
      if (pkg.products && Array.isArray(pkg.products)) {
        pkg.products.forEach(prod => {
          calculatedCustomsValue += parseFloat(prod.totalValue) || 0;
        });
      }
    });
    updatedShipment.customsValue = calculatedCustomsValue;

    // Save to store and navigate to details for AI evaluation
    try {
      shipmentsStore.saveShipment(updatedShipment);
      onNavigate('shipment-details', updatedShipment);
    } catch (err) {
      console.error('Error saving shipment', err);
      alert('Failed to save shipment - please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* BASICS SECTION */}
          <CollapsibleSection
            title="Shipment Basics"
            isOpen={expandedSections.basics}
            onToggle={() => toggleSection('basics')}
            icon={Truck}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Shipment Title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                placeholder="Electronic Components Shipment"
                required
              />
              <SelectField
                label="Mode"
                name="mode"
                value={formData.mode || ''}
                onChange={handleChange}
                options={modes}
                required
              />
              <SelectField
                label="Shipment Type"
                name="shipmentType"
                value={formData.shipmentType || ''}
                onChange={handleChange}
                options={shipmentTypes}
                required
              />
              <SelectField
                label="Pickup Type"
                name="pickupType"
                value={formData.pickupType || ''}
                onChange={handleChange}
                options={pickupTypes}
              />
              {formData.pickupType === 'Drop-off' && (
                <InputField
                  label="Estimated Drop-off Date"
                  type="date"
                  name="estimatedDropoffDate"
                  value={formData.estimatedDropoffDate || ''}
                  onChange={handleChange}
                />
              )}
              {formData.pickupType === 'Scheduled Pickup' && (
                <>
                  <InputField
                    label="Pickup Location"
                    name="pickupLocation"
                    value={formData.pickupLocation || ''}
                    onChange={handleChange}
                    placeholder="Enter pickup address"
                  />
                  <InputField
                    label="Pickup Date"
                    type="date"
                    name="pickupDate"
                    value={formData.pickupDate || ''}
                    onChange={handleChange}
                  />
                  <InputField
                    label="Earliest Pickup Time"
                    type="time"
                    name="pickupTimeEarliest"
                    value={formData.pickupTimeEarliest || ''}
                    onChange={handleChange}
                  />
                  <InputField
                    label="Latest Pickup Time"
                    type="time"
                    name="pickupTimeLatest"
                    value={formData.pickupTimeLatest || ''}
                    onChange={handleChange}
                  />
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* SHIPPER SECTION */}
          <CollapsibleSection
            title="Shipper Information"
            isOpen={expandedSections.shipper}
            onToggle={() => toggleSection('shipper')}
            icon={Users}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">Autofilled from Profile. Use edit to adjust.</p>
              <button
                type="button"
                onClick={() => setShipperEditable(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-4 h-4 text-slate-600" />
                <span className="text-slate-700">{shipperEditable ? 'Lock' : 'Edit'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Company Name"
                name="company"
                value={formData.shipper?.company || profileData?.companyName || ''}
                onChange={(e) => handleNestedChange('shipper', 'company', e.target.value)}
                disabled={!shipperEditable}
                required
                placeholder="ABC Exports"
              />
              <InputField
                label="Contact Name"
                name="contactName"
                value={formData.shipper?.contactName || (profileData ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() : '') || ''}
                onChange={(e) => handleNestedChange('shipper', 'contactName', e.target.value)}
                disabled={!shipperEditable}
                placeholder="John Smith"
              />
              <InputField
                label="Phone"
                type="tel"
                name="phone"
                value={formData.shipper?.phone || profileData?.phone || ''}
                onChange={(e) => handleNestedChange('shipper', 'phone', e.target.value)}
                disabled={!shipperEditable}
                placeholder="+1-555-0001"
              />
              <InputField
                label="Email"
                type="email"
                name="email"
                value={formData.shipper?.email || profileData?.email || ''}
                onChange={(e) => handleNestedChange('shipper', 'email', e.target.value)}
                disabled={!shipperEditable}
                placeholder="john@company.com"
              />
              <InputField
                label="Address Line 1"
                name="address1"
                value={formData.shipper?.address1 || profileData?.addressLine1 || ''}
                onChange={(e) => handleNestedChange('shipper', 'address1', e.target.value)}
                disabled={!shipperEditable}
                placeholder="123 Manufacturing St"
              />
              <InputField
                label="Address Line 2"
                name="address2"
                value={formData.shipper?.address2 || profileData?.addressLine2 || ''}
                onChange={(e) => handleNestedChange('shipper', 'address2', e.target.value)}
                disabled={!shipperEditable}
                placeholder="Suite 100"
              />
              <InputField
                label="City"
                name="city"
                value={formData.shipper?.city || profileData?.city || ''}
                onChange={(e) => handleNestedChange('shipper', 'city', e.target.value)}
                disabled={!shipperEditable}
                placeholder="Shanghai"
              />
              <InputField
                label="State/Province"
                name="state"
                value={formData.shipper?.state || profileData?.state || ''}
                onChange={(e) => handleNestedChange('shipper', 'state', e.target.value)}
                disabled={!shipperEditable}
                placeholder="SH"
              />
              <InputField
                label="Postal Code"
                name="postalCode"
                value={formData.shipper?.postalCode || profileData?.pinCode || ''}
                onChange={(e) => handleNestedChange('shipper', 'postalCode', e.target.value)}
                disabled={!shipperEditable}
                placeholder="200000"
              />
              <SelectField
                label="Country"
                name="country"
                value={formData.shipper?.country || profileData?.countryCode || profileCountry || ''}
                onChange={(e) => handleNestedChange('shipper', 'country', e.target.value)}
                disabled={!shipperEditable}
                options={countryOptions.map(c => ({ value: c.code, label: c.name }))}
              />
              <div className="md:col-span-2">
                {/* Tax ID removed from shipper UI for shippers; backend handles taxId if needed */}
                <CheckboxField
                  label="Exporter of Record"
                  name="exporterOfRecord"
                  checked={formData.shipper?.exporterOfRecord || false}
                  onChange={(e) => handleNestedChange('shipper', 'exporterOfRecord', e.target.checked)}
                  disabled={!shipperEditable}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* CONSIGNEE SECTION */}
          <CollapsibleSection
            title="Consignee Information"
            isOpen={expandedSections.consignee}
            onToggle={() => toggleSection('consignee')}
            icon={MapPin}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Company Name"
                name="company"
                value={formData.consignee?.company || ''}
                onChange={(e) => handleNestedChange('consignee', 'company', e.target.value)}
                required
                placeholder="Tech Imports Inc"
              />
              <InputField
                label="Contact Name"
                name="contactName"
                value={formData.consignee?.contactName || ''}
                onChange={(e) => handleNestedChange('consignee', 'contactName', e.target.value)}
                placeholder="Jane Doe"
              />
              <InputField
                label="Phone"
                type="tel"
                name="phone"
                value={formData.consignee?.phone || ''}
                onChange={(e) => handleNestedChange('consignee', 'phone', e.target.value)}
                placeholder="+1-555-0101"
              />
              <InputField
                label="Email"
                type="email"
                name="email"
                value={formData.consignee?.email || ''}
                onChange={(e) => handleNestedChange('consignee', 'email', e.target.value)}
                placeholder="jane@company.com"
              />
              <InputField
                label="Address Line 1"
                name="address1"
                value={formData.consignee?.address1 || ''}
                onChange={(e) => handleNestedChange('consignee', 'address1', e.target.value)}
                placeholder="456 Import Ave"
              />
              <InputField
                label="Address Line 2"
                name="address2"
                value={formData.consignee?.address2 || ''}
                onChange={(e) => handleNestedChange('consignee', 'address2', e.target.value)}
                placeholder="Floor 5"
              />
              <InputField
                label="City"
                name="city"
                value={formData.consignee?.city || ''}
                onChange={(e) => handleNestedChange('consignee', 'city', e.target.value)}
                placeholder="New York"
              />
              <InputField
                label="State/Province"
                name="state"
                value={formData.consignee?.state || ''}
                onChange={(e) => handleNestedChange('consignee', 'state', e.target.value)}
                placeholder="NY"
              />
              <InputField
                label="Postal Code"
                name="postalCode"
                value={formData.consignee?.postalCode || ''}
                onChange={(e) => handleNestedChange('consignee', 'postalCode', e.target.value)}
                placeholder="10001"
              />
              <SelectField
                label="Country"
                name="country"
                value={formData.consignee?.country || ''}
                onChange={(e) => handleNestedChange('consignee', 'country', e.target.value)}
                options={countryOptions.map(c => ({ value: c.code, label: c.name }))}
              />
              <div className="md:col-span-2">
                {/* Tax ID removed from consignee UI for shippers; backend handles taxId if needed */}
                <CheckboxField
                  label="Importer of Record"
                  name="importerOfRecord"
                  checked={formData.consignee?.importerOfRecord || false}
                  onChange={(e) => handleNestedChange('consignee', 'importerOfRecord', e.target.checked)}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* PACKAGE AND CONTENTS SECTION */}
          <CollapsibleSection
            title="Package and Contents"
            isOpen={expandedSections.packages}
            onToggle={() => toggleSection('packages')}
            icon={Package}
          >
            <div className="space-y-6">
              {formData.packages && formData.packages.map((pkg, pkgIdx) => (
                <div key={pkgIdx} className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-900 text-lg">Package {pkgIdx + 1}</h4>
                    <button
                      onClick={() => removeArrayItem('packages', pkgIdx)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Package Details */}
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <h5 className="text-sm font-medium text-slate-700 mb-3">Package Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SelectField
                        label="Package Type"
                        name="type"
                        value={pkg.type || ''}
                        onChange={(e) => handleArrayChange('packages', pkgIdx, 'type', e.target.value)}
                        options={packageTypes}
                      />
                      <InputField
                        label="Length (cm)"
                        type="number"
                        name="length"
                        value={pkg.length || ''}
                        onChange={(e) => handleArrayChange('packages', pkgIdx, 'length', parseFloat(e.target.value))}
                      />
                      <InputField
                        label="Width (cm)"
                        type="number"
                        name="width"
                        value={pkg.width || ''}
                        onChange={(e) => handleArrayChange('packages', pkgIdx, 'width', parseFloat(e.target.value))}
                      />
                      <InputField
                        label="Height (cm)"
                        type="number"
                        name="height"
                        value={pkg.height || ''}
                        onChange={(e) => handleArrayChange('packages', pkgIdx, 'height', parseFloat(e.target.value))}
                      />
                      <InputField
                        label="Weight"
                        type="number"
                        name="weight"
                        value={pkg.weight || ''}
                        onChange={(e) => handleArrayChange('packages', pkgIdx, 'weight', parseFloat(e.target.value))}
                      />
                      <SelectField
                        label="Weight Unit"
                        name="weightUnit"
                        value={pkg.weightUnit || 'kg'}
                        onChange={(e) => handleArrayChange('packages', pkgIdx, 'weightUnit', e.target.value)}
                        options={['kg', 'lb']}
                      />
                      <div className="md:col-span-3">
                        <CheckboxField
                          label="Stackable"
                          name="stackable"
                          checked={pkg.stackable || false}
                          onChange={(e) => handleArrayChange('packages', pkgIdx, 'stackable', e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Products within Package */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-medium text-slate-700">Product Contents</h5>
                      <button
                        type="button"
                        onClick={() => {
                          const currentProducts = pkg.products || [];
                          const newProduct = {
                            id: `PROD-${Date.now()}-${pkgIdx}`,
                            name: '',
                            description: '',
                            hsCode: '',
                            category: '',
                            uom: '',
                            qty: '',
                            unitPrice: '',
                            totalValue: '',
                            originCountry: formData.shipper?.country || profileCountry || '',
                            reasonForExport: '',
                          };
                          handleArrayChange('packages', pkgIdx, 'products', [...currentProducts, newProduct]);
                        }}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Product
                      </button>
                    </div>
                    
                    {pkg.products && pkg.products.length > 0 ? (
                      <div className="space-y-4">
                        {pkg.products.map((product, prodIdx) => (
                          <div key={product.id || prodIdx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <div className="flex justify-between items-start mb-3">
                              <h6 className="font-medium text-slate-900">Product {prodIdx + 1}</h6>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedProducts = pkg.products.filter((_, i) => i !== prodIdx);
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InputField
                                label="Product Name"
                                name="name"
                                value={product.name || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...pkg.products];
                                  updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], name: e.target.value };
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                                placeholder="Electronic Integrated Circuits"
                              />
                              <InputField
                                label="Category"
                                name="category"
                                value={product.category || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...pkg.products];
                                  updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], category: e.target.value };
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                                placeholder="Electronics, Textiles, Medical, etc."
                              />
                              <div className="md:col-span-2">
                                <InputField
                                  label="Description"
                                  name="description"
                                  value={product.description || ''}
                                  onChange={(e) => {
                                    const updatedProducts = [...pkg.products];
                                    updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], description: e.target.value };
                                    handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                  }}
                                  placeholder="Product description"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  HS Code
                                  <span className="text-red-600">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={product.hsCode || ''}
                                  onChange={(e) => {
                                    const updatedProducts = [...pkg.products];
                                    updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], hsCode: e.target.value };
                                    handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                  }}
                                  placeholder="8541.10.00"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <SelectField
                                label="Unit of Measure"
                                name="uom"
                                value={product.uom || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...pkg.products];
                                  updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], uom: e.target.value };
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                                options={uoms}
                              />
                              <InputField
                                label="Quantity"
                                type="number"
                                name="qty"
                                value={product.qty || ''}
                                onChange={(e) => {
                                  const qty = parseFloat(e.target.value) || 0;
                                  const unitPrice = parseFloat(product.unitPrice) || 0;
                                  const totalValue = qty * unitPrice;
                                  const updatedProducts = [...pkg.products];
                                  updatedProducts[prodIdx] = { 
                                    ...updatedProducts[prodIdx], 
                                    qty: qty,
                                    totalValue: totalValue
                                  };
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                              />
                              <InputField
                                label="Unit Price"
                                type="number"
                                name="unitPrice"
                                value={product.unitPrice || ''}
                                onChange={(e) => {
                                  const unitPrice = parseFloat(e.target.value) || 0;
                                  const qty = parseFloat(product.qty) || 0;
                                  const totalValue = qty * unitPrice;
                                  const updatedProducts = [...pkg.products];
                                  updatedProducts[prodIdx] = { 
                                    ...updatedProducts[prodIdx], 
                                    unitPrice: unitPrice,
                                    totalValue: totalValue
                                  };
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                              />
                              <InputField
                                label="Total Value"
                                type="number"
                                name="totalValue"
                                value={product.totalValue || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...pkg.products];
                                  updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], totalValue: parseFloat(e.target.value) || 0 };
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                                disabled
                              />
                              <SelectField
                                label="Origin Country"
                                name="originCountry"
                                value={product.originCountry || formData.shipper?.country || profileCountry || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...pkg.products];
                                  updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], originCountry: e.target.value };
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                                options={countryOptions.map(c => ({ value: c.code, label: c.name }))}
                              />
                              <SelectField
                                label="Reason for Export"
                                name="reasonForExport"
                                value={product.reasonForExport || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...pkg.products];
                                  updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], reasonForExport: e.target.value };
                                  handleArrayChange('packages', pkgIdx, 'products', updatedProducts);
                                }}
                                options={reasonsForExport}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No products added yet. Click "Add Product" to add product details to this package.
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => addArrayItem('packages', {
                  id: `PKG-${Date.now()}`,
                  type: '',
                  length: '',
                  width: '',
                  height: '',
                  dimUnit: 'cm',
                  weight: '',
                  weightUnit: 'kg',
                  stackable: false,
                  products: [],
                })}
                className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" /> Add Package
              </button>
            </div>
          </CollapsibleSection>


          {/* SERVICE & BILLING SECTION */}
          <CollapsibleSection
            title="Service & Billing"
            isOpen={expandedSections.service}
            onToggle={() => toggleSection('service')}
            icon={DollarSign}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Service Level"
                name="serviceLevel"
                value={formData.serviceLevel || ''}
                onChange={handleChange}
                options={serviceLevels}
              />
              <SelectField
                label="Currency"
                name="currency"
                value={formData.currency || ''}
                onChange={handleChange}
                options={currencies}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customs Value
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="customsValue"
                  value={(() => {
                    // Auto-calculate as sum of all package product total values
                    if (!formData.packages || formData.packages.length === 0) return '';
                    let total = 0;
                    formData.packages.forEach(pkg => {
                      if (pkg.products && Array.isArray(pkg.products)) {
                        pkg.products.forEach(prod => {
                          total += parseFloat(prod.totalValue) || 0;
                        });
                      }
                    });
                    return total > 0 ? total : '';
                  })()}
                  onChange={handleChange}
                  disabled
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">Automatically calculated from package product values</p>
              </div>
              <SelectField
                label="Payment Timing"
                name="paymentTiming"
                value={formData.paymentTiming || ''}
                onChange={handleChange}
                options={paymentTimings}
              />
            </div>
          </CollapsibleSection>

          {/* COMPLIANCE & ATTACHMENTS SECTION */}
          <CollapsibleSection
            title="Compliance & Attachments"
            isOpen={expandedSections.documents}
            onToggle={() => toggleSection('documents')}
            icon={Sparkles}
          >
            <div className="space-y-6">
              {/* AI Document Suggestions */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <h4 className="text-lg font-semibold text-purple-900">AI-Powered Required Documents</h4>
                </div>
                <p className="text-sm text-purple-800 mb-4">
                  Based on your shipment details, the following documents are required for customs clearance:
                </p>
                
                {analyzingDocuments ? (
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-purple-200">
                    <span className="inline-block w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-purple-700">Analyzing shipment details and product information...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requiredDocuments.length > 0 ? (
                      requiredDocuments.map((doc, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 border border-purple-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="font-medium text-slate-900">{doc.name}</p>
                              {doc.description && (
                                <p className="text-xs text-slate-600 mt-1">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {doc.required && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">Required</span>
                            )}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setDocumentFiles(prev => ({ ...prev, [doc.name]: file }));
                                }
                              }}
                              className="hidden"
                              id={`file-${idx}`}
                            />
                            <label
                              htmlFor={`file-${idx}`}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer text-sm flex items-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              {documentFiles[doc.name] ? 'Change File' : 'Upload'}
                            </label>
                            {documentFiles[doc.name] && (
                              <span className="text-sm text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                {documentFiles[doc.name].name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
                        <p className="text-sm text-slate-600">Click "Analyze Documents" to get AI-powered document suggestions</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setAnalyzingDocuments(true);
                      // Simulate AI analysis - in real app, this would call an API
                      await new Promise(resolve => setTimeout(resolve, 1500));
                      
                      // Generate document suggestions based on shipment data
                      const suggestedDocs = [
                        { name: 'Commercial Invoice', required: true, description: 'Required for all shipments' },
                        { name: 'Packing List', required: true, description: 'Required for all shipments' },
                      ];
                      
                      // Add documents based on HS codes
                      if (formData.packages) {
                        formData.packages.forEach(pkg => {
                          if (pkg.products) {
                            pkg.products.forEach(prod => {
                              if (prod.hsCode) {
                                // Add Certificate of Origin for international shipments
                                if (formData.shipmentType === 'International' && 
                                    !suggestedDocs.find(d => d.name === 'Certificate of Origin')) {
                                  suggestedDocs.push({ 
                                    name: 'Certificate of Origin', 
                                    required: true,
                                    description: 'Required for international shipments'
                                  });
                                }
                                
                                // Add Export License for certain HS codes
                                if (prod.hsCode.startsWith('85') && 
                                    !suggestedDocs.find(d => d.name === 'Export License')) {
                                  suggestedDocs.push({ 
                                    name: 'Export License', 
                                    required: false,
                                    description: 'May be required for electronic goods'
                                  });
                                }
                              }
                            });
                          }
                        });
                      }
                      
                      setRequiredDocuments(suggestedDocs);
                      setAnalyzingDocuments(false);
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Sparkles className="w-5 h-5" />
                    Analyze Required Documents
                  </button>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 pt-8 border-t border-slate-200">
            <button
              onClick={handleSubmit}
              className="flex-1 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {formData.status === 'token-generated' ? 'Proceed to Booking' : 'Upload and Submit for AI Review'}
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 py-4 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR - SUMMARY */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-lg sticky top-6 overflow-hidden">
            {/* Summary Cards */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-100px)] overflow-y-auto">
              
              {/* Shipment Overview */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Shipment Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Reference ID:</span>
                    <span className="text-slate-900 font-mono">{formData.referenceId || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mode:</span>
                    <span className="text-slate-900">{formData.mode || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="text-slate-900">{formData.shipmentType || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service:</span>
                    <span className="text-slate-900">{formData.serviceLevel || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-3">Parties</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Shipper:</p>
                    <p className="text-slate-900 font-medium">{formData.shipper?.company || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Consignee:</p>
                    <p className="text-slate-900 font-medium">{formData.consignee?.company || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-3">Weight & Packages</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Packages:</span>
                    <span className="text-slate-900 font-semibold">{formData.packages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Products:</span>
                    <span className="text-slate-900 font-semibold">
                      {formData.packages?.reduce((sum, pkg) => sum + (pkg.products?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Weight:</span>
                    <span className="text-slate-900">{formData.totalWeight || '—'} kg</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-3">Pricing Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Customs Value:</span>
                    <span className="text-slate-900">{formData.currency || 'USD'} {formData.customsValue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Price:</span>
                    <span className="text-slate-900">${pricing.basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service Charge:</span>
                    <span className="text-slate-900">${pricing.serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Clearance:</span>
                    <span className="text-slate-900">${pricing.customsClearance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-slate-200">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="text-slate-900">${pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax (18%):</span>
                    <span className="text-slate-900">${pricing.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t border-slate-200 text-base font-semibold">
                    <span className="text-slate-900">Total:</span>
                    <span className="text-blue-600">${pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${formData.referenceId || 'shipment'}-summary.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  Download Summary
                </button>
              </div>

              {/* Status Badge */}
              {formData.status && (
                <div className="border-t border-slate-200 pt-6">
                  <div className={`p-3 rounded-lg text-center text-sm font-semibold ${
                    formData.status === 'token-generated' 
                      ? 'bg-green-50 text-green-700'
                      : formData.status === 'ai-approved'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-50 text-slate-700'
                  }`}>
                    Status: {formData.status.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShipmentForm;
