export interface TranscriptSegment {
    id: string;
    speakerId: string;
    speakerName: string;
    startTime: number;
    endTime: number;
    text: string;
}

export interface SummaryActionItem {
    id: string;
    assignee?: string;
    description: string;
    isCompleted: boolean;
}

export interface SummaryDecision {
    id: string;
    description: string;
}

export interface SummaryTopic {
    id: string;
    title: string;
    description?: string;
}

export interface MeetingSummary {
    topics: SummaryTopic[];
    decisions: SummaryDecision[];
    actionItems: SummaryActionItem[];
    fullText?: string;
}

export interface TranslationSegment {
    id: string; // Should match transcript segment id
    translatedText: string;
    originalText: string;
}

export interface Meeting {
    id: string;
    title: string;
    date: string; // ISO string
    duration: number; // in seconds
    audioUrl?: string; // Firebase storage URL

    // These might be loaded lazily, but for now we include them
    transcript?: TranscriptSegment[];
    translation?: TranslationSegment[];
    summary?: MeetingSummary;

    status: 'processing' | 'completed' | 'failed';
}
