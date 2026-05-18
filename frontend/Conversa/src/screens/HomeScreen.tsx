import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../services/AuthService';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [recordings, setRecordings] = useState<any[]>([]);
    const [displayName, setDisplayName] = useState('');
    const [totalDuration, setTotalDuration] = useState('0m');
    const [summaryCount, setSummaryCount] = useState(0);

    // Kullanıcı bilgilerini yükle
    useFocusEffect(
        useCallback(() => {
            const user = authService.getUser();
            if (user) {
                setDisplayName(user.display_name || user.email?.split('@')[0] || 'there');
            }
            // TODO: Backend'den gerçek kayıtları çek
            // setRecordings(...)
        }, [])
    );

    // Helper to render status badge
    const renderStatus = (status: string) => {
        const isProcessing = status === 'processing';
        return (
            <View style={[styles.statusBadge, isProcessing ? styles.statusProcessing : styles.statusCompleted]}>
                <View style={[styles.statusDot, { backgroundColor: isProcessing ? '#F59E0B' : '#10B981' }]} />
                <Text style={[styles.statusText, { color: isProcessing ? '#B45309' : '#047857' }]}>
                    {isProcessing ? 'Processing' : 'Done'}
                </Text>
            </View>
        );
    };

    const renderItem = (item: any) => (
        <TouchableOpacity style={styles.card} key={item.id}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Icon name="mic" size={18} color={colors.primary} />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{item.date} • {item.duration}</Text>
                </View>
                {renderStatus(item.status)}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
                        <Text style={styles.subGreeting}>Ready to capture your thoughts?</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
                            <Icon name="settings" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                            <Icon name="bell" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
                        <View style={styles.statIconCircle}>
                            <Icon name="clock" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{totalDuration}</Text>
                            <Text style={styles.statLabel}>Recorded this month</Text>
                        </View>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#E0D0C1' }]}>
                        <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                            <Icon name="file-text" size={20} color="#5C4033" />
                        </View>
                        <View>
                            <Text style={[styles.statValue, { color: '#5C4033' }]}>
                                {summaryCount} {summaryCount === 1 ? 'Summary' : 'Summaries'}
                            </Text>
                            <Text style={[styles.statLabel, { color: '#8D6E63' }]}>Generated this week</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Recordings */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Recordings</Text>
                    {recordings.length > 0 && (
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {recordings.length > 0 ? (
                    recordings.map((item) => (
                        <View key={item.id} style={{ marginBottom: spacing.m }}>
                            {renderItem(item)}
                        </View>
                    ))
                ) : (
                    /* ── Empty State ── */
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Icon name="mic" size={32} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>No recordings yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap the microphone button below to{'\n'}start your first recording session!
                        </Text>
                        <View style={styles.tipContainer}>
                            <Icon name="info" size={14} color={colors.primary} />
                            <Text style={styles.tipText}>
                                Conversa will transcribe, translate and{'\n'}summarize your audio automatically
                            </Text>
                        </View>
                    </View>
                )}

                {/* Space for Tab Bar */}
                <View style={{ height: 100 }} />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
        marginTop: spacing.s,
    },
    greeting: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold as any,
        color: colors.text,
    },
    subGreeting: {
        fontSize: typography.sizes.s,
        color: colors.textSecondary,
        marginTop: 4,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        backgroundColor: colors.surface,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: spacing.m,
        marginHorizontal: 4,
        height: 120,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    statValue: {
        fontSize: typography.sizes.l,
        fontWeight: typography.weights.bold as any,
        color: colors.onPrimary,
    },
    statLabel: {
        fontSize: typography.sizes.xs,
        color: 'rgba(255,255,255,0.8)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    sectionTitle: {
        fontSize: typography.sizes.l,
        fontWeight: typography.weights.bold as any,
        color: colors.text,
    },
    seeAll: {
        fontSize: typography.sizes.s,
        color: colors.primary,
        fontWeight: typography.weights.medium as any,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.gray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: typography.sizes.m,
        fontWeight: typography.weights.medium as any,
        color: colors.text,
        marginBottom: 2,
    },
    cardDate: {
        fontSize: typography.sizes.s,
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusProcessing: {
        backgroundColor: '#FEF3C7',
    },
    statusCompleted: {
        backgroundColor: '#D1FAE5',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    // ── Empty State ──
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl * 1.5,
        paddingHorizontal: spacing.l,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.gray,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    emptyTitle: {
        fontSize: typography.sizes.l,
        fontWeight: typography.weights.bold as any,
        color: colors.text,
        marginBottom: spacing.s,
    },
    emptySubtitle: {
        fontSize: typography.sizes.m,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.l,
    },
    tipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tipText: {
        fontSize: typography.sizes.s,
        color: colors.textSecondary,
        marginLeft: spacing.s,
        lineHeight: 18,
    },
});
