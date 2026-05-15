/**
 * AuthService — Gerçek backend auth entegrasyonu.
 *
 * Desteklenen yöntemler:
 *   - Email + Şifre (JWT)
 *   - Google Sign-In (Firebase → JWT)    [firebase-admin backend'de kurulunca aktif]
 *   - Apple Sign-In (Firebase → JWT)     [firebase-admin backend'de kurulunca aktif]
 *
 * Tüm yöntemler tutarlı bir JWT döndürür ve token AsyncStorage'a kaydedilir.
 */

import { TokenStorage, StoredUser } from './TokenStorage';

// ─── Backend base URL ────────────────────────────────────────────────────────
// Simulator için localhost, gerçek cihazda Mac'in IP'si ile değiştir
const BASE_URL = 'http://localhost:8000';

// ─── API helpers ─────────────────────────────────────────────────────────────

async function post<T>(path: string, body: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json() as Promise<T>;
}

// ─── AuthService ─────────────────────────────────────────────────────────────

class AuthService {
  private _token: string | null = null;
  private _user: StoredUser | null = null;

  /** Call once at app start to restore session from AsyncStorage. */
  async init(): Promise<boolean> {
    const token = await TokenStorage.getToken();
    const user = await TokenStorage.getUser();
    if (token && user) {
      this._token = token;
      this._user = user;
      return true; // still logged in
    }
    return false;
  }

  // ── Email / Password ────────────────────────────────────────────────────────

  async signup(email: string, password: string, displayName?: string): Promise<boolean> {
    const { access_token } = await post<{ access_token: string }>('/auth/signup', {
      email,
      password,
      display_name: displayName,
    });
    await this._finalizeLogin(access_token);
    return true;
  }

  async login(email: string, password: string): Promise<boolean> {
    const { access_token } = await post<{ access_token: string }>('/auth/login', {
      email,
      password,
    });
    await this._finalizeLogin(access_token);
    return true;
  }

  // ── Google Sign-In ──────────────────────────────────────────────────────────

  async googleLogin(): Promise<boolean> {
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');

      GoogleSignin.configure({
        // web client ID from Firebase Console → Project Settings → Web API Key
        webClientId: 'REPLACE_WITH_FIREBASE_WEB_CLIENT_ID',
      });

      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) throw new Error('Google Sign-In: no ID token');

      const { access_token } = await post<{ access_token: string }>('/auth/firebase-login', {
        id_token: idToken,
      });
      await this._finalizeLogin(access_token);
      return true;
    } catch (e: any) {
      throw new Error(`Google login failed: ${e.message}`);
    }
  }

  // ── Apple Sign-In ───────────────────────────────────────────────────────────

  async appleLogin(): Promise<boolean> {
    try {
      const { appleAuth } = await import('@invertase/react-native-apple-authentication');

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { identityToken } = appleAuthRequestResponse;
      if (!identityToken) throw new Error('Apple Sign-In: no identity token');

      const { access_token } = await post<{ access_token: string }>('/auth/firebase-login', {
        id_token: identityToken,
        display_name:
          appleAuthRequestResponse.fullName?.givenName ?? undefined,
      });
      await this._finalizeLogin(access_token);
      return true;
    } catch (e: any) {
      throw new Error(`Apple login failed: ${e.message}`);
    }
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    this._token = null;
    this._user = null;
    await TokenStorage.clearAll();
  }

  // ── Getters ──────────────────────────────────────────────────────────────────

  getToken(): string | null {
    return this._token;
  }

  getUser(): StoredUser | null {
    return this._user;
  }

  isLoggedIn(): boolean {
    return !!this._token;
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private async _finalizeLogin(token: string): Promise<void> {
    this._token = token;
    await TokenStorage.saveToken(token);

    // Fetch user profile from backend
    try {
      const user = await get<StoredUser>('/auth/me', token);
      this._user = user;
      await TokenStorage.saveUser(user);
    } catch {
      // Profile fetch failed — token is still valid, continue
    }
  }
}

export const authService = new AuthService();
