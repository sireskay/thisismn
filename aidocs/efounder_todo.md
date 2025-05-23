# SaaS Implementation Todo Checklist

## Phase 1: Better-Auth Enhancements (Weeks 1-4)

### Story 1: Implement Multi-Factor Authentication (MFA)

#### Subtask 1.1: TOTP MFA Setup
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Integrate `better-auth` TOTP (Time-Based One-Time Password) plugin
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Update `betterAuth` options to include TOTP
- [ ] **File:** `packages/database/prisma/schema.prisma`
- [ ] **Task:** Add `totpSecret` field to the `User` model
- [ ] **Command:** `pnpm --filter @repo/database run generate`
- [ ] **File:** `apps/web/modules/saas/settings/components/`
  - [ ] Create `TOTPSetup.tsx` (Component for UI)
  - [ ] Create `TOTPSetup.spec.tsx` (Component test)
- [ ] **Task:** Create UI component for QR code display, code verification, etc.
- [ ] **Task:** Add relevant tests

#### Subtask 1.2: SMS MFA Setup
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Integrate an SMS provider (Twilio, AWS SNS, etc.)
  - [ ] Create `packages/auth/plugins/sms-provider.ts` (abstraction)
  - [ ] Create `packages/auth/plugins/twilio-sms.ts` (or similar)
- [ ] **File:** `config/types.ts`
- [ ] **Task:** Add configuration for SMS provider
- [ ] **File:** `config/index.ts`
- [ ] **Task:** Add default values for new config
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Update `betterAuth` options with SMS plugin
- [ ] **File:** `packages/database/prisma/schema.prisma`
- [ ] **Task:** Add `phoneNumber` and `phoneNumberVerified` fields to `User` model
- [ ] **Command:** `pnpm --filter @repo/database run generate`
- [ ] **File:** `apps/web/modules/saas/settings/components/`
  - [ ] Create `SMSSetup.tsx` (Component for UI)
  - [ ] Create `SMSSetup.spec.tsx` (Component test)
- [ ] **Task:** Add relevant tests

#### Subtask 1.3: Email MFA Setup
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Update `betterAuth` options with email plugin
- [ ] **File:** `packages/mail/emails`
  - [ ] Create `MFAVerification.tsx` (Email template)
- [ ] **File:** `apps/web/modules/saas/settings/components/`
  - [ ] Create `EmailSetup.tsx` (Component for UI)
  - [ ] Create `EmailSetup.spec.tsx` (Component test)
- [ ] **Task:** Add relevant tests

#### Subtask 1.4: Recovery Codes
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Implement generation of recovery codes
- [ ] **File:** `packages/database/prisma/schema.prisma`
- [ ] **Task:** Add `recoveryCodes` field to the `User` model
- [ ] **Command:** `pnpm --filter @repo/database run generate`
- [ ] **File:** `apps/web/modules/saas/settings/components/`
- [ ] **Task:** Integrate recovery codes management into MFA setup UI
- [ ] **Task:** Add relevant tests

#### Subtask 1.5: MFA Login Flow
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Modify login flow for MFA verification
- [ ] **File:** `apps/web/modules/saas/auth/components/LoginForm.tsx`
- [ ] **Task:** Update Login form
- [ ] **Task:** Add relevant tests

### Story 2: Enhanced OAuth Integration

#### Subtask 2.1: LinkedIn OAuth
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Add LinkedIn as a social provider
- [ ] **File:** `apps/web/modules/saas/auth/components/SocialSigninButton.tsx`
- [ ] **Task:** Update UI component for LinkedIn
- [ ] **Task:** Add relevant tests

#### Subtask 2.2: Microsoft OAuth
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Add Microsoft as a social provider
- [ ] **File:** `apps/web/modules/saas/auth/components/SocialSigninButton.tsx`
- [ ] **Task:** Update UI component for Microsoft
- [ ] **Task:** Add relevant tests

#### Subtask 2.3: Apple OAuth
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Add Apple as a social provider
- [ ] **File:** `apps/web/modules/saas/auth/components/SocialSigninButton.tsx`
- [ ] **Task:** Update UI component for Apple
- [ ] **Task:** Add relevant tests

#### Subtask 2.4: Unified Profile Linking Interface
- [ ] **File:** `apps/web/modules/saas/settings/components/ConnectedAccountsBlock.tsx`
- [ ] **Task:** Update component to show all OAuth providers
- [ ] **Task:** Add relevant tests

### Story 3: Advanced Session Management

