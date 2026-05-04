import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function saveAccessToken(access_token: string) {
  return window.localStorage.setItem('access_token', access_token)
}

export function readAccessToken() {
  return window.localStorage.getItem('access_token') || ''
}

export function removeAccessToken() {
  return window.localStorage.removeItem('access_token')
}
