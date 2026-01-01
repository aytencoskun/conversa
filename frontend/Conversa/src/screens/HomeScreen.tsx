import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock Data
const RECENT_RECORDINGS = [
    { id: '1', title: 'Product Design Sync', date: 'Today, 10:00 AM', duration: '45:00', status: 'processing' },
    { id: '2', title: 'Client Interview', date: 'Yesterday, 2:30 PM', duration: '23:15', status: 'completed' },
    { id: '3', title: 'Idea Brainstorm', date: 'Oct 24, 9:00 AM', duration: '12:05', status: 'completed' },
];

export default function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();

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

    const renderItem = ({ item }: { item: typeof RECENT_RECORDINGS[0] }) => (
        <TouchableOpacity style={styles.card}>
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
                        <Text style={styles.greeting}>Hello, Ayten</Text>
                        <Text style={styles.subGreeting}>Ready to capture your thoughts?</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
                            <Icon name="settings" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                            <Icon name="bell" size={24} color={colors.text} />
                            <View style={styles.badge} />
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
                            <Text style={styles.statValue}>12h 45m</Text>
                            <Text style={styles.statLabel}>Recorded this month</Text>
                        </View>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#E0D0C1' }]}>
                        <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                            <Icon name="file-text" size={20} color="#5C4033" />
                        </View>
                        <View>
                            <Text style={[styles.statValue, { color: '#5C4033' }]}>5 Summaries</Text>
                            <Text style={[styles.statLabel, { color: '#8D6E63' }]}>Generated this week</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Recordings */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Recordings</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {RECENT_RECORDINGS.map((item) => (
                    <View key={item.id} style={{ marginBottom: spacing.m }}>
                        {renderItem({ item })}
                    </View>
                ))}

                {/* Space for FAB / Tab Bar */}
                <View style={{ height: 100 }} />

            </ScrollView>

            {/* Floating Action Button (Alternative to Tab Bar center button if needed, but sticking to Tab bar is usually UX standard. 
            However, user requested "Alt Bölüm (Action Button - FAB)". 
            If I place it here, it might overlap tab bar.
            I will rely on the Tab Bar "Record" button as the primary action, but maybe add a smaller quick action here?
            Actually the user said "Large, attention-grabbing Microphone button".
            Let's assume the Tab Bar middle button IS that button. But to be safe, I'll add a visual cue or a specific FAB if the tab bar isn't enough.
            Let's stick to the Tab Bar for now to avoid specific layout collisions. 
        */}

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
    badge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
        borderWidth: 1,
        borderColor: colors.surface,
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
        height: 120, // Taller card
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
        fontSize: typography.sizes.s, // Using s (14) instead of xs (12) for better readability
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
        fontSize: 10, // Small text
        fontWeight: '600',
    },
});
