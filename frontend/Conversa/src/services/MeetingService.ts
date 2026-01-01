import { Meeting } from '../types/meeting';

// Mock data to simulate backend response
const MOCK_MEETING: Meeting = {
    id: '1',
    title: 'Weekly Sync - Engineering',
    date: new Date().toISOString(),
    duration: 3600, // 1 hour
    status: 'completed',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Sample audio
    summary: {
        topics: [
            { id: 't1', title: 'Q1 Roadmap Review', description: 'discussed the upcoming features for Q1' },
            { id: 't2', title: 'Performance Issues', description: 'addressed latency in the API' },
        ],
        decisions: [
            { id: 'd1', description: 'Adopt React Native for mobile app' },
            { id: 'd2', description: 'Migrate to PostgreSQL' },
        ],
        actionItems: [
            { id: 'a1', description: 'Create Jira tickets for roadmap', assignee: 'John', isCompleted: false },
            { id: 'a2', description: 'Benchmark DB queries', assignee: 'Jane', isCompleted: true },
        ],
    },
    transcript: [
        { id: 'tr1', speakerId: 's1', speakerName: 'Alice', startTime: 0, endTime: 5, text: 'Hello everyone, let\'s start.' },
        { id: 'tr2', speakerId: 's2', speakerName: 'Bob', startTime: 6, endTime: 12, text: 'Sure, I have the updates ready.' },
        { id: 'tr3', speakerId: 's1', speakerName: 'Alice', startTime: 13, endTime: 20, text: 'Great, please go ahead.' },
        { id: 'tr4', speakerId: 's2', speakerName: 'Bob', startTime: 21, endTime: 45, text: 'We have completed the initial phase of the migration. However, we are facing some issues with the legacy data format.' },
    ],
    translation: [
        { id: 'tr1', originalText: 'Hello everyone, let\'s start.', translatedText: 'Herkese merhaba, başlayalım.' },
        { id: 'tr2', originalText: 'Sure, I have the updates ready.', translatedText: 'Tabii, güncellemeler hazır.' },
        { id: 'tr3', originalText: 'Great, please go ahead.', translatedText: 'Harika, lütfen devam et.' },
        { id: 'tr4', originalText: 'We have completed the initial phase of the migration. However, we are facing some issues with the legacy data format.', translatedText: 'Göçün ilk aşamasını tamamladık. Ancak, eski veri formatıyla ilgili bazı sorunlarla karşı karşıyayız.' },
    ]
};

export const getMeetingDetails = async (meetingId: string): Promise<Meeting> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(() => resolve(undefined), 500));

    return {
        ...MOCK_MEETING,
        id: meetingId,
    };
};

export const updateMeetingTitle = async (meetingId: string, newTitle: string): Promise<void> => {
    await new Promise(resolve => setTimeout(() => resolve(undefined), 300));
    console.log(`Updated meeting ${meetingId} title to: ${newTitle}`);
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(() => resolve(undefined), 300));
    console.log(`Deleted meeting ${meetingId}`);
};
