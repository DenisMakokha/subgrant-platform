import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';

const HelpCenter: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok?: boolean; error?: string } | null>(null);
  const location = useLocation();
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const qpName = sp.get('name');
    const qpEmail = sp.get('email');
    const qpMessage = sp.get('message');
    if (qpName) setName(qpName);
    if (qpEmail) setEmail(qpEmail);
    if (qpMessage) setMessage(qpMessage);
    if (location.hash === '#contact') {
      setTimeout(() => messageRef.current?.focus(), 0);
    }
  }, [location.search]);

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setStatus(null);
    try {
      await api.fetchWithAuth('/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, source: 'partner_help_center' }),
      } as any);
      setStatus({ ok: true });
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      try {
        const to = 'info@ziziafrique.org';
        const subject = encodeURIComponent('Partner Help Feedback');
        const body = encodeURIComponent(`From: ${name || 'Anonymous'} <${email || 'no-email'}>\n\n${message}`);
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
        setStatus({ ok: true });
      } catch (e2) {
        setStatus({ error: 'Could not send feedback. Please email info@ziziafrique.org' });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl border border-white/10">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Help Center</h1>
                <p className="text-blue-100 text-base">Get expert support and find answers</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-white">24/7</div>
                <div className="text-blue-200">Support</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">&lt; 2h</div>
                <div className="text-blue-200">Response</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <a href="mailto:info@ziziafrique.org" className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 hover:-translate-y-1 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[1.25rem] font-semibold text-gray-900 dark:text-white">Email<br />Support</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Get help via email</p>
            </div>
          </div>
          <div className="text-sm font-medium text-blue-600">info@ziziafrique.org</div>
        </a>

        <a href="tel:+254734620181" className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-green-200 hover:-translate-y-1 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[1.25rem] font-semibold text-gray-900 dark:text-white">Phone<br />Support</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Call us directly</p>
            </div>
          </div>
          <div className="text-sm font-medium text-green-600">+254 734 620 181</div>
        </a>

        <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-orange-200 hover:-translate-y-1 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-md group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[1.25rem] font-semibold text-gray-900 dark:text-white">Business<br />Hours</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">When we're available</p>
            </div>
          </div>
          <div className="text-sm font-medium text-orange-600">Mon–Fri, 9:00–17:00 (EAT)</div>
        </div>

        <Link to="/partner/forum" className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-purple-200 hover:-translate-y-1 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[1.25rem] font-semibold text-gray-900 dark:text-white">Community<br />Forum</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Connect with others</p>
            </div>
          </div>
          <div className="text-sm font-medium text-purple-600">Ask questions & share tips</div>
        </Link>
      </div>

      {/* Getting Started */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Getting Started</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <h3 className="text-[1.1rem] font-semibold text-gray-900 dark:text-white">Complete Onboarding</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Organization Profile → Financial Assessment → Document Upload</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <h3 className="text-[1.1rem] font-semibold text-gray-900 dark:text-white">Manage Projects</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select a project and manage Budget, Reports, Contracts, and Documents</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <h3 className="text-[1.1rem] font-semibold text-gray-900 dark:text-white">Stay Connected</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Use the Forum for announcements and Q&A with the grants team</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <h3 className="text-[1.1rem] font-semibold text-gray-900 dark:text-white mb-2">How do I select my current project?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Go to Projects and click "Open". The app will remember your selection until you change it.</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <h3 className="text-[1.1rem] font-semibold text-gray-900 dark:text-white mb-2">Why can't I access Budget or Reports?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">These require a selected project and an approved onboarding. Choose a project first and ensure your onboarding status is finalized.</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <h3 className="text-[1.1rem] font-semibold text-gray-900 dark:text-white mb-2">Who can I contact for urgent issues?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email <a className="text-blue-600 hover:text-blue-700 font-medium" href="mailto:info@ziziafrique.org">info@ziziafrique.org</a> or call <a className="text-blue-600 hover:text-blue-700 font-medium" href="tel:+254734620181">+254 734 620 181</a> / <a className="text-blue-600 hover:text-blue-700 font-medium" href="tel:0740571038">0740571038</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Contact Form */}
      <div id="contact" className="relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-indigo-900/20 rounded-2xl shadow-xl p-8 border-2 border-blue-100 dark:border-blue-800/50 ring-1 ring-blue-200/50 dark:ring-blue-700/30">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Support</h2>
              <p className="text-base text-gray-600 dark:text-gray-400">Send us a message and we'll get back to you quickly</p>
            </div>
          </div>
          
          <form onSubmit={submitFeedback} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name (optional)</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Your name" 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email (optional)</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="your.email@example.com" 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message *</label>
              <textarea 
                ref={messageRef} 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                rows={5} 
                placeholder="How can we help you? Please be as detailed as possible..." 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none shadow-sm hover:shadow-md" 
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Or email us directly at <a className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200" href="mailto:info@ziziafrique.org">info@ziziafrique.org</a>
              </div>
              <button 
                type="submit" 
                disabled={sending || !message.trim()} 
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
          
          {status?.ok && (
            <div className="mt-6 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Thanks! Your message has been sent successfully.
              </div>
            </div>
          )}
          {status?.error && (
            <div className="mt-6 text-sm text-rose-700 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {status.error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
