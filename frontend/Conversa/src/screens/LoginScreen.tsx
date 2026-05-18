import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { authService } from '../services/AuthService';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            await authService.login(email, password);
            // Navigation will be handled by the AppNavigator observing Auth State
            // But for now, since we don't have the observer set up in this step yet, 
            // we might manually navigate or reload. 
            // Ideally, App.tsx should re-render.
            // For this step, let's assume valid login triggers a "Success" alert or nav.
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const success = await authService.googleLogin();
            if (success) {
                navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Google Login Failed');
        } finally { setIsLoading(false); }
    };

    const handleAppleLogin = async () => {
        setIsLoading(true);
        try {
            const success = await authService.appleLogin();
            if (success) {
                navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Apple Login Failed');
        } finally { setIsLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior="padding" // Optimized for iOS (Android behavior: 'height' commented out)
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.inner}>

                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            {/* Email */}
                            <View style={styles.inputContainer}>
                                <Icon name="mail" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor={colors.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Password */}
                            <View style={styles.inputContainer}>
                                <Icon name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor={colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={secureTextEntry}
                                />
                                <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                                    <Icon name={secureTextEntry ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                )}
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.line} />
                                <Text style={styles.orText}>OR</Text>
                                <View style={styles.line} />
                            </View>

                            {/* Social Login */}
                            <View style={styles.socialContainer}>
                                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                                    {/* Placeholder for Google Icon */}
                                    <Icon name="globe" size={20} color={colors.text} />
                                    <Text style={styles.socialButtonText}>Google</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
                                    {/* Placeholder for Apple Icon */}
                                    <Icon name="command" size={20} color={colors.text} />
                                    <Text style={styles.socialButtonText}>Apple</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.footerLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    inner: {
        flex: 1,
        paddingHorizontal: spacing.l,
        justifyContent: 'flex-start',
        paddingTop: 140, // Push content down
    },
    headerContainer: {
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    title: {
        fontSize: typography.sizes.xxl,
        fontWeight: typography.weights.bold as any,
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: typography.sizes.m,
        color: colors.textSecondary,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.m,
        paddingHorizontal: spacing.m,
        height: 56,
    },
    inputIcon: {
        marginRight: spacing.s,
    },
    input: {
        flex: 1,
        height: '100%',
        color: colors.text,
        fontSize: typography.sizes.m,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: spacing.l,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontWeight: typography.weights.medium as any,
        fontSize: typography.sizes.s,
    },
    loginButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonText: {
        color: colors.onPrimary,
        fontSize: typography.sizes.m,
        fontWeight: typography.weights.bold as any,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    orText: {
        marginHorizontal: spacing.m,
        color: colors.textSecondary,
        fontSize: typography.sizes.s,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    socialButtonText: {
        marginLeft: 8,
        color: colors.text,
        fontWeight: typography.weights.medium as any,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: spacing.l,
    },
    footerText: {
        color: colors.textSecondary,
        fontSize: typography.sizes.m,
    },
    footerLink: {
        color: colors.primary,
        fontWeight: typography.weights.bold as any,
        fontSize: typography.sizes.m,
    },
});
