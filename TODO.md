# PaidIn App - TODO List

## 🔄 Current Sprint / Active Development

### Completed ✅
- [x] Implement email verification flow with proper redirect URLs (dev vs production)
- [x] Improve email styling with logo and branded button
- [x] Integrate Breez SDK for non-custodial wallet creation during signup
- [x] Fix wallet creation flow - moved to after email verification (security improvement)
- [x] Redesign WalletBackupModal for better aesthetics and readability
- [x] Fix duplicate email verification API calls
- [x] Fix Breez SDK WebAssembly loading issues
- [x] Fix Buffer polyfill for mnemonic generation
- [x] Fix wallet registration backend API endpoint routing
- [x] Fix Plaid service enum imports (CountryCode, Products)

## 🎯 High Priority

### Authentication & Onboarding
- [ ] Build Welcome/Tour page after email verification (before wallet creation)
- [ ] Implement tooltips/onboarding flow for new users
- [ ] Implement 2FA for all users (including Admin/PaidIn founder)
- [ ] Create mechanism for only admins/business owners to sign up, then they can invite employees

### Wallet & Payments
- [ ] Implement full payment functionality (receive and send) using Breez SDK
- [ ] Test full Breez wallet creation flow during signup to confirm all issues are resolved

### Payment Processing
- [ ] Decide on payment page design: keep Stripe component only or create separate page

## 📋 Medium Priority

### Admin & Management
- [ ] Create separate, dedicated admin portal for PaidIn core team to manage the app
- [ ] Implement subscription free tier definition (what it offers)

### Infrastructure & Operations
- [ ] Address Redis usage (received "Upstash Redis Database Inactivity First Notice" email)
- [ ] Reduce console logging in production (optional cleanup)

### User Experience
- [ ] Polish dashboard UI/UX based on user feedback
- [ ] Add error boundaries for better error handling
- [ ] Improve loading states across the application

## 🔮 Future Enhancements

### Features
- [ ] Multi-currency support (beyond Bitcoin)
- [ ] Advanced reporting and analytics
- [ ] Export functionality for reports and data
- [ ] Batch operations for payroll processing
- [ ] Recurring payment scheduling
- [ ] Employee self-service portal enhancements

### Technical Improvements
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Comprehensive test coverage
- [ ] API documentation improvements
- [ ] Monitoring and logging infrastructure
- [ ] Automated backup systems

### Documentation
- [ ] Update API documentation
- [ ] Create user guides and tutorials
- [ ] Developer onboarding documentation
- [ ] Deployment runbooks

---

**Last Updated:** Based on current development status and user requirements

**Note:** Tasks are prioritized but not strictly ordered. Priorities may shift based on business needs.
