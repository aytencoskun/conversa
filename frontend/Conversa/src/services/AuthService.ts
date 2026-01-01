import { Alert } from 'react-native';

// Mock Token for dev
const MOCK_TOKEN = "firebase_auth_token_example_12345";

class AuthService {
    private isAuthenticated = false;
    private token: string | null = null;

    async login(email: string, password: string): Promise<boolean> {
        console.log(`AuthService: Attempting login for ${email}`);
        // TODO: Connect to Firebase Auth
        // const userCredential = await auth().signInWithEmailAndPassword(email, password);

        // Simulate network delay
        await new Promise(resolve => setTimeout(() => resolve(true), 1000));

        if (email.includes('error')) {
            throw new Error('Invalid credentials');
        }

        this.isAuthenticated = true;
        this.token = MOCK_TOKEN;
        return true;
    }

    async signup(email: string, password: string): Promise<boolean> {
        console.log(`AuthService: Attempting signup for ${email}`);
        // TODO: Firebase Create User
        await new Promise(resolve => setTimeout(() => resolve(true), 1000));

        this.isAuthenticated = true;
        this.token = MOCK_TOKEN;
        return true;
    }

    async googleLogin(): Promise<boolean> {
        console.log('AuthService: Google Login');
        // TODO: Google Sign In Logic
        await new Promise(resolve => setTimeout(() => resolve(true), 1000));
        this.isAuthenticated = true;
        this.token = MOCK_TOKEN;
        return true;
    }

    async appleLogin(): Promise<boolean> {
        console.log('AuthService: Apple Login');
        // TODO: Apple Sign In Logic
        await new Promise(resolve => setTimeout(() => resolve(true), 1000));
        this.isAuthenticated = true;
        this.token = MOCK_TOKEN;
        return true;
    }

    async logout(): Promise<void> {
        console.log('AuthService: Logging out');
        this.isAuthenticated = false;
        this.token = null;
    }

    getToken(): string | null {
        return this.token;
    }

    isLoggedIn(): boolean {
        return this.isAuthenticated;
    }
}

export const authService = new AuthService();
