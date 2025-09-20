import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">About Quely.ai</h2>
            <p className="text-gray-700 mb-4">
              Quely.ai is a social media management platform that helps users create, schedule, and publish content 
              to their Facebook Pages and Instagram Business accounts. This privacy policy explains how we collect, 
              use, and protect your information when you use our service.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect the following types of information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Account Information:</strong> Email address, name, and profile information when you create an account</li>
              <li><strong>Meta Platform Data:</strong> Access tokens, Facebook Pages, Instagram Business accounts, and content you authorize us to access</li>
              <li><strong>Content Data:</strong> Posts, images, videos, captions, and scheduling information you create through our platform</li>
              <li><strong>Usage Data:</strong> How you interact with our service, including features used and posting patterns</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage analytics</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide our social media management services</li>
              <li>Schedule and publish your content to Facebook and Instagram</li>
              <li>Connect to your Meta accounts and manage permissions</li>
              <li>Improve our platform and develop new features</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Meta Platform Integration</h2>
            <p className="text-gray-700 mb-4">
              When you connect your Meta accounts (Facebook Pages and Instagram Business accounts), we:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Store access tokens securely to enable posting on your behalf</li>
              <li>Access your Facebook Pages and Instagram accounts as authorized by you</li>
              <li>Read and publish content to your connected platforms</li>
              <li>Access basic profile information to display account details</li>
              <li>Use Meta APIs to schedule and publish your content</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>With Meta Platforms:</strong> To publish your content to Facebook and Instagram as authorized by you</li>
              <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our platform (hosting, analytics, etc.)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure storage of access tokens and sensitive information</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication measures</li>
              <li>Monitoring for suspicious activity</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">
              You have the following rights regarding your information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Revoke Access:</strong> Disconnect your Meta accounts at any time</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as your account is active or as needed to provide our services. 
              When you delete your account, we will delete your personal information within 30 days, except where 
              retention is required by law or for legitimate business purposes.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected information from a child under 13, 
              please contact us immediately.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure 
              appropriate safeguards are in place to protect your information in accordance with this privacy policy.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. We will notify you of any material changes by 
              posting the new policy on this page and updating the "Last updated" date. Your continued use of our 
              service after any changes constitutes acceptance of the updated policy.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <ul className="list-none pl-6 text-gray-700 mb-4">
              <li><strong>Email:</strong> info@mzonetechnologies.com</li>
              <li><strong>Website:</strong> https://www.mzonetechnologies.com</li>
            </ul>
            
            <p className="text-gray-700 mb-4">
              For data deletion requests, please email us with the subject line "Delete My Account" and include 
              your registered email address in the body of the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 