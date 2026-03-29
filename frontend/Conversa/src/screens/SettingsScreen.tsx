import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';
import { authService } from '../services/AuthService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const SettingItem = ({
  label,
  value,
  onPress,
  hasArrow = true,
  rightElement
}: {
  label: string,
  value?: string,
  onPress?: () => void,
  hasArrow?: boolean,
  rightElement?: React.ReactNode
}) => (
  <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress}>
    <Text style={styles.itemLabel}>{label}</Text>
    <View style={styles.itemRight}>
      {value && <Text style={styles.itemValue}>{value}</Text>}
      {rightElement}
      {hasArrow && <Icon name="chevron-right" size={20} color={colors.textSecondary} />}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();

  // Mock State
  const [spokenLang, setSpokenLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Turkish');
  const [translationProvider, setTranslationProvider] = useState('LibreTranslate');
  const [summaryFormat, setSummaryFormat] = useState('Bullet Points');
  const [userEmail] = useState('ayten@example.com');
  const [storageUsed] = useState('1.2 GB / 5.0 GB');

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>

        {/* Account Section */}
        <View style={styles.section}>
          <SectionTitle title="Account" />
          <SettingItem label="Email" value={userEmail} hasArrow={false} />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="log-out" size={20} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Language Preferences */}
        <View style={styles.section}>
          <SectionTitle title="Language Preferences" />
          <SettingItem
            label="Spoken Language"
            value={spokenLang}
            onPress={() => Alert.alert('Change Spoken Language', 'Selector to be implemented')}
          />
          <Text style={styles.helperText}>Used as a hint for Whisper transcription accuracy.</Text>

          <SettingItem
            label="Translation Target"
            value={targetLang}
            onPress={() => Alert.alert('Change Target Language', 'Selector to be implemented')}
          />

          <SettingItem
            label="Translation Provider"
            value={translationProvider}
            onPress={() => {
              Alert.alert('Translation Provider', 'Select a provider', [
                { text: 'DeepL', onPress: () => setTranslationProvider('DeepL') },
                { text: 'LibreTranslate', onPress: () => setTranslationProvider('LibreTranslate') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
          <Text style={styles.helperText}>DeepL (cloud) or LibreTranslate (self-hosted).</Text>
        </View>

        {/* Summary Format */}
        <View style={styles.section}>
          <SectionTitle title="Summary Format" />
          <SettingItem
            label="Format Style"
            value={summaryFormat}
            onPress={() => Alert.alert('Change Format', 'Options: Short, Detailed, Bullet Points')}
          />
          <Text style={styles.helperText}>Determines style of AI generated summaries.</Text>
        </View>

        {/* Storage */}
        <View style={styles.section}>
          <SectionTitle title="Storage" />
          <SettingItem label="Storage Used" value={storageUsed} hasArrow={false} />
          <View style={styles.storageBarBg}>
            <View style={[styles.storageBarFill, { width: '24%' }]} />
          </View>
        </View>

      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: typography.sizes.s,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s + 4,
  },
  itemLabel: {
    fontSize: typography.sizes.m,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: typography.sizes.m,
    color: colors.textSecondary,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.s,
    paddingVertical: spacing.s,
  },
  logoutText: {
    color: colors.error,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.m,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: -4,
    marginBottom: spacing.s,
    marginLeft: spacing.xs,
  },
  storageBarBg: {
    height: 8,
    backgroundColor: colors.gray,
    borderRadius: 4,
    marginTop: spacing.s,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  }
});
