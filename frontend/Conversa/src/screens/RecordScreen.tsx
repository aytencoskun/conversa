import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Alert, Animated, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';
import { audioService } from '../services/AudioService';
import { audioWebSocket, WSMessage } from '../services/WebSocketService';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const originalScrollRef = useRef<ScrollView>(null);
  const translationScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      audioWebSocket.removeMessageHandler();
    };
  }, []);

  const checkPermissions = async () => {
    // Optimized for iOS. Android permission commented out.
    const permission = PERMISSIONS.IOS.MICROPHONE;
    // const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
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
      Alert.alert(
        "Microphone Permission Required",
        "To record audio, please allow microphone access in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    try {
      // Only clear texts if starting a completely new session
      if (!isSessionActive) {
        setTranscribedText('');
        setTranslatedText('');
        setIsSessionActive(true);
      }

      // Register WebSocket message handler for live transcription + translation
      audioWebSocket.onMessage((message: WSMessage) => {
        if (message.type === 'partial_transcript' && message.text) {
          setTranscribedText(prev => {
            const separator = prev.length > 0 ? ' ' : '';
            return prev + separator + message.text;
          });
        } else if (message.type === 'translation' && message.translated) {
          setTranslatedText(prev => {
            const separator = prev.length > 0 ? ' ' : '';
            return prev + separator + message.translated;
          });
        }
      });

      // Send translation config to backend
      audioWebSocket.connect();
      // Small delay to ensure connection is established before sending config
      setTimeout(() => {
        audioWebSocket.sendConfig({
          source_lang: 'EN',
          target_lang: 'TR',
          provider: 'libre',
          translation_enabled: true,
        });
      }, 500);

      audioService.start();
      setIsRecording(true);
    } catch (e) {
      console.error("AudioService start failed:", e);
      Alert.alert("Error", "Failed to start audio stream");
    }
  };

  const stopRecording = () => {
    // audioWebSocket.removeMessageHandler(); // REMOVED: Keep active to catch delayed background translations!
    audioService.stop();
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording(); // Acts as pause
    } else {
      startRecording(); // Acts as resume
    }
  };

  const handleDefinitiveStop = () => {
    stopRecording();
    setIsSessionActive(false); // Next start will clear the screen
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
            <Text style={styles.inactiveLanguageText}>Turkish (TR)</Text>
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

      {/* Single-Screen Text Card: Translation Focused */}
      <View style={styles.textCard}>
        <View style={styles.sectionHeader}>
          <Icon name="globe" size={16} color={colors.primary} />
          <Text style={styles.sectionLabel}>Translation</Text>
        </View>
        <ScrollView
          ref={translationScrollRef}
          style={styles.textScrollView}
          onContentSizeChange={() => translationScrollRef.current?.scrollToEnd({ animated: true })}
        >
          <Text style={styles.transcribedText}>
            {translatedText
              ? translatedText
              : isRecording
                ? 'Dinleniyor ve çevirisi bekleniyor... (Cümle bitiminde çevrilecektir)'
                : 'Başlamak için mikrofona dokunun.'}
          </Text>
        </ScrollView>
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

        <TouchableOpacity style={styles.controlButton} onPress={handleDefinitiveStop} disabled={!isSessionActive}>
          <LinearGradient
            colors={['#9db297', '#cdae94']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.stopGradient, { opacity: isSessionActive ? 1 : 0.5 }]}
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
    minHeight: 220,
  },
  organicBlob: {
    position: 'absolute',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob1: {
    width: 140,
    height: 140,
    zIndex: 3,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob2: {
    width: 175,
    height: 175,
    backgroundColor: '#A3B5AC',
    opacity: 0.6,
    zIndex: 2,
    transform: [{ scale: 1.1 }],
  },
  blob3: {
    width: 210,
    height: 210,
    backgroundColor: '#D8C8BC',
    opacity: 0.4,
    zIndex: 1,
    transform: [{ scale: 1.2 }],
  },
  // Single-screen text card
  textCard: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 24,
    marginBottom: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    maxHeight: 260,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.m,
  },
  textScrollView: {
    flexGrow: 0,
    maxHeight: 80,
  },
  transcribedText: {
    fontSize: typography.sizes.m,
    color: colors.text,
    lineHeight: 22,
  },
  translatedText: {
    fontSize: typography.sizes.m,
    color: colors.primary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  controlButton: {
    width: '48%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  pauseGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0C0B0',
    borderRadius: 32,
  },
  stopGradient: {
    flex: 1,
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
