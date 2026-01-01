# How to Run Conversa

Since you are on a Mac, the easiest way to run the app is on the **iOS Simulator**.

## Prerequisites
1.  **Node.js**: You likely have this installed.
2.  **Xcode**: Required for the iOS Simulator. You can install it from the Mac App Store.
3.  **CocoaPods**: Required for managing iOS dependencies. (We just ran `pod install` for you).

## Running on iOS Simulator

1.  **Start the Metro Bundler**:
    Open a terminal in the project folder (`frontend/Conversa`) and run:
    ```bash
    npm start
    ```
    Keep this terminal open.

2.  **Launch the App**:
    Open a **new** terminal tab/window in the same folder and run:
    ```bash
    npm run ios
    ```

This will launch the iPhone simulator and install the app.

## Running on Android Emulator

1.  **Android Studio**: You need Android Studio installed and an emulator set up.
2.  **Launch the App**:
    ```bash
    npm run android
    ```

## Troubleshooting
- If you see errors about "pods", try running:
  ```bash
  cd ios
  pod install
  cd ..
  ```
- If the build fails, make sure Xcode is updated.
