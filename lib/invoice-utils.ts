// Invoice and GST utility functions

export interface BusinessInfo {
  businessName?: string;
  gstNumber?: string;
  businessAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  businessType?: 'proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'public_limited' | 'other';
}

export interface BillingInfo {
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface GSTCalculation {
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  isExport: boolean;
  customerType: 'individual' | 'business';
  gstApplicable: boolean;
}

/**
 * Determines if a customer is a business client based on various factors
 */
export function determineCustomerType(
  userData: any,
  businessInfo?: BusinessInfo
): 'individual' | 'business' {
  // Check if explicitly set as business
  if (userData.customer_type === 'business' || businessInfo?.businessName) {
    return 'business';
  }

  // Check if GST number is provided
  if (userData.gst_number || businessInfo?.gstNumber) {
    return 'business';
  }

  // Check if business name is provided
  if (userData.business_name || businessInfo?.businessName) {
    return 'business';
  }

  // Default to individual
  return 'individual';
}

/**
 * Validates GST number format (basic validation)
 */
export function validateGSTNumber(gstNumber: string): boolean {
  if (!gstNumber) return false;
  
  // Basic GST number format validation (15 characters, alphanumeric)
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber.toUpperCase());
}

/**
 * Determines if GST should be applied based on customer type and location
 */
export function shouldApplyGST(
  customerType: 'individual' | 'business',
  hasGstNumber: boolean,
  isIndianClient: boolean = true
): boolean {
  // International clients - no GST (export of services)
  if (!isIndianClient) {
    return false;
  }

  // Individual clients - no GST
  if (customerType === 'individual') {
    return false;
  }

  // Business clients - apply GST regardless of GST number
  // (GST number determines if it's B2B or B2C, but GST is still applicable)
  if (customerType === 'business') {
    return true;
  }

  return false;
}

/**
 * Calculates GST for a given amount
 */
export function calculateGST(
  baseAmount: number,
  gstRate: number = 18.00,
  isInterstate: boolean = false
): {
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
} {
  const totalTaxAmount = Math.round(baseAmount * gstRate / 100);
  
  if (isInterstate) {
    // Inter-state transaction: IGST
    return {
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: totalTaxAmount,
      totalTaxAmount
    };
  } else {
    // Intra-state transaction: CGST + SGST
    const halfTax = Math.round(totalTaxAmount / 2);
    return {
      cgstAmount: halfTax,
      sgstAmount: halfTax,
      igstAmount: 0,
      totalTaxAmount
    };
  }
}

/**
 * Comprehensive GST calculation for invoices
 */
export function calculateInvoiceGST(
  baseAmount: number,
  customerType: 'individual' | 'business',
  hasGstNumber: boolean,
  isIndianClient: boolean = true,
  isInterstate: boolean = false
): GSTCalculation {
  const gstApplicable = shouldApplyGST(customerType, hasGstNumber, isIndianClient);
  
  if (!gstApplicable) {
    return {
      baseAmount,
      taxAmount: 0,
      totalAmount: baseAmount,
      gstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      isExport: !isIndianClient,
      customerType,
      gstApplicable: false
    };
  }

  const gstRate = 18.00;
  const taxCalculation = calculateGST(baseAmount, gstRate, isInterstate);
  
  return {
    baseAmount,
    taxAmount: taxCalculation.totalTaxAmount,
    totalAmount: baseAmount + taxCalculation.totalTaxAmount,
    gstRate,
    cgstAmount: taxCalculation.cgstAmount,
    sgstAmount: taxCalculation.sgstAmount,
    igstAmount: taxCalculation.igstAmount,
    isExport: false,
    customerType,
    gstApplicable: true
  };
}

/**
 * Formats amount for display (converts from cents to rupees)
 */
export function formatAmount(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2);
}

/**
 * Formats amount for Razorpay (converts from rupees to cents)
 */
export function formatAmountForRazorpay(amountInRupees: number): number {
  return Math.round(amountInRupees * 100);
}

/**
 * Determines if transaction is interstate based on addresses
 */
