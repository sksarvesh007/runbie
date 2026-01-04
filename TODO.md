# Runbie Development TODO

## Project Status: Phase 1 - Initial Setup

---

## PHASE 1: Project Setup & Foundation (Estimated: 2-3 hours)
**Status**: ✅ COMPLETED

### Project Initialization
- [x] Create React Native project with Expo
- [x] Set up project directory structure
- [x] Configure package.json with all dependencies
- [x] Set up ESLint and Prettier
- [x] Create .gitignore file
- [ ] Initialize Git repository

### Configuration Files
- [x] Create .env.example file for environment variables
- [x] Set up Firebase configuration structure
- [x] Create Razorpay configuration structure
- [x] Set up theme and constants files

### Basic Navigation
- [x] Install and configure React Navigation v6
- [x] Create Auth Stack Navigator
- [x] Create Main Stack Navigator
- [x] Create Tab Navigator for main app
- [x] Set up navigation container with auth flow

### State Management
- [x] Install and configure Zustand
- [x] Create auth store
- [x] Create session store
- [x] Create user store

### Basic UI Components
- [x] Create Button component
- [x] Create Input component
- [x] Create Card component
- [x] Create Loading component
- [ ] Create Header component

**Phase 1 Completion Criteria**: 
- Project runs on both iOS and Android
- Navigation structure is in place
- Basic components are reusable
- No console errors

---

## PHASE 2: Authentication (Estimated: 4-5 hours)
**Status**: ✅ COMPLETED

### Firebase Setup
- [ ] Create Firebase project
- [ ] Enable Authentication (Email/Password + Google)
- [ ] Set up Firestore database
- [ ] Configure Firebase in app
- [ ] Set up security rules

### Email/Password Authentication
- [ ] Create Login screen UI
- [ ] Create Signup screen UI
- [ ] Create Forgot Password screen UI
- [ ] Implement email/password login logic
- [ ] Implement signup logic
- [ ] Implement password reset logic
- [ ] Add form validation
- [ ] Add error handling

### Google OAuth
- [ ] Configure Google Sign-In in Firebase
- [ ] Install @react-native-google-signin/google-signin
- [ ] Implement Google Sign-In button
- [ ] Implement Google OAuth flow
- [ ] Handle OAuth errors

### User Profile
- [ ] Create user document in Firestore on signup
- [ ] Implement user profile screen
- [ ] Add profile photo upload
- [ ] Add profile edit functionality
- [ ] Implement logout functionality

### Auth State Management
- [ ] Implement auth state persistence
- [ ] Add auth state listener
- [ ] Handle session expiry
- [ ] Add loading states during auth

**Phase 2 Completion Criteria**:
- Users can sign up with email/password
- Users can log in with Google
- User data persists in Firestore
- Auth state persists across app restarts
- Proper error messages display

---

## PHASE 3: GPS Tracking & Location Services (Estimated: 5-6 hours)
**Status**: ✅ COMPLETED

### Location Permissions
- [ ] Install expo-location
- [ ] Request foreground location permissions
- [ ] Request background location permissions
- [ ] Handle permission denials gracefully
- [ ] Add permission explanation screens

### GPS Tracking Implementation
- [ ] Create location service module
- [ ] Implement real-time location tracking
- [ ] Set up high-accuracy GPS mode
- [ ] Implement GPS accuracy filtering
- [ ] Add location update listeners

### Distance & Pace Calculations
- [ ] Implement Haversine formula for distance
- [ ] Create pace calculation utility (min/km)
- [ ] Implement moving average for pace smoothing
- [ ] Calculate distance from start point
- [ ] Track cumulative distance

### Background Tracking
- [ ] Configure background location task
- [ ] Implement battery-efficient tracking
- [ ] Handle GPS signal loss
- [ ] Add location data buffering
- [ ] Test background tracking thoroughly

### Location Data Management
- [ ] Create location point data structure
- [ ] Implement location point storage
- [ ] Add timestamp to each location point
- [ ] Calculate speed from GPS data
- [ ] Store route points array

**Phase 3 Completion Criteria**:
- GPS tracking works accurately
- Pace calculations are smooth and accurate
- Background tracking works when app is minimized
- Battery usage is optimized
- Handles poor GPS signal gracefully

---

## PHASE 4: Map Integration & Visualization (Estimated: 4-5 hours)
**Status**: ✅ COMPLETED

