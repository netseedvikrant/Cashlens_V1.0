import React from 'react';
import { Trash2 } from 'lucide-react';

const ExpenseList = ({ expenses, onDelete }) => {
  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center mt-8">
        <p className="text-slate-400">No expenses recorded yet. Add one above to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Recent Expenses</h2>
        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-100 shadow-sm">
          {expenses.length} Total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Note</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                  {new Date(expense.date).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100/50">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 max-w-[150px] truncate">
                  {expense.note || <span className="text-slate-300 italic">None</span>}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                  ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseList;
