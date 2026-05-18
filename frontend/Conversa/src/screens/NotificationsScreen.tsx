import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';

// Gerçek bildirimler gelene kadar boş dizi — backend entegrasyonu ile doldurulacak
const NOTIFICATIONS: any[] = [];

export default function NotificationsScreen() {
    const navigation = useNavigation();

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={[styles.card, !item.isRead && styles.unreadCard]}>
            <View style={styles.iconContainer}>
                <Icon name={item.isRead ? "bell" : "bell-off"} size={20} color={item.isRead ? colors.textSecondary : colors.primary} />
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={NOTIFICATIONS}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={[
                    styles.listContent,
                    NOTIFICATIONS.length === 0 && styles.emptyListContent,
                ]}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Icon name="bell" size={36} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>All caught up!</Text>
                        <Text style={styles.emptySubtitle}>
                            You don't have any notifications yet.{'\n'}
                            We'll let you know when something{'\n'}
                            interesting happens.
                        </Text>
                        <View style={styles.tipContainer}>
                            <Icon name="mic" size={14} color={colors.primary} />
                            <Text style={styles.tipText}>
                                Start a recording to get notified{'\n'}when processing is complete
                            </Text>
                        </View>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    title: {
        fontSize: typography.sizes.l,
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    listContent: {
        padding: spacing.m,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        padding: spacing.m,
        borderRadius: 12,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    unreadCard: {
        backgroundColor: '#F0F9F4',
        borderColor: colors.primary,
    },
    iconContainer: {
        marginRight: spacing.m,
        justifyContent: 'center',
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: typography.sizes.m,
        fontWeight: typography.weights.medium,
        color: colors.text,
        flex: 1,
    },
    unreadText: {
        fontWeight: typography.weights.bold,
        color: colors.primary,
    },
    timeText: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
    },
    cardMessage: {
        fontSize: typography.sizes.s,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    // ── Empty State ──
    emptyContainer: {
        alignItems: 'center',
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
