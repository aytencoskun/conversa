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
    Keyboard,
    ScrollView // Added ScrollView for smaller screens
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

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
    const navigation = useNavigation<SignupScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await authService.signup(email, password);
            // Assuming success logs in automatically or asks to login
            // For this flow, let's go to MainTabs
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior="padding" // Optimized for iOS (Android behavior: 'height' commented out)
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Icon name="arrow-left" size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Start your journey with Conversa</Text>
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

                            {/* Confirm Password */}
                            <View style={styles.inputContainer}>
                                <Icon name="check-circle" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor={colors.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={secureTextEntry}
                                />
                            </View>

                            {/* Signup Button */}
                            <TouchableOpacity
                                style={styles.signupButton}
                                onPress={handleSignup}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.signupButtonText}>Create Account</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.footerLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.l,
        justifyContent: 'center',
    },
    headerContainer: {
        marginBottom: spacing.xl,
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontSize: typography.sizes.xxl,
        fontWeight: typography.weights.bold as any,
        color: colors.text,
        marginBottom: 8,
        marginTop: 40,
    },
    subtitle: {
        fontSize: typography.sizes.m,
        color: colors.textSecondary,
    },
    formContainer: {
        width: '100%',
        marginBottom: spacing.xl,
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
    signupButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.m,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    signupButtonText: {
        color: colors.onPrimary,
        fontSize: typography.sizes.m,
        fontWeight: typography.weights.bold as any,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
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
