import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';
// @ts-ignore
import Sound from 'react-native-sound';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../types/navigation';
import { Meeting, MeetingSummary, TranscriptSegment, TranslationSegment } from '../types/meeting';
import * as MeetingService from '../services/MeetingService';

type MeetingDetailRouteProp = RouteProp<RootStackParamList, 'MeetingDetail'>;

// --- Sub-components (could be moved to separate files later) ---

const TabButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={onPress}
    >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{title}</Text>
    </TouchableOpacity>
);

const AudioPlayer = ({ duration, audioUrl }: { duration: number, audioUrl?: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [progress, setProgress] = useState(0);

    // Todo: Implement real sound logic using react-native-sound
    // For now, visual mock

    const togglePlay = () => setIsPlaying(!isPlaying);
    const cycleSpeed = () => {
        const speeds = [1, 1.5, 2];
        const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
        setSpeed(speeds[nextIndex]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={styles.playerContainer}>
            <View style={styles.progressBar}>
                <View style={{ width: `${(progress / duration) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
            </View>
            <View style={styles.playerControls}>
                <TouchableOpacity onPress={cycleSpeed} style={styles.speedButton}>
                    <Text style={styles.speedText}>{speed}x</Text>
                </TouchableOpacity>

                <View style={styles.mainControls}>
                    <TouchableOpacity onPress={() => setProgress(Math.max(0, progress - 15))}>
                        <Icon name="rotate-ccw" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
                        <Icon name={isPlaying ? "pause" : "play"} size={28} color={colors.onPrimary} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setProgress(Math.min(duration, progress + 15))}>
                        <Icon name="rotate-cw" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.timeText}>{formatTime(progress)} / {formatTime(duration)}</Text>
            </View>
        </View>
    );
};

const SummaryTab = ({ summary }: { summary?: MeetingSummary }) => {
    if (!summary) return <Text style={styles.emptyText}>No summary available.</Text>;

    return (
        <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Icon name="list" size={20} color={colors.primary} />
                    <Text style={styles.cardTitle}>Topics</Text>
                </View>
                {summary.topics.map((item) => (
                    <View key={item.id} style={styles.listItem}>
                        <Text style={styles.itemTitle}>• {item.title}</Text>
                        {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                    </View>
                ))}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Icon name="check-circle" size={20} color={colors.secondary} />
                    <Text style={styles.cardTitle}>Decisions</Text>
                </View>
                {summary.decisions.map((item) => (
                    <View key={item.id} style={styles.listItem}>
                        <Text style={styles.itemText}>✅ {item.description}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Icon name="zap" size={20} color={colors.error} />
                    <Text style={styles.cardTitle}>Action Items</Text>
                </View>
                {summary.actionItems.map((item) => (
                    <View key={item.id} style={styles.listItem}>
                        <Text style={[styles.itemText, item.isCompleted && styles.completedText]}>
                            🚀 {item.description} {item.assignee && <Text style={styles.assignee}>@{item.assignee}</Text>}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const TranscriptTab = ({ transcript }: { transcript?: TranscriptSegment[] }) => {
    const [search, setSearch] = useState('');

    const filtered = transcript?.filter(t => t.text.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <View style={styles.tabContent}>
            <View style={styles.searchBar}>
                <Icon name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search transcript..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <View style={styles.transcriptItem}>
                        <View style={styles.speakerInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.speakerName[0]}</Text>
                            </View>
                            <Text style={styles.speakerName}>{item.speakerName}</Text>
                            <Text style={styles.timestamp}>{Math.floor(item.startTime / 60)}:{Math.floor(item.startTime % 60).toString().padStart(2, '0')}</Text>
                        </View>
                        <Text style={styles.transcriptText}>{item.text}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const TranslationTab = ({ translation, transcript }: { translation?: TranslationSegment[], transcript?: TranscriptSegment[] }) => {
    // Simple mapped view assuming 1-to-1 mapping with transcript id
    return (
        <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 100 }}>
            {translation?.map((item) => (
                <View key={item.id} style={styles.translationItem}>
                    <Text style={styles.originalTextLabel}>Original:</Text>
                    <Text style={styles.originalText}>{item.originalText}</Text>
                    <View style={styles.separator} />
                    <Text style={styles.translatedTextLabel}>Translated:</Text>
                    <Text style={styles.translatedText}>{item.translatedText}</Text>
                </View>
            ))}
        </ScrollView>
    );
};


export default function MeetingDetailScreen() {
    const route = useRoute<MeetingDetailRouteProp>();
    const navigation = useNavigation();
    const { meetingId } = route.params;

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Summary' | 'Transcript' | 'Translation'>('Summary');
    const [title, setTitle] = useState('');

    useEffect(() => {
        loadMeeting();
    }, [meetingId]);

    const loadMeeting = async () => {
        try {
            const data = await MeetingService.getMeetingDetails(meetingId);
            setMeeting(data);
            setTitle(data.title);
        } catch (e) {
            Alert.alert("Error", "Failed to load meeting details");
        } finally {
            setLoading(false);
        }
    };

    const handleTitleBlur = () => {
        if (meeting && title !== meeting.title) {
            MeetingService.updateMeetingTitle(meeting.id, title);
        }
    };

    const handleExport = () => {
        Alert.alert("Export", "Export functionality to be implemented with react-native-share");
    };

    const handleDelete = () => {
        Alert.alert("Delete", "Are you sure you want to delete this meeting?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    if (meeting) {
                        await MeetingService.deleteMeeting(meeting.id);
                        navigation.goBack();
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!meeting) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Meeting not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerDate}>{new Date(meeting.date).toLocaleDateString()}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.titleContainer}>
                <TextInput
                    style={styles.titleInput}
                    value={title}
                    onChangeText={setTitle}
                    onBlur={handleTitleBlur}
                    multiline
                />
            </View>

            <AudioPlayer duration={meeting.duration} audioUrl={meeting.audioUrl} />

            <View style={styles.tabsContainer}>
                <TabButton title="AI Summary" isActive={activeTab === 'Summary'} onPress={() => setActiveTab('Summary')} />
                <TabButton title="Transcript" isActive={activeTab === 'Transcript'} onPress={() => setActiveTab('Transcript')} />
                <TabButton title="Translation" isActive={activeTab === 'Translation'} onPress={() => setActiveTab('Translation')} />
            </View>

            <View style={styles.contentContainer}>
                {activeTab === 'Summary' && <SummaryTab summary={meeting.summary} />}
                {activeTab === 'Transcript' && <TranscriptTab transcript={meeting.transcript} />}
                {activeTab === 'Translation' && <TranslationTab translation={meeting.translation} />}
            </View>

            <View style={styles.floatingActions}>
                <TouchableOpacity style={styles.fabSecondary} onPress={handleDelete}>
                    <Icon name="trash-2" size={20} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabPrimary} onPress={handleExport}>
                    <Icon name="share" size={24} color={colors.onPrimary} />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
    },
    headerDate: {
        color: colors.textSecondary,
        fontSize: typography.sizes.s,
    },
    titleContainer: {
        paddingHorizontal: spacing.m,
        marginBottom: spacing.s,
    },
    titleInput: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    playerContainer: {
        marginHorizontal: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.m,
        marginBottom: spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: colors.gray,
        borderRadius: 2,
        marginBottom: spacing.s,
        overflow: 'hidden',
    },
    playerControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    speedButton: {
        width: 40,
    },
    speedText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    timeText: {
        color: colors.textSecondary,
        fontSize: typography.sizes.xs,
        width: 80,
        textAlign: 'right',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabButton: {
        paddingVertical: spacing.s,
        marginRight: spacing.l,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        color: colors.textSecondary,
        fontWeight: typography.weights.medium,
    },
    tabTextActive: {
        color: colors.primary,
    },
    contentContainer: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
        padding: spacing.m,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: spacing.xl,
        color: colors.textSecondary,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.m,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
        gap: 8,
    },
    cardTitle: {
        fontSize: typography.sizes.m,
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    listItem: {
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: typography.sizes.s,
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    itemDesc: {
        fontSize: typography.sizes.s,
        color: colors.textSecondary,
        marginLeft: 8,
    },
    itemText: {
        fontSize: typography.sizes.s,
        color: colors.text,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    assignee: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: spacing.s,
        height: 40,
        marginBottom: spacing.m,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.s,
        height: '100%',
    },
    transcriptItem: {
        marginBottom: spacing.m,
    },
    speakerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primaryVariant,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    speakerName: {
        fontSize: typography.sizes.xs,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginRight: 8,
    },
    timestamp: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
    },
    transcriptText: {
        fontSize: typography.sizes.s,
        color: colors.text,
        lineHeight: 20,
    },
    translationItem: {
        backgroundColor: colors.surface,
        padding: spacing.m,
        borderRadius: 8,
        marginBottom: spacing.m,
    },
    originalTextLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    originalText: {
        fontSize: typography.sizes.s,
        color: colors.text,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    translatedTextLabel: {
        fontSize: 10,
        color: colors.primary,
        marginBottom: 2,
    },
    translatedText: {
        fontSize: typography.sizes.s,
        color: colors.text,
        fontWeight: '500',
    },
    floatingActions: {
        position: 'absolute',
        bottom: spacing.l,
        right: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    fabPrimary: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    fabSecondary: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 1,
        borderColor: colors.error,
    }
});