### Map Setup
- [ ] Install react-native-maps
- [ ] Configure Google Maps API key
- [ ] Set up MapView component
- [ ] Configure map for iOS
- [ ] Configure map for Android

### User Location Display
- [ ] Show user's current location on map
- [ ] Add user location marker
- [ ] Implement map camera following
- [ ] Add smooth camera animations
- [ ] Handle map loading states

### Route Visualization
- [ ] Draw route polyline on map
- [ ] Update polyline in real-time
- [ ] Style route line (color, width)
- [ ] Add distance markers on route
- [ ] Implement route replay functionality

### Zombie Visualization
- [ ] Create zombie marker icon
- [ ] Calculate zombie position on map
- [ ] Update zombie position in real-time
- [ ] Add zombie animation effects
- [ ] Show distance between user and zombie

### Map UI Elements
- [ ] Add zoom controls
- [ ] Add center-on-user button
- [ ] Add map type selector
- [ ] Show current stats overlay
- [ ] Add danger zone visualization (when zombie is close)

**Phase 4 Completion Criteria**:
- Map displays user location accurately
- Route trail updates in real-time
- Zombie position is visible and updates
- Map performance is smooth
- UI elements are intuitive

---

## PHASE 5: Zombie Chase Mechanics (Estimated: 6-7 hours)
**Status**: ✅ COMPLETED

### Zombie AI Logic
- [ ] Create zombie service module
- [ ] Calculate zombie pace (paceMax + 0.15)
- [ ] Implement zombie position calculation
- [ ] Update zombie position every 5 seconds
- [ ] Calculate distance between user and zombie

### Catch Detection
- [ ] Implement catch detection logic (≤10m)
- [ ] Add catch event handling
- [ ] Track number of catches
- [ ] Implement catch cooldown
- [ ] Log catch events

### Distance Eating Mechanism
- [ ] Implement distance reduction when caught
- [ ] Calculate eaten distance (1m per second)
- [ ] Update total distance in real-time
- [ ] Show visual feedback for distance loss
- [ ] Track total distance eaten

### Warning System
- [ ] Implement proximity detection (50m warning)
- [ ] Add visual warning indicators
- [ ] Add audio warning sounds
- [ ] Implement escalating warnings
- [ ] Add haptic feedback

### Zombie State Management
- [ ] Create zombie state in Zustand
- [ ] Track zombie distance from user
- [ ] Track zombie catch status
- [ ] Store zombie events in session
- [ ] Reset zombie state on new run

**Phase 5 Completion Criteria**:
- Zombie chases user based on pace
- Catch detection works accurately
- Distance eating mechanism functions
- Warnings alert user appropriately
- Zombie mechanics are engaging and fair

---

## PHASE 6: Session Management (Estimated: 5-6 hours)
**Status**: ✅ COMPLETED

### Pre-Run Setup
- [ ] Create RunSetup screen UI
- [ ] Add distance goal input
- [ ] Add pace zone inputs (min/max)
- [ ] Validate input values
- [ ] Calculate and display zombie pace
- [ ] Add start run button

### Active Run Screen
- [ ] Create ActiveRun screen UI
- [ ] Display real-time stats (distance, pace, time)
- [ ] Show zombie distance indicator
- [ ] Add pause/resume buttons
- [ ] Add stop/finish button
- [ ] Implement session timer

### Session Control
- [ ] Implement start session logic
- [ ] Implement pause/resume logic
- [ ] Implement stop session logic
- [ ] Handle session abandonment
- [ ] Implement session recovery (crash handling)

### Session Data Storage
- [ ] Create session document structure
- [ ] Save session to Firestore on start
- [ ] Update session incrementally (every 30s)
- [ ] Save final session data on completion
- [ ] Store route points efficiently

### Session History
- [ ] Create SessionHistory screen
- [ ] Fetch user's sessions from Firestore
- [ ] Display session list with key stats
- [ ] Implement session filtering/sorting
- [ ] Add pull-to-refresh

### Session Details
- [ ] Create SessionDetail screen
- [ ] Display full session statistics
- [ ] Show route map replay
- [ ] Display pace graph
- [ ] Show zombie catch events
- [ ] Add share functionality

### Session Statistics
- [ ] Calculate average pace
- [ ] Calculate max/min pace
- [ ] Calculate completion percentage
- [ ] Calculate total duration
- [ ] Generate session summary

