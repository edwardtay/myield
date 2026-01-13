'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'pending'

interface ToastProps {
  type: ToastType
  message: string
  txHash?: string
  onClose: () => void
  duration?: number
}

export function Toast({ type, message, txHash, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (type !== 'pending') {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [type, duration, onClose])

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    pending: 'bg-blue-600',
  }[type]

  const icon = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    pending: (
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  }[type]

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${bgColor} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {icon}
      <div>
        <p className="font-medium text-sm">{message}</p>
        {txHash && (
          <a
            href={`https://mantlescan.xyz/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs opacity-80 hover:opacity-100 underline"
          >
            View on MantleScan
          </a>
        )}
      </div>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Toast container for multiple toasts
interface ToastItem {
  id: string
  type: ToastType
  message: string
  txHash?: string
}

interface ToastContainerProps {
  toasts: ToastItem[]
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ transform: `translateY(-${index * 10}px)` }}
        >
          <Toast
            type={toast.type}
            message={toast.message}
            txHash={toast.txHash}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}
