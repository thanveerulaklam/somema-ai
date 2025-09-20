# GST Export Compliance Documentation

## Overview

This document explains how our payment system handles GST (Goods and Services Tax) for international customers according to Indian tax laws.

## GST Export Rules

### Export of Services (Section 16, IGST Act)

**Definition**: When services are provided to customers outside India, it's considered an export of services.

**Tax Treatment**: 
- **Zero-rated supply** (0% GST)
- No GST charged to international customers
- Export under LUT (Letter of Undertaking) approach

## Implementation Details

### Currency-Based Tax Logic

| Currency | Tax Treatment | GST Rate | Notes |
|----------|---------------|----------|-------|
| **INR** | GST Applied | 18% | Domestic Indian customers |
| **USD** | No GST | 0% | Export of services |
| **EUR** | No GST | 0% | Export of services |
| **GBP** | No GST | 0% | Export of services |

### Code Implementation

```javascript
// Tax configuration logic
if (currency === 'INR') {
  // Domestic Indian customers - GST applies
  taxConfig = {
    tax_amount: 0,
    tax_details: {
      enable_auto_calculation: true,
      tax_type: 'gst',
      is_export: false
    }
  };
} else {
  // International customers - No GST (export)
  taxConfig = {
    tax_amount: 0,
    tax_details: {
      enable_auto_calculation: false,
      tax_type: 'export',
      is_export: true,
      gst_rate: 0
    }
  };
}
```

## Customer Experience

### Indian Customers (INR)
- **Pricing**: "₹1,499 + GST"
- **Payment**: ₹1,499 + ₹270 GST = ₹1,769
- **Tax**: 18% GST applied

### International Customers (USD/EUR/GBP)
- **Pricing**: "$18 (No GST - Export)"
- **Payment**: $18.00 (no additional tax)
- **Tax**: 0% (export of services)

## Compliance Requirements

### For Your Business

1. **GST Registration**: Required for domestic sales
2. **LUT Registration**: Required for export of services
3. **Invoice Requirements**: 
   - Domestic: Include GST details
   - Export: Mark as "Export of Services"

### Documentation Needed

1. **LUT (Letter of Undertaking)**: For export without GST collection
2. **Export Invoices**: Proper documentation for international sales
3. **GST Returns**: Separate reporting for domestic vs export sales

## Database Tracking

### Payment Records Include:
- `is_export`: Boolean flag for export transactions
- `tax_amount`: 0 for exports, calculated GST for domestic
- `tax_details`: Detailed tax configuration used

### Example Records:

**Domestic Payment (INR)**:
```json
{
  "currency": "INR",
  "amount": 99900,
  "tax_amount": 17982,
  "total_amount": 117882,
  "is_export": false
}
```

**Export Payment (USD)**:
```json
{
  "currency": "USD",
  "amount": 1800,
  "tax_amount": 0,
  "total_amount": 1800,
  "is_export": true
}
```

## Benefits

✅ **Compliance**: Follows Indian GST export rules
✅ **Customer Friendly**: International customers pay exact price
✅ **Tax Efficiency**: No GST collection hassle for exports
✅ **Clear Documentation**: Proper tracking for tax reporting

## Next Steps

1. **Apply Database Schema**: Run `add-tax-support.sql`
2. **Register for LUT**: Contact your GST consultant
3. **Update Invoices**: Ensure proper export documentation
4. **Monitor Compliance**: Regular review of tax reporting

## Support

For GST compliance questions, consult with a qualified tax professional familiar with Indian export regulations.
