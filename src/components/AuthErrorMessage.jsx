import Link from 'next/link';
import { AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';

const ICONS = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle
};

const COLORS = {
  error: {
    bg: 'bg-red-500/10 dark:bg-red-900/20',
    border: 'border-red-500/30 dark:border-red-700/30',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-600 dark:text-red-300',
    message: 'text-red-600/80 dark:text-red-400/80',
    button: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
  },
  warning: {
    bg: 'bg-amber-500/10 dark:bg-amber-900/20',
    border: 'border-amber-500/30 dark:border-amber-700/30',
    icon: 'text-amber-500 dark:text-amber-400',
    title: 'text-amber-600 dark:text-amber-300',
    message: 'text-amber-600/80 dark:text-amber-400/80',
    button: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700'
  },
  info: {
    bg: 'bg-sky-500/10 dark:bg-sky-900/20',
    border: 'border-sky-500/30 dark:border-sky-700/30',
    icon: 'text-sky-500 dark:text-sky-400',
    title: 'text-sky-600 dark:text-sky-300',
    message: 'text-sky-600/80 dark:text-sky-400/80',
    button: 'bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700'
  },
  success: {
    bg: 'bg-green-500/10 dark:bg-green-900/20',
    border: 'border-green-500/30 dark:border-green-700/30',
    icon: 'text-green-500 dark:text-green-400',
    title: 'text-green-600 dark:text-green-300',
    message: 'text-green-600/80 dark:text-green-400/80',
    button: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
  }
};

export default function AuthErrorMessage({ error, onAction }) {
  if (!error) return null;

  const { title, message, type = 'error', action } = error;
  const colors = COLORS[type] || COLORS.error;
  const Icon = ICONS[type] || ICONS.error;

  return (
    <div className={`mb-8 p-4 rounded-2xl flex flex-col gap-3 ${colors.bg} ${colors.border} border`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${colors.icon}`} />
        <div className="flex flex-col">
          <p className={`text-sm font-bold leading-tight ${colors.title}`}>
            {title}
          </p>
          <p className={`text-xs mt-1 ${colors.message}`}>
            {message}
          </p>
        </div>
      </div>
      
      {action && (
        <div className="mt-1">
          {action.link && (
            <Link 
              href={action.link} 
              className={`w-full py-2.5 ${colors.button} text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all text-center flex items-center justify-center gap-2`}
            >
              {action.text}
            </Link>
          )}
          {action.action && onAction && (
            <button 
              onClick={() => onAction(action.action)}
              className={`w-full py-2.5 ${colors.button} text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all text-center flex items-center justify-center gap-2`}
            >
              {action.text}
            </button>
          )}
        </div>
      )}
    </div>
  );
}