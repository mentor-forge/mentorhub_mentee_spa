/**
 * IdP login redirects for the mentee SPA.
 * spa_utils redirectToIdpLogin no-ops when VITE_IDP_LOGIN_URI is unset; we always
 * pass an explicit URI (env or Developer Edition default) and use location.replace.
 */
import { buildIdpLoginRedirectUrl } from '@mentor-forge/mentorhub_spa_utils'

const DEFAULT_IDP_LOGIN_URI = 'http://127.0.0.1:8080/login.html'

export function getIdpLoginUri(): string {
  const configured = import.meta.env.VITE_IDP_LOGIN_URI
  return typeof configured === 'string' && configured.trim()
    ? configured.trim()
    : DEFAULT_IDP_LOGIN_URI
}

/** Full-page redirect to the Developer Edition / IdP login page. */
export function redirectToLogin(returnTo?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const destination = returnTo ?? `${window.location.origin}${window.location.pathname}${window.location.search}`
  window.location.replace(buildIdpLoginRedirectUrl(destination, getIdpLoginUri()))
}
