'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import InvoiceForm from '../../../components/InvoiceForm';

function CreateInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    // Get plan and billing cycle from URL params
    const plan = searchParams.get('plan');
    const cycle = searchParams.get('cycle');
    
    if (plan) setPlanId(plan);
    if (cycle && (cycle === 'monthly' || cycle === 'yearly')) {
      setBillingCycle(cycle);
    }

    // Get current user with profile
    const getUser = async () => {
      try {
        console.log('🔍 Checking user authentication...');
        
        // Try both getUser and getSession
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('👤 User from getUser:', user ? `Found user ${user.id}` : 'No user');
        console.log('👤 User from session:', session?.user ? `Found user ${session.user.id}` : 'No user in session');
        console.log('❌ User Error:', userError);
        console.log('❌ Session Error:', sessionError);
        
        const currentUser = user || session?.user;
        
        if (!currentUser) {
          console.log('🚪 Redirecting to login due to auth error');
          router.push('/login');
          return;
        }

        // Get user profile data
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        // If no profile exists, create a default one
        if (profileError && profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: currentUser.id,
              customer_type: 'individual',
              invoice_email: currentUser.email
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating user profile:', createError);
            setUser(currentUser);
          } else {
            setUser({
              ...currentUser,
              ...newProfile,
              id: currentUser.id // Ensure the original user ID is preserved
            });
          }
        } else if (profileError) {
          console.error('Error getting user profile:', profileError);
          setUser(currentUser);
        } else {
          setUser({
            ...currentUser,
            ...userProfile,
            id: currentUser.id // Ensure the original user ID is preserved
          });
        }
      } catch (error) {
        console.error('Error getting user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, searchParams]);

  const handleInvoiceCreated = (invoice: any) => {
    // Redirect to Razorpay payment dashboard
    if (invoice.short_url) {
      // Open payment page in current tab (same as localhost behavior)
      window.location.href = invoice.short_url;
    } else {
      alert('Invoice created successfully!');
      router.push('/invoices');
    }
  };

  const handleCancel = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <InvoiceForm
          planId={planId}
          billingCycle={billingCycle}
          onInvoiceCreated={handleInvoiceCreated}
          onCancel={handleCancel}
          user={user}
        />
      </div>
    </div>
  );
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CreateInvoiceContent />
    </Suspense>
  );
}
