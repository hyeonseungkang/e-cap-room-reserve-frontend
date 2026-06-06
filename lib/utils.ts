import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Session } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SESSION_KEY = 'session'

export function saveAccessToken(access_token: string) {
  return window.localStorage.setItem('access_token', access_token)
}

export function readAccessToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('access_token') || ''
}

export function removeAccessToken() {
  return window.localStorage.removeItem('access_token')
}

// 백엔드에 /auth/me 엔드포인트가 없으므로 로그인 응답으로 받은 세션 정보를
// localStorage 에 저장하여 현재 로그인 사용자/관리자 정보를 유지한다.
export function saveSession(session: Session) {
  return window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function clearSession() {
  window.localStorage.removeItem('access_token')
  window.localStorage.removeItem(SESSION_KEY)
}
