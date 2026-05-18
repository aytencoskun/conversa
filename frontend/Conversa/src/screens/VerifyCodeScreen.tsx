import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { authService } from '../services/AuthService';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';

type VerifyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyCode'>;
type VerifyScreenRouteProp = RouteProp<RootStackParamList, 'VerifyCode'>;

const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
    const navigation = useNavigation<VerifyScreenNavigationProp>();
    const route = useRoute<VerifyScreenRouteProp>();
    const { email } = route.params;

    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleCodeChange = (text: string, index: number) => {
        const newCode = [...code];

        if (text.length > 1) {
            // Handle paste — distribute digits across inputs
            const digits = text.replace(/\D/g, '').split('').slice(0, CODE_LENGTH);
            digits.forEach((d, i) => {
                if (i + index < CODE_LENGTH) newCode[i + index] = d;
            });
            setCode(newCode);
            const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
        } else {
            newCode[index] = text;
            setCode(newCode);
            if (text && index < CODE_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        }

        // Auto-submit when all digits entered
        const fullCode = newCode.join('');
        if (fullCode.length === CODE_LENGTH && !fullCode.includes('')) {
            handleVerify(fullCode);
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            const newCode = [...code];
            newCode[index - 1] = '';
            setCode(newCode);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (fullCode?: string) => {
        const codeStr = fullCode || code.join('');
        if (codeStr.length !== CODE_LENGTH) {
            Alert.alert('Error', 'Please enter the complete verification code');
            return;
        }

        setIsLoading(true);
        try {
            await authService.verifyCode(email, codeStr);
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message);
            setCode(Array(CODE_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        try {
            await authService.resendCode(email);
            setResendCooldown(60); // 60 second cooldown
            Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>

                        {/* Back Button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-left" size={24} color={colors.text} />
                        </TouchableOpacity>

                        {/* Icon */}
                        <View style={styles.iconCircle}>
                            <Icon name="mail" size={36} color={colors.primary} />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Verify Your Email</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to{'\n'}
                            <Text style={styles.emailText}>{email}</Text>
                        </Text>

                        {/* Code Input */}
                        <View style={styles.codeContainer}>
                            {code.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { inputRefs.current[index] = ref; }}
                                    style={[
                                        styles.codeInput,
                                        digit ? styles.codeInputFilled : {},
                                    ]}
                                    value={digit}
                                    onChangeText={(text) => handleCodeChange(text, index)}
                                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                    keyboardType="number-pad"
                                    maxLength={index === 0 ? CODE_LENGTH : 1} // Allow paste on first input
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={styles.verifyButton}
                            onPress={() => handleVerify()}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend */}
                        <View style={styles.resendContainer}>
                            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
                            <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0}>
                                <Text style={[styles.resendLink, resendCooldown > 0 && styles.resendDisabled]}>
                                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Expiry info */}
                        <View style={styles.infoContainer}>
                            <Icon name="clock" size={14} color={colors.textSecondary} />
                            <Text style={styles.infoText}>Code expires in 10 minutes</Text>
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
    content: {
        flex: 1,
        paddingHorizontal: spacing.l,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: spacing.m,
        left: spacing.l,
        padding: 8,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.gray,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    title: {
        fontSize: typography.sizes.xxl,
        fontWeight: typography.weights.bold as any,
        color: colors.text,
        marginBottom: spacing.s,
    },
    subtitle: {
        fontSize: typography.sizes.m,
        color: colors.textSecondary,
        textAlign: 'center' as const,
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    emailText: {
        color: colors.primary,
        fontWeight: typography.weights.bold as any,
    },
    codeContainer: {
        flexDirection: 'row' as const,
        justifyContent: 'center',
        gap: 10,
        marginBottom: spacing.xl,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        textAlign: 'center' as const,
        fontSize: 24,
        fontWeight: '700' as const,
        color: colors.text,
    },
    codeInputFilled: {
        borderColor: colors.primary,
        backgroundColor: '#F0F9F4',
    },
    verifyButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 56,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    verifyButtonText: {
        color: colors.onPrimary,
        fontSize: typography.sizes.m,
        fontWeight: typography.weights.bold as any,
    },
    resendContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: spacing.m,
    },
    resendLabel: {
        color: colors.textSecondary,
        fontSize: typography.sizes.m,
    },
    resendLink: {
        color: colors.primary,
        fontWeight: typography.weights.bold as any,
        fontSize: typography.sizes.m,
    },
    resendDisabled: {
        color: colors.textSecondary,
    },
    infoContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 6,
    },
    infoText: {
        fontSize: typography.sizes.s,
        color: colors.textSecondary,
    },
});
