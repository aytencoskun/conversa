import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';
import { audioService } from '../services/AudioService';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const checkPermissions = async () => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
    const result = await check(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    const requestResult = await request(permission);
    return requestResult === RESULTS.GRANTED;
  };

  const startRecording = async () => {
    const hasPermission = await checkPermissions();

    if (!hasPermission) {
      Alert.alert("Permission Denied", "Microphone permission is required to record audio.");
      return;
    }

    try {
      audioService.start();
      setIsRecording(true);
    } catch (e) {
      console.error("AudioService start failed:", e);
      Alert.alert("Error", "Failed to start audio stream");
    }
  };

  const stopRecording = () => {
    audioService.stop();
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Language Selector */}
      <View style={styles.header}>
        <View style={styles.languagePill}>
          <View style={styles.activeLanguage}>
            <Icon name="globe" size={16} color={colors.text} style={styles.langIcon} />
            <Text style={styles.activeLanguageText}>English (US)</Text>
            <Icon name="feather" size={12} color={colors.text} style={styles.leafIcon} />
          </View>
          <View style={styles.inactiveLanguage}>
            <Text style={styles.inactiveLanguageText}>Spanish (ES)</Text>
            <Icon name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
        </View>
      </View>

      {/* Main Content - Mic Visualization */}
      <View style={styles.micContainer}>
        <View style={[styles.organicBlob, styles.blob3]} />
        <View style={[styles.organicBlob, styles.blob2]} />
        <LinearGradient
          colors={isRecording ? [colors.primary, colors.micBackground] : [colors.micBackground, colors.primary]}
          style={[styles.organicBlob, styles.blob1]}
        >
          <TouchableOpacity onPress={handleToggleRecording} activeOpacity={0.8}>
            <Ionicons name={isRecording ? "stop-circle-outline" : "mic-circle-outline"} size={64} color="#F9F7F2" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Text Card */}
      <View style={styles.textCard}>
        <Text style={styles.transcribedText}>
          {isRecording ? "Listening..." : "Tap microphone to start recording."}
        </Text>
      </View>

      {/* Footer - Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={stopRecording} disabled={!isRecording}>
          <LinearGradient
            colors={['#c8aa92', '#f1ede1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.pauseGradient, { opacity: isRecording ? 1 : 0.5 }]}
          >
            <Icon name="pause" size={24} color="#14301c" />
            <Text style={[styles.buttonText, styles.pauseButtonText]}>Pause</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={stopRecording} disabled={!isRecording}>
          <LinearGradient
            colors={['#9db297', '#cdae94']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.stopGradient, { opacity: isRecording ? 1 : 0.5 }]}
          >
            <Icon name="square" size={24} color="#1f341f" />
            <Text style={[styles.buttonText, styles.stopButtonText]}>Stop</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.m,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.l,
  },
  languagePill: {
    flexDirection: 'row',
    backgroundColor: colors.gray,
    borderRadius: 24,
    padding: 4,
    alignItems: 'center',
  },
  activeLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B8C5BD', // Muted Green
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  langIcon: { marginRight: 8 },
  leafIcon: { marginLeft: 8 },
  activeLanguageText: {
    fontSize: typography.sizes.s,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  inactiveLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inactiveLanguageText: {
    fontSize: typography.sizes.s,
    color: colors.textSecondary,
    marginRight: 8,
  },
  micContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 300,
  },
  organicBlob: {
    position: 'absolute',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob1: {
    width: 160,
    height: 160,
    zIndex: 3,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob2: {
    width: 200,
    height: 200,
    backgroundColor: '#A3B5AC', // Lighter Sage
    opacity: 0.6,
    zIndex: 2,
    transform: [{ scale: 1.1 }],
  },
  blob3: {
    width: 240,
    height: 240,
    backgroundColor: '#D8C8BC', // Beige/Sand
    opacity: 0.4,
    zIndex: 1,
    transform: [{ scale: 1.2 }],
  },
  textCard: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 24,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  transcribedText: {
    fontSize: typography.sizes.m,
    color: colors.text,
    lineHeight: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  controlButton: {
    width: '48%',
    height: 64, // Fixed height
    borderRadius: 32,
    overflow: 'hidden', // Ensure gradient stays within bounds
  },
  pauseGradient: {
    flex: 1, // Fill container
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0C0B0',
    borderRadius: 32,
  },
  stopGradient: {
    flex: 1, // Fill container
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7A8C7F',
    borderRadius: 32,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
  },
  pauseButtonText: {
    color: '#14301c',
  },
  stopButtonText: {
    color: '#1f341f',
  },
});
