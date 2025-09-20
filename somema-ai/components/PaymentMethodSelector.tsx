import React, { useState } from 'react';

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: string) => void;
  selectedMethod?: string;
  disabled?: boolean;
  showBenefits?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onMethodSelect,
  selectedMethod = 'upi-autopay',
  disabled = false,
  showBenefits = true
}) => {
  const [method, setMethod] = useState(selectedMethod);

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    onMethodSelect(newMethod);
  };

  const paymentMethods = [
    {
      id: 'upi-autopay',
      name: 'UPI AutoPay',
      icon: '📱',
      description: 'Auto-renewal from bank account',
      benefits: [
        'No credit card required',
        '99% success rate',
        'Manage in UPI app',
        'No expiration issues'
      ],
      recommended: true,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'card',
      name: 'Credit Card',
      icon: '💳',
      description: 'Auto-renewal with card',
      benefits: [
        'Instant activation',
        'Global acceptance',
        'Easy management'
      ],
      recommended: false,
      color: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      id: 'one-time',
      name: 'One-time Payment',
      icon: '💰',
      description: 'Pay once, no auto-renewal',
      benefits: [
        'Multiple payment options',
        'No recurring charges',
        'Full control'
      ],
      recommended: false,
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Payment Method</h3>
        <p className="text-sm text-gray-600">Select how you'd like to pay for your subscription</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {paymentMethods.map((pm) => (
          <div
            key={pm.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
              method === pm.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && handleMethodChange(pm.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{pm.icon}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{pm.name}</h4>
                    {pm.recommended && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{pm.description}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  name="payment-method"
                  value={pm.id}
                  checked={method === pm.id}
                  onChange={() => !disabled && handleMethodChange(pm.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={disabled}
                />
              </div>
            </div>

            {showBenefits && method === pm.id && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  {pm.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-green-500 text-sm">✅</span>
                      <span className="text-xs text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {method === 'upi-autopay' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-green-500 text-lg">💡</span>
            <div>
              <h4 className="font-medium text-green-900">UPI AutoPay Setup</h4>
              <p className="text-sm text-green-700 mt-1">
                After clicking subscribe, you'll be redirected to authorize the UPI mandate in your UPI app. 
                This allows automatic payments without entering details each time.
              </p>
            </div>
          </div>
        </div>
      )}

      {method === 'one-time' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-500 text-lg">⚠️</span>
            <div>
              <h4 className="font-medium text-yellow-900">One-time Payment</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your plan will expire after the billing period. You'll need to manually renew to continue using the service.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
