# Studymor

A comprehensive mobile study companion application. A modern, responsive React Native application built with **Expo**, featuring a focus-centric design, real-time analytics, and a seamless cross-platform user experience.

## 📥 Download Android App

**Try it now on your device!**
You can download the latest APK file directly from this repository:

👉 **[Download Studymor.apk](./release/studymor.apk)**

*(Note: If you get a security warning during installation, select "Install Anyway" as this is a developer build.)*

---

## Project Overview

Studymor provides students with an intelligent interface to plan sessions, track focus time, and manage subjects. The app connects to **Firebase** to provide real-time data synchronization, persistent user authentication, and cloud-based analytics.

**Main Features:**
* **Smart Dashboard:** Visualizes study habits with an interactive Line Chart (last 7 days), "Daily Goal" progress bar, and dynamic greetings based on the time of day.
* **Focus Timer:** A customizable Pomodoro-style timer with selectable subjects and background ringtones (e.g., Classic Alarm, Soft Chime) to enhance concentration.
* **Study Planner:** A scheduling system where users can book future study sessions with specific subjects and time slots.
* **Profile Hub & Analytics:**
    * **Dark Mode:** A system-wide toggle (Light/Dark themes) using NativeWind.
    * **Statistics:** Real-time tracking of total study hours and session counts.
    * **Profile Customization:** Upload and manage profile pictures.
* **Motivational Engine:** Fetches daily motivational quotes from an external API to keep users inspired.
* **Secure Authentication:** Robust Login and Sign-Up flows with Gradient aesthetics, Glassmorphism cards, and smooth entry animations.

## Technologies & Tools

* **Core:** React Native (Expo SDK 52), TypeScript
* **Styling:** NativeWind (Tailwind CSS for React Native)
* **State Management:** React Hooks & Context
* **Routing:** Expo Router (File-based routing)
* **Authentication:** Firebase Auth (Persistent state with AsyncStorage)
* **Database:** Cloud Firestore
* **Visualization:** React Native Chart Kit
* **Animations:** React Native Reanimated
* **Icons:** Ionicons (@expo/vector-icons)
* **Audio:** Expo AV

## Prerequisites

* Node.js (v18 or higher)
* npm or yarn
* Expo Go app (on iOS or Android for testing)

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd studymor
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory to connect your Firebase project.
    > **Note:** Do not commit this file to version control.

    ```env
    EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the application:**
    ```bash
    npx expo start -c
    ```
    Scan the QR code with the **Expo Go** app on your Android or iOS device.

## Application Architecture

* **`/app`**: Main application routes and screens (File-based routing).
    * **`/(tabs)`**: The main tab navigator (Dashboard, Focus, Planner, Subjects, Profile).
    * **`index.tsx`**: The Login screen.
    * **`signup.tsx`**: The Registration screen.
* **`/src/config`**: Configuration files (Firebase initialization).
* **`/components`**: Reusable UI elements (ThemedView, ThemedText, etc.).
* **`/assets`**: Static assets like images, fonts, and sounds.
* **`/release`**: Contains the compiled Android APK file.

## Screenshots

**Analytics Dashboard**
![Dashboard Screenshot](https://i.imgur.com/k9bSNUG.jpeg)
*Real-time weekly progress chart and daily goal tracking.*
<br><br>

**Focus Timer**
![Timer Screenshot](https://i.imgur.com/B0aFFa5.jpeg)
*Distraction-free timer with subject selection and sound controls.*
<br><br>

**Planner & Schedule**
![Planner Screenshot](https://i.imgur.com/42zv3eZ.jpeg)
*Session management and future study planning.*
<br><br>

**Profile & Dark Mode**
![Profile Screenshot](https://i.imgur.com/emIz9iC.jpeg)
*User statistics, history, and theme toggles.*
<br><br>

## Deployment

* **Build Tool:** EAS (Expo Application Services)
* **Platform:** Android (APK) & iOS

### Important Development Notes
1.  **Auth Persistence:** The app uses `@react-native-async-storage/async-storage` to persist Firebase sessions, ensuring users stay logged in after restarting the app.
2.  **NativeWind:** Styling is handled via utility classes. Ensure `tailwind.config.js` is updated if you add new folders containing UI components.
3.  **Expo Go Caching:** If you change the App Icon or Splash screen, you may need to clear the Expo Go app data/cache on your device to see the changes immediately.