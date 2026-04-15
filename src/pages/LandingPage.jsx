import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Play, ArrowRight, Shield, Zap, Heart, Star, Quote, ChevronDown, Brain, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToMore = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  const reviews = [
    {
      name: "Divyam Malliwal",
      role: "Financial Analyst",
      text: "Cashlens transformed how I track my daily expenses. The AI invoice parsing is a game changer!",
      stars: 5,
      avatar: "https://i.pravatar.cc/150?u=alex"
    },
    {
      name: "Vartika Jadon",
      role: "Freelance Designer",
      text: "The cleanest UI I've ever seen in a finance app. Simple, powerful, and beautiful. Even better than my own App.",
      stars: 5,
      avatar: "https://i.pravatar.cc/150?u=sarah"
    },
    {
      name: "Trisha Devadhe",
      role: "Small Business Owner",
      text: "Finally an app that understands multi-currency tracking perfectly. Highly recommended!",
      stars: 5,
      avatar: "https://i.pravatar.cc/150?u=michael"
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-blue-700" />,
      title: "AI-Powered Scanning",
      description: "Just upload your invoice and let our AI extract the data automatically."
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-700" />,
      title: "Cloud Sync & Security",
      description: "Your data is encrypted and synced across all your devices in real-time."
    },
    {
      icon: <Heart className="w-6 h-6 text-rose-700" />,
      title: "Clean Experience",
      description: "No ads, no clutter. Just you and your financial goals in a premium interface."
    },
    {
      icon: <Brain className="w-6 h-6 text-indigo-700" />,
      title: "Budget Intelligence",
      description: "Smart monthly tracking that alerts you before you exceed your limits."
    },
    {
      icon: <Globe className="w-6 h-6 text-cyan-700" />,
      title: "Multi-Currency Ready",
      description: "Track expenses globally with automatic exchange rate conversions."
    },
    {
      icon: <Star className="w-6 h-6 text-amber-700" />,
      title: "Offline Reliability",
      description: "Add expenses even without internet; they'll sync once you're back online."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <ThemeToggle className="fixed top-6 right-6 z-50 shadow-2xl" />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
              Cashlens
            </h1>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl sm:text-2xl font-medium text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto"
          >
            The premium way to track, analyze, and master your financial life with AI precision.
          </motion.h2>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              Start Tracking Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={scrollToMore}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Learn More
              <ChevronDown className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Video Placeholder Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-slate-300 dark:shadow-none border-8 border-white dark:border-slate-900 group">
              <img 
                src="/cashlens_app_mockup.webp" 
                alt="App Demonstration" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center group-hover:bg-slate-900/30 transition-colors">
                <div className="w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 active:scale-90 transition-all border border-white/20">
                  <Play className="w-8 h-8 text-blue-600 fill-blue-600 ml-1" />
                </div>
              </div>
              
              {/* Overlay labels to feel like a video UI */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white/80 pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Live App Working Demonstration</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg">4K UHD</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Why choose Cashlens?</h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="p-3 bg-white dark:bg-slate-700 rounded-2xl w-fit mb-6 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Reviews Section */}
      <section className="py-24 px-4 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">What our users say</h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {reviews.map((r, i) => (
              <motion.div 
                key={i}
                whileInView={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative"
              >
                <Quote className="absolute top-6 right-8 w-10 h-10 text-slate-100 dark:text-slate-800 -z-0" />
                <div className="relative z-10">
                  <div className="flex gap-1 mb-4">
                    {[...Array(r.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 italic mb-6 text-sm leading-relaxed">
                    "{r.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-800" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{r.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{r.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">Ready to take control?</h2>
            <p className="text-blue-100 mb-10 text-lg sm:text-xl font-medium">Join thousands of users who are already mastering their finances.</p>
            <button 
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 hover:bg-slate-50 px-10 py-5 rounded-2xl font-black text-lg transition-all transform active:scale-95 shadow-xl"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Wallet className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-black text-slate-900 dark:text-white">Cashlens</span>
          </div>
          <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            Cashlens trademarked by Vikrant
          </p>
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">© 2026 All Rights Reserved.</p>
            <div className="flex gap-6 text-xs text-slate-400 font-medium">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
