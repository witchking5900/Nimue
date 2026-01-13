import { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Function to trigger a notification
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => removeToast(id), 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container (Fixed to bottom right) */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto min-w-[200px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-2xl font-bold text-sm animate-in slide-in-from-right fade-in duration-300 ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 
              'bg-slate-900 text-white border border-slate-700'
            }`}
          >
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook to use it in other components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fail-safe if used outside provider
    return { addToast: (msg) => console.log("Toast:", msg) };
  }
  return context;
};