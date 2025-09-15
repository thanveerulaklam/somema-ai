'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface Invoice {
  id: string;
  invoice_number: string;
  razorpay_invoice_id: string;
  plan_id: string;
  billing_cycle: string;
  customer_name: string;
  customer_email: string;
  customer_type: 'individual' | 'business';
  base_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'expired';
  due_date: string;
  paid_at?: string;
  created_at: string;
  // short_url?: string; // Razorpay payment URL - temporarily commented out
  invoice_items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  item_name: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
}

interface InvoiceListProps {
  userId: string;
}

export default function InvoiceList({ userId }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });

  const fetchInvoices = async (offset: number = 0, status: string = 'all') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId,
        limit: pagination.limit.toString(),
        offset: offset.toString()
      });

      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/invoices/list?${params}`);
      const result = await response.json();

      if (result.success) {
        if (offset === 0) {
          setInvoices(result.invoices);
        } else {
          setInvoices(prev => [...prev, ...result.invoices]);
        }
        setPagination(result.pagination);
      } else {
        setError(result.error || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(0, statusFilter);
  }, [userId, statusFilter]);

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the invoice list
        fetchInvoices(0, statusFilter);
        alert('Invoice sent successfully!');
      } else {
        alert('Failed to send invoice: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice');
    }
  };

  const formatAmount = (amount: number): string => {
    return (amount / 100).toFixed(2);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const loadMore = () => {
    if (pagination.hasMore) {
      fetchInvoices(pagination.offset + pagination.limit, statusFilter);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => fetchInvoices(0, statusFilter)}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Invoice #{invoice.invoice_number}
                  </h3>
                  <p className="text-gray-600">
                    {invoice.customer_name} ({invoice.customer_email})
                  </p>
                  <p className="text-sm text-gray-500">
                    {invoice.plan_id} - {invoice.billing_cycle}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                  <p className="text-lg font-bold mt-1">
                    ₹{formatAmount(invoice.total_amount)}
                  </p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Base Amount</p>
                  <p className="font-medium">₹{formatAmount(invoice.base_amount)}</p>
                </div>
                {invoice.tax_amount > 0 && (
                  <div>
                    <p className="text-gray-500">Tax Amount</p>
                    <p className="font-medium">₹{formatAmount(invoice.tax_amount)}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(invoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(invoice.created_at)}</p>
                </div>
              </div>

              {/* Invoice Items */}
              {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-1">
                    {invoice.invoice_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.item_name}</span>
                        <span>₹{formatAmount(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                {invoice.status === 'draft' && (
                  <Button
                    onClick={() => handleSendInvoice(invoice.id)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Send Invoice
                  </Button>
                )}
                {invoice.status === 'sent' && (
                  <>
                    {/* Temporarily commented out until short_url column is added to database
                    {invoice.short_url && (
                      <Button
                        onClick={() => window.open(invoice.short_url, '_blank')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Pay Now
                      </Button>
                    )}
                    */}
                    <Button
                      onClick={() => window.open(`https://invoice.razorpay.com/invoice/${invoice.razorpay_invoice_id}`, '_blank')}
                      size="sm"
                      variant="outline"
                    >
                      View Invoice
                    </Button>
                  </>
                )}
                {invoice.status === 'paid' && (
                  <div className="flex items-center text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Paid on {formatDate(invoice.paid_at!)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
