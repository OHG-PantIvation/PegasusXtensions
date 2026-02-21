# Hover Preview - MRR Plan and Current Implementation

Date: 2026-02-20

## 1) Product Positioning

Hover Preview is positioned for general productivity users who want faster reading and lookup workflows:
- Image hover previews for links
- Right-click word definitions
- Low-friction UI with no distracting popups or aggressive visuals

## 2) Monetization Strategy (Freemium)

### Free Tier
- Image hover previews
- Right-click definitions
- Daily definition cap: 5 lookups/day

### Premium Tier ($2.99/month target)
- Unlimited definitions
- Synonyms and antonyms (via enhanced dictionary payload)
- Etymology / word origin (when available)
- Multiple definitions and usage examples
- Word history features
- Clean experience without intrusive upgrade interruptions

## 3) MRR Logic and Conversion Flow

Primary conversion trigger:
- User reaches the free daily definition limit
- Inline warning appears with clear upgrade CTA
- CTA opens extension settings/options page

Secondary conversion trigger:
- Options page presents premium value stack and upgrade action

Retention levers:
- Daily habit loop from quick definitions
- Word history creates perceived value over time
- Enhanced definitions improve utility for paid users

## 4) What Is Implemented in the Extension

### A) Core Interaction
- Hover image preview behavior with increased preview size (+150%)
- Reddit gallery/post handling for image extraction
- Right-click selected text to request definitions

### B) Freemium Infrastructure
- User tier state (free/premium)
- Daily usage counter with automatic reset
- Premium expiry support
- Word history storage (latest 100 entries)

### C) Definition Experience
- Enhanced response format for richer content
- Premium-style content sections:
  - Definition
  - Synonyms
  - Origin/Etymology
- Auto-hide floating definition panel
- Limit warning panel with upgrade link

### D) Settings / Options UX
- Account plan display (Free vs Premium)
- Usage progress indicator for free users
- Upgrade button (currently demo activation behavior)
- Word history list and clear action
- Feature list presentation for premium value

## 5) Files Added/Updated for This Work

- chrome-hover-preview/manifest.json
- chrome-hover-preview/background.js
- chrome-hover-preview/contentScript.js
- chrome-hover-preview/content.css
- chrome-hover-preview/storage.js
- chrome-hover-preview/options.html
- chrome-hover-preview/options.js

## 6) Pricing and Packaging Recommendation

Recommended initial plan:
- Single paid tier at $2.99/month

Optional near-term tests:
- $1.99/month launch promo for first 60 days
- Annual plan later (for example: ~$19.99/year) after baseline conversion is measured

## 7) Metrics to Track for MRR

Core funnel metrics:
1. Active users (DAU/WAU/MAU)
2. Free users hitting daily cap (% of active)
3. Upgrade click-through from cap warning
4. Trial-to-paid conversion (if trial is used)
5. Paid churn rate
6. ARPU and MRR growth rate

Operational metrics:
- Definition success rate
- Lookup latency
- Error rates from dictionary provider

## 8) What Still Needs to Be Done for Real Billing

Current upgrade behavior is demo-style and not connected to payment rails.
To productionize MRR, add:
1. Payment provider integration (Stripe, Paddle, Lemon Squeezy, etc.)
2. License/token verification flow for premium entitlement
3. Secure entitlement sync (backend + extension)
4. Grace period and failed-payment handling
5. Cancellation and downgrade UX

## 9) Suggested Next Build Steps (Practical Order)

1. Add real billing and entitlement verification
2. Add lightweight analytics events for funnel tracking
3. Add premium trial (for example 7 days) and A/B test offer copy
4. Add export capability for word history (premium feature)
5. Improve onboarding copy to show free value quickly

## 10) Positioning Copy (Store-Friendly Draft)

Short value prop:
- Preview images instantly and define words in one click.

Free plan copy:
- Fast previews + 5 daily definitions.

Premium plan copy:
- Unlimited definitions, synonyms, origins, examples, and history tools.

---

This document summarizes the full MRR direction and the implementation status currently in the codebase.