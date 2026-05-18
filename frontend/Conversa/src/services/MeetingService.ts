import { Meeting } from '../types/meeting';

const API_BASE_URL = 'http://192.168.1.174:8000';

/**
 * Map a backend session document to the frontend Meeting type.
 * The backend stores fields like `created_at`, `transcript[].original`, etc.
 * that need slight re-mapping to match the existing UI expectations.
 */
function mapSessionToMeeting(session: any): Meeting {
    return {
        id: session.id,
        title: session.title || 'Untitled Meeting',
        date: session.created_at || new Date().toISOString(),
        duration: session.duration || 0,
        status: session.status || 'completed',
        source_lang: session.source_lang,
        target_lang: session.target_lang,
        // Map transcript — backend stores { id, text, timestamp }
        transcript: session.transcript?.map((seg: any) => ({
            id: seg.id,
            speakerId: 'default',
            speakerName: 'Speaker',
            startTime: seg.timestamp ?? 0,
            endTime: seg.timestamp ?? 0,
            text: seg.text,
            timestamp: seg.timestamp,
        })),
        // Map translation — backend stores { id, original, translated, timestamp }
        translation: session.translation?.map((seg: any) => ({
            id: seg.id,
            originalText: seg.original,
            translatedText: seg.translated,
            timestamp: seg.timestamp,
        })),
        // Summary already matches MeetingSummary shape (topics, decisions, actionItems, paragraph, bulletPoints)
        summary: session.summary,
    };
}

export const getMeetingsList = async (): Promise<Partial<Meeting>[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/session/list`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const sessions = await response.json();
        return sessions.map((s: any) => ({
            id: s.id,
            title: s.title || 'Untitled Meeting',
            date: s.created_at || new Date().toISOString(),
            duration: s.duration || 0,
            status: s.status || 'completed',
        }));
    } catch (e) {
        console.warn('Failed to fetch sessions from backend, returning empty list:', e);
        return [];
    }
};

export const getMeetingDetails = async (meetingId: string): Promise<Meeting> => {
    const response = await fetch(`${API_BASE_URL}/session/${meetingId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const session = await response.json();
    return mapSessionToMeeting(session);
};

export const updateMeetingTitle = async (meetingId: string, newTitle: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/session/${meetingId}/title?title=${encodeURIComponent(newTitle)}`, {
        method: 'PATCH',
    });
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/session/${meetingId}`, {
        method: 'DELETE',
    });
};
