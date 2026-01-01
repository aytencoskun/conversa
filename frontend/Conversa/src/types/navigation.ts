import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
    Home: undefined;
    Record: undefined;
    History: undefined;
    // Settings removed
};

export type RootStackParamList = {
    Login: undefined;
    Signup: undefined;
    ForgotPassword: undefined;
    Settings: undefined;
    Notifications: undefined;
    MainTabs: undefined;
    MeetingDetail: { meetingId: string };
    // Add other stack screens here if needed (e.g., Login, Onboarding)
};
