'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import { ToastContainer, ToastType } from '@/components/Toast'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  txHash?: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, txHash?: string) => string
  removeToast: (id: string) => void
  updateToast: (id: string, type: ToastType, message: string, txHash?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)
  const counterRef = useRef(0)

  // Only render toasts after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const showToast = useCallback((type: ToastType, message: string, txHash?: string) => {
    counterRef.current += 1
    const id = `toast-${counterRef.current}`
    setToasts((prev) => [...prev.slice(-2), { id, type, message, txHash }])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateToast = useCallback((id: string, type: ToastType, message: string, txHash?: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, type, message, txHash } : t))
    )
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast, updateToast }}>
      {children}
      {mounted && <ToastContainer toasts={toasts} removeToast={removeToast} />}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
