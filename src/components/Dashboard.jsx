import React, { useState, useMemo } from 'react';
import { Globe, TrendingUp, Sun, Moon, Sparkles, Brain, Loader2, Download, Calendar, CheckCircle, AlertCircle, LogOut, X, FileText, Upload, Utensils, Car, Home, Stethoscope, Film, ShoppingBag, GraduationCap, MoreHorizontal, DollarSign, Euro, PoundSterling, IndianRupee, JapaneseYen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { fileToImage, parseInvoiceWithAI } from '../utils/invoiceProcessor';
import ExpenseList from './ExpenseList';
import confetti from 'canvas-confetti';

// Define categories and currencies with icons outside the component to prevent re-creation
const CATEGORIES = [
  { name: 'Food & Drink', icon: <Utensils className="w-4 h-4" /> },
  { name: 'Transport', icon: <Car className="w-4 h-4" /> },
  { name: 'Housing', icon: <Home className="w-4 h-4" /> },
  { name: 'Health', icon: <Stethoscope className="w-4 h-4" /> },
  { name: 'Entertainment', icon: <Film className="w-4 h-4" /> },
  { name: 'Shopping', icon: <ShoppingBag className="w-4 h-4" /> },
  { name: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
  { name: 'Other', icon: <MoreHorizontal className="w-4 h-4" /> }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', icon: <DollarSign className="w-4 h-4" /> },
  { code: 'EUR', symbol: '€', icon: <Euro className="w-4 h-4" /> },
  { code: 'GBP', symbol: '£', icon: <PoundSterling className="w-4 h-4" /> },
  { code: 'INR', symbol: '₹', icon: <IndianRupee className="w-4 h-4" /> },
  { code: 'JPY', symbol: '¥', icon: <JapaneseYen className="w-4 h-4" /> },
  { code: 'CAD', symbol: 'C$', icon: <DollarSign className="w-4 h-4" /> },
  { code: 'AUD', symbol: 'A$', icon: <DollarSign className="w-4 h-4" /> }
];

const Dashboard = ({ user }) => {
  // Celebration Effect for Google login redirects
  React.useEffect(() => {
    const show = sessionStorage.getItem('showConfetti');
    if (show === 'true') {
      const scalar = 2.5;
      const money = confetti.shapeFromText({ text: '💵', scalar });
      const moneyWings = confetti.shapeFromText({ text: '💸', scalar });
      const bag = confetti.shapeFromText({ text: '💰', scalar });

      const defaults = {
        spread: 360,
        ticks: 150,
        gravity: 0.8,
        decay: 0.96,
        startVelocity: 35,
        shapes: [money, moneyWings, bag],
        scalar
      };

      confetti({ ...defaults, particleCount: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ ...defaults, particleCount: 40, origin: { x: 0.2, y: 0.5 } }), 200);
      setTimeout(() => confetti({ ...defaults, particleCount: 40, origin: { x: 0.8, y: 0.5 } }), 400);
      
      sessionStorage.removeItem('showConfetti');
    }
  }, []);
  const [expenses, setExpenses] = useState([]);
  const [initLoaded, setInitLoaded] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  const [income, setIncome] = useState(() => {
    return parseFloat(localStorage.getItem(`cashlens_income_${user.id}`)) || 0;
  });

  const [budget, setBudget] = useState(() => {
    return parseFloat(localStorage.getItem(`cashlens_budget_${user.id}`)) || 0;
  });

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food & Drink',
    date: new Date().toISOString().split('T')[0],
    note: '',
    currency: 'INR' // Initialize with a safe default
  });

  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCurrency, setFilterCurrency] = useState('All');
  const [baseCurrency] = useState(() => {
    return localStorage.getItem(`cashlens_base_currency_${user.id}`) || 'INR';
  });

  const [exchangeRates, setExchangeRates] = useState({});
  const [, setRatesLoading] = useState(true);
  const { isDarkMode } = useTheme();
  const [aiInsights, setAiInsights] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTimeframe, setAiTimeframe] = useState('Month');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [zoomLevel, setZoomLevel] = useState(() => {
    return parseFloat(localStorage.getItem(`cashlens_zoom_${user.id}`)) || 1;
  });

  const handleZoom = (level) => {
    setZoomLevel(level);
    localStorage.setItem(`cashlens_zoom_${user.id}`, level);
  };

  // User Profile State (Offline-first)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`cashlens_profile_${user.id}`);
    if (saved) return JSON.parse(saved);
    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
      email: user.email,
      phone: user.user_metadata?.phone || '',
      avatar_url: user.user_metadata?.avatar_url || null,
      sync_status: 'pending'
    };
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const currentSymbol = CURRENCIES.find(c => c?.code === baseCurrency)?.symbol || '$';

  const mostUsedCurrency = useMemo(() => {
    if (expenses.length === 0) return baseCurrency;
    const counts = expenses.reduce((acc, exp) => {
      acc[exp.currency] = (acc[exp.currency] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, baseCurrency);
  }, [expenses, baseCurrency]);

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, currency: mostUsedCurrency }));
  }, [mostUsedCurrency]);


  const handleIncomeChange = async (val) => {
    const value = parseFloat(val) || 0;
    setIncome(value);
    localStorage.setItem(`cashlens_income_${user.id}`, value);
    
    // Sync to Supabase profile
    if (supabase && isOnline) {
      await supabase.from('profiles').upsert({
        id: user.id,
        monthly_income: value,
        updated_at: new Date().toISOString()
      });
    }
  };

  const handleBudgetChange = async (val) => {
    const value = parseFloat(val) || 0;
    setBudget(value);
    localStorage.setItem(`cashlens_budget_${user.id}`, value);

    // Sync to Supabase profile
    if (supabase && isOnline) {
      await supabase.from('profiles').upsert({
        id: user.id,
        monthly_budget: value,
        updated_at: new Date().toISOString()
      });
    }
  };

  // Fetch exchange rates whenever base currency changes
  React.useEffect(() => {
    const fetchRates = async () => {
      setRatesLoading(true);
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        setExchangeRates(data.rates);
        setRatesLoading(false);
      } catch (error) {
        console.error('Error fetching rates:', error);
        // Fallback or retry
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, [baseCurrency]);

  const convertToBase = (amount, fromCurrency) => {
    const from = fromCurrency || baseCurrency;
    if (from === baseCurrency) return amount;
    const rate = exchangeRates[from];
    if (!rate || isNaN(rate) || rate === 0) return amount;
    return amount / rate;
  };


  // Online/Offline status listeners and Sync Logic
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // REAL-TIME SYNC: Listen for changes from other devices
    let subscription = null;
    if (supabase && isOnline) {
      subscription = supabase
        .channel(`public:expenses:user:${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'expenses', 
          filter: `user_id=eq.${user.id}` 
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newExp = {
              id: payload.new.id,
              amount: payload.new.amount,
              amountInBaseCurrency: payload.new.amount_in_base,
              currency: payload.new.currency || 'INR',
              category: payload.new.category,
              date: payload.new.date,
              note: payload.new.note,
              createdAt: payload.new.created_at,
              sync_status: 'synced'
            };
            setExpenses(prev => {
              if (prev.find(e => e.id === newExp.id)) return prev;
              const updated = [newExp, ...prev];
              return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
            });
          } else if (payload.eventType === 'UPDATE') {
            setExpenses(prev => prev.map(e => e.id === payload.new.id ? {
               ...e,
               amount: payload.new.amount,
               amountInBaseCurrency: payload.new.amount_in_base,
               currency: payload.new.currency || 'INR',
               category: payload.new.category,
               date: payload.new.date,
               note: payload.new.note,
               sync_status: 'synced'
            } : e));
          } else if (payload.eventType === 'DELETE') {
            setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
          }
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [user.id, isOnline]);

  // Initialization Logic: Load data from appropriate source
  React.useEffect(() => {
    const initializeData = async () => {
      if (initLoaded) return;

      // Load local pending items first to ensure they aren't lost
      const saved = localStorage.getItem(`cashlens_expenses_${user.id}`);
      const localPending = saved ? JSON.parse(saved).filter(e => e.sync_status === 'pending') : [];

      if (isOnline && supabase) {
        try {
          // Online: Fetch Expenses & Sync Profile
          const [expensesRes, profileRes] = await Promise.all([
            supabase
              .from('expenses')
              .select('*')
              .eq('user_id', user.id)
              .order('date', { ascending: false }),
            supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
          ]);

          if (profileRes.data) {
            const fetchedProfile = {
              id: profileRes.data.id,
              name: profileRes.data.full_name,
              email: profileRes.data.email,
              phone: profileRes.data.phone,
              avatar_url: profileRes.data.avatar_url,
              sync_status: 'synced'
            };
            setProfile(fetchedProfile);
            localStorage.setItem(`cashlens_profile_${user.id}`, JSON.stringify(fetchedProfile));

            // Sync Income & Budget if present in DB
            if (profileRes.data.monthly_income !== undefined && profileRes.data.monthly_income !== null) {
              setIncome(profileRes.data.monthly_income);
              localStorage.setItem(`cashlens_income_${user.id}`, profileRes.data.monthly_income);
            }
            if (profileRes.data.monthly_budget !== undefined && profileRes.data.monthly_budget !== null) {
              setBudget(profileRes.data.monthly_budget);
              localStorage.setItem(`cashlens_budget_${user.id}`, profileRes.data.monthly_budget);
            }
          } else if (!profileRes.error) {
            // Profile missing but no error? Upsert current metadata
            await supabase.from('profiles').upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              phone: user.user_metadata?.phone || '',
              avatar_url: user.user_metadata?.avatar_url || null,
              updated_at: new Date().toISOString()
            });
          }

          if (!expensesRes.error && expensesRes.data) {
            const fetched = expensesRes.data.map(exp => ({
              id: exp.id,
              amount: exp.amount,
              amountInBaseCurrency: exp.amount_in_base,
              currency: exp.currency || 'INR',
              category: exp.category,
              date: exp.date,
              note: exp.note,
              createdAt: exp.created_at,
              sync_status: 'synced'
            }));
            
            // Merge with pending items (prioritize local pending version if IDs match)
            const merged = [...localPending];
            fetched.forEach(f => {
              if (!merged.find(m => m.id === f.id)) {
                merged.push(f);
              }
            });
            
            setExpenses(merged.sort((a, b) => new Date(b.date) - new Date(a.date)));
            setInitLoaded(true);
          } else {
            throw expensesRes.error || new Error('Data fetch failed');
          }
        } catch (err) {
          console.error("Supabase load error:", err.message);
          setExpenses(localPending);
          setInitLoaded(true);
        }
      } else {
        // Offline: Show only pending items from previous sessions
        setExpenses(localPending);
        setInitLoaded(true);
      }
    };
    initializeData();
  }, [user.id, isOnline, initLoaded]);

  // Sync Profile when online
  React.useEffect(() => {
    const syncProfile = async () => {
      if (!isOnline || !supabase || profile.sync_status === 'synced') return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        setProfile(prev => ({ ...prev, sync_status: 'synced' }));
      }
    };
    syncProfile();
  }, [isOnline, profile.id, profile.name, profile.email, profile.phone, profile.sync_status]);

  // Handle Profile Local Persistence
  React.useEffect(() => {
    localStorage.setItem(`cashlens_profile_${user.id}`, JSON.stringify(profile));
  }, [profile, user.id]);

  // Fetch Profile from Supabase on mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!isOnline || !supabase) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        const fetchedProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatar_url: data.avatar_url || user.user_metadata?.avatar_url || null,
          sync_status: 'synced'
        };
        setProfile(fetchedProfile);
        localStorage.setItem(`cashlens_profile_${user.id}`, JSON.stringify(fetchedProfile));
      }
    };
    fetchProfile();
  }, [user.id, isOnline]);
  const syncWithSupabase = React.useCallback(async () => {
    const pending = expenses.filter(e => e.sync_status === 'pending');
    if (pending.length === 0 || syncing) return;

    setSyncing(true);
    try {
      for (const exp of pending) {
        const { error } = await supabase.from('expenses').upsert({
          id: exp.id,
          user_id: user.id,
          amount: exp.amount,
          amount_in_base: exp.amountInBaseCurrency,
          currency: exp.currency,
          category: exp.category,
          date: exp.date,
          note: exp.note,
          created_at: exp.createdAt
        });

        if (!error) {
          setExpenses(prev => prev.map(item => 
            item.id === exp.id ? { ...item, sync_status: 'synced' } : item
          ));
        }
      }
      showToast('Data synchronized with cloud', 'success');
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  }, [expenses, syncing, user.id]);

  // Synchronize pending records when online
  React.useEffect(() => {
    if (isOnline) {
      syncWithSupabase();
    }
  }, [isOnline, user.id, syncWithSupabase]);

  // Persist ONLY pending expenses to localStorage
  React.useEffect(() => {
    const pending = expenses.filter(e => e.sync_status === 'pending');
    if (pending.length > 0) {
      localStorage.setItem(`cashlens_expenses_${user.id}`, JSON.stringify(pending));
    } else {
      localStorage.removeItem(`cashlens_expenses_${user.id}`);
    }
  }, [expenses, user.id]);

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { amount, category, date, note, currency: entryCurrency } = formData;

    // 1. Validation
    if (!amount || !category || !date || !entryCurrency) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    const numericAmount = parseFloat(amount);
    
    // Ensure we have rates if converting from a different currency
    if (entryCurrency !== baseCurrency && (!exchangeRates || !exchangeRates[entryCurrency])) {
      showToast('Currency rates still loading. Please try again in a moment.', 'error');
      return;
    }

    const amountInBase = convertToBase(numericAmount, entryCurrency);

    // 2. Generate unique entry
    const newExpense = {
      id: crypto.randomUUID(),
      amount: numericAmount,
      amountInBaseCurrency: amountInBase,
      currency: entryCurrency,
      baseCurrencyAtTime: baseCurrency,
      category,
      date,
      note,
      createdAt: new Date().toISOString(),
      sync_status: 'pending'
    };

    // Save to state with appropriate status
    const status = isOnline ? 'synced' : 'pending';
    const entryWithStatus = { ...newExpense, sync_status: status };
    setExpenses(prev => [entryWithStatus, ...prev]);

    // Async attempt to save to Supabase if online
    if (isOnline) {
      supabase.from('expenses').insert([{
        id: newExpense.id,
        user_id: user.id,
        amount: newExpense.amount,
        amount_in_base: newExpense.amountInBaseCurrency,
        currency: newExpense.currency,
        category: newExpense.category,
        date: newExpense.date,
        note: newExpense.note,
        created_at: newExpense.createdAt
      }]).then(({ error }) => {
        if (error) {
          console.error("Supabase insert error:", error.message);
          // Revert to pending if online save failed
          setExpenses(prev => prev.map(item => 
            item.id === newExpense.id ? { ...item, sync_status: 'pending' } : item
          ));
        }
      });
    }

    // Reset form
    setFormData({
      amount: '',
      category: 'Food & Drink',
      date: new Date().toISOString().split('T')[0],
      note: '',
      currency: mostUsedCurrency
    });

    showToast(isOnline ? 'Expense saved' : 'Saved offline', 'success');
  };

  const handleInvoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload an image (JPG/PNG) or PDF file.', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast('File size must be less than 20MB.', 'error');
      return;
    }

    setInvoiceLoading(true);
    try {
      const base64Image = await fileToImage(file);
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      
      const result = await parseInvoiceWithAI(base64Image, groqKey);
      
      // Robust currency mapping
      let matchedCode = 'INR';
      const rawCurr = (result.currency || 'INR').toUpperCase().trim();
      
      const found = currencies.find(c => 
        c.code === rawCurr || 
        c.symbol === result.currency ||
        rawCurr.includes(c.code) ||
        (c.code === 'INR' && (rawCurr.includes('RS') || rawCurr.includes('RUPEE'))) ||
        (c.code === 'USD' && rawCurr.includes('DOLLAR')) ||
        (c.code === 'EUR' && (rawCurr.includes('EURO') || rawCurr.includes('€'))) ||
        (c.code === 'GBP' && (rawCurr.includes('POUND') || rawCurr.includes('£')))
      );
      if (found) matchedCode = found.code;

      const numericAmount = parseFloat(result.amount);
      const amountInBase = convertToBase(numericAmount, matchedCode);

      const newExpense = {
        id: crypto.randomUUID(),
        amount: numericAmount,
        amountInBaseCurrency: amountInBase,
        currency: matchedCode,
        baseCurrencyAtTime: baseCurrency,
        category: result.category,
        date: result.date,
        note: result.vendor, // Keep place/vendor name in note
        createdAt: new Date().toISOString(),
        sync_status: 'pending'
      };

      // 3. Save to state with appropriate status
      const status = isOnline ? 'synced' : 'pending';
      const entryWithStatus = { ...newExpense, sync_status: status };
      setExpenses(prev => [entryWithStatus, ...prev]);
      
      if (isOnline) {
        supabase.from('expenses').insert([{
          id: newExpense.id,
          user_id: user.id,
          amount: newExpense.amount,
          amount_in_base: newExpense.amountInBaseCurrency,
          currency: newExpense.currency,
          category: newExpense.category,
          date: newExpense.date,
          note: newExpense.note,
          created_at: newExpense.createdAt
        }]).then(({ error }) => {
          if (error) {
            console.error("Supabase insert error:", error.message);
            // Revert to pending if online save failed
            setExpenses(prev => prev.map(item => 
              item.id === newExpense.id ? { ...item, sync_status: 'pending' } : item
            ));
          }
        });
      }

      showToast(isOnline ? `Added: ${result.vendor}` : 'Saved offline', 'success');
    } catch (error) {
      console.error('Invoice processing error:', error);
      showToast(error.message || 'Failed to process invoice.', 'error');
    } finally {
      setInvoiceLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleUpdate = (updatedExpense) => {
    const amountInBase = convertToBase(updatedExpense.amount, updatedExpense.currency);
    const finalUpdate = { ...updatedExpense, amountInBaseCurrency: amountInBase, sync_status: 'pending' };

    setExpenses(expenses.map(exp => exp.id === finalUpdate.id ? finalUpdate : exp));

    if (isOnline) {
      supabase.from('expenses').update({
        amount: finalUpdate.amount,
        amount_in_base: finalUpdate.amountInBaseCurrency,
        currency: finalUpdate.currency,
        category: finalUpdate.category,
        date: finalUpdate.date,
        note: finalUpdate.note
      }).eq('id', finalUpdate.id).eq('user_id', user.id).then(({ error }) => {
        if (!error) {
          setExpenses(prev => prev.map(item => 
            item.id === finalUpdate.id ? { ...item, sync_status: 'synced' } : item
          ));
        }
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));

      if (isOnline) {
        supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
          if (error) {
            console.error('Remote delete failed, but local was removed.');
          }
        });
      }
    }
  };

  const getAIInsights = async () => {
    if (expenses.length === 0) {
      showToast('Please add some expenses first!', 'error');
      return;
    }

    setAiLoading(true);
    try {
      const now = new Date();
      let filteredData = [...expenses];

      if (aiTimeframe === 'Month') {
        filteredData = expenses.filter(exp => {
          const d = new Date(exp.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
      } else if (aiTimeframe === 'Year') {
        filteredData = expenses.filter(exp => new Date(exp.date).getFullYear() === now.getFullYear());
      }

      if (filteredData.length === 0) {
      showToast(`No expenses found for the selected ${aiTimeframe.toLowerCase()}. Please add some data for this period.`, 'error');
        setAiLoading(false);
        return;
      }

      const summaryData = filteredData.map(exp => ({
        amount: exp.amount,
        currency: exp.currency,
        convertedAmount: exp.amountInBaseCurrency,
        category: exp.category,
        date: exp.date,
        note: exp.note
      }));

      const totalSpentCalculated = filteredData.reduce((sum, exp) => sum + (exp.amountInBaseCurrency || exp.amount), 0);

      const prompt = `You are a world-class Financial Performance Coach. 
      
      USER CONTEXT:
      - Primary Currency: ${baseCurrency}
      - Total Monthly Income: ${income} ${baseCurrency}
      - Monthly Savings Goal/Budget: ${budget} ${baseCurrency}
      
      SPENDING PERFORMANCE (${aiTimeframe}):
      - Total spent during this period: ${totalSpentCalculated.toFixed(2)} ${baseCurrency}
      - Budget Utilization: ${budget > 0 ? ((totalSpentCalculated / budget) * 100).toFixed(1) : 'N/A'}%
      - Income-to-Spent Ratio: ${income > 0 ? ((totalSpentCalculated / income) * 100).toFixed(1) : 'N/A'}%
      
      DETAILED TRANSACTION DATA:
      ${JSON.stringify(summaryData)}
      
      TASK:
      1. Analyze patterns. If multiple currencies (like USD, EUR, INR) are used, comment on how these diversions affect their primary ${baseCurrency} balance.
      2. Performance Review: Honestly assess if they are respecting their ${budget} budget and ${income} income.
      3. Action Plan: Give 3 high-impact, specific tips to widen the gap between income and expenses.
      
      Maintain a professional, empathetic, and data-driven tone. Highlight specific categories that are "leaks". Keep it under 200 words.`; 

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setAiInsights(data.choices[0].message.content);
      } else {
        throw new Error('Failed to get response from AI');
      }
    } catch (error) {
      console.error(error);
      showToast('AI Insights unavailable. Please check your API key.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('No data to export!', 'error');
      return;
    }

    const headers = ['Date', 'Category', 'Amount', 'Note'];
    const csvRows = [
      headers.join(','),
      ...filteredExpenses.map(exp => [
        exp.date,
        `"${exp.category}"`,
        exp.amount,
        `"${exp.note || ''}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cashlens_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchCategory = filterCategory === 'All' || exp.category === filterCategory;
      const matchCurrency = filterCurrency === 'All' || exp.currency === filterCurrency;
      const matchStartDate = !startDate || exp.date >= startDate;
      const matchEndDate = !endDate || exp.date <= endDate;
      return matchCategory && matchCurrency && matchStartDate && matchEndDate;
    });
  }, [expenses, filterCategory, filterCurrency, startDate, endDate]);

  // Calculate stats based on filtered data for the History section
  const filteredSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (exp.amountInBaseCurrency || exp.amount), 0);
  }, [filteredExpenses]);

  // Calculate current month's total for the Budget Progress Card specifically
  const monthlySpent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      })
      .reduce((sum, exp) => sum + (exp.amountInBaseCurrency || exp.amount), 0);
  }, [expenses]);

  const remainingBudget = budget ? budget - monthlySpent : 0;
  const budgetProgress = budget ? (monthlySpent / budget) * 100 : 0;

  // Chart data calculation
  const chartData = useMemo(() => {
    const categoryTotals = filteredExpenses.reduce((acc, exp) => {
      const amount = exp.amountInBaseCurrency || exp.amount;
      acc[exp.category] = (acc[exp.category] || 0) + amount;
      return acc;
    }, {});

    return Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: categoryTotals[cat]
    }));
  }, [filteredExpenses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`} style={{ zoom: zoomLevel }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">

        {/* Profile Section - Top Left */}
        <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2.5 sm:gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 pr-3 sm:p-2.5 sm:pr-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:scale-[1.02]">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-blue-500/20" />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700">
                <img src="/default-user.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white dark:border-slate-900 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white leading-none truncate max-w-[70px] sm:max-w-[120px]">
              {profile.name || user.email}
            </p>
          </div>
        </div>

        {/* Controls Section - Top Right */}
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3">
          {/* Zoom Control - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg">
            {[1, 1.1, 1.25].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleZoom(lvl)}
                className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all ${zoomLevel === lvl ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {Math.round(lvl * 100)}%
              </button>
            ))}
          </div>

          <ThemeToggle />

          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to sign out?')) {
                await supabase.auth.signOut();
              }
            }}
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-all hover:scale-110 active:scale-95 group"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">

          {/* Left Column: Form & Summary */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8 fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
              <header className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700">
                      <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Cashlens</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    {syncing ? (
                      <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                        <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Syncing</span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isOnline ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                        <span className={`text-[10px] font-bold uppercase ${isOnline ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-slate-500 text-sm">Visualize your spending patterns.</p>
              </header>

              <section className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-blue-900 dark:to-slate-900 rounded-2xl shadow-lg mb-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                        Monthly Income
                      </p>
                      <p className="text-lg font-bold">
                        <span className="text-blue-400 mr-1">{currentSymbol}</span>
                        {income.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    {budget > 0 && (
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                          Budget
                        </p>
                        <p className="text-lg font-bold">
                          <span className="text-blue-400 mr-1">{currentSymbol}</span>
                          {budget.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="h-2 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${budgetProgress > 100 ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                    ></div>
                  </div>

                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    Monthly Spending
                  </p>
                  <p className="text-3xl font-bold tracking-tight mb-4 text-white">
                    <span className="text-blue-400 mr-1">{currentSymbol}</span>
                    {monthlySpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>

                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${remainingBudget >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        <TrendingUp className={`w-3 h-3 ${remainingBudget < 0 ? 'rotate-180' : ''}`} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Remaining</p>
                        <p className={`text-sm font-bold ${remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {remainingBudget < 0 ? '-' : ''}{currentSymbol}{Math.abs(remainingBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Real-time</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
              </section>

              <section className="mb-8 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Set Income</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{currentSymbol}</span>
                    <input
                      type="number"
                      value={income || ''}
                      onChange={(e) => handleIncomeChange(e.target.value)}
                      placeholder="Income"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Monthly Budget</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{currentSymbol}</span>
                    <input
                      type="number"
                      value={budget || ''}
                      onChange={(e) => handleBudgetChange(e.target.value)}
                      placeholder="Budget"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Add Expense</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Amount
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                          {CURRENCIES.find(c => c.code === (formData.currency || 'INR'))?.symbol || '$'}
                        </span>
                        <input
                          type="number"
                          name="amount"
                          id="amount"
                          required
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-semibold"
                          value={formData.amount}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="w-32 relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-blue-600 dark:text-blue-400">
                          {CURRENCIES.find(c => c.code === formData.currency)?.icon || <Globe className="w-4 h-4" />}
                        </div>
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700 dark:text-slate-300 font-bold text-sm shadow-sm"
                        >
                          {CURRENCIES.map(c => <option key={c.code} value={c.code} className="dark:bg-slate-800 font-bold">{c.code} ({c.symbol})</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Category
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-blue-600 dark:text-blue-400">
                        {CATEGORIES.find(c => c.name === formData.category)?.icon || <MoreHorizontal className="w-4 h-4" />}
                      </div>
                      <select
                        name="category"
                        id="category"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700 dark:text-slate-300 font-semibold shadow-sm"
                        value={formData.category}
                        onChange={handleChange}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.name} value={cat.name} className="dark:bg-slate-800">{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      required
                      max={today}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer text-slate-700 dark:text-slate-300"
                      value={formData.date}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Note <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      name="note"
                      id="note"
                      rows="3"
                      placeholder="What was this for?"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-slate-300 text-slate-700 dark:text-slate-300"
                      value={formData.note}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all transform active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                  >
                    Add Expense
                  </button>
                </form>

                {/* Invoice Upload Option */}
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Have an invoice?</p>
                    <label className={`
                      flex flex-col items-center justify-center w-full h-32 px-4 
                      transition bg-white dark:bg-slate-800/50 border-2 border-slate-300 dark:border-slate-700 
                      border-dashed rounded-2xl appearance-none cursor-pointer 
                      hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 
                      focus:outline-none relative overflow-hidden group
                      ${invoiceLoading ? 'pointer-events-none opacity-60' : ''}
                    `}>
                      {invoiceLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Scanning Invoice...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                          </div>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Upload Invoice</span>
                          <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max 20MB)</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        name="invoice" 
                        className="hidden" 
                        accept="image/*,application/pdf"
                        onChange={handleInvoiceUpload}
                        disabled={invoiceLoading}
                      />
                    </label>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Visualization & List */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8 fade-in">

            {/* Chart Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 sm:p-8 min-h-[350px] sm:h-[400px]">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                Spending Breakdown
                <span className="text-xs font-normal text-slate-400">(by All Categories)</span>
              </h2>
              <div className="h-64 w-full">
                {expenses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                          color: isDarkMode ? '#f8fafc' : '#1e293b'
                        }}
                        formatter={(value) => [`${currentSymbol}${value.toFixed(2)}`, 'Spent']}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300 dark:text-slate-700 font-medium italic">
                    Not enough data to visualize
                  </div>
                )}
              </div>
            </div>

            {/* List Section */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">Expense History</h2>
                      <p className="text-xs text-slate-400 font-medium">Manage and filter your transaction records</p>
                    </div>
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Data (CSV)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                      <select
                        id="filter"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm"
                      >
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Currency</label>
                      <select
                        value={filterCurrency}
                        onChange={(e) => setFilterCurrency(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm"
                      >
                        <option value="All">All Currencies</option>
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>{c.code}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative group flex flex-col">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">From Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div className="relative group flex flex-col">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <ExpenseList
                expenses={filteredExpenses}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                baseCurrency={baseCurrency}
                currencies={CURRENCIES}
                categories={CATEGORIES}
              />
            </div>

            {/* AI Insights Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    AI Spending Coach
                  </h2>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">Experimental Feature • Groq AI</p>
                </div>
                <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                  {['Month', 'Year', 'All'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAiTimeframe(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${aiTimeframe === t
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 min-h-[120px] flex flex-col items-center justify-center text-center relative overflow-hidden">
                {aiLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Analyzing patterns...</p>
                  </div>
                ) : aiInsights ? (
                  <div className="text-left w-full">
                    <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {aiInsights}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiInsights);
                        showToast('Insights copied to clipboard!', 'success');
                      }}
                      className="mt-4 text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-widest mr-4"
                    >
                      Copy Insights
                    </button>
                    <button
                      onClick={() => setAiInsights('')}
                      className="mt-4 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ready for Analysis</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Get a personalized summary of your spending habits.</p>
                    </div>
                  </div>
                )}

                {/* Abstract decorative elements */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-400/5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-purple-400/5 rounded-full blur-2xl"></div>
              </div>

              <button
                onClick={getAIInsights}
                disabled={aiLoading}
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 group"
              >
                {!aiLoading && <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                {aiLoading ? 'Connecting to Groq AI...' : 'Ask AI for Insights'}
              </button>

              <p className="mt-4 text-[10px] text-center text-slate-400 dark:text-slate-600 italic">
                * This is an AI-powered experimental feature. Insights are generated based on your spending history.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400' 
            : 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800/50 text-rose-700 dark:text-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-bold tracking-tight">{toast.message}</p>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 hover:opacity-70 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
