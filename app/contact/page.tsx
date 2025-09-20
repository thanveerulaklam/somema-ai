import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';

export default function ContactPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              We're here to help! Get in touch with us for any questions, support, or feedback.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">Email Support</h3>
                      <p className="text-gray-600">info@mzonetechnologies.com</p>
                      <p className="text-sm text-gray-500">For general inquiries and support</p>
                    </div>
                  </div>
                  
                 
                  
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">Business Hours</h3>
                      <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                      <p className="text-sm text-gray-500">Weekend support available for urgent issues</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Company Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">Registered Address</h3>
                      <p className="text-gray-600">
                        Quely.ai<br />
                        MZone Technologies<br />
                        305, 2nd Floor, Dhali Road<br />
                        Udumalpet, Tamil Nadu<br />
                        India
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">Phone Support</h3>
                      <p className="text-gray-600">+91 70109 38016</p>
                      <p className="text-sm text-gray-500">Available during business hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Support Categories */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How Can We Help?</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Technical Support</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Issues with platform features, integrations, or technical problems
                  </p>
                                        <p className="text-blue-600 text-sm font-medium">info@mzonetechnologies.com</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Billing & Payments</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Questions about subscriptions, payments, refunds, or billing issues
                  </p>
                                        <p className="text-blue-600 text-sm font-medium">info@mzonetechnologies.com</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Partnership</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Business partnerships, enterprise solutions, or collaboration inquiries
                  </p>
                                        <p className="text-blue-600 text-sm font-medium">info@mzonetechnologies.com</p>
                </div>
              </div>
            </div>
            
            {/* Response Times */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Times</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• General inquiries: Within 24 hours</li>
                      <li>• Technical issues: Within 12 hours</li>
                      <li>• Billing issues: Within 6 hours</li>
                    </ul>
                  </div>
                  
                  {/*  */}
                </div>
              </div>
            </div>
            
            {/* FAQ Link */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Can't find what you're looking for? Check our frequently asked questions.
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Visit FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
