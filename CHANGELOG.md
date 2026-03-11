# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Multi-step Onboarding Flow:** Replaced the legacy registration with a modern 5-screen onboarding sequence (Email/Password, Profile Setup, Game Tags Selection, Photo Upload).
- **Match Popup System:** A newly designed animated "Match!" modal that displays when two users mutually swipe right.
- **Chat Timestamps & Visuals:** Chat window now groups messages by time, tracks sender identity, and uses a dark-UI styling system with distinct `#1E2A4A` bubbles for user messages and transparent outlines for match messages.

### Changed
- **Profile Architecture:** Split the `ProfileView.vue` into dedicated View and Edit modes for easier state management without requiring a separate page.
- **Discover Page:** Upgraded the swiping view from a standard list spacing to a full-screen, mobile-friendly card deck styled with modern backdrop blurs and floating Action buttons.
- **Match List Navigation:** Upgraded `MatchesView.vue` to properly handle HTTP fetches and ensure routing includes the necessary Match parameters directly to the chat rooms.

### Fixed
- **Swipe Payload Error:** Resolved a 400 Bad Request HTTP error by fixing the payload parameter mismatch (`action` to `status`) between the Client `chat.ts` store and the `swipeController.ts` in the Backend.
- **Undefined Match Generation:** Fixed an issue where matches were successfully created in the Postgres database, but the backend failed to return the generated `matchId` to the frontend, breaking the "Send a Message" routing.
- **Chat Bubble Alignment:** Resolved bug where the authenticated user's sent chat bubbles mistakenly rendered on the left pane as if arriving from a receiver. Fixed using explicit Number parsing in `ChatView.vue` computed states.
