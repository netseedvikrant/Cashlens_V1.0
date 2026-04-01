import React, { useState, useMemo } from 'react';
import { Wallet, Globe, TrendingUp } from 'lucide-react';
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
      alert('Please fill in all required fields (Amount, Category, and Date).');
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

    alert('Expense added successfully!');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      setExpenses(updatedExpenses);
      localStorage.setItem('cashlens_expenses', JSON.stringify(updatedExpenses));
    }
  };

  const filteredExpenses = filterCategory === 'All' 
    ? expenses 
    : expenses.filter(exp => exp.category === filterCategory);

  // Calculate stats based on filtered data
  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Chart data calculation
  const chartData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    return Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: categoryTotals[cat]
    }));
  }, [expenses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Form & Summary */}
        <div className="w-full lg:w-1/3 flex flex-col gap-8">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            <header className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-200">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Cashlens</h1>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <select 
                    value={currency} 
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-1"
                  >
                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-slate-500 text-sm">Visualize your spending patterns.</p>
            </header>

            <section className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg mb-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  {filterCategory === 'All' ? 'Total Expenses' : `${filterCategory}`}
                </p>
                <p className="text-4xl font-bold tracking-tight">
                  <span className="text-blue-400 mr-2">{currentSymbol}</span>
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
                <h2 className="text-xl font-semibold text-slate-700">Add Expense</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">
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
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-semibold"
                      value={formData.amount}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    id="category"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer text-slate-700"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-slate-600 mb-1">
                    Note <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    name="note"
                    id="note"
                    rows="3"
                    placeholder="What was this for?"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-slate-300 text-slate-700"
                    value={formData.note}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                >
                  Add Expense
                </button>
              </form>
            </section>
          </div>
        </div>

        {/* Right Column: Visualization & List */}
        <div className="w-full lg:w-2/3 flex flex-col gap-8">
          
          {/* Chart Section */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 h-[400px]">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`${currentSymbol}${value.toFixed(2)}`, 'Spent']}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300 font-medium italic">
                  Not enough data to visualize
                </div>
              )}
            </div>
          </div>

          {/* List Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-slate-800">Expense History</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="filter" className="text-xs font-bold text-slate-400 uppercase">Filter:</label>
                <select
                  id="filter"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-slate-300 transition-all shadow-sm"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <ExpenseList 
              expenses={filteredExpenses} 
              onDelete={handleDelete} 
              currencySymbol={currentSymbol}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
