# JustDo - Modern Todo App

A beautiful, modern todo application built with React Native and Expo, featuring real-time synchronization, offline support, and a clean, intuitive interface.

## 🚀 Features

- **Real-time Sync**: Tasks sync instantly across devices using Firebase Firestore
- **Offline Support**: Works seamlessly offline with local storage fallback
- **User Authentication**: Secure email/password authentication with Firebase Auth
- **Task Management**: Create, edit, delete, and mark tasks as complete
- **Due Dates**: Set and track due dates for your tasks
- **Filtering**: View all, active, or completed tasks
- **Modern UI**: Clean, minimalist design with smooth animations
- **Cross-platform**: Runs on iOS, Android, and Web

## 📱 Screenshots

*Screenshots will be added here showing the app's interface*

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and toolchain
- **TypeScript** - Type-safe JavaScript development
- **React Navigation** - Navigation library for React Native
- **TailwindCSS (twrnc)** - Utility-first styling

### Backend & Services
- **Firebase Auth** - User authentication
- **Firebase Firestore** - Real-time database
- **AsyncStorage** - Local storage for offline support

### Development Tools
- **Expo CLI** - Development and build tools
- **TypeScript** - Static type checking
- **Babel** - JavaScript transpilation

## 🏗️ Architecture Decisions

### Why React Native + Expo?
I chose React Native with Expo because it provides:
- **Rapid Development**: Expo's managed workflow speeds up development significantly
- **Cross-platform**: Single codebase for iOS, Android, and Web
- **Rich Ecosystem**: Access to native APIs and third-party libraries
- **Easy Deployment**: Simplified build and deployment process

### Why Firebase?
Firebase was selected for backend services because:
- **Real-time Sync**: Firestore provides instant data synchronization
- **Authentication**: Built-in auth with multiple providers
- **Offline Support**: Automatic offline persistence and sync
- **Scalability**: Handles growth from prototype to production
- **Cost-effective**: Generous free tier for development

### Why TypeScript?
TypeScript was chosen for:
- **Type Safety**: Catches errors at compile time
- **Better IDE Support**: Enhanced autocomplete and refactoring
- **Maintainability**: Easier to maintain and scale the codebase
- **Team Collaboration**: Clear interfaces and contracts

### Why TailwindCSS (twrnc)?
TailwindCSS for React Native provides:
- **Rapid Styling**: Utility-first approach for quick UI development
- **Consistency**: Design system with predefined spacing, colors, and typography
- **Responsive Design**: Built-in responsive utilities
- **Performance**: Only includes used styles in the final bundle

### State Management Approach
I used React Context for state management because:
- **Simplicity**: Built-in React solution, no additional dependencies
- **Authentication State**: Perfect for user authentication state
- **Small Scale**: Appropriate for the app's current complexity
- **Future Flexibility**: Easy to migrate to Redux or Zustand if needed

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-todo
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on your preferred platform**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web Browser
   npm run web
   ```

### Firebase Setup

1. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication and Firestore Database

2. **Configure Authentication**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Email/Password authentication

3. **Configure Firestore**
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see Security Rules section)

4. **Update Firebase Configuration**
   - Replace the Firebase config in `src/lib/firebase.ts` with your project's config
   - Get your config from Project Settings > General > Your apps

### Security Rules

Add these Firestore security rules to ensure data security:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
    // Users can only access their own tasks
    match /tasks/{taskId} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
       }
     }
   }
   ```

## 📁 Project Structure

```
my-todo/
├── src/
│   ├── components/          # Reusable UI components
│   ├── constants/           # App constants and configuration
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # External library configurations
│   │   └── firebase.ts     # Firebase configuration
│   ├── screens/            # Screen components
│   │   ├── AuthScreen.tsx  # Authentication screen
│   │   ├── TasksScreen.tsx # Main tasks screen
│   │   └── SettingsScreen.tsx # Settings screen
│   ├── state/              # State management
│   │   └── AuthContext.tsx # Authentication context
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images, icons, and other assets
├── App.tsx                 # Main app component
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## 🚀 Deployment

### Building for Production

1. **Build for Android**
   ```bash
   expo build:android
   ```

2. **Build for iOS**
   ```bash
   expo build:ios
   ```

3. **Build for Web**
   ```bash
   expo build:web
   ```

### Publishing Updates

```bash
expo publish
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [Firebase](https://firebase.google.com/) for backend services
- [React Native](https://reactnative.dev/) for cross-platform development
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the [Expo documentation](https://docs.expo.dev/)
- Review the [React Native documentation](https://reactnative.dev/docs/getting-started)

---

**Happy coding! 🎉**