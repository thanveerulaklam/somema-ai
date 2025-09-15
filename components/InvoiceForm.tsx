'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface BusinessInfo {
  businessName: string;
  gstNumber: string;
  businessAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  businessType: string;
}

interface BillingInfo {
  address: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface InvoiceFormProps {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  onInvoiceCreated: (invoice: any) => void;
  onCancel: () => void;
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      phone?: string;
    };
    customer_type?: 'individual' | 'business';
    business_name?: string;
    gst_number?: string;
    business_address?: any;
    billing_address?: any;
  };
}

export default function InvoiceForm({
  planId,
  billingCycle,
  onInvoiceCreated,
  onCancel,
  user
}: InvoiceFormProps) {
  const [customerType, setCustomerType] = useState<'individual' | 'business'>('individual');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    gstNumber: '',
    businessAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    businessType: 'proprietorship'
  });
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    address: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setCustomerType(user.customer_type || 'individual');
      if (user.business_name) {
        setBusinessInfo(prev => ({
          ...prev,
          businessName: user.business_name || '',
          gstNumber: user.gst_number || ''
        }));
      }
      if (user.business_address) {
        setBusinessInfo(prev => ({
          ...prev,
          businessAddress: {
            line1: user.business_address.line1 || '',
            line2: user.business_address.line2 || '',
            city: user.business_address.city || '',
            state: user.business_address.state || '',
            pincode: user.business_address.pincode || '',
            country: user.business_address.country || 'India'
          }
        }));
      }
      if (user.billing_address) {
        setBillingInfo(prev => ({
          ...prev,
          address: user.billing_address.line1 || '',
          address2: user.billing_address.line2 || '',
          city: user.billing_address.city || '',
          state: user.billing_address.state || '',
          pincode: user.billing_address.pincode || '',
          country: user.billing_address.country || 'India'
        }));
      }
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (customerType === 'business') {
      if (!businessInfo.businessName.trim()) {
        newErrors.push('Business name is required');
      }
      if (businessInfo.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(businessInfo.gstNumber.toUpperCase())) {
        newErrors.push('Invalid GST number format');
      }
      if (!businessInfo.businessAddress.line1.trim()) {
        newErrors.push('Business address is required');
      }
      if (!businessInfo.businessAddress.city.trim()) {
        newErrors.push('Business city is required');
      }
      if (!businessInfo.businessAddress.state.trim()) {
        newErrors.push('Business state is required');
      }
      if (!/^\d{6}$/.test(businessInfo.businessAddress.pincode)) {
        newErrors.push('Valid 6-digit pincode is required');
      }
    }

    if (!billingInfo.address.trim()) {
      newErrors.push('Billing address is required');
    }
    if (!billingInfo.city.trim()) {
      newErrors.push('Billing city is required');
    }
    if (!billingInfo.state.trim()) {
      newErrors.push('Billing state is required');
    }
    if (!/^\d{6}$/.test(billingInfo.pincode)) {
      newErrors.push('Valid 6-digit billing pincode is required');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      console.log('🚀 Sending invoice creation request...');
      console.log('👤 User data:', { id: user.id, email: user.email });
      
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planId,
          billingCycle,
          customerType,
          businessInfo: customerType === 'business' ? businessInfo : {},
          billingInfo
        }),
      });

      const result = await response.json();

      if (result.success) {
        onInvoiceCreated(result.invoice);
      } else {
        setErrors([result.error || 'Failed to create invoice']);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setErrors(['Failed to create invoice. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessInfo = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBusinessInfo(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BusinessInfo] as any || {}),
          [child]: value
        }
      }));
    } else {
      setBusinessInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const updateBillingInfo = (field: string, value: string) => {
    setBillingInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create Invoice</h2>
      
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <ul className="text-red-600 text-sm">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="individual"
                checked={customerType === 'individual'}
                onChange={(e) => setCustomerType(e.target.value as 'individual' | 'business')}
                className="mr-2"
              />
              Individual
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="business"
                checked={customerType === 'business'}
                onChange={(e) => setCustomerType(e.target.value as 'individual' | 'business')}
                className="mr-2"
              />
              Business
            </label>
          </div>
        </div>

        {/* Business Information */}
        {customerType === 'business' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold">Business Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <Input
                type="text"
                value={businessInfo.businessName}
                onChange={(e) => updateBusinessInfo('businessName', e.target.value)}
                placeholder="Enter business name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <Input
                type="text"
                value={businessInfo.gstNumber}
                onChange={(e) => updateBusinessInfo('gstNumber', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 22AAAAA0000A1Z5 (15 characters)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                value={businessInfo.businessType}
                onChange={(e) => updateBusinessInfo('businessType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="proprietorship">Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="llp">LLP</option>
                <option value="private_limited">Private Limited</option>
                <option value="public_limited">Public Limited</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Address Line 1 *
              </label>
              <Input
                type="text"
                value={businessInfo.businessAddress.line1}
                onChange={(e) => updateBusinessInfo('businessAddress.line1', e.target.value)}
                placeholder="Enter business address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Address Line 2
              </label>
              <Input
                type="text"
                value={businessInfo.businessAddress.line2}
                onChange={(e) => updateBusinessInfo('businessAddress.line2', e.target.value)}
                placeholder="Enter additional address details"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  type="text"
                  value={businessInfo.businessAddress.city}
                  onChange={(e) => updateBusinessInfo('businessAddress.city', e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <Input
                  type="text"
                  value={businessInfo.businessAddress.state}
                  onChange={(e) => updateBusinessInfo('businessAddress.state', e.target.value)}
                  placeholder="Enter state"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode *
              </label>
              <Input
                type="text"
                value={businessInfo.businessAddress.pincode}
                onChange={(e) => updateBusinessInfo('businessAddress.pincode', e.target.value)}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </div>
          </div>
        )}

        {/* Billing Information */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-semibold">Billing Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Address Line 1 *
            </label>
            <Input
              type="text"
              value={billingInfo.address}
              onChange={(e) => updateBillingInfo('address', e.target.value)}
              placeholder="Enter billing address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Address Line 2
            </label>
            <Input
              type="text"
              value={billingInfo.address2}
              onChange={(e) => updateBillingInfo('address2', e.target.value)}
              placeholder="Enter additional address details"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <Input
                type="text"
                value={billingInfo.city}
                onChange={(e) => updateBillingInfo('city', e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <Input
                type="text"
                value={billingInfo.state}
                onChange={(e) => updateBillingInfo('state', e.target.value)}
                placeholder="Enter state"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode *
            </label>
            <Input
              type="text"
              value={billingInfo.pincode}
              onChange={(e) => updateBillingInfo('pincode', e.target.value)}
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Creating Invoice...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
