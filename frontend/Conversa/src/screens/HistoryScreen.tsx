import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../types/navigation';
import { Meeting } from '../types/meeting';
import * as MeetingService from '../services/MeetingService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [sessions, setSessions] = useState<Partial<Meeting>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await MeetingService.getMeetingsList();
      setSessions(data);
    } catch (e) {
      console.warn('Failed to load sessions:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [])
  );

  const renderItem = ({ item }: { item: Partial<Meeting> }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('MeetingDetail', { meetingId: item.id! })}
    >
      <View style={styles.cardIcon}>
        <Icon name={item.status === 'processing' ? 'loader' : 'check-circle'} size={24} color={item.status === 'processing' ? colors.secondary : colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.date!).toLocaleDateString()} • {Math.floor((item.duration || 0) / 60)} min
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={item => item.id!}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => fetchSessions(true)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
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
    paddingBottom: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  listContent: {
    padding: spacing.m,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: typography.sizes.s,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.sizes.m,
    color: colors.textSecondary,
  },
});
