
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, LanguageType, ThemeType } from './types';
import { Card, Modal } from './components';
import { t } from './translations';
import { supabase } from './supabaseClient';

interface SettingsViewProps {
  userProfile: UserProfile;
  setUserProfile: (p: UserProfile) => void;
  language: LanguageType;
  setLanguage: (l: LanguageType) => void;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  onLogout: () => void;
  onResetData?: () => void;
  allData?: any;
  currentUserId?: string;
}

const SettingsSwitch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${active ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
  >
    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${active ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile, setUserProfile, language, setLanguage, theme, setTheme, onLogout, onResetData, allData, currentUserId
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState(userProfile);
  const [privacySettings, setPrivacySettings] = useState({ personalizedAI: true, shareAnalytics: false, cloudSync: true });
  
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSaveProfile = () => {
    setUserProfile(editForm);
    setIsEditModalOpen(false);
    setMessage({ text: language === 'bn' ? 'প্রোফাইল আপডেট হয়েছে!' : 'Profile updated!', type: 'success' });
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.new || !passwordForm.confirm) {
      setMessage({ text: t('fillAllFields', language), type: 'error' });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ text: language === 'bn' ? 'পাসওয়ার্ড মিলছে না!' : 'Passwords do not match!', type: 'error' });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      
      setMessage({ text: language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' : 'Password updated successfully!', type: 'success' });
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setIsSecurityModalOpen(false), 2000);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUserId) return;
    
    setIsDeleting(true);
    try {
      // ১. RPC কল করে ডাটাবেস লেভেল থেকে ডিলিট করা
      const { error: deleteError } = await supabase.rpc('delete_user_account');

      if (deleteError) {
        // যদি RPC এরর দেয় (যেমন ফাংশন তৈরি করা না থাকলে), বিকল্প হিসেবে ডাটা ডিলিট করার চেষ্টা
        console.error("Account delete error:", deleteError.message);
        throw new Error(language === 'bn' ? 'অ্যাকাউন্ট মুছতে সমস্যা হয়েছে। অনুগ্রহ করে SQL Editor-এর কোডটি রান করুন।' : 'Error deleting account. Please run the SQL Editor code.');
      }
      
      // ২. সফল হলে সেশন থেকে লগআউট এবং রিলোড
      await supabase.auth.signOut();
      alert(language === 'bn' ? 'আপনার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।' : 'Your account has been deleted successfully.');
      window.location.href = '/'; // হোম পেজে পাঠিয়ে দেওয়া
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteAccountConfirmOpen(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'finance_hub_backup.json');
    linkElement.click();
    setMessage({ text: 'Data exported successfully!', type: 'success' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-24">
      {message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {message.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          {message.text}
        </div>
      )}

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <img src={userProfile.avatar} alt="Profile" className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl object-cover" />
            <button onClick={() => setIsEditModalOpen(true)} className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{userProfile.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">{userProfile.email}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t('preferences', language)}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><p className="font-bold text-slate-800 dark:text-white text-sm">{t('language', language)}</p></div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'en' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>EN</button>
                <button onClick={() => setLanguage('bn')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'bn' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>BN</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="font-bold text-slate-800 dark:text-white text-sm">{t('appearance', language)}</p></div>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="w-14 h-8 bg-slate-100 dark:bg-slate-800 rounded-full relative p-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${theme === 'dark' ? 'translate-x-6 bg-blue-600 text-white' : 'translate-x-0 bg-white text-amber-500'}`}>
                  {theme === 'dark' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>}
                </div>
              </button>
            </div>
          </div>
        </Card>

        <Card title={t('account', language)}>
          <div className="space-y-4">
            <button onClick={() => setIsSecurityModalOpen(true)} className="w-full text-left p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group border border-transparent transition-all">
              <div className="flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Security Settings</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <button onClick={() => setIsPrivacyModalOpen(true)} className="w-full text-left p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group transition-all">
              <div className="flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Data & Privacy</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <button onClick={onLogout} className="w-full py-3.5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-black rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span className="text-[10px] uppercase tracking-widest">{t('logout', language)}</span>
            </button>
          </div>
        </Card>
      </div>

      <Card title="Danger Zone" className="border-rose-200 dark:border-rose-900/30">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
            {language === 'bn' ? 'সতর্কতা: এই অ্যাকশনগুলো স্থায়ী এবং পরিবর্তনযোগ্য নয়।' : 'Warning: These actions are permanent and cannot be reversed.'}
          </p>
          <button 
            onClick={() => setIsDeleteAccountConfirmOpen(true)}
            className="w-full p-4 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-900/50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M12 11v6"/><path d="M16 11v6"/><path d="M8 11v6"/></svg>
            {language === 'bn' ? 'অ্যাকাউন্ট ও সব ডাটা মুছে ফেলুন' : 'Delete Account & WIPE ALL DATA'}
          </button>
        </div>
      </Card>

      {/* Profile Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('editProfile', language)}>
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img src={editForm.avatar} className="w-28 h-28 rounded-[2rem] object-cover border-4 border-blue-50 dark:border-slate-800 shadow-xl" />
              <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-xl cursor-pointer shadow-lg hover:scale-110 active:scale-90 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Display Name</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold text-sm dark:text-white" placeholder="Full Name" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Email (Read Only)</label>
              <input type="email" value={editForm.email} readOnly className="w-full p-4 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold text-sm text-slate-500 cursor-not-allowed" placeholder="Email" />
            </div>
          </div>
          <button onClick={handleSaveProfile} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs active:scale-95 transition-all">{t('saveChanges', language)}</button>
        </div>
      </Modal>

      {/* Security Modal */}
      <Modal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} title="Security Settings">
        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 border-l-4 border-blue-600 pl-3">
              <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{t('changePassword', language)}</h4>
            </div>
            <div className="space-y-3">
              <input 
                type="password" 
                placeholder={t('newPassword', language)} 
                value={passwordForm.new} 
                onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} 
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none text-sm dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all" 
              />
              <input 
                type="password" 
                placeholder={language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'} 
                value={passwordForm.confirm} 
                onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} 
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none text-sm dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all" 
              />
            </div>
            <button 
              onClick={handleUpdatePassword} 
              disabled={isUpdating}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {isUpdating ? 'UPDATING...' : t('update', language)}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirm Modal */}
      <Modal isOpen={isDeleteAccountConfirmOpen} onClose={() => setIsDeleteAccountConfirmOpen(false)} title="Confirm Account Deletion">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M12 11v6"/><path d="M16 11v6"/><path d="M8 11v6"/></svg>
          </div>
          <p className="font-black text-xl text-slate-800 dark:text-white">
            {language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you absolutely sure?'}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm px-4">
            {language === 'bn' 
              ? 'এটি আপনার সব লেনদেন, বিল এবং সেটিংস স্থায়ীভাবে মুছে ফেলবে। এটি আর ফিরে পাওয়া সম্ভব নয়।' 
              : 'This will permanently delete ALL your transactions, bills, and settings. This action is irreversible.'}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button disabled={isDeleting} onClick={() => setIsDeleteAccountConfirmOpen(false)} className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
            <button disabled={isDeleting} onClick={handleDeleteAccount} className="py-3.5 bg-rose-600 text-white font-black rounded-2xl shadow-xl hover:bg-rose-700 uppercase text-[10px] tracking-widest">
              {isDeleting ? 'DELETING...' : (language === 'bn' ? 'মুছে ফেলুন' : 'DELETE EVERYTHING')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
