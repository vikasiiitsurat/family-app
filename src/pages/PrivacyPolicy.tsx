import { useState } from 'react';
import { Shield, Lock, Eye, UserCheck, Database, Bell, Mail, FileText, ChevronDown, ChevronUp, Calendar, Globe, Smartphone, Heart, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
  id: string;
  title: string;
  icon: JSX.Element;
  content: JSX.Element;
  color: string;
}

export default function PrivacyPolicy() {
  const [expandedSection, setExpandedSection] = useState<string | null>('intro');
  const [lastUpdated] = useState('February 14, 2026');

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const sections: Section[] = [
    {
      id: 'intro',
      title: 'Introduction',
      icon: <Shield size={24} />,
      color: 'from-blue-500 to-cyan-500',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Welcome to our Community Platform! We value your privacy and are committed to protecting your personal information. 
            This Privacy Policy explains how we collect, use, store, and safeguard your data when you use our services.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
            <p className="text-blue-800 font-semibold flex items-center gap-2">
              <Info size={18} />
              By using our platform, you agree to the collection and use of information in accordance with this policy.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'collection',
      title: 'Information We Collect',
      icon: <Database size={24} />,
      color: 'from-purple-500 to-pink-500',
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <UserCheck size={18} className="text-purple-600" />
              Personal Information
            </h4>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Name:</strong> Your full name for identification and celebration purposes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Email Address:</strong> For account management and communication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Phone Number:</strong> For contact purposes and community connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Date of Birth:</strong> To celebrate your special day with you</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Anniversary Date:</strong> Optional, for celebration purposes</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Globe size={18} className="text-pink-600" />
              Professional & Social Information
            </h4>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Qualification:</strong> Your educational background</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Current Status:</strong> Your work or study information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-1">•</span>
                <span className="text-gray-700"><strong>LinkedIn Profile:</strong> Optional, for professional networking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Instagram Handle:</strong> Optional, for social connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-1">•</span>
                <span className="text-gray-700"><strong>WhatsApp Number:</strong> Optional, for direct communication</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Smartphone size={18} className="text-indigo-600" />
              Technical Information
            </h4>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Timezone:</strong> Automatically detected to show you relevant celebration times</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Registration Date:</strong> When you joined our community</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'usage',
      title: 'How We Use Your Information',
      icon: <Eye size={24} />,
      color: 'from-green-500 to-emerald-500',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We use the information we collect for the following purposes:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
              <h5 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                <Bell size={16} />
                Celebrations
              </h5>
              <p className="text-sm text-gray-700">
                To notify community members of birthdays and anniversaries, making every special day memorable.
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-200">
              <h5 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                <UserCheck size={16} />
                Profile Management
              </h5>
              <p className="text-sm text-gray-700">
                To create and maintain your community profile, allowing others to connect with you.
              </p>
            </div>
            <div className="bg-teal-50 p-4 rounded-xl border-2 border-teal-200">
              <h5 className="font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Mail size={16} />
                Communication
              </h5>
              <p className="text-sm text-gray-700">
                To send you important updates, celebration reminders, and community announcements.
              </p>
            </div>
            <div className="bg-cyan-50 p-4 rounded-xl border-2 border-cyan-200">
              <h5 className="font-bold text-cyan-800 mb-2 flex items-center gap-2">
                <Heart size={16} />
                Community Building
              </h5>
              <p className="text-sm text-gray-700">
                To facilitate connections between members and create a thriving, engaged community.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'storage',
      title: 'Data Storage & Security',
      icon: <Lock size={24} />,
      color: 'from-orange-500 to-red-500',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-2 border-orange-200">
            <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2 text-lg">
              <Shield size={20} />
              Our Security Measures
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Encrypted Storage:</strong> All data is stored securely using Supabase's enterprise-grade encryption
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Secure Connections:</strong> All data transmissions are protected using SSL/TLS encryption
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Access Control:</strong> Strict access controls ensure only authorized personnel can access the database
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Regular Backups:</strong> Your data is backed up regularly to prevent loss
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
            <p className="text-yellow-800 font-semibold flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>
                While we implement industry-standard security measures, please note that no method of transmission over the internet 
                or electronic storage is 100% secure. We strive to protect your data but cannot guarantee absolute security.
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'sharing',
      title: 'Information Sharing',
      icon: <Globe size={24} />,
      color: 'from-indigo-500 to-purple-500',
      content: (
        <div className="space-y-4">
          <div className="bg-indigo-50 p-5 rounded-xl border-2 border-indigo-200">
            <h4 className="font-bold text-indigo-800 mb-3 text-lg">Within the Community</h4>
            <p className="text-gray-700 leading-relaxed mb-3">
              The following information is visible to other community members:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <Eye size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Your name, qualification, and current status</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Your contact information (email, phone)</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Your social media links (if provided)</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Birthday and anniversary dates (month and day only)</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200">
            <h4 className="font-bold text-purple-800 mb-3 text-lg">Third-Party Sharing</h4>
            <p className="text-gray-700 leading-relaxed">
              We <strong>DO NOT</strong> sell, trade, or rent your personal information to third parties. 
              We only share data with trusted service providers who assist in operating our platform:
            </p>
            <ul className="space-y-2 ml-6 mt-3">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Supabase:</strong> Our database and authentication provider</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-gray-700"><strong>Hosting Services:</strong> To make the platform accessible online</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              These service providers are obligated to keep your information confidential and use it only for the purposes we specify.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'rights',
      title: 'Your Rights & Control',
      icon: <UserCheck size={24} />,
      color: 'from-pink-500 to-rose-500',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            You have full control over your personal information. Here are your rights:
          </p>
          <div className="grid gap-4">
            <div className="flex items-start gap-4 bg-pink-50 p-4 rounded-xl border-2 border-pink-200">
              <div className="bg-pink-500 text-white p-2 rounded-lg flex-shrink-0">
                <Eye size={20} />
              </div>
              <div>
                <h5 className="font-bold text-pink-800 mb-1">Access Your Data</h5>
                <p className="text-sm text-gray-700">
                  You can view all your personal information at any time through your profile page.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-rose-50 p-4 rounded-xl border-2 border-rose-200">
              <div className="bg-rose-500 text-white p-2 rounded-lg flex-shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <h5 className="font-bold text-rose-800 mb-1">Update Information</h5>
                <p className="text-sm text-gray-700">
                  Use the "Update Profile" feature to modify any of your personal details whenever needed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-red-50 p-4 rounded-xl border-2 border-red-200">
              <div className="bg-red-500 text-white p-2 rounded-lg flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h5 className="font-bold text-red-800 mb-1">Request Deletion</h5>
                <p className="text-sm text-gray-700">
                  Contact our support team to request complete deletion of your account and all associated data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
              <div className="bg-orange-500 text-white p-2 rounded-lg flex-shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h5 className="font-bold text-orange-800 mb-1">Data Portability</h5>
                <p className="text-sm text-gray-700">
                  Request a copy of your data in a structured, machine-readable format for your records.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'cookies',
      title: 'Cookies & Tracking',
      icon: <Smartphone size={24} />,
      color: 'from-cyan-500 to-blue-500',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Our platform uses minimal tracking technologies to enhance your experience:
          </p>
          <div className="bg-cyan-50 p-5 rounded-xl border-2 border-cyan-200">
            <h4 className="font-bold text-cyan-800 mb-3">What We Use:</h4>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-1">•</span>
                <span className="text-gray-700">
                  <strong>Session Storage:</strong> To keep you logged in during your visit
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-1">•</span>
                <span className="text-gray-700">
                  <strong>Local Storage:</strong> To remember your preferences and settings
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-1">•</span>
                <span className="text-gray-700">
                  <strong>Timezone Detection:</strong> To show you celebration times in your local timezone
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <h4 className="font-bold text-blue-800 mb-3">What We DON'T Use:</h4>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">No third-party advertising cookies</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">No behavior tracking for marketing purposes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">No data sharing with ad networks</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    
    {
      id: 'changes',
      title: 'Policy Updates',
      icon: <Calendar size={24} />,
      color: 'from-teal-500 to-green-500',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons.
          </p>
          <div className="bg-teal-50 p-5 rounded-xl border-2 border-teal-200">
            <h4 className="font-bold text-teal-800 mb-3 flex items-center gap-2">
              <Bell size={18} />
              How We Notify You
            </h4>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span className="text-gray-700">
                  We'll update the "Last Updated" date at the top of this policy
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span className="text-gray-700">
                  For significant changes, we'll send an email notification to all members
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span className="text-gray-700">
                  We encourage you to review this policy periodically to stay informed
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
            <p className="text-gray-700 leading-relaxed">
              <strong>Your Continued Use:</strong> By continuing to use our platform after changes are posted, 
              you accept the updated Privacy Policy. If you disagree with any changes, please contact support 
              to discuss your concerns or request account deletion.
            </p>
          </div>
        </div>
      ),
    },
    
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-rose-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-3xl">
                <Shield size={56} className="text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
            Your privacy matters to us. Learn how we protect and manage your personal information.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-purple-200 shadow-lg">
            <Calendar className="text-purple-600" size={18} />
            <span className="text-gray-700 font-semibold">Last Updated: {lastUpdated}</span>
          </div>
        </motion.div>

        {/* Quick Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-200 shadow-xl">
            <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="text-green-600" size={28} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">We Protect Your Data</h3>
            <p className="text-gray-600 text-sm">Enterprise-grade encryption and security measures keep your information safe.</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-blue-200 shadow-xl">
            <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
              <Eye className="text-blue-600" size={28} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Full Transparency</h3>
            <p className="text-gray-600 text-sm">You always know what data we collect and how we use it.</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-200 shadow-xl">
            <div className="bg-purple-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
              <UserCheck className="text-purple-600" size={28} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">You're in Control</h3>
            <p className="text-gray-600 text-sm">Access, update, or delete your data anytime you want.</p>
          </div>
        </motion.div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full p-6 flex items-center justify-between transition-all duration-300 ${
                  expandedSection === section.id
                    ? `bg-gradient-to-r ${section.color} text-white`
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl transition-all ${
                      expandedSection === section.id
                        ? 'bg-white/20 backdrop-blur-sm'
                        : 'bg-gradient-to-r ' + section.color + ' text-white'
                    }`}
                  >
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold text-left">
                    {section.title}
                  </h2>
                </div>
                <div className="transition-transform duration-300">
                  {expandedSection === section.id ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} className={expandedSection === section.id ? 'text-white' : 'text-gray-600'} />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 border-2 border-purple-200 shadow-xl">
            <Shield className="mx-auto mb-4 text-purple-600" size={48} />
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Your Privacy is Our Priority
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We're committed to maintaining the highest standards of privacy and data protection. 
              If you have any questions or concerns, please don't hesitate to reach out to our team.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href="mailto:vikaspandit25116@gmail.com"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Contact Support
              </a>
              
            </div>
          </div>
        </motion.div>

        {/* Legal Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2026 Community Platform. All rights reserved.</p>
          <p className="mt-2">
            By using our services, you agree to this Privacy Policy and our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
