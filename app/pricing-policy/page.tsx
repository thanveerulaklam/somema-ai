import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PricingPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Pricing Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Overview</h2>
            <p className="text-gray-700 mb-4">
              Quely.ai offers subscription-based pricing for our social media management platform. 
              All prices are listed in Indian Rupees (INR) and US Dollars (USD) and are subject to 
              applicable taxes.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Subscription Plans</h2>
            <p className="text-gray-700 mb-4">
              We offer the following subscription plans:
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🆓 Free Plan</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">₹0</p>
                <p className="text-gray-600 mb-4">per month</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 15 post generations</li>
                  <li>• 3 AI image enhancements (cannot be downloaded)</li>
                  <li>• 50 images stored</li>
                  <li>• Unlimited posting & scheduling</li>
                  <li>• Unlimited Meta accounts</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Starter Plan</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">₹999</p>
                <p className="text-gray-600 mb-4">per month</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 100 post generations</li>
                  <li>• 30 AI image enhancements (downloadable)</li>
                  <li>• 500 image/video stored</li>
                  <li>• Unlimited posting & scheduling</li>
                  <li>• Unlimited Meta accounts</li>
                  <li>• 🎁 Free Trial (7 Days)</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Growth Plan</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">₹2,499</p>
                <p className="text-gray-600 mb-4">per month</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 300 post generations</li>
                  <li>• 100 AI image enhancements (downloadable)</li>
                  <li>• Unlimited image/video stored</li>
                  <li>• Unlimited posting & scheduling</li>
                  <li>• Unlimited Meta accounts</li>
                  <li>• 🎁 Free Trial (7 Days)</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Scale Plan</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">₹8,999</p>
                <p className="text-gray-600 mb-4">per month</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 1000 post generations</li>
                  <li>• 500 AI image enhancements (downloadable)</li>
                  <li>• Unlimited image/video stored</li>
                  <li>• Unlimited posting & scheduling</li>
                  <li>• Unlimited Meta accounts</li>
                  <li>• 🎁 Free Trial (7 Days)</li>
                </ul>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Payment Terms</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>All subscriptions are billed monthly in advance</li>
              <li>Payments are processed securely through Razorpay</li>
              <li>We accept major credit cards, debit cards, UPI, and net banking</li>
              <li>International payments are accepted in USD</li>
              <li>All prices are exclusive of applicable taxes</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Billing and Renewal</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Subscriptions automatically renew at the end of each billing cycle</li>
              <li>You will be charged the same amount unless you change your plan</li>
              <li>You can cancel your subscription at any time</li>
              <li>No refunds for partial months of service</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Plan Changes</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You can upgrade your plan at any time</li>
              <li>Upgrades take effect immediately</li>
              <li>Downgrades take effect at the next billing cycle</li>
              <li>Pro-rated charges may apply for plan changes</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Taxes</h2>
            <p className="text-gray-700 mb-4">
              All prices are exclusive of applicable taxes. You are responsible for paying any 
              taxes that may apply to your subscription based on your location.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Price Changes</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to change our pricing at any time. We will provide at least 
              30 days notice before any price changes take effect. Your continued use of the 
              service after the price change constitutes acceptance of the new pricing.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about our pricing policy, please contact us at:
            </p>
            <ul className="list-none pl-6 text-gray-700 mb-4">
              <li><strong>Email:</strong> info@mzonetechnologies.com</li>
              <li><strong>Support:</strong> info@mzonetechnologies.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 