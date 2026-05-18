import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Alert, Animated, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
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
  const [direction, setDirection] = useState<'EN_TO_TR' | 'TR_TO_EN'>('EN_TO_TR');
  const [currentSummary, setCurrentSummary] = useState('');
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
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

  const toggleDirection = () => {
    if (isRecording) {
      Alert.alert("Bekleyiniz", "Yönü değiştirmek için lütfen kaydı durdurun.");
      return;
    }
    setDirection(prev => prev === 'EN_TO_TR' ? 'TR_TO_EN' : 'EN_TO_TR');
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
        } else if (message.type === 'summary' && message.text) {
          setCurrentSummary(message.text);
          setShowSummaryPopup(true);
          // Hide popup automatically after 10 seconds
          setTimeout(() => {
            setShowSummaryPopup(false);
          }, 10000);
        }
      });

      // Send translation config to backend
      audioWebSocket.connect();
      // Small delay to ensure connection is established before sending config
      setTimeout(() => {
        audioWebSocket.sendConfig({
          source_lang: direction === 'EN_TO_TR' ? 'EN' : 'TR',
          target_lang: direction === 'EN_TO_TR' ? 'TR' : 'EN',
          provider: 'libre',
          translation_enabled: true,
          reset_session: !isSessionActive,
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
    setShowSaveDialog(true);
  };

  const handleSaveSession = () => {
    audioWebSocket.send(JSON.stringify({ type: 'command', command: 'save_session' }));
    setShowSaveDialog(false);
    setIsSessionActive(false);
    Alert.alert('Toplantı Kaydediliyor', 'Yapay zeka özeti çıkarılıyor ve oturum geçmişe kaydediliyor.');
  };

  const handleDiscardSession = () => {
    audioWebSocket.send(JSON.stringify({ type: 'command', command: 'discard_session' }));
    setShowSaveDialog(false);
    setIsSessionActive(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Language Selector */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.languagePill} onPress={toggleDirection} activeOpacity={0.7}>
          <View style={direction === 'EN_TO_TR' ? styles.activeLanguage : styles.inactiveLanguage}>
            {direction === 'EN_TO_TR' && <Icon name="globe" size={16} color={colors.text} style={styles.langIcon} />}
            <Text style={direction === 'EN_TO_TR' ? styles.activeLanguageText : styles.inactiveLanguageText}>English (US)</Text>
          </View>
          
          <Icon name="repeat" size={14} color={colors.textSecondary} style={{marginHorizontal: 4}} />

          <View style={direction === 'TR_TO_EN' ? styles.activeLanguage : styles.inactiveLanguage}>
            {direction === 'TR_TO_EN' && <Icon name="globe" size={16} color={colors.text} style={styles.langIcon} />}
            <Text style={direction === 'TR_TO_EN' ? styles.activeLanguageText : styles.inactiveLanguageText}>Turkish (TR)</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Summary Popup */}
      {showSummaryPopup && currentSummary ? (
        <View style={styles.summaryPopup}>
          <View style={styles.summaryHeader}>
            <Icon name="cpu" size={16} color="#fff" />
            <Text style={styles.summaryTitle}>AI Ara Özet</Text>
            <TouchableOpacity onPress={() => setShowSummaryPopup(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon name="x" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryText}>{currentSummary}</Text>
        </View>
      ) : null}

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
        <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="globe" size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>Translation</Text>
          </View>
          {translatedText ? (
            <TouchableOpacity onPress={() => {
              Clipboard.setString(translatedText);
              Alert.alert('Kopyalandı', 'Çeviri panoya kopyalandı!');
            }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="copy" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
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
                ? direction === 'EN_TO_TR' 
                  ? 'Dinleniyor ve çevirisi bekleniyor... (Cümle bitiminde çevrilecektir)' 
                  : 'Listening and waiting for translation... (Will translate at sentence end)'
                : direction === 'EN_TO_TR' 
                  ? 'Başlamak için mikrofona dokunun.' 
                  : 'Tap the microphone to start.'}
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

      {/* Save Session Dialog */}
      {showSaveDialog && (
        <View style={styles.saveDialogContainer}>
          <Text style={styles.saveDialogTitle}>Toplantı Kaydedilsin mi?</Text>
          <Text style={styles.saveDialogText}>
            Evet'e tıklarsanız yapay zeka detaylı bir özet çıkaracak ve konuşma Geçmiş sekmesine kaydedilecektir.
          </Text>
          <View style={styles.saveDialogButtons}>
            <TouchableOpacity style={[styles.saveDialogBtn, styles.discardBtn]} onPress={handleDiscardSession}>
              <Text style={styles.discardBtnText}>Hayır, Sil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveDialogBtn, styles.saveBtn]} onPress={handleSaveSession}>
              <Text style={styles.saveBtnText}>Evet, Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  summaryPopup: {
    position: 'absolute',
    top: 90,
    left: spacing.m,
    right: spacing.m,
    backgroundColor: 'rgba(20, 48, 28, 0.95)',
    padding: spacing.m,
    borderRadius: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: typography.sizes.s,
    flex: 1,
    marginLeft: 8,
  },
  summaryText: {
    color: '#E8F5E9',
    fontSize: typography.sizes.s,
    lineHeight: 20,
  },
  saveDialogContainer: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginTop: spacing.s,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  saveDialogTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  saveDialogText: {
    fontSize: typography.sizes.s,
    color: colors.textSecondary,
    marginBottom: spacing.m,
    textAlign: 'center',
    lineHeight: 18,
  },
  saveDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveDialogBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardBtn: {
    backgroundColor: '#FFEAEA',
    marginRight: spacing.s,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    marginLeft: spacing.s,
  },
  discardBtnText: {
    color: '#D32F2F',
    fontWeight: typography.weights.bold,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
  },
});
