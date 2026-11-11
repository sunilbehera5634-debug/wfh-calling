import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, ShieldCheck, Clock, CheckCircle2, Award, Users, 
  BookOpen, Star, HelpCircle, Download, ExternalLink, MessageSquare, 
  ArrowRight, Sparkles, Check, ChevronRight, Menu, X, Lock, ShieldAlert, AlertCircle, RefreshCw, Upload, Eye
} from 'lucide-react';

interface Registration {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  utr: string;
  screenshot: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}

// Helper to safely trigger Meta Pixel events
const triggerPixelEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', eventName, params);
  }
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'status' | 'dashboard' | 'admin'>('landing');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    utr: ''
  });
  const [screenshotFile, setScreenshotFile] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');

  // User session state
  const [currentRegId, setCurrentRegId] = useState<string | null>(null);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(null);

  // Admin state
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);

  // Countdown timer state (2 hours remaining)
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 42, seconds: 35 });

  const openRegistrationModal = () => {
    setIsModalOpen(true);
    triggerPixelEvent('InitiateCheckout', {
      value: 199,
      currency: 'INR',
      content_name: 'WFH Hindi Calling Masterclass Seat Booking'
    });
  };

  useEffect(() => {
    // Fire Meta Pixel ViewContent event on page load
    triggerPixelEvent('ViewContent', {
      content_name: 'WFH Hindi Calling Masterclass',
      value: 199,
      currency: 'INR'
    });

    // Load registrations from localStorage
    const savedRegs = localStorage.getItem('wfh_all_registrations');
    if (savedRegs) {
      try {
        setAllRegistrations(JSON.parse(savedRegs));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default dummy registration for initial demo
      const initial: Registration[] = [
        {
          id: 'WFH-199-482910',
          name: 'Amit Kumar',
          phone: '9876543210',
          email: 'amit@example.com',
          address: 'House 42, Civil Lines, Delhi',
          utr: '423589123456',
          screenshot: '',
          status: 'PENDING',
          date: new Date().toLocaleDateString()
        }
      ];
      setAllRegistrations(initial);
      localStorage.setItem('wfh_all_registrations', JSON.stringify(initial));
    }

    // Check active session registration ID
    const activeId = localStorage.getItem('wfh_active_reg_id');
    if (activeId) {
      setCurrentRegId(activeId);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 2, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update active user registration object & track Meta Pixel Purchase event ONLY on admin payment approval
  useEffect(() => {
    if (currentRegId) {
      const found = allRegistrations.find(r => r.id === currentRegId);
      if (found) {
        setUserRegistration(found);
        if (found.status === 'APPROVED') {
          const purchaseTrackedKey = `wfh_purchase_tracked_${found.id}`;
          if (!localStorage.getItem(purchaseTrackedKey)) {
            triggerPixelEvent('Purchase', {
              value: 199,
              currency: 'INR',
              content_name: 'WFH Hindi Calling Masterclass Seat Confirmation',
              registration_id: found.id
            });
            localStorage.setItem(purchaseTrackedKey, 'true');
          }
        }
      } else {
        setUserRegistration(null);
      }
    }
  }, [allRegistrations, currentRegId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate type
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('Kripya sirf JPG ya PNG format ki payment screenshot upload karein.');
        return;
      }
      // Validate size (< 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size 5MB se kam honi chahiye.');
        return;
      }
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.address) {
      alert('Kripya sabhi mandatory fields (Name, Phone, Email, Address) bharein.');
      return;
    }

    setIsSubmitting(true);
    const qrRef = 'QR-PAY-' + Math.floor(100000 + Math.random() * 900000);
    const generatedId = 'WFH-199-' + Math.floor(100000 + Math.random() * 900000);
    const currentDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    const newReg: Registration = {
      id: generatedId,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      utr: qrRef,
      screenshot: screenshotFile || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      status: 'PENDING',
      date: currentDate
    };

    try {
      await fetch('/api/proxy-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          registrationId: generatedId,
          fullName: formData.name,
          mobileNumber: formData.phone,
          email: formData.email,
          fullAddress: formData.address,
          paymentScreenshot: newReg.screenshot,
          paymentStatus: 'PENDING',
          registrationDate: currentDate,
          approvalDate: ''
        })
      });
    } catch (err) {
      console.error('Google Sheets sync error:', err);
    }

    // Fire Meta Pixel Lead event ONLY on successful registration form submission
    triggerPixelEvent('Lead', {
      content_name: 'Webinar Registration Submission',
      value: 199,
      currency: 'INR',
      registration_id: generatedId
    });

    setIsSubmitting(false);
    const updated = [newReg, ...allRegistrations];
    setAllRegistrations(updated);
    localStorage.setItem('wfh_all_registrations', JSON.stringify(updated));
    localStorage.setItem('wfh_active_reg_id', generatedId);
    setCurrentRegId(generatedId);
    setUserRegistration(newReg);

    setIsModalOpen(false);
    setCurrentPage('status');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '9937') {
      setIsAdminAuthenticated(true);
      setIsAdminModalOpen(false);
      setCurrentPage('admin');
      setAdminPin('');
    } else {
      alert('Galat Admin PIN! Kripya sahi PIN darj karein.');
    }
  };

  const updateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const approvalDateStr = newStatus === 'APPROVED' ? (new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : '';

    const updated = allRegistrations.map(r => {
      if (r.id === id) {
        const updatedReg = { ...r, status: newStatus };
        if (newStatus === 'APPROVED') {
          const waNumber = r.phone.replace(/\D/g, '');
          const groupLink = 'https://chat.whatsapp.com/EFkfWTf63LJ2UtpmQF37fn?s=cl&p=a&mlu=4&ilr=4&iam=2';
          const message = encodeURIComponent(
            `Namaste ${r.name}! 🎉\n\nCongratulations! Aapka WFH Hindi Calling Webinar registration CONFIRM ho chuka hai.\n\nRegistration ID: ${r.id}\nStatus: APPROVED\n\nNiche diye gaye link par click karke hamare official WhatsApp Support Group mein judein:\n${groupLink}\n\nLive webinar ki jankari aapko group par mil jayegi.`
          );
          window.open(`https://api.whatsapp.com/send?phone=91${waNumber}&text=${message}`, '_blank');
        }
        return updatedReg;
      }
      return r;
    });

    setAllRegistrations(updated);
    localStorage.setItem('wfh_all_registrations', JSON.stringify(updated));

    try {
      await fetch('/api/proxy-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          registrationId: id,
          paymentStatus: newStatus,
          seatStatus: newStatus === 'APPROVED' ? 'CONFIRMED' : 'UNCONFIRMED',
          approvalDate: approvalDateStr
        })
      });
    } catch (err) {
      console.error('Google Sheets status sync error:', err);
    }
  };

  const handleDeleteAllData = () => {
    if (window.confirm('Kya aap sach mein sabhi registrations data delete karna chahte hain? Yeh action irreversible hai.')) {
      setAllRegistrations([]);
      localStorage.removeItem('wfh_all_registrations');
      localStorage.removeItem('wfh_active_reg_id');
      setUserRegistration(null);
      alert('Sabhi registrations data delete kar diya gaya hai.');
    }
  };

  const handleDeleteParticipant = (id: string, name: string) => {
    const updated = allRegistrations.filter(r => r.id !== id);
    setAllRegistrations(updated);
    localStorage.setItem('wfh_all_registrations', JSON.stringify(updated));
    if (currentRegId === id) {
      localStorage.removeItem('wfh_active_reg_id');
      setCurrentRegId(null);
      setUserRegistration(null);
    }
    alert(`${name} ka record successfully delete kar diya gaya hai.`);
  };

  const stats = {
    total: allRegistrations.length,
    pending: allRegistrations.filter(r => r.status === 'PENDING').length,
    approved: allRegistrations.filter(r => r.status === 'APPROVED').length,
    rejected: allRegistrations.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <PhoneCall className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                WFH Hindi Calling Masterclass
              </span>
              <p className="text-[10px] text-purple-400 font-medium tracking-wide">Work From Home ₹50k - ₹1L/month</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button onClick={() => { setCurrentPage('landing'); window.scrollTo({top:0, behavior:'smooth'}); }} className="hover:text-white transition-colors">
              Home
            </button>
            <a href="#benefits" className="hover:text-white transition-colors">Fayde</a>
            <a href="#curriculum" className="hover:text-white transition-colors">Syllabus</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Success Stories</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQs</a>
          </nav>

          <div className="flex items-center gap-3">
            {userRegistration && userRegistration.status === 'APPROVED' ? (
              <button 
                onClick={() => setCurrentPage('dashboard')}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
              >
                <CheckCircle2 className="w-4 h-4" /> VIP Portal Access
              </button>
            ) : (
              <button 
                onClick={openRegistrationModal}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all transform hover:scale-105 cursor-pointer"
              >
                Join Webinar @ ₹199 Only
              </button>
            )}

            <button 
              onClick={() => {
                setIsAdminAuthenticated(false);
                setIsAdminModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Admin Portal"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Admin
            </button>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
            <button 
              onClick={() => { setCurrentPage('landing'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-slate-300 hover:text-white font-medium"
            >
              Home
            </button>
            {userRegistration && (
              <button 
                onClick={() => { 
                  setCurrentPage(userRegistration.status === 'APPROVED' ? 'dashboard' : 'status'); 
                  setMobileMenuOpen(false); 
                }}
                className="block w-full text-left py-2 text-emerald-400 font-semibold"
              >
                Check Registration Status ({userRegistration.status})
              </button>
            )}
            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Fayde</a>
            <a href="#curriculum" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Syllabus</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Success Stories</a>
          </div>
        )}
      </header>

      {/* URGENCY BANNER */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border-b border-purple-800/40 py-2.5 px-4 text-center text-xs sm:text-sm text-purple-200">
        <span className="bg-purple-600/40 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-md font-bold mr-2">LIMITED SEATS</span>
        Agla Live Webinar Shuru Ho Raha Hai: <span className="font-bold text-white underline decoration-purple-500">Aaj Raat 8:00 Baje</span> | 
        Bacha Hua Samay: <span className="font-mono text-amber-400 font-bold ml-1">{timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s</span>
      </div>

      {/* RENDER PAGES */}
      {currentPage === 'landing' ? (
        <main>
          {/* HERO SECTION */}
          <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Text Column */}
                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950 border border-purple-800/60 text-purple-300 text-xs sm:text-sm font-semibold tracking-wide">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    100% Work From Home • Sirf Hindi Bolkar Kamayein
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                    Ab naukri ke liye bhatakana band karo! <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Ghar baithe Hindi calling</span> karke kamayein <span className="text-amber-400">₹50,000 se ₹1 Lakh+</span> mahina!
                  </h1>

                  <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    Kya aapke paas smartphone aur internet hai? Bina kisi purane experience ke, ghar baithe sirf Hindi calling karke rozana 2-3 ghante kaam karke acchi income generate karein.
                  </p>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm font-semibold text-purple-300">
                    <span className="bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-lg">🎓 Students</span>
                    <span className="bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-lg">🏠 Housewives</span>
                    <span className="bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-lg">💼 Job Seekers</span>
                    <span className="bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-lg">⏰ Part-Time & Full-Time Workers</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                    <button 
                      onClick={openRegistrationModal}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-purple-900/50 transition-all transform hover:-translate-y-1 flex items-center gap-3 cursor-pointer"
                    >
                      <span>Join Live Masterclass @ ₹199 Only</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <div className="text-xs text-slate-400 text-left">
                      <p className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PhonePe & UPI QR Verified
                      </p>
                      <p>✨ Manual Admin Verification & Approval</p>
                    </div>
                  </div>

                  {/* Trust badges */}
                  <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                    <div>
                      <h4 className="text-2xl font-black text-white">15,000+</h4>
                      <p className="text-xs text-slate-400">Students Trained</p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white">₹60,000</h4>
                      <p className="text-xs text-slate-400">Avg. Monthly Earning</p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white">4.9 / 5</h4>
                      <p className="text-xs text-slate-400">Webinar Rating</p>
                    </div>
                  </div>
                </div>

                {/* Right Image/Card Column */}
                <div className="lg:col-span-5 relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                    <div className="relative rounded-2xl overflow-hidden aspect-[9/16] max-w-xs mx-auto shadow-2xl bg-black border border-purple-500/30">
                      <video 
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        poster="/src/assets/images/wfh_calling_hero_1794277624484.jpg"
                      >
                        <source src="/assets/aistudio/WhatsApp_Video_2026-11-11_at_8.02.42_AM_0b86dd93.mp4" type="video/mp4" />
                        Aapka browser video tag support nahi karta hai.
                      </video>
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <div className="flex items-center gap-2 text-xs font-bold text-white bg-purple-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-purple-500/50 shadow-lg">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                          ▶ Join Live Masterclass
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Webinar Fee:</span>
                        <span className="line-through text-slate-500">₹999</span>
                      </div>
                      <div className="flex items-center justify-between text-base font-bold">
                        <span className="text-purple-300">Special Offer Today:</span>
                        <span className="text-emerald-400 text-xl font-black">₹199 Only</span>
                      </div>
                      <button 
                        onClick={openRegistrationModal}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Secure Your Seat Now <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>100% Secure Manual Payment Verification</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* WHY HINDI CALLING */}
          <section id="benefits" className="py-20 bg-slate-900/50 border-t border-slate-800/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                <h2 className="text-xs font-bold tracking-widest text-purple-400 uppercase">Aapke Liye Yeh Kyun Best Hai?</h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Work From Home Hindi Calling ke Fayde
                </h3>
                <p className="text-slate-400 text-base">
                  India ki top companies ko aaj aise logon ki zarurat hai jo shuddh aur confident Hindi mein customer se baat karke company ko support kar sakein.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-purple-600/50 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 font-bold text-xl">
                    01
                  </div>
                  <h4 className="text-xl font-bold text-white">Zero Experience Required</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Agar aapko sirf achhi Hindi bolni aati hai aur smartphone chalana aata hai, toh hum aapko zero se expert level tak ki training denge.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-purple-600/50 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold text-xl">
                    02
                  </div>
                  <h4 className="text-xl font-bold text-white">Flexible Timing (2-4 Ghante)</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Chahe aap housewife hon, college student hon ya part-time job chahte hon - aap apni marzi ke ghante kaam karke acchi salary pa sakte hain.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-purple-600/50 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-pink-950 border border-pink-800 flex items-center justify-center text-pink-400 font-bold text-xl">
                    03
                  </div>
                  <h4 className="text-xl font-bold text-white">Direct Company Placements</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Webinar ke baad hamare placement partners (EdTech, Fintech, Insurance & E-commerce companies) mein direct interview aur placement support milega.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CURRICULUM SECTION */}
          <section id="curriculum" className="py-20 bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                <h2 className="text-xs font-bold tracking-widest text-purple-400 uppercase">Live Masterclass Syllabus</h2>
                <h3 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                  <span className="inline-block bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">90 Minutes</span> Mein Aisi Kaunsi Skills Seekhenge Jo Aapke <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Work From Home Career</span> Ki Shuruaat Karwa Sakti Hain?
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {[
                  { title: "Module 1: Hindi Telecalling Ka Secret Formula", desc: "Customer ki psychology ko samjhna aur pehle 30 seconds mein call hold karna." },
                  { title: "Module 2: Ready-to-Use Calling Scripts", desc: "Hamaare proven scripts jo bade call centers aur sales teams use karti hain." },
                  { title: "Module 3: Daily ₹2,000 - ₹4,000 Kaise Kamayein", desc: "Incentive aur commission based high-paying calling projects grab karne ke tareeqe." },
                  { title: "Module 4: Live Doubt Clearing & Q&A", desc: "Aapke saare sawalon ke live jawab aur 1-on-1 career guidance." },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold shrink-0 mt-1">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section id="testimonials" className="py-20 bg-slate-900/40 border-t border-slate-800/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                <h2 className="text-xs font-bold tracking-widest text-purple-400 uppercase">Student Success Stories</h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Hamaare Students Ke Anubhav
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: "Priya Sharma", role: "Housewife, Delhi", text: "Maine sirf 2 ghante roz kaam karke pehle hi mahine ₹42,000 kamaye. Is webinar ne meri zindagi badal di!", amount: "₹45,000/mo" },
                  { name: "Rahul Verma", role: "College Student, Lucknow", text: "Mujhe English mein problem thi, lekin Hindi calling masterclass join karne ke baad ab main ghar baithe apni padhai ke sath earn kar raha hoon.", amount: "₹38,000/mo" },
                  { name: "Sunita Mishra", role: "Telecaller, Jaipur", text: "Phonepe se sirf ₹199 dekar yeh webinar join kiya tha. Aaj main ek badi edtech company mein WFH telecaller hoon.", amount: "₹65,000/mo" },
                  { name: "Vikas Yadav", role: "Job Seeker, Patna", text: "Pehle job nahi mil rahi thi. Webinar ki calling scripts aur pitch strategy apply ki to Fintech company me instant project mil gaya.", amount: "₹52,000/mo" },
                  { name: "Neha Gupta", role: "Freelancer, Indore", text: "Mujhe pehle lagta tha ki online calling work me scam hoga, lekin masterclass ke baad genuine company placements aur direct payouts mil rahe hain!", amount: "₹48,000/mo" },
                  { name: "Deepak Chauhan", role: "Ex-Sales Executive, Bhopal", text: "Office travel me bohot time aur paisa waste hota tha. Ab ghar se Hindi calling karke family ke sath rehte hue double earn kar raha hoon.", amount: "₹72,000/mo" },
                ].map((t, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, s) => <Star key={s} className="w-4 h-4 fill-amber-400" />)}
                      </div>
                      <p className="text-slate-300 text-sm italic">"{t.text}"</p>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-white text-sm">{t.name}</h5>
                        <p className="text-xs text-slate-400">{t.role}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold">
                        {t.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ SECTION */}
          <section id="faq" className="py-20 bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-xs font-bold tracking-widest text-purple-400 uppercase">Aapke Sawal</h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h3>
              </div>

              <div className="space-y-4">
                {[
                  { q: "Kya mujhe English aani zaroori hai?", a: "Nahi! Yeh masterclass 100% Hindi calling aur Hindi-speaking customers ke liye hai. English ki koi zaroorat nahi hai." },
                  { q: "Kya iske liye laptop hona zaroori hai?", a: "Bilkul nahi. Aapke paas sirf ek smartphone aur internet connection hona chahiye." },
                  { q: "₹199 ka charge kyun hai?", a: "Yeh charge sirf un serious logon ke liye hai jo sach mein work from home karke kamana chahte hain aur bheed kam rakhne ke liye hai." },
                  { q: "Payment aur Seat Confirmation ka kya process hai?", a: "QR code par ₹199 pay karne ke baad UTR number aur payment screenshot upload karein. Admin verification ke baad aapka seat confirm ho jayega aur WhatsApp group link mil jayegi." },
                ].map((faq, i) => (
                  <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-2">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      {faq.q}
                    </h4>
                    <p className="text-sm text-slate-400 pl-7">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-slate-900 border-t border-slate-800 py-12 text-center text-sm text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              <p>© 2026 WFH Hindi Calling Masterclass. All rights reserved.</p>
              <p className="text-xs">Disclaimer: Earnings depend on individual efforts, dedication, and skill application.</p>
            </div>
          </footer>
        </main>
      ) : currentPage === 'status' ? (
        /* REGISTRATION STATUS PAGE */
        <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className={`border rounded-3xl p-8 shadow-2xl space-y-6 ${
              userRegistration?.status === 'APPROVED' 
                ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-emerald-700/60' 
                : userRegistration?.status === 'REJECTED'
                ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-rose-700/60'
                : 'bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-amber-700/60'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registration Status Portal</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  userRegistration?.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                  userRegistration?.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  {userRegistration?.status || 'PENDING'}
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Namaste, {userRegistration?.name || 'Student'}!
                </h1>
                
                {userRegistration?.status === 'APPROVED' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-emerald-200 text-sm">
                      🎉 <strong>Congratulations!</strong> Your webinar registration is confirmed. Aapka seat book ho chuka hai. Niche diye gaye link se WhatsApp group mein judein.
                    </div>
                    <button 
                      onClick={() => setCurrentPage('dashboard')}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Open VIP Webinar Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : userRegistration?.status === 'REJECTED' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-200 text-sm">
                      ❌ Your payment could not be verified. Please contact the administrator or re-submit correct UTR / Screenshot.
                    </div>
                    <button 
                      onClick={() => {
                        setUserRegistration(null);
                        localStorage.removeItem('wfh_active_reg_id');
                        openRegistrationModal();
                      }}
                      className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Re-submit Payment Details</span>
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-amber-200 text-sm leading-relaxed">
                      ⏳ <strong>Your payment is under verification. Your seat is not confirmed yet.</strong><br/>
                      Admin aapke PhonePe transaction aur screenshot ko verify kar raha hai. Verification mein 15-30 minutes lag sakte hain.
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300 font-mono">
                      <p>Registration ID: <span className="text-white font-bold">{userRegistration?.id}</span></p>
                      <p>UTR / Transaction ID: <span className="text-white font-bold">{userRegistration?.utr}</span></p>
                      <p>Submitted On: <span className="text-white">{userRegistration?.date}</span></p>
                    </div>
                    <button 
                      onClick={() => {
                        // Refresh status check
                        setAllRegistrations([...allRegistrations]);
                        alert('Status refreshed successfully!');
                      }}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Check Verification Status
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 text-center">
                <button 
                  onClick={() => setCurrentPage('landing')}
                  className="text-xs text-purple-400 hover:text-purple-300 underline font-medium"
                >
                  ← Home Page Par Jayein
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : currentPage === 'dashboard' ? (
        /* VIP DASHBOARD (APPROVED ONLY) */
        <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Seat Confirmed by Admin
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                  Swagat Hai, {userRegistration?.name || 'VIP Student'}! 🎉
                </h1>
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
                  Aapka seat book ho chuka hai. Niche diye gaye link se WhatsApp group mein judein.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono text-purple-300">
                    Registration ID: <strong className="text-white">{userRegistration?.id}</strong>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
                    WhatsApp: <strong className="text-white">9692750542</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Community */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 max-w-xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">WhatsApp Support Group</h3>
              <p className="text-sm text-slate-400">
                Daily updates, calling scripts aur mentor support ke liye hamare official WhatsApp group mein judein.
              </p>
              <a 
                href="https://chat.whatsapp.com/EFkfWTf63LJ2UtpmQF37fn?s=cl&p=a&mlu=4&ilr=4&iam=2" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-center shadow-lg transition-all items-center justify-center gap-2"
              >
                <span>Join WhatsApp Group Now</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="text-center pt-4">
              <button 
                onClick={() => setCurrentPage('landing')}
                className="text-sm text-purple-400 hover:text-purple-300 underline font-medium"
              >
                ← Wapas Home Page Par Jayein
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* ADMIN DASHBOARD */
        <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                  <Lock className="w-6 h-6 text-purple-400" /> Admin Payment Verification Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">Review participant payments, verify UTR & screenshots, and approve/reject seats.</p>
              </div>
              <button 
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  setCurrentPage('landing');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Logout Admin
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-1">
                <span className="text-xs font-medium text-slate-400">Total Registrations</span>
                <h3 className="text-3xl font-black text-white">{stats.total}</h3>
              </div>
              <div className="bg-amber-950/20 border border-amber-800/50 p-6 rounded-2xl space-y-1">
                <span className="text-xs font-medium text-amber-400">Pending Verification</span>
                <h3 className="text-3xl font-black text-amber-300">{stats.pending}</h3>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-800/50 p-6 rounded-2xl space-y-1">
                <span className="text-xs font-medium text-emerald-400">Approved Seats</span>
                <h3 className="text-3xl font-black text-emerald-300">{stats.approved}</h3>
              </div>
              <div className="bg-rose-950/20 border border-rose-800/50 p-6 rounded-2xl space-y-1">
                <span className="text-xs font-medium text-rose-400">Rejected Payments</span>
                <h3 className="text-3xl font-black text-rose-300">{stats.rejected}</h3>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Participant Payments & Verifications</h3>
                  <span className="text-xs text-slate-400">Showing all records ({allRegistrations.length})</span>
                </div>
                <button 
                  onClick={handleDeleteAllData}
                  className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  <span>🗑️ Delete All Data</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="p-4 font-semibold">Participant Details</th>
                      <th className="p-4 font-semibold">Registration ID / Date</th>
                      <th className="p-4 font-semibold">UTR / Transaction ID</th>
                      <th className="p-4 font-semibold">Screenshot</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {allRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">No registrations found yet.</td>
                      </tr>
                    ) : (
                      allRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 space-y-0.5">
                            <div className="font-bold text-white">{reg.name}</div>
                            <div className="text-xs text-slate-400">{reg.phone} • {reg.email}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{reg.address}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-mono text-purple-300 text-xs font-bold">{reg.id}</div>
                            <div className="text-xs text-slate-500">{reg.date}</div>
                          </td>
                          <td className="p-4 font-mono text-xs font-semibold text-amber-400">
                            {reg.utr}
                          </td>
                          <td className="p-4">
                            {reg.screenshot ? (
                              <button 
                                type="button"
                                onClick={() => setViewingScreenshot(reg.screenshot)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs rounded-lg border border-slate-700 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Receipt
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 italic">No screenshot</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              reg.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                              reg.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}>
                              {reg.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button 
                              onClick={() => updateStatus(reg.id, 'APPROVED')}
                              disabled={reg.status === 'APPROVED'}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                reg.status === 'APPROVED' 
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                              }`}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => updateStatus(reg.id, 'REJECTED')}
                              disabled={reg.status === 'REJECTED'}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                reg.status === 'REJECTED' 
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                              }`}
                            >
                              Reject
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteParticipant(reg.id, reg.name)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-rose-400 border border-slate-700 hover:border-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION & PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
          <div className="relative bg-slate-900 border border-purple-800/60 rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  ₹199
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Webinar Registration & Payment</h3>
                  <p className="text-xs text-purple-400">Scan QR Code & Submit Verification Details</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Jaise: Amit Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  placeholder="amit@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Address *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Jaise: House No, Colony, City, State, Pincode"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* PhonePe QR Code & Payment Instruction Box */}
              <div className="bg-slate-950 border border-purple-900/40 rounded-2xl p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-purple-300">
                  <PhoneCall className="w-4 h-4" /> Scan QR Code & Pay ₹199 (Fee)
                </div>
                
                <div className="w-40 h-40 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-lg border border-purple-500/30">
                  <img 
                    src="/assets/aistudio/WhatsApp_Image_2026-11-10_at_9.32.59_PM__2__7382ed93.jpeg" 
                    alt="PhonePe QR Code" 
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">PhonePe / GooglePay / Paytm se ₹199 pay karne ke baad niche payment screenshot upload karein.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Payment Screenshot (JPG/PNG, max 5MB) *</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer text-xs font-medium text-slate-300 transition-all">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>{screenshotName ? screenshotName : 'Choose Screenshot Image...'}</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Syncing with Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Payment for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative bg-slate-900 border border-purple-800/60 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" /> Admin Login
              </h3>
              <button onClick={() => setIsAdminModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Admin PIN</label>
                <input 
                  type="password" 
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest focus:outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Access Admin Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SCREENSHOT PREVIEW MODAL */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Payment Screenshot Receipt</h3>
              <button 
                onClick={() => setViewingScreenshot(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img 
                src={viewingScreenshot} 
                alt="Payment Receipt" 
                className="max-w-full h-auto object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="text-center pt-2">
              <button 
                onClick={() => setViewingScreenshot(null)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
