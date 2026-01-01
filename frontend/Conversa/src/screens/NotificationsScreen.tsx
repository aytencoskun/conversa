import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';

// Mock Data
const NOTIFICATIONS = [
    { id: '1', title: 'Meeting Processed', message: 'Your "Weekly Sync" meeting is ready for review.', time: '2 mins ago', isRead: false },
    { id: '2', title: 'New Feature', message: 'Try out the new Translation tab in your meeting details.', time: '1 hour ago', isRead: false },
    { id: '3', title: 'System Update', message: 'Conversa will be under maintenance tonight at 2 AM.', time: '1 day ago', isRead: true },
    { id: '4', title: 'Welcome!', message: 'Thanks for joining Conversa. Start recording your first meeting.', time: '2 days ago', isRead: true },
];

export default function NotificationsScreen() {
    const navigation = useNavigation();

    const renderItem = ({ item }: { item: typeof NOTIFICATIONS[0] }) => (
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
                <TouchableOpacity style={styles.clearButton}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={NOTIFICATIONS}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="bell" size={48} color={colors.border} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
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
    clearButton: {
        padding: 8,
    },
    clearText: {
        fontSize: typography.sizes.s,
        color: colors.primary,
    },
    listContent: {
        padding: spacing.m,
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
        backgroundColor: '#F0F9F4', // Very light green
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
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xl * 2,
    },
    emptyText: {
        marginTop: spacing.m,
        fontSize: typography.sizes.m,
        color: colors.textSecondary,
    },
});
