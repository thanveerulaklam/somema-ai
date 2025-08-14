import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using Somema AI, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Service Description</h2>
            <p className="text-gray-700 mb-4">
              Somema AI is a social media management platform that provides AI-powered content generation, 
              scheduling, and publishing tools for Facebook Pages and Instagram Business accounts.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">User Registration and Accounts</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You are liable for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>We reserve the right to terminate accounts that violate these terms</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Subscription and Payment Terms</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Subscription fees are billed monthly in advance</li>
              <li>Payments are processed securely through Razorpay</li>
              <li>All prices are exclusive of applicable taxes</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>No refunds for partial months of service</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Acceptable Use Policy</h2>
            <p className="text-gray-700 mb-4">
              You agree not to use our service to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Post, upload, or transmit illegal, harmful, or objectionable content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of our service</li>
              <li>Use our service for spam or unsolicited communications</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Content Ownership and License</h2>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you create using our service. By using our service, you grant us a 
              limited license to process and deliver your content to your connected social media accounts.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Third-Party Integrations</h2>
            <p className="text-gray-700 mb-4">
              Our service integrates with Meta platforms (Facebook and Instagram). You must comply with their 
              respective terms of service and policies when using our platform.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Service Availability</h2>
            <p className="text-gray-700 mb-4">
              We strive to maintain high service availability but do not guarantee uninterrupted access. 
              We may perform maintenance or updates that temporarily affect service availability.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data Privacy and Security</h2>
            <p className="text-gray-700 mb-4">
              We collect and process your data in accordance with our Privacy Policy. We implement 
              industry-standard security measures to protect your information.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              Our platform, including its design, code, and content, is protected by intellectual property laws. 
              You may not copy, modify, or distribute our proprietary materials without permission.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, Somema AI shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages arising from your use of our service.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless Somema AI from any claims, damages, or expenses 
              arising from your use of our service or violation of these terms.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account at any time for violation of these terms. 
              You may cancel your subscription at any time through your account settings.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These terms are governed by the laws of India. Any disputes shall be resolved in the 
              courts of India.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of material 
              changes via email or through our platform.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <ul className="list-none pl-6 text-gray-700 mb-4">
              <li><strong>Email:</strong> legal@somema.ai</li>
              <li><strong>Support:</strong> support@somema.ai</li>
              <li><strong>Website:</strong> https://somema.ai</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 