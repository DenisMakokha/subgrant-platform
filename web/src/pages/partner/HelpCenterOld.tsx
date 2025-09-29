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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Graceful fallback to mailto
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Enhanced Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Help Center</h1>
                <p className="text-blue-100 text-lg">Get expert support and find answers to your questions</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-blue-200">Support</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">&lt; 2h</div>
                <div className="text-blue-200">Response</div>
              </div>
            </div>
          </div>
        </div>
        {/* Enhanced Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-full -translate-y-20 translate-x-20 blur-sm"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/8 to-white/3 rounded-full translate-y-16 -translate-x-16 blur-sm"></div>
        <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Enhanced Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <a href="mailto:info@ziziafrique.org" className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Email Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get help via email</p>
              </div>
            </div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
              info@ziziafrique.org
            </div>
          </div>
        </a>

        <a href="tel:+254734620181" className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">Phone Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Call us directly</p>
              </div>
            </div>
            <div className="text-sm font-medium text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-300">
              +254 734 620 181
            </div>
          </div>
        </a>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">Business Hours</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">When we're available</p>
              </div>
            </div>
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors duration-300">
              Mon–Fri, 9:00–17:00 (EAT)
            </div>
          </div>
        </div>

        <Link to="/partner/forum" className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">Community Forum</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connect with others</p>
              </div>
            </div>
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">
              Ask questions & share tips
            </div>
          </div>
        </Link>
      </div>

      {/* Enhanced Guidelines Section */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 rounded-3xl shadow-xl p-8 border border-gray-100/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Getting Started</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Follow these steps to get up and running</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-white/80 dark:bg-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Complete Onboarding</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Organization Profile → Financial Assessment → Document Upload</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white/80 dark:bg-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manage Your Projects</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select a project and manage Budget, Reports, Contracts, and Documents</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white/80 dark:bg-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Stay Connected</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Use the Forum for announcements and Q&A with the grants team</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Frequently Asked Questions</div>
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <div className="font-medium">How do I select my current project?</div>
            <div>Go to Projects and click “Open”. The app will remember your selection until you change it.</div>
          </div>
          <div>
            <div className="font-medium">Why can’t I access Budget or Reports?</div>
            <div>These require a selected project and an approved onboarding. Choose a project first and ensure your onboarding status is finalized.</div>
          </div>
          <div>
            <div className="font-medium">Who can I contact for urgent issues?</div>
            <div>Email <a className="text-blue-600" href="mailto:info@ziziafrique.org">info@ziziafrique.org</a> or call <a className="text-blue-600" href="tel:+254734620181">+254 734 620 181</a> / <a className="text-blue-600" href="tel:0740571038">0740571038</a>.</div>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <div id="contact" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Contact Support</div>
        <form onSubmit={submitFeedback} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)" className="rounded-lg border-slate-300 dark:border-slate-600" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email (optional)" className="rounded-lg border-slate-300 dark:border-slate-600" />
          <div className="md:col-span-2">
            <textarea ref={messageRef} value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="How can we help?" className="w-full rounded-lg border-slate-300 dark:border-slate-600" />
          </div>
          <div className="md:col-span-2 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Or email us at <a className="text-blue-600" href="mailto:info@ziziafrique.org">info@ziziafrique.org</a>
            </div>
            <button type="submit" disabled={sending || !message.trim()} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm disabled:opacity-50">
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </div>
        </form>
        {status?.ok && (
          <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Thanks! Your message has been sent.</div>
        )}
        {status?.error && (
          <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{status.error}</div>
        )}
      </div>
    </div>
  );
};

export default HelpCenter;