#### Subtask 3.1: Device Tracking
- [ ] **File:** `packages/database/prisma/schema.prisma`
- [ ] **Task:** Extend the `Session` model with additional tracking fields
- [ ] **Command:** `pnpm --filter @repo/database run generate`
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Generate unique device ID on session creation
- [ ] **File:** `apps/web/modules/saas/settings/components/ActiveSessionsBlock.tsx`
- [ ] **Task:** Update UI to display device information
- [ ] **Task:** Add relevant tests

#### Subtask 3.2: Session Termination
- [ ] **File:** `apps/web/modules/saas/settings/components/ActiveSessionsBlock.tsx`
- [ ] **Task:** Add session termination functionality
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Implement API endpoint to revoke sessions
- [ ] **Task:** Add relevant tests

#### Subtask 3.3: Suspicious Activity Detection
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Implement basic suspicious activity detection
- [ ] **File:** Create UI component for security notifications
- [ ] **Task:** Add relevant tests

### Story 4: Expanded Role-Based Permissions

#### Subtask 4.1: Define Roles and Permissions
- [ ] **File:** `packages/database/prisma/schema.prisma`
- [ ] **Task:** Modify the `Member` model for role-based permissions
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Update auth config for roles
- [ ] **File:** `config/types.ts`
- [ ] **Task:** Define role constants/enums
- [ ] **File:** `config/index.ts`
- [ ] **Task:** Set default configuration
- [ ] **File:** `packages/auth/lib/helper.ts`
- [ ] **Task:** Implement permission helper functions
- [ ] **Task:** Add relevant tests

#### Subtask 4.2: Resource-Based Controls
- [ ] **File:** `packages/api/` (multiple files)
- [ ] **Task:** Add permission checks to API routes
- [ ] **File:** `packages/auth/auth.ts`
- [ ] **Task:** Create middleware for permission checks
- [ ] **Task:** Add relevant tests

#### Subtask 4.3: Role and Permission Management UI
- [ ] **File:** `apps/web/modules/saas/organizations/components/`
- [ ] **Task:** Create UI for role management
- [ ] **Task:** Add relevant tests

## Phase 2: Core Product Modules (Weeks 5-12)

### Story 5: Integrated Dashboard

#### Subtask 5.1: Dashboard Layout
- [ ] **File:** `apps/web/app/(saas)/app/page.tsx`
- [ ] **Task:** Create dashboard layout structure

#### Subtask 5.2: User Metrics Widget
- [ ] **File:** `apps/web/modules/saas/start/components/`
  - [ ] Create `UserMetricsWidget.tsx`
  - [ ] Create `UserMetricsWidget.spec.tsx`
- [ ] **File:** `apps/web/app/(saas)/app/page.tsx`
- [ ] **Task:** Integrate widget into dashboard

#### Subtask 5.3: Security Status Widget
- [ ] **File:** `apps/web/modules/saas/start/components/`
  - [ ] Create `SecurityStatusWidget.tsx`
  - [ ] Create `SecurityStatusWidget.spec.tsx`
- [ ] **File:** `apps/web/app/(saas)/app/page.tsx`
- [ ] **Task:** Integrate widget into dashboard

#### Subtask 5.4: Quick Access Links
- [ ] **File:** `apps/web/app/(saas)/app/page.tsx`
- [ ] **Task:** Add quick access links to dashboard

#### Subtask 5.5: Subscription Tier Display
- [ ] **File:** `apps/web/modules/saas/payments/components/`
  - [ ] Create `SubscriptionTierWidget.tsx`
  - [ ] Create `SubscriptionTierWidget.spec.tsx`
- [ ] **File:** `apps/web/app/(saas)/app/page.tsx`
- [ ] **Task:** Integrate widget into dashboard

### Story 6: CRM Module (SalesTwirl)

#### Subtask 6.1: Contact Management
- [ ] **File:** `packages/database/prisma/schema.prisma`
- [ ] **Task:** Create a `Contact` model
- [ ] **Command:** `pnpm --filter @repo/database run generate`
- [ ] **File:** `packages/api/src/routes/contacts/router.ts`
- [ ] **Task:** Create API endpoints for contact management
- [ ] **File:** `apps/web/modules/saas/crm/`
  - [ ] Create `components/ContactList.tsx`
  - [ ] Create `components/ContactForm.tsx`
  - [ ] Create `lib/api.ts`
  - [ ] Create `ContactList.spec.tsx`
  - [ ] Create `ContactForm.spec.tsx`
  - [ ] Create `api.spec.ts`
- [ ] **Task:** Add relevant tests

