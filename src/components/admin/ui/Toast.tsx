'use client'
import { toast } from 'sonner'

export const Toast = {
  success: (msg: string) => toast.success(msg, {
    style: { background: '#1a2e1a', border: '1px solid #22c55e', color: '#86efac' }
  }),
  error: (msg: string) => toast.error(msg, {
    style: { background: '#2e1a1a', border: '1px solid #ef4444', color: '#fca5a5' }
  }),
  info: (msg: string) => toast(msg, {
    style: { background: '#1a1a2e', border: '1px solid #f59e0b', color: '#fcd34d' }
  }),
  loading: (msg: string) => toast.loading(msg),
  promise: <T,>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
    toast.promise(promise, msgs),
}