**Phase 6 Completion Criteria**:
- Users can set up and start runs
- Sessions save correctly to Firestore
- Session history displays properly
- Session details show all relevant data
- Pause/resume works without data loss

---

## PHASE 7: Subscriptions & Payments (Estimated: 6-8 hours)
**Status**: ✅ COMPLETED

### Razorpay Setup
- [ ] Create Razorpay account
- [ ] Install razorpay-react-native SDK
- [ ] Configure Razorpay keys
- [ ] Set up test mode
- [ ] Create subscription plans in Razorpay

### Free Account Management
- [ ] Implement session counter
- [ ] Check session limit before run
- [ ] Display remaining sessions
- [ ] Block new runs when limit reached
- [ ] Show upgrade prompts

### Subscription Screen
- [ ] Create Subscription screen UI
- [ ] Display plan options (monthly/yearly/lifetime)
- [ ] Show plan features and pricing
- [ ] Add plan selection
- [ ] Implement purchase buttons

### Payment Flow
- [ ] Implement Razorpay checkout
- [ ] Handle payment success
- [ ] Handle payment failure
- [ ] Show payment confirmation
- [ ] Send payment receipt

### Subscription Management
- [ ] Create subscription document in Firestore
- [ ] Update user account type on purchase
- [ ] Implement subscription status checking
- [ ] Add subscription cancellation
- [ ] Handle subscription expiry

### Firebase Cloud Functions
- [ ] Set up Firebase Functions
- [ ] Create Razorpay webhook handler
- [ ] Verify webhook signatures
- [ ] Update subscription status from webhooks
- [ ] Handle subscription renewal
- [ ] Handle subscription cancellation

### Subscription State
- [ ] Add subscription state to user store
- [ ] Check subscription status on app launch
- [ ] Update UI based on subscription
- [ ] Show subscription details in profile
- [ ] Add manage subscription option

**Phase 7 Completion Criteria**:
- Free accounts limited to 5 sessions
- Payment flow works smoothly
- Subscriptions activate immediately
- Webhooks update subscription status
- Users can manage subscriptions

---

## PHASE 8: UI/UX Polish & Optimization (Estimated: 4-5 hours)
**Status**: ⏳ PENDING

### UI Refinement
- [ ] Apply consistent theme across app
- [ ] Add smooth animations and transitions
- [ ] Improve button and input styling
- [ ] Add loading skeletons
- [ ] Implement empty states
- [ ] Add success/error toast messages

### Onboarding
- [ ] Create onboarding screens
- [ ] Add app tutorial
- [ ] Create first-run experience
- [ ] Add permission explanation screens
- [ ] Implement skip functionality

### Performance Optimization
- [ ] Optimize map rendering
- [ ] Reduce unnecessary re-renders
- [ ] Implement lazy loading
- [ ] Optimize image assets
- [ ] Minimize bundle size

### Accessibility
- [ ] Add accessibility labels
- [ ] Ensure proper contrast ratios
- [ ] Test with screen readers
- [ ] Add haptic feedback
- [ ] Implement large text support

### Error Handling
- [ ] Add global error boundary
- [ ] Implement offline mode handling
- [ ] Add retry mechanisms
- [ ] Show user-friendly error messages
- [ ] Log errors to Firebase Crashlytics

### App Icon & Splash Screen
- [ ] Design app icon
- [ ] Create splash screen
- [ ] Configure app metadata
- [ ] Set up app store assets

**Phase 8 Completion Criteria**:
- App looks polished and professional
- Animations are smooth
- Error handling is comprehensive
- App works offline (where applicable)
- Performance is optimized

---

## PHASE 9: Testing & Bug Fixes (Estimated: 5-6 hours)
**Status**: ⏳ PENDING

### Functional Testing
- [ ] Test authentication flows
- [ ] Test GPS tracking accuracy
- [ ] Test zombie mechanics
- [ ] Test session management
- [ ] Test payment flows
- [ ] Test subscription management

### Device Testing
- [ ] Test on iOS devices
- [ ] Test on Android devices
- [ ] Test on different screen sizes
- [ ] Test on different OS versions
- [ ] Test with poor GPS signal
- [ ] Test with poor network connection

### Edge Cases
- [ ] Test with no internet connection
- [ ] Test with GPS disabled
- [ ] Test with permissions denied
- [ ] Test app backgrounding during run
- [ ] Test phone calls during run
- [ ] Test low battery scenarios

