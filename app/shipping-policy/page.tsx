import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ShippingPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Digital Service Delivery</h2>
            <p className="text-gray-700 mb-4">
              Quely.ai is a digital service platform that provides social media management tools 
              and AI-powered content generation. As such, we do not ship physical products. All 
              our services are delivered digitally through our web platform.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Service Activation</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Upon successful payment, your subscription is activated immediately</li>
              <li>You will receive an email confirmation with your account details</li>
              <li>Access to your purchased plan features is granted instantly</li>
              <li>No physical delivery or shipping is involved</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Account Access</h2>
            <p className="text-gray-700 mb-4">
              Once your payment is processed successfully:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Your account is automatically upgraded to the selected plan</li>
              <li>All features and limits are updated immediately</li>
              <li>You can start using the enhanced features right away</li>
              <li>No waiting time or delivery delays</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Digital Content Delivery</h2>
            <p className="text-gray-700 mb-4">
              Our platform delivers digital content and services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>AI-generated content is available instantly in your dashboard</li>
              <li>Scheduled posts are delivered to your social media accounts as configured</li>
              <li>Analytics and reports are generated in real-time</li>
              <li>All content is accessible through our web interface</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Technical Requirements</h2>
            <p className="text-gray-700 mb-4">
              To access our digital services, you need:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>A stable internet connection</li>
              <li>A modern web browser (Chrome, Firefox, Safari, Edge)</li>
              <li>JavaScript enabled in your browser</li>
              <li>Valid social media accounts for integration</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Service Availability</h2>
            <p className="text-gray-700 mb-4">
              Our digital services are available:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>24/7 through our web platform</li>
              <li>From anywhere in the world with internet access</li>
              <li>On desktop and mobile devices</li>
              <li>Subject to our terms of service and fair usage policies</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">No Physical Shipping</h2>
            <p className="text-gray-700 mb-4">
              Since we provide digital services only:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>No shipping costs are applicable</li>
              <li>No delivery timeframes to consider</li>
              <li>No tracking numbers or shipping confirmations</li>
              <li>No physical address required for service delivery</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">International Access</h2>
            <p className="text-gray-700 mb-4">
              Our digital services are available globally:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>No geographical restrictions on service delivery</li>
              <li>Same instant access regardless of location</li>
              <li>Localized pricing in INR and USD</li>
              <li>Support available in multiple time zones</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about our digital service delivery, please contact us at:
            </p>
            <ul className="list-none pl-6 text-gray-700 mb-4">
              <li><strong>Email:</strong> info@mzonetechnologies.com</li>
              <li><strong>Technical Support:</strong> info@mzonetechnologies.com</li>
              <li><strong>Website:</strong> https://quely.ai</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 