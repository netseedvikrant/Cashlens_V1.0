import React, { useState, useMemo } from 'react';
import { Wallet, Globe, TrendingUp, Sun, Moon, Sparkles, Brain, Loader2, Download, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ExpenseList from './ExpenseList';

const Dashboard = () => {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('cashlens_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food & Drink',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [filterCategory, setFilterCategory] = useState('All');
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('cashlens_currency') || 'USD';
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTimeframe, setAiTimeframe] = useState('Month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'INR', symbol: '₹' },
    { code: 'JPY', symbol: '¥' },
    { code: 'CAD', symbol: 'C$' },
    { code: 'AUD', symbol: 'A$' }
  ];

  const currentSymbol = currencies.find(c => c.code === currency)?.symbol || '$';

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('cashlens_currency', newCurrency);
  };

  const categories = [
    'Food & Drink',
    'Transport',
    'Housing',
    'Health',
    'Entertainment',
    'Shopping',
    'Education',
    'Other'
  ];

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

    const { amount, category, date, note } = formData;

    // 1. Validation
    if (!amount || !category || !date) {
      showToast('Please fill in all required fields (Amount, Category, and Date).', 'error');
      return;
    }

    // 2. Generate unique entry
    const newExpense = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      category,
      date,
      note,
      createdAt: new Date().toISOString()
    };

    // 3. Save to state and localStorage
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem('cashlens_expenses', JSON.stringify(updatedExpenses));

    // Reset form
    setFormData({
      amount: '',
      category: 'Food & Drink',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });

    showToast('Expense added successfully!', 'success');
  };

  const handleUpdate = (updatedExpense) => {
    const updatedExpenses = expenses.map(exp =>
      exp.id === updatedExpense.id ? updatedExpense : exp
    );
    setExpenses(updatedExpenses);
    localStorage.setItem('cashlens_expenses', JSON.stringify(updatedExpenses));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      setExpenses(updatedExpenses);
      localStorage.setItem('cashlens_expenses', JSON.stringify(updatedExpenses));
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
        category: exp.category,
        date: exp.date,
        note: exp.note
      }));

      const prompt = `User's spending data for ${aiTimeframe}: ${JSON.stringify(summaryData)}. 
      Currency: ${currency}. 
      Total Spent: ${filteredData.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}.

      Act as a world-class financial advisor. Analyze the provided spending data and:
      1. Provide a concise summary of the biggest spending habits. Use bullet points for the habits.
      2. This is just for you to think like a Human and reason that a person can't just simply reduce some of their expenses like Health, Basic Grocery, Some Food and Entertainment once in a while, Monthly Rent or Loan EMI, Etc.
      3. Task: "Offer 2-3 genuinely useful piece of advice to save money or optimize budget, don't budge user for neccesary expenses like Hospital, Medicine, Once in a while Outside Food, Monthly Groceries, Etc", compare the expenses to a average expense of a person data for the country that have same currency to do said task.
      4. If Health Expenses, Food Expenses, Grocery Expenses are too much in comparision to average Give a one liner expert advice.
      5. Keep the tone professional yet encouraging. Limit the response to under 200 words.`; 

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
      const matchStartDate = !startDate || exp.date >= startDate;
      const matchEndDate = !endDate || exp.date <= endDate;
      return matchCategory && matchStartDate && matchEndDate;
    });
  }, [expenses, filterCategory, startDate, endDate]);

  // Calculate stats based on filtered data
  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Chart data calculation
  const chartData = useMemo(() => {
    const categoryTotals = filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    return Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: categoryTotals[cat]
    }));
  }, [filteredExpenses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="fixed top-6 right-6 z-50 p-3 bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-blue-400 hover:scale-110 transition-all active:scale-95"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">

          {/* Left Column: Form & Summary */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8 fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
              <header className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-200">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Cashlens</h1>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={currency}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer pr-1"
                    >
                      {currencies.map(c => <option key={c.code} value={c.code} className="dark:bg-slate-800">{c.code}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-slate-500 text-sm">Visualize your spending patterns.</p>
              </header>

              <section className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-blue-900 dark:to-slate-900 rounded-2xl shadow-lg mb-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    {filterCategory === 'All' ? 'Total Expenses' : `${filterCategory}`}
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                    <span className="text-blue-400 mr-1 sm:mr-2">{currentSymbol}</span>
                    {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full w-fit border border-emerald-400/20">
                    <TrendingUp className="w-3 h-3" />
                    <span>Real-time Analytics</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -left-4 -top-8 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl"></div>
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{currentSymbol}</span>
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
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      id="category"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700 dark:text-slate-300"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Expense History</h2>
                    <p className="text-xs text-slate-400 font-medium">Manage and filter your records</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                    <div className="relative group">
                      <select
                        id="filter"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm min-w-[140px]"
                      >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Globe className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Range Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                      <Calendar className="w-3 h-3" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                      <Calendar className="w-3 h-3" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="sm:col-span-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-widest mt-1 text-center"
                    >
                      Clear Date Range
                    </button>
                  )}
                </div>
              </div>

              <ExpenseList
                expenses={filteredExpenses}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                currencySymbol={currentSymbol}
                categories={categories}
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
