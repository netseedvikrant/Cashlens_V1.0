import React, { useMemo, useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';

const ExpenseList = ({ expenses, onDelete, onUpdate, currencySymbol = '$', categories = [] }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses]);

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
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 sm:p-16 text-center mt-8 shadow-sm mx-2">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-slate-200" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">No expenses yet</h3>
        <p className="text-slate-400 max-w-xs mx-auto text-sm sm:text-base">Start tracking your spending by adding your first expense using the form above.</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="mt-8 mx-2 sm:mx-0">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Financial Records</h2>
          <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-100 shadow-sm whitespace-nowrap">
            {expenses.length} Total
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Note</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedExpenses.map((expense) => {
                const isEditing = editingId === expense.id;
                return (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          name="date"
                          max={today}
                          value={editForm.date}
                          onChange={handleEditChange}
                          className="bg-white border border-slate-200 rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : expense.date}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          name="category"
                          value={editForm.category}
                          onChange={handleEditChange}
                          className="bg-white border border-slate-200 rounded px-1 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        >
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/50">
                          {expense.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-[150px] truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          name="note"
                          value={editForm.note}
                          onChange={handleEditChange}
                          placeholder="Note"
                          className="bg-white border border-slate-200 rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        expense.note || <span className="text-slate-300 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400">{currencySymbol}</span>
                          <input
                            type="number"
                            name="amount"
                            step="0.01"
                            value={editForm.amount}
                            onChange={handleEditChange}
                            className="bg-white border border-slate-200 rounded px-2 py-1 w-20 outline-none focus:ring-1 focus:ring-blue-500 text-right"
                          />
                        </div>
                      ) : (
                        `${currencySymbol}${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Save">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEditing} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all" title="Cancel">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(expense)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(expense.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
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
        <div className="sm:hidden divide-y divide-slate-100">
          {sortedExpenses.map((expense) => {
            const isEditing = editingId === expense.id;
            return (
              <div key={expense.id} className="p-4 bg-white">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex justify-between gap-2">
                      <input type="date" name="date" max={today} value={editForm.date} onChange={handleEditChange} className="text-xs border rounded p-1 w-full" />
                      <select name="category" value={editForm.category} onChange={handleEditChange} className="text-xs border rounded p-1 w-full">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <input type="text" name="note" value={editForm.note} onChange={handleEditChange} placeholder="Note" className="text-xs border rounded p-1 w-full" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-bold">{currencySymbol}</span>
                      <input type="number" name="amount" step="0.01" value={editForm.amount} onChange={handleEditChange} className="text-xs border rounded p-1 w-full font-bold" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveEdit} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">Save</button>
                      <button onClick={cancelEditing} className="flex-1 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{expense.date}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">{expense.category}</span>
                      </div>
                      <p className="text-sm text-slate-800 font-medium truncate">{expense.note || 'No note'}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {currencySymbol}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="flex gap-3">
                        <button onClick={() => startEditing(expense)} className="text-slate-300 active:text-blue-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(expense.id)} className="text-slate-300 active:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
