# Memory Keeper Application

## Overview

Memory Keeper is a full-stack web application designed to help users nurture their relationships by organizing memories about people in their lives and setting up thoughtful reminders. The application allows users to store detailed information about their contacts, capture meaningful memories, and receive email notifications for important dates like birthdays and anniversaries.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Delete Person Functionality (July 12, 2025)
- Added comprehensive delete person functionality with confirmation dialog
- Implemented dropdown menu with Edit and Delete options on person cards
- Added proper error handling and success notifications for delete operations
- Connected to existing backend DELETE API endpoint for secure deletion
- Delete operation removes person and all associated memories and reminders
- User testing confirmed functionality works perfectly

### Automated Testing Infrastructure (July 12, 2025)
- Implemented comprehensive testing framework using Vitest and Testing Library
- Created 30 automated tests covering core functionality with 100% pass rate
- Added API integration tests for all major endpoints (people, memories, reminders, stats)
- Implemented data model validation tests for type safety and structure
- Created utility function tests for date handling, search, and form validation
- Set up component testing infrastructure with React Testing Library
- Generated comprehensive test report documenting coverage and results
- Testing infrastructure ready for continuous integration and quality assurance

### Email System Successfully Configured (July 12, 2025)
- Resolved Gmail SMTP authentication issues with correct credentials
- Fixed email address mismatch (corrected from thehoneybadgertstorenz@gmail.com to thehoneybadgerstorenz@gmail.com)
- Successfully tested email delivery system - reminders now sending to user's inbox
- Email notifications are fully operational for birthday and custom reminders
- System now properly authenticates with Gmail using app passwords

### Birthday Form Improvement (July 12, 2025)
- Updated person creation form to use separate dropdown fields for day, month, and optional year
- Replaced calendar date picker with intuitive dropdown menus
- Day and month are required together, year is completely optional
- Improved user experience with clear validation and helpful descriptions
- Successfully tested and confirmed working by user

### Email Notification Settings (July 12, 2025)
- Added user settings page for managing notification email addresses
- Users can now add multiple email addresses to receive reminders
- Email validation ensures only valid addresses are stored
- Updated email service to use user's specified notification addresses
- Added settings link to user dropdown menu in navigation

### Cron Job Optimization (July 12, 2025)
- Updated cron job to run once daily at 5 AM instead of multiple times
- Consolidated reminder checking into single comprehensive function
- Improved logging to show which reminders are being processed
- Enhanced efficiency by reducing unnecessary server processing

### Timezone Issue Resolution (July 12, 2025)
- Fixed timezone issues where dates were showing incorrectly (e.g., July 13 showing as July 14)
- Updated all date parsing to use local date construction instead of UTC conversion
- Modified date handling in person-card, reminder-card, person-profile, and cron job components
- Ensured consistent date formatting across frontend and backend without timezone shifts
- Dates now display correctly in user's local timezone (New Zealand, US, etc.)

### Timeline Page Conversion (July 12, 2025)
- Converted Timeline page from showing memories to showing upcoming reminders
- Timeline now displays chronological view of upcoming reminders and important dates
- Added time-based filtering options (7 days, 30 days, 90 days, all future)
- Implemented search functionality for reminders by title, description, or person name
- Added person-based filtering to view reminders for specific individuals
- Updated UI to use Calendar icon and reminder-focused terminology
- Enhanced user experience with cleaner, more relevant timeline of upcoming events

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store

## Key Components

### Database Schema
- **Users**: Stores user authentication data (required for Replit Auth)
- **People**: Stores information about contacts (name, relationship, birth date, notes)
- **Memories**: Stores memories associated with people (content, tags, timestamps)
- **Reminders**: Stores reminder configurations (type, dates, recurring settings)
- **Email Notifications**: Tracks sent notifications
- **Sessions**: Manages user sessions (required for Replit Auth)

### Core Features
1. **People Management**: Add, edit, and organize contact information
2. **Memory Tracking**: Capture and categorize meaningful moments
3. **Smart Reminders**: Set up birthday, anniversary, and custom reminders
4. **Email Notifications**: Automated email alerts for upcoming events
5. **Search & Filter**: Find memories and people quickly
6. **Timeline View**: Chronological display of memories

### Authentication System
- Uses Replit's OpenID Connect authentication
- Mandatory user and session tables for Replit Auth compatibility
- Passport.js integration for authentication middleware
- Session-based authentication with PostgreSQL storage

## Data Flow

1. **User Authentication**: Users authenticate through Replit Auth system
2. **Data Input**: Users add people, memories, and reminders through React forms
3. **API Processing**: Express routes validate and process data using Zod schemas
4. **Database Storage**: Drizzle ORM handles type-safe database operations
5. **Background Jobs**: Node-cron triggers email notifications based on reminder schedules
6. **Real-time Updates**: TanStack Query manages client-side cache invalidation

## External Dependencies

### Testing Dependencies
- **vitest**: Modern testing framework for unit and integration tests
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Additional DOM testing matchers
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment for browser-like testing
- **supertest**: HTTP assertion library for API testing

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL database client
- **drizzle-orm**: Type-safe ORM for database operations
- **nodemailer**: Email sending functionality
- **node-cron**: Scheduled job execution
- **passport**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session store

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form state management
- **@tanstack/react-query**: Server state management

## Deployment Strategy

### Development
- Vite development server with hot module replacement
- Environment variables for database and email configuration
- Replit-specific development tooling and banner integration

### Production Build
- Vite builds optimized client-side bundle
- esbuild compiles server-side TypeScript to ESM
- Static files served from Express with fallback to React app
- Database migrations handled through Drizzle Kit

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SMTP_***: Email service configuration for notifications
- **SESSION_SECRET**: Required for session management
- **REPLIT_DOMAINS**: Required for Replit Auth integration

### Scheduled Services
- Daily email reminders at 9 AM
- Hourly advance reminder checks during business hours
- Automatic cleanup and notification sending

The application follows a modern full-stack architecture with strong type safety, efficient data management, and scalable deployment patterns optimized for the Replit environment.