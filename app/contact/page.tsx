export default function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Contact Us</h1>
      <p className="mb-8 text-gray-600">
        Have questions or need support? We're here to help you succeed in your university journey.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-semibold mb-2">Email Support</h2>
          <p className="text-gray-500 mb-2">
            Drop us an email anytime. We usually reply within 24 hours.
          </p>
          <a
            href="mailto:support@myeduai.online"
            className="text-blue-600 font-medium hover:underline"
          >
            support@myeduai.online
          </a>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-4xl mb-4">📞</div>
          <h2 className="text-xl font-semibold mb-2">Phone Support</h2>
          <p className="text-gray-500 mb-2">
            Available Monday to Friday, 9:00 AM to 5:00 PM (PKT).
          </p>
          <a
            href="tel:+923216768326"
            className="text-blue-600 font-medium hover:underline"
          >
            +92 321 6768326
          </a>
        </div>
      </div>
    </div>
  );
}