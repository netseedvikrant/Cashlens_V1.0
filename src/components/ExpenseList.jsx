import React, { useMemo, useState } from 'react';
import { Trash2, Pencil, Check, X, Utensils, Car, Home, Stethoscope, Film, ShoppingBag, GraduationCap, MoreHorizontal, DollarSign, Euro, PoundSterling, IndianRupee, JapaneseYen } from 'lucide-react';

const ExpenseList = ({ expenses, onDelete, onUpdate, currencies = [], categories = [] }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses]);

  const renderCategoryIcon = (categoryName) => {
    const category = categories.find(c => (c.name || c) === categoryName);
    return category?.icon || <MoreHorizontal className="w-4 h-4" />;
  };

  const startEditing = (expense) => {
    setEditingId(expense.id);
    setEditForm({ ...expense });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const saveEdit = () => {
    onUpdate(editForm);
    setEditingId(null);
    setEditForm({});
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 sm:p-16 text-center mt-8 shadow-sm mx-2">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-slate-200 dark:text-slate-700" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No expenses yet</h3>
        <p className="text-slate-400 dark:text-slate-500 max-w-xs mx-auto text-sm sm:text-base">Start tracking your spending by adding your first expense using the form above.</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="mt-8 mx-2 sm:mx-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight">Financial Records</h2>
          <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm whitespace-nowrap">
            {expenses.length} Total
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[110px]">Date</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[140px]">Category</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Note</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right w-[130px]">Amount</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {sortedExpenses.map((expense) => {
                const isEditing = editingId === expense.id;
                return (
                  <tr key={expense.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          name="date"
                          max={today}
                          value={editForm.date}
                          onChange={handleEditChange}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        />
                      ) : expense.date}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <select
                          name="category"
                          value={editForm.category}
                          onChange={handleEditChange}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded px-1 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        >
                          {categories.map(cat => (
                            <option key={cat.name || cat} value={cat.name || cat} className="dark:bg-slate-800">
                              {cat.name || cat}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50">
                          {renderCategoryIcon(expense.category)}
                          {expense.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          name="note"
                          value={editForm.note}
                          onChange={handleEditChange}
                          placeholder="Note"
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        />
                      ) : (
                        expense.note || <span className="text-slate-300 dark:text-slate-700 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-white text-right whitespace-nowrap w-[130px]">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1 min-w-[100px]">
                          <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                            {editForm.currency || 'INR'}
                          </span>
                          <input
                            type="number"
                            name="amount"
                            step="0.01"
                            value={editForm.amount}
                            onChange={handleEditChange}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded px-1.5 py-1 w-16 outline-none focus:ring-1 focus:ring-blue-500 text-right font-bold text-xs"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="flex items-center gap-1">
                            <span className="text-blue-500 text-[10px] font-bold">
                              {currencies.find(c => c.code === (expense.currency || 'INR'))?.symbol || (expense.currency || 'INR')}
                            </span>
                            {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center w-[90px]">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit} className="p-1 px-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-all border border-emerald-100 dark:border-emerald-800/30" title="Save">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={cancelEditing} className="p-1 px-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all border border-slate-100 dark:border-slate-700" title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(expense)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(expense.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (375px Friendly) */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {sortedExpenses.map((expense) => {
            const isEditing = editingId === expense.id;
            return (
              <div key={expense.id} className={`p-5 transition-all ${isEditing ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-900'}`}>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 ml-1">Date</label>
                        <input type="date" name="date" max={today} value={editForm.date} onChange={handleEditChange} className="text-xs bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2 w-full outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 ml-1">Category</label>
                        <select name="category" value={editForm.category} onChange={handleEditChange} className="text-xs bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2 w-full outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
                          {categories.map(cat => (
                            <option key={cat.name || cat} value={cat.name || cat} className="dark:bg-slate-800">
                              {cat.name || cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 ml-1">Note</label>
                      <input type="text" name="note" value={editForm.note} onChange={handleEditChange} placeholder="What was this for?" className="text-xs bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2 w-full outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 ml-1">Amount</label>
                      <div className="flex gap-2">
                        <div className="flex items-center justify-center w-16 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl">
                          {editForm.currency || 'INR'}
                        </div>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                             {currencies.find(c => c.code === (editForm.currency || 'INR'))?.symbol || ''}
                          </span>
                          <input type="number" name="amount" step="0.01" value={editForm.amount} onChange={handleEditChange} className="text-sm bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl pl-6 pr-3 py-2 w-full font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={saveEdit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Save Changes
                      </button>
                      <button onClick={cancelEditing} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-blue-500" /> {expense.date}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50 flex items-center gap-1">
                          {renderCategoryIcon(expense.category)}
                          {expense.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold truncate leading-tight">{expense.note || <span className="text-slate-300 dark:text-slate-700 font-normal italic">No note</span>}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <span className="text-base font-bold text-slate-900 dark:text-white flex items-baseline">
                        <span className="text-[10px] text-blue-500 mr-0.5">
                           {currencies.find(c => c.code === (expense.currency || 'INR'))?.symbol || (expense.currency || 'INR')}
                        </span>
                        {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => startEditing(expense)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 active:scale-95 transition-all border border-slate-100 dark:border-slate-700 rounded-lg" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(expense.id)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 active:scale-95 transition-all border border-slate-100 dark:border-slate-700 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExpenseList;