### Bug Fixes
- [ ] Fix any crashes
- [ ] Fix navigation issues
- [ ] Fix data persistence issues
- [ ] Fix UI glitches
- [ ] Fix performance issues

### Final Polish
- [ ] Review all error messages
- [ ] Test all user flows end-to-end
- [ ] Verify all features work as expected
- [ ] Check for memory leaks
- [ ] Optimize battery usage

**Phase 9 Completion Criteria**:
- No critical bugs
- App is stable on both platforms
- All features work as designed
- Performance is acceptable
- Ready for beta testing

---

## PHASE 10: Deployment Preparation (Estimated: 3-4 hours)
**Status**: ⏳ PENDING

### App Store Preparation
- [ ] Create app store listing
- [ ] Prepare screenshots
- [ ] Write app description
- [ ] Set up app store metadata
- [ ] Create privacy policy
- [ ] Create terms of service

### Build Configuration
- [ ] Configure production environment
- [ ] Set up production Firebase project
- [ ] Configure production Razorpay keys
- [ ] Set up production Google Maps API
- [ ] Create production builds

### iOS Deployment
- [ ] Set up Apple Developer account
- [ ] Create app in App Store Connect
- [ ] Configure certificates and profiles
- [ ] Build iOS release
- [ ] Submit for review

### Android Deployment
- [ ] Set up Google Play Console
- [ ] Create app listing
- [ ] Configure signing keys
- [ ] Build Android release (AAB)
- [ ] Submit for review

**Phase 10 Completion Criteria**:
- App submitted to both stores
- All store assets are ready
- Production environment configured
- Privacy policy and terms published

---

## Dependencies to Install

### Core Dependencies
```json
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.0",
  "expo-location": "~17.0.0",
  "react-native-maps": "1.14.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "zustand": "^4.4.7",
  "firebase": "^10.7.1",
  "@react-native-firebase/app": "^19.0.0",
  "@react-native-firebase/auth": "^19.0.0",
  "@react-native-firebase/firestore": "^19.0.0",
  "@react-native-firebase/storage": "^19.0.0",
  "@react-native-firebase/analytics": "^19.0.0",
  "@react-native-firebase/crashlytics": "^19.0.0",
  "@react-native-google-signin/google-signin": "^11.0.0",
  "react-native-razorpay": "^2.3.0",
  "react-native-paper": "^5.11.3",
  "react-native-vector-icons": "^10.0.3",
  "react-native-dotenv": "^3.4.9",
  "date-fns": "^3.0.0"
}
```

### Dev Dependencies
```json
{
  "@babel/core": "^7.20.0",
  "eslint": "^8.55.0",
  "eslint-config-expo": "^7.0.0",
  "prettier": "^3.1.1"
}
```

---

## Environment Variables Needed

```env
# Firebase Configuration
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=

# Google Maps
GOOGLE_MAPS_API_KEY_IOS=
GOOGLE_MAPS_API_KEY_ANDROID=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Google OAuth
GOOGLE_WEB_CLIENT_ID=
GOOGLE_IOS_CLIENT_ID=
GOOGLE_ANDROID_CLIENT_ID=
```

---

## Notes & Decisions

### Technical Decisions
- Using Expo for easier cross-platform development
- Zustand for lightweight state management
- Firebase for backend (auth, database, functions)
- Razorpay for payments (India-focused)
- React Native Maps with Google Maps provider

### Key Considerations
- GPS accuracy is critical - implement filtering and smoothing
- Battery optimization for background tracking
- Zombie mechanics must feel fair and engaging
- Payment flow must be secure and reliable
- Free tier limitation enforcement must be robust

### Testing Strategy
- Test GPS tracking in various conditions (urban, rural, indoor)
- Test with different phone models and OS versions
- Test payment flows thoroughly in sandbox mode
- Test subscription webhooks with Razorpay test events
- Conduct beta testing with real users before launch

---

## Progress Tracking

**Last Updated**: [DATE]
**Current Phase**: Phase 1 - Initial Setup
**Completed Phases**: None
**Blocked Items**: None
**Next Steps**: Initialize Expo project and set up basic structure

---

## Questions & Blockers

- [ ] Firebase project credentials needed (Phase 1)
- [ ] Google Maps API key needed (Phase 4)
- [ ] Razorpay API keys needed (Phase 7)
- [ ] Apple Developer account access (Phase 10)
- [ ] Google Play Console access (Phase 10)
