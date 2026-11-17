import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext.jsx';
import { Settings as SettingsIcon, Save, Building, Phone, Mail, Globe, Calendar, DollarSign, ShieldCheck } from 'lucide-react';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';

export const Settings = () => {
  const { settings, updateSchoolSettings } = useSchool();

  const [formData, setFormData] = useState({
    schoolName: settings.schoolName || 'SchoolSphere Academy',
    schoolMotto: settings.schoolMotto || 'Excellence in Global Education',
    address: settings.address || '100 Academic Blvd, International Education District',
    phone: settings.phone || '+1 (555) 019-2834',
    email: settings.email || 'admissions@schoolsphere.com',
    website: settings.website || 'https://schoolsphere.edu',
    academicYear: settings.academicYear || '2026-2027',
    currency: settings.currency || '$'
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateSchoolSettings(formData);
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-slate-900" />
          <span>Institutional Branding & Campus Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure official academy credentials, academic calendar sessions, receipts, and global styling identity.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                School Name *
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                pattern={SECURITY_PATTERNS.name.pattern}
                title={SECURITY_PATTERNS.name.title}
                maxLength={100}
                onChange={(e) => setFormData({ ...formData, schoolName: sanitizeInputText(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Institutional Motto
              </label>
              <input
                type="text"
                value={formData.schoolMotto}
                pattern="^[^<>]{0,150}$"
                title="Motto must not contain HTML tags (< >)."
                maxLength={150}
                onChange={(e) => setFormData({ ...formData, schoolMotto: sanitizeInputText(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Campus Physical Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                pattern="^[^<>]{2,200}$"
                title="Address must not contain HTML tags (< >)."
                maxLength={200}
                onChange={(e) => setFormData({ ...formData, address: sanitizeInputText(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Office Telephone Contact *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                pattern={SECURITY_PATTERNS.phone.pattern}
                title={SECURITY_PATTERNS.phone.title}
                maxLength={25}
                onChange={(e) => setFormData({ ...formData, phone: sanitizeInputText(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Official Communications Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                pattern={SECURITY_PATTERNS.email.pattern}
                title={SECURITY_PATTERNS.email.title}
                maxLength={100}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                Portal Web Domain
              </label>
              <input
                type="url"
                value={formData.website}
                pattern="https?://[a-zA-Z0-9.\\-]+(:[0-9]+)?(/.*)?"
                title="Must be a valid web URL starting with http:// or https://"
                maxLength={200}
                onChange={(e) => setFormData({ ...formData, website: e.target.value.trim() })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Current Academic Calendar Session
              </label>
              <input
                type="text"
                value={formData.academicYear}
                pattern="^[a-zA-Z0-9\s\-\./]{2,30}$"
                title="Must be a valid academic session (e.g., 2026-2027)."
                maxLength={30}
                onChange={(e) => setFormData({ ...formData, academicYear: sanitizeInputText(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Fee Currency Display Unit
              </label>
              <input
                type="text"
                value={formData.currency}
                pattern="^[a-zA-Z0-9$€£₹¥]{1,5}$"
                title="Currency symbol or 3-letter code (e.g., $, USD, ₹, EUR)."
                maxLength={5}
                onChange={(e) => setFormData({ ...formData, currency: sanitizeInputText(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition duration-150"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Persisting Changes...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