export function isInterstateTransaction(
  businessState: string,
  customerState: string
): boolean {
  if (!businessState || !customerState) {
    return false; // Default to intra-state if states not provided
  }
  
  return businessState.toLowerCase() !== customerState.toLowerCase();
}

/**
 * Gets state code from state name (basic mapping)
 */
export function getStateCode(stateName: string): string {
  const stateMapping: { [key: string]: string } = {
    'andhra pradesh': 'AP',
    'arunachal pradesh': 'AR',
    'assam': 'AS',
    'bihar': 'BR',
    'chhattisgarh': 'CG',
    'goa': 'GA',
    'gujarat': 'GJ',
    'haryana': 'HR',
    'himachal pradesh': 'HP',
    'jharkhand': 'JH',
    'karnataka': 'KA',
    'kerala': 'KL',
    'madhya pradesh': 'MP',
    'maharashtra': 'MH',
    'manipur': 'MN',
    'meghalaya': 'ML',
    'mizoram': 'MZ',
    'nagaland': 'NL',
    'odisha': 'OR',
    'punjab': 'PB',
    'rajasthan': 'RJ',
    'sikkim': 'SK',
    'tamil nadu': 'TN',
    'telangana': 'TG',
    'tripura': 'TR',
    'uttar pradesh': 'UP',
    'uttarakhand': 'UK',
    'west bengal': 'WB',
    'andaman and nicobar islands': 'AN',
    'chandigarh': 'CH',
    'dadra and nagar haveli and daman and diu': 'DN',
    'delhi': 'DL',
    'jammu and kashmir': 'JK',
    'ladakh': 'LA',
    'lakshadweep': 'LD',
    'puducherry': 'PY'
  };
  
  return stateMapping[stateName.toLowerCase()] || stateName.toUpperCase();
}

/**
 * Generates invoice line items for Razorpay
 */
export function generateInvoiceLineItems(
  planName: string,
  baseAmount: number,
  gstCalculation: GSTCalculation
): any[] {
  const lineItems = [
    {
      name: planName,
      description: `${planName} subscription`,
      amount: baseAmount,
      quantity: 1,
      unit: 'nos'
    }
  ];

  // Add GST line items if applicable
  if (gstCalculation.gstApplicable) {
    if (gstCalculation.cgstAmount > 0) {
      lineItems.push({
        name: 'CGST',
        description: 'Central GST @ 9%',
        amount: gstCalculation.cgstAmount,
        quantity: 1,
        unit: 'nos'
      });
    }
    
    if (gstCalculation.sgstAmount > 0) {
      lineItems.push({
        name: 'SGST',
        description: 'State GST @ 9%',
        amount: gstCalculation.sgstAmount,
        quantity: 1,
        unit: 'nos'
      });
    }
    
    if (gstCalculation.igstAmount > 0) {
      lineItems.push({
        name: 'IGST',
        description: 'Integrated GST @ 18%',
        amount: gstCalculation.igstAmount,
        quantity: 1,
        unit: 'nos'
      });
    }
  }

  return lineItems;
}

/**
 * Validates business information for GST compliance
 */
export function validateBusinessInfo(businessInfo: BusinessInfo): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (businessInfo.gstNumber && !validateGSTNumber(businessInfo.gstNumber)) {
    errors.push('Invalid GST number format');
  }

  if (businessInfo.businessName && businessInfo.businessName.length < 2) {
    errors.push('Business name must be at least 2 characters long');
  }

  if (businessInfo.businessAddress) {
    const addr = businessInfo.businessAddress;
    if (!addr.line1 || addr.line1.length < 5) {
      errors.push('Business address line 1 is required and must be at least 5 characters');
    }
    if (!addr.city || addr.city.length < 2) {
      errors.push('City is required and must be at least 2 characters');
    }
    if (!addr.state || addr.state.length < 2) {
      errors.push('State is required and must be at least 2 characters');
    }
    if (!addr.pincode || !/^\d{6}$/.test(addr.pincode)) {
      errors.push('Valid 6-digit pincode is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