#### Subtask 6.2: Deal Pipelines
- [ ] **File:** `packages/database/prisma/schema.prisma`
- [ ] **Task:** Create `Deal` and `DealStage` models
- [ ] **Command:** `pnpm --filter @repo/database run generate`
- [ ] **File:** `packages/api/src/routes/deals/router.ts`
- [ ] **Task:** Create API endpoints for deal management
- [ ] **File:** `apps/web/modules/saas/crm/components/`
  - [ ] Create `DealPipeline.tsx`
  - [ ] Create `DealCard.tsx`
  - [ ] Create `DealForm.tsx`
  - [ ] Create `DealPipeline.spec.tsx`
  - [ ] Create `DealCard.spec.tsx`
  - [ ] Create `DealForm.spec.tsx`
- [ ] **Task:** Add relevant tests

#### Subtask 6.3: Email Integration
- [ ] **Task:** Implement email association with contacts and deals
- [ ] **Task:** Create UI for email viewing
- [ ] **Task:** Integrate with email provider

### Story 7: Project Management Module (VaryPoint)

#### Subtask 7.1: Project and Task Models
- [ ] **File:** `packages/database/prisma/schema.prisma`
- [ ] **Task:** Create `Project` and `Task` models
- [ ] **Command:** `pnpm --filter @repo/database run generate`

#### Subtask 7.2: API Endpoints
- [ ] **File:** `packages/api/src/routes/projects/router.ts`
- [ ] **Task:** Create API endpoints for project and task management

#### Subtask 7.3: UI Components
- [ ] **File:** `apps/web/modules/saas/projects/components/`
  - [ ] Create `ProjectList.tsx`
  - [ ] Create `ProjectForm.tsx`
  - [ ] Create `ProjectBoard.tsx`
  - [ ] Create `TaskCard.tsx`
  - [ ] Create `TaskForm.tsx`
  - [ ] Create `ProjectList.spec.tsx`
  - [ ] Create `ProjectForm.spec.tsx`
  - [ ] Create `ProjectBoard.spec.tsx`
  - [ ] Create `TaskCard.spec.tsx`
  - [ ] Create `TaskForm.spec.tsx`
- [ ] **Task:** Add relevant tests

#### Subtask 7.4: Task Assignment and Collaboration
- [ ] **File:** `apps/web/modules/saas/projects/components/TaskForm.tsx`
- [ ] **Task:** Add task assignment functionality
- [ ] **Task:** (Optional) Add commenting features
- [ ] **Task:** Add relevant tests

### Story 8: Dashboard Integration
- [ ] **File:** `apps/web/app/(saas)/app/page.tsx`
- [ ] **Task:** Integrate project and task widgets
- [ ] **Task:** Make dashboard customizable based on roles

## Phase 3: Advanced Features (Weeks 13-20)

### Story 9: Email Marketing Module (FlackEmail)
- [ ] **Design:** Create data models for email campaigns
- [ ] **Database:** Create Prisma models for email marketing
- [ ] **API:** Create endpoints for email marketing features
- [ ] **UI:** Create email marketing interface components
- [ ] **Task:** Add relevant tests

### Story 10: Analytics and Reporting

#### Subtask 10.1: Data Collection
- [ ] Create analytics middleware file: `packages/api/src/middleware/analytics.ts`
  - [ ] Implement functionality to intercept relevant API requests
  - [ ] Extract relevant data from requests (user ID, organization ID, timestamp, action type)
  - [ ] Store data in analytics database using Prisma
- [ ] Update `packages/api/src/app.ts` to apply the analytics middleware
  - [ ] Add middleware after CORS and before routes
- [ ] Update `packages/database/prisma/schema.prisma` to create AnalyticsEvent model
- [ ] Run `pnpm --filter @repo/database run generate` to update Prisma client

#### Subtask 10.2: Reporting API
- [ ] Create new file `packages/api/src/routes/admin/analytics.ts` for analytics endpoints
  - [ ] Implement `GET /api/admin/analytics/users/count` endpoint
  - [ ] Implement `GET /api/admin/analytics/organizations/count` endpoint 
  - [ ] Implement `GET /api/admin/analytics/events` endpoint with filtering and pagination
  - [ ] Implement `GET /api/admin/analytics/events/count` endpoint with grouping by event type
  - [ ] Add proper authorization checks (admin only)
- [ ] Write tests for analytics endpoints

#### Subtask 10.3: Dashboard Widgets (Analytics)
- [ ] Update `apps/web/modules/saas/start/components/StatsTile.tsx`
  - [ ] Add support for data fetching functions as props
  - [ ] Add loading indicators during data fetching
  - [ ] Implement error handling
  - [ ] Integrate React Query's useQuery hook
- [ ] Create new components for complex visualizations (charts)
  - [ ] Create user activity chart components using recharts or nivo
- [ ] Update `apps/web/app/(saas)/app/page.tsx` to integrate new analytics widgets

