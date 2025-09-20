import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cancellation & Refund Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Overview</h2>
            <p className="text-gray-700 mb-4">
              This policy outlines the terms and conditions for cancellation and refunds of 
              Quely.ai subscription services. Please read this policy carefully before making 
              a purchase.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Subscription Cancellation</h2>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Through your account dashboard settings</li>
              <li>By contacting our customer support team</li>
              <li>By emailing us at info@mzonetechnologies.com</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Cancellation Terms</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>You will continue to have access to your plan features until the end of the billing cycle</li>
              <li>No refunds are provided for the remaining days of the current billing period</li>
              <li>Your account will revert to the free plan after cancellation</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Refund Policy</h2>
            <p className="text-gray-700 mb-4">
              Our refund policy is designed to be fair and transparent:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">No Refunds for Used Services</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>We do not provide refunds for partially used subscription periods</li>
              <li>Once you have accessed premium features, refunds are not available</li>
              <li>This includes AI content generation, advanced analytics, and other premium features</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Exception Cases</h3>
            <p className="text-gray-700 mb-4">
              Refunds may be considered in the following exceptional circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Technical Issues:</strong> If our service is unavailable for more than 24 hours due to technical problems</li>
              <li><strong>Billing Errors:</strong> If you were charged incorrectly or multiple times</li>
              <li><strong>Service Unavailability:</strong> If we discontinue a service you purchased</li>
              <li><strong>Account Security:</strong> If your account was compromised through no fault of your own</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Refund Process</h2>
            <p className="text-gray-700 mb-4">
              If a refund is approved:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Refunds are processed within 5-7 business days</li>
              <li>Refunds are issued to the original payment method</li>
              <li>You will receive an email confirmation when the refund is processed</li>
              <li>International refunds may take 10-15 business days</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Plan Changes and Refunds</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Upgrading your plan: No refunds for the difference in pricing</li>
              <li>Downgrading your plan: No refunds for the current billing period</li>
              <li>Plan changes take effect at the next billing cycle</li>
              <li>Pro-rated charges may apply for mid-cycle upgrades</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Free Trial Policy</h2>
            <p className="text-gray-700 mb-4">
              If we offer a free trial:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You can cancel during the trial period without any charges</li>
              <li>If you don't cancel, you will be charged at the end of the trial</li>
              <li>No refunds are provided after the trial period ends</li>
              <li>Trial terms and conditions apply as specified</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              If you disagree with a refund decision:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Contact our customer support team with detailed information</li>
              <li>Provide evidence to support your claim</li>
              <li>We will review your case within 5 business days</li>
              <li>Our decision is final and binding</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For cancellation and refund requests, please contact us at:
            </p>
            <ul className="list-none pl-6 text-gray-700 mb-4">
              <li><strong>Email:</strong> info@mzonetechnologies.com</li>
              <li><strong>Support:</strong> info@mzonetechnologies.com</li>
              <li><strong>Response Time:</strong> Within 24 hours during business days</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Policy Updates</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to update this cancellation and refund policy at any time. 
              Changes will be effective immediately upon posting. Your continued use of our 
              service after any changes constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 