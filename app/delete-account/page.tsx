export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Delete Your Account & Data</h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-4">
              If you wish to delete your Quely AI account and all associated data, please email us at <a href="mailto:privacy@quely.ai" className="text-blue-600 underline">privacy@quely.ai</a> from the email address associated with your account. We will process your request and permanently delete your data within 7 business days.
            </p>
            <p className="text-gray-700 mb-4">
              For faster processing, please include the subject line <strong>"Delete My Account"</strong> and mention your registered email address in the body of the email.
            </p>
            <p className="text-gray-700 mb-4">
              If you have any questions about data deletion or privacy, feel free to contact us at the same email address.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 