import React, { useState } from 'react';
import { Wallet } from 'lucide-react';

const Dashboard = () => {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food & Drink',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

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
    console.log('Expense Submitted:', formData);
    // Reset or further actions
    alert('Expense added successfully!');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Cashlens</h1>
          </div>
          <p className="text-slate-500 text-sm">Manage your daily expenses and track your spending habits.</p>
        </header>

        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-blue-900">$0</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Categories</p>
            <p className="text-2xl font-bold text-emerald-900">0</p>
          </div>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-slate-300"
                value={formData.note}
                onChange={handleChange}
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all transform active:scale-[0.98] mt-4"
            >
              Add Expense
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