#### Subtask 10.4: AI-Driven Insights (Future Enhancement)
- [ ] Research potential AI models (OpenAI, Cohere, open-source alternatives)
- [ ] Design UI for displaying AI-driven insights
- [ ] Create API endpoints for AI model interaction
- [ ] Integrate AI-powered insights into dashboard

### Story 11: Integration Hub

#### Subtask 11.1: Connector Framework
- [ ] Create integration router at `packages/api/src/routes/integrations/router.ts`
  - [ ] Design system for managing third-party integrations
  - [ ] Create abstraction layer for different connector types
  - [ ] Implement secure credential storage mechanism
- [ ] Update `packages/database/prisma/schema.prisma` to add Integration model
- [ ] Run `pnpm --filter @repo/database run generate` to update Prisma client

#### Subtask 11.2: Webhook Handling
- [ ] Extend `packages/api/src/routes/webhooks.ts`
  - [ ] Add support for different providers
  - [ ] Implement webhook signature validation
  - [ ] Create event dispatch system based on provider and event type

#### Subtask 11.3: API Connectors
- [ ] Create specific integration files in `packages/api/src/routes/integrations/`
  - [ ] Implement Stripe connector
  - [ ] Implement GitHub connector
  - [ ] Add functions for API calls to each service
  - [ ] Handle authentication using stored credentials
  - [ ] Implement error handling and rate limiting
- [ ] Write tests for API connectors

#### Subtask 11.4: Integration Hub UI
- [ ] Create directory structure `apps/web/modules/saas/integrations/`
- [ ] Create components:
  - [ ] `components/IntegrationList.tsx`
  - [ ] `components/IntegrationCard.tsx`
  - [ ] `components/IntegrationForm.tsx`
  - [ ] `lib/api.ts`
- [ ] Implement UI features:
  - [ ] Display available integrations
  - [ ] Allow enabling/disabling integrations
  - [ ] Create configuration UI for integration settings
- [ ] Write tests:
  - [ ] `IntegrationList.spec.tsx`
  - [ ] `IntegrationCard.spec.tsx`
  - [ ] `IntegrationForm.spec.tsx`

#### Subtask 11.5: Template Library
- [ ] Design template structure for storing and accessing templates
- [ ] Create Template model in database (if needed)
- [ ] Implement API endpoints for template management (CRUD)
- [ ] Create UI components:
  - [ ] Template browser/selector
  - [ ] Template preview 
  - [ ] Optional: Template editor

### Story 12: User Onboarding

#### Subtask 12.1: Onboarding Form
- [ ] Extend `apps/web/modules/saas/onboarding/components/OnboardingForm.tsx`
  - [ ] Add subscription plan selection step (if needed)
  - [ ] Add initial project settings step
  - [ ] Add team member invitation step (if organization-based)

#### Subtask 12.2: Product Tour
- [ ] Research and select product tour library (react-joyride, reactour, intro.js)
- [ ] Create new files in `apps/web/modules/saas/onboarding/`
  - [ ] Implement hook for managing tour logic
  - [ ] Add component to AppWrapper
- [ ] Implement guided product tour:
  - [ ] Highlight key features and UI elements
  - [ ] Create tooltips/popovers with helpful information
  - [ ] Guide users through initial setup
  - [ ] Add auto-trigger after onboarding
  - [ ] Allow skipping/retriggering

#### Subtask 12.3: Onboarding Completion
- [ ] Update `packages/auth/auth.ts` to set onboardingComplete to true after successful onboarding

## Phase 4: Refinement & Optimization (Weeks 21-24)

### Story 13: Security Audits & Vulnerability Scans
- [ ] Conduct security audits:
  - [ ] Penetration testing
  - [ ] Static code analysis
  - [ ] Dependency vulnerability scanning
  - [ ] Authentication/authorization review
- [ ] Address identified vulnerabilities
- [ ] Set up automated security scanning in CI/CD pipeline

### Story 14: Performance Optimizations
- [ ] Profile application to identify bottlenecks
- [ ] Optimize database queries:
  - [ ] Add indexes
  - [ ] Optimize query structure
- [ ] Implement caching strategies:
  - [ ] Server-side caching
  - [ ] Client-side caching
  - [ ] CDN integration
- [ ] Optimize frontend performance:
  - [ ] Implement code splitting
  - [ ] Add lazy loading
  - [ ] Optimize images
- [ ] Conduct load testing

### Story 15: UI/UX Refinements
- [ ] Conduct user testing and gather feedback
- [ ] Implement UI/UX improvements based on feedback
- [ ] Ensure WCAG compliance for accessibility

### Story 16: Documentation & Training
- [ ] Complete and review documentation (using Fumadocs)
- [ ] Create user guides and tutorials
- [ ] Optional: Develop training materials (videos, webinars)
- [ ] Verify documentation is up-to-date and comprehensive