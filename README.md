# Runbie - Gamified Running App 🏃‍♂️🧟

A gamified running motivation app that uses real-time GPS tracking to create an immersive zombie chase experience.

## Project Status

**Current Phase**: Phase 1 - Initial Setup ✅

See [TODO.md](./TODO.md) for detailed development progress.

## Features (Planned)

- 🏃‍♂️ Real-time GPS tracking with high accuracy
- 🧟 Virtual zombie chase mechanics
- 🗺️ Live map visualization with route tracking
- 📊 Detailed session statistics and history
- 💳 Subscription-based premium features
- 🔐 Google OAuth and email authentication
- 📱 Cross-platform (iOS & Android)

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Maps**: react-native-maps (Google Maps)
- **Location**: expo-location
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Payments**: Razorpay

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
cd runbie
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your API keys to `.env` file

5. Start the development server:
```bash
npm start
```

6. Run on iOS or Android:
```bash
npm run ios
# or
npm run android
```

## Project Structure

```
runbie/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── store/            # Zustand state management
│   ├── services/         # API and business logic
│   ├── utils/            # Helper functions
│   ├── config/           # Configuration files
│   ├── constants/        # App constants
│   └── theme/            # Theme and styling
├── assets/               # Images, fonts, icons
├── firebase/             # Firebase Cloud Functions
├── TODO.md               # Development checklist
└── README.md
```

## Development Phases

1. ✅ **Phase 1**: Project Setup & Foundation
2. ⏳ **Phase 2**: Authentication
3. ⏳ **Phase 3**: GPS Tracking & Location Services
4. ⏳ **Phase 4**: Map Integration & Visualization
5. ⏳ **Phase 5**: Zombie Chase Mechanics
6. ⏳ **Phase 6**: Session Management
7. ⏳ **Phase 7**: Subscriptions & Payments
8. ⏳ **Phase 8**: UI/UX Polish & Optimization
9. ⏳ **Phase 9**: Testing & Bug Fixes
10. ⏳ **Phase 10**: Deployment

## Environment Variables

Required environment variables (see `.env.example`):

- Firebase configuration
- Google Maps API keys
- Razorpay keys
- Google OAuth credentials

## Contributing

This is a personal project. Development is tracked in TODO.md.

## License

Private - All rights reserved

## Contact

For questions or feedback, please contact the development team.
