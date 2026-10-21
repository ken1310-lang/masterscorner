# MastersCorner — Product Requirements Document (PRD)

**Product:** MastersCorner  
**Document version:** 2.0  
**Status:** Reconciled with the design prototype; first release scoped and gated (§29, §30)  
**Product category:** Martial arts discovery marketplace + academy management platform + branded website builder  
**Primary market:** India, with Chennai and Tamil Nadu as initial focus markets  
**Primary users:** Martial arts masters, academy owners, students, parents and event organisers

**Companion documents**

| Document | Purpose |
| --- | --- |
| `docs/design-alignment.md` | Screen-by-screen mapping between `masterscorner.html` and this PRD: screen dispositions, contradictions and their resolutions, and the allowed design deviations |
| `docs/decisions/ADR-001-environment-and-migration-strategy.md` | Development, preview and production environments; versioned database migrations |
| `docs/decisions/ADR-002-mvp-scope-and-free-pro-site.md` | First-release scope and the decision that the Pro Site is free |
| `docs/decisions/ADR-003-design-source-of-truth-and-port.md` | How the design prototype is ported into the web application |

**Change log — version 2.0 (reconciliation with the design prototype)**

- The Pro Site is **free** in the first release; subscriptions, billing and custom domains are deferred (§20, §21).
- The first release is narrowed to master accounts, master-owned classes, public discovery and the free Pro Site (§29, §30, §39).
- Verification badges, ratings and reviews are not displayed until the data and workflow behind them exist (§14, §16, §31.9).
- Sections carry release phases instead of unanchored priority labels (§29).
- The delivery model is recorded: environments, migrations, pull requests and quality gates (§37).
- The prototype is the visual source of truth with a documented deviation register (§26.6, §38, ADR-003).
- Two prototype flows absent from this PRD — SchoolConnect and the request network — are recorded as future scope (§40).
- Navigation and console labels are aligned with the prototype (§5).

---

# 1. Executive Summary

## 1.1 What is MastersCorner?

MastersCorner is a digital platform dedicated to discovering, promoting, managing and growing martial arts education and communities.

It combines three connected products:

1. **A marketplace for martial arts:** Students and parents can discover masters, academies, classes, styles, events and training opportunities.
2. **A business platform for masters:** Masters can maintain their profiles, manage enquiries, promote classes, accept trial bookings, manage students and showcase their achievements.
3. **A branded website for every master or academy:** Masters can create a professional website powered by MastersCorner without hiring a designer or managing a separate website service. This website is free for every master in the first release (§20, §21).

The experience should be inspired by the relationship between Uniiti and individual restaurant websites such as Chennai Dosa: a central discovery platform helps customers find a business, while the business can also have its own branded digital presence.

MastersCorner applies this concept specifically to martial arts, where trust, lineage, experience, qualifications, training discipline and community are important.

## 1.2 The product in one sentence

**MastersCorner helps students find the right martial arts training and helps masters turn their expertise into a discoverable, trustworthy and sustainable business.**

## 1.3 Why build it?

Martial arts discovery and academy management are often fragmented.

Students may find academies through word of mouth, social media, maps or messaging groups. Comparing instructors, understanding class schedules, checking qualifications, evaluating locations and booking trial classes can require multiple separate conversations.

Masters face a different problem. Many have valuable expertise but lack a professional website, consistent marketing, a reliable way to manage incoming leads or the time and budget to maintain digital tools.

MastersCorner connects these needs.

Students get one place to discover and evaluate training opportunities. Masters get one platform to promote and manage their work. MastersCorner creates value from both sides of that relationship.

## 1.4 Product vision

Become the trusted digital home for martial arts in India, beginning with discovery and professional master profiles, then expanding into academy operations, branded websites, bookings, events and student growth.

## 1.5 Product positioning

MastersCorner should not look like a generic business directory or an ordinary website builder.

It should feel like a specialised martial arts platform that understands:

- Traditional martial arts and their lineages.
- Modern combat sports and fitness-oriented training.
- The importance of instructors and credentials.
- Academy locations, class schedules and training programmes.
- Students, parents, competitive athletes and beginners.
- Seminars, workshops, grading, championships and martial arts communities.

Traditional martial arts should receive the same quality of representation as mainstream commercial classes.

---

# 2. Product Goals

## 2.1 Primary goals

### Goal A: Make martial arts easier to discover

Students should be able to find appropriate masters, academies and classes by location, style, audience, experience level, schedule and training objective.

**Why:** Better discovery brings value to students and gives masters a reason to maintain their MastersCorner profiles.

### Goal B: Make masters look professional online

Every master should be able to present their background, skills, lineage, achievements, teaching philosophy, locations, class schedules, photographs and contact options in one well-organised profile.

**Why:** A professional profile builds credibility and reduces the need for students to collect information from scattered social media posts and messages.

### Goal C: Generate measurable enquiries and bookings

Students should be able to enquire about classes, request a trial, register for events and express interest in training without unnecessary friction.

**Why:** Masters need measurable business value, not just a profile page that receives views.

### Goal D: Give masters their own branded website

Masters should be able to create an attractive website under a MastersCorner subdomain and upgrade to a custom domain when appropriate.

**Why:** A branded website gives masters a practical alternative to building and maintaining their own sites. It is free during the first release and becomes a recurring revenue source once paid plans and custom domains are introduced (§21).

### Goal E: Support academy growth and everyday operations

The platform should progressively support lead follow-up, student records, schedules, attendance, memberships and academy communications.

**Why:** MastersCorner should become more valuable as the master grows, rather than remaining a directory account used only occasionally.

### Goal F: Build a trusted martial arts community

The platform should make it easier to identify genuine masters, discover legitimate events, understand qualifications and read credible reviews.

**Why:** Trust is central to choosing a martial arts instructor, particularly for parents choosing training for their children.

## 2.2 Secondary goals

- Encourage more masters to establish a digital presence.
- Increase the number of complete and accurate academy listings.
- Support both traditional and modern martial arts.
- Increase student participation in workshops and tournaments.
- Create opportunities for master-to-master collaboration.
- Enable regional and language-specific discovery as the platform grows.
- Create a sustainable subscription and transaction-based business.

## 2.3 What success looks like

A successful MastersCorner experience should allow a student to go from searching for a suitable class to submitting a trial enquiry without needing to understand how the platform works.

It should allow a master to create a professional digital presence, receive an enquiry and follow up with the student without managing multiple unrelated services.

---

# 3. Target Users and Personas

## 3.1 Students and beginners

These users want to start training but may not know which martial art or instructor is right for them.

They need to understand what a class teaches, where it is held, what it costs, whether beginners are welcome and how to get started.

Typical needs:

- Find nearby training.
- Compare different martial arts.
- Understand class timings and fees.
- See instructor backgrounds.
- Ask questions before committing.
- Book a trial class.
- Save interesting masters and academies.

## 3.2 Parents and guardians

Parents need confidence that an academy is appropriate for their children.

They care about instructor credibility, class environment, age suitability, location, schedule, safety and communication.

Typical needs:

- Find child-friendly classes.
- Identify verified instructors and academies.
- Understand the programme and progression.
- Contact the academy or request a trial.
- Find competition and grading opportunities.

## 3.3 Traditional martial arts masters

This includes instructors teaching arts such as Silambam, Kalaripayattu, Varma Kalai and other traditional disciplines.

Their expertise may be well established locally but not well represented online.

Typical needs:

- Preserve and communicate lineage and tradition.
- Document achievements and teaching experience.
- List multiple training locations.
- Share photos, demonstrations and events.
- Promote classes without depending entirely on social media.
- Create an affordable professional website.

## 3.4 Modern martial arts instructors

This includes instructors teaching Karate, Taekwondo, Judo, Boxing, Kickboxing, Muay Thai, MMA, Brazilian Jiu-Jitsu, self-defence and related disciplines.

Typical needs:

- Generate trial enquiries.
- Promote different programmes.
- Display qualifications and competition achievements.
- Manage class schedules and leads.
- Promote memberships, workshops and special sessions.

## 3.5 Academy owners

Academy owners may manage several instructors, locations, programmes and student groups.

Typical needs:

- Present the academy as a professional brand.
- Maintain accurate information for each branch.
- Manage incoming leads.
- Promote class schedules and events.
- Track student enrolment and attendance.
- Maintain a branded website.
- Understand how online promotion converts into enquiries.

## 3.6 Event organisers

These users organise tournaments, seminars, workshops, demonstrations, grading sessions and camps.

Typical needs:

- Publish event information.
- Specify eligibility, age groups and categories.
- Promote events to relevant audiences.
- Accept registrations or expressions of interest.
- Communicate updates to participants.
- Share results and event photographs after completion.

## 3.7 MastersCorner administrators

Administrators maintain the quality, trustworthiness and consistency of the platform.

They need to manage master verification, academy listings, event content, reports, reviews and subscription-related support.

Their objective is to protect marketplace quality while helping genuine masters participate.

---

# 4. Product Principles

Every product decision should follow these principles.

## 4.1 Martial arts first

The product must represent martial arts accurately rather than forcing every discipline into a generic fitness-business template.

For example, lineage and traditional weapons training may be important for one master, while competition results, sparring programmes or belt progression may be more relevant to another.

## 4.2 Trust before promotion

Paid subscriptions may offer additional branding and business tools, but they must not automatically imply that a master is qualified or verified.

Verification status, paid status and search promotion must remain clearly distinguishable.

## 4.3 One update, multiple destinations

A master should be able to maintain their important information in one place and reuse it across their public profile, academy page, branded website and relevant booking or event pages.

## 4.4 Simple for non-technical users

A master should not need web-design knowledge to publish a professional profile or branded website.

Use clear forms, guided setup, previews, helpful explanations and sensible defaults.

## 4.5 The marketplace and master tools must reinforce each other

The public marketplace should bring students to masters. The business tools should help masters convert that interest into enrolments and better service.

Neither side should feel like an unrelated product.

## 4.6 Mobile-first usability

Students often discover classes and contact instructors from their phones. Masters may also manage enquiries and schedules while travelling or teaching.

The experience must be comfortable on mobile, while still providing a capable desktop workspace for academy management.

## 4.7 Transparent commercial relationships

Clearly explain subscription plans, transaction charges where applicable, cancellation terms, paid promotions and the distinction between MastersCorner services and the master's own services.

---

# 5. Product Structure and Navigation

MastersCorner should provide two connected experiences.

## 5.1 Public discovery experience

Primary navigation (labels follow the design prototype):

- Masters
- Academies
- Classes
- Events
- Experience Card
- For Masters

Utility navigation:

- Search
- Sign in
- For Masters call to action

Saved items requires student accounts (§22) and appears with them in Phase 3. A navigation link is rendered only when its destination exists (deviation D6 in `docs/design-alignment.md`).

The public pages should be approachable to students who have never used MastersCorner before.

## 5.2 Master business experience

The signed-in workspace provides, by release phase:

First release:

- Overview
- Profile (identity, teaching locations, media)
- Classes and schedules
- Pro Site

Later phases add: Leads and enquiries (Phase 2), Bookings (Phase 2), Insights (Phase 2), Reviews (Phase 3), Events (Phase 3), Students and locations as an organisation entity (Phase 3), Plan and billing (Phase 3), Account settings as required.

The console navigation is phase-gated: a destination is shown only when its module exists (`docs/design-alignment.md` §2).

## 5.3 Academy and master websites

Each master or academy should have a public profile on MastersCorner and, where eligible, a dedicated branded site.

The public listing helps students discover and compare options. The branded site allows the master to explain their academy in greater depth, tell their story and promote programmes under their own identity.

---

# 6. Public Marketplace: Homepage

**Release phase: First release — Foundational**

## 6.1 Purpose

Introduce MastersCorner, communicate its value and guide visitors towards discovering a suitable martial arts experience.

The homepage must serve both people who already know what they want and people who are exploring martial arts for the first time.

## 6.2 Required content

### Main introduction

A strong opening section explaining that visitors can discover martial arts masters, academies, classes and events.

Primary action: **Explore Masters**

Secondary action: **Find Classes Near Me**

A third pathway can introduce the platform to instructors: **Join as a Master**

### Search and discovery

Visitors should be able to search by:

- Martial art or discipline.
- Location.
- Master or academy name.
- Training objective.
- Audience, such as children, adults or beginners.

Search suggestions should make it easier for visitors who are uncertain about terminology.

### Featured masters

Show selected master profiles with meaningful information:

- Name and photo.
- Main martial arts.
- Location.
- Experience, where provided.
- Verification status, where applicable.
- Short introduction.
- Link to view the profile.

Featured status must not be confused with verification.

### Browse by martial art

Visitors should be able to explore recognised martial arts and related disciplines through visual categories.

Categories must accommodate traditional martial arts, striking, grappling, combat sports and self-defence.

### Browse by location

Provide accessible entry points into available cities and localities, starting with Chennai and expanding based on genuine coverage.

### Academies and classes

Introduce nearby academies, group classes, beginner programmes, children's training and other useful entry points.

### Upcoming events

Highlight relevant seminars, workshops, tournaments and special programmes.

### Experience Card

Explain the opportunity to discover or try martial arts through the Experience Card concept, including clear terms before the visitor proceeds.

### For masters

Explain the benefits of a MastersCorner profile, lead generation, academy tools and Pro Sites.

### Trust and quality

Explain how master verification works, what the platform checks and how visitors can report inaccurate information.

## 6.3 Why it matters

The homepage should not merely advertise MastersCorner. It must start a meaningful journey for both sides of the marketplace.

## 6.4 Acceptance criteria

- A visitor can begin a search immediately.
- Each major discovery section leads to a relevant page.
- The master onboarding pathway is easy to find.
- The page works comfortably on mobile and desktop.
- Visitors can identify what MastersCorner offers without signing in.
- Unavailable or incomplete marketplace categories are not falsely presented as fully populated.

---

# 7. Master Directory

**Release phase: First release — Core marketplace**

## 7.1 Purpose

Help students discover and compare individual martial arts masters.

This is the primary supply-side discovery feature and a foundation for MastersCorner’s long-term visibility.

## 7.2 Search filters

Visitors should be able to narrow results by:

- Martial art.
- City and locality.
- Distance or preferred area, where location information is available.
- Beginner-friendly training.
- Children's classes.
- Adult classes.
- Competition coaching.
- Self-defence.
- Available class days or time ranges, where maintained.
- Online or in-person training.
- Verification status.
- Price range, where the master has provided reliable pricing.

Not every filter needs to launch immediately. Filters should appear when there is enough reliable data to make them useful.

## 7.3 Master result cards

Each card should show enough information for a quick comparison:

- Master photograph.
- Name.
- Principal discipline.
- City or locality.
- Short biography or distinctive teaching focus.
- Years of experience if supplied and reasonably supported.
- Verification status, only where verification has actually been completed (§16).
- Rating and review count, only when genuine reviews exist (Phase 3, §14).
- Starting price or trial information, only when the master supplies it (§31.3).
- View Profile action.
- Book Trial or Enquire action, where the booking module exists (Phase 2, §13).

A card never displays a badge, rating or price that the platform cannot substantiate (§31.9).

## 7.4 Search and sorting

Support useful sorting options such as relevance, proximity where available, rating based on genuine reviews, and recently updated profiles.

Commercial promotion, if offered, must be labelled clearly. Paid placement must not be presented as proof of quality.

## 7.5 Empty, incomplete and error states

If few masters are available for a particular search, explain this and suggest nearby areas or related disciplines.

Do not invent results or display fabricated review counts.

Incomplete profiles may be displayed according to marketplace policy, but the page should distinguish limited information from verified information.

## 7.6 Why it matters

The directory creates shared value across the marketplace. Each additional quality master gives students more options, while students create the potential for more enquiries and bookings.

---

# 8. Master Profile

**Release phase: First release — Core trust and conversion page**

## 8.1 Purpose

Give each master a dedicated, comprehensive profile that helps visitors understand the instructor, evaluate suitability and take the next step.

Example: `masterscorner.in/master/master-name`

## 8.2 Profile sections

### Identity and introduction

- Name and professional title.
- Profile photograph.
- Short professional introduction.
- Primary discipline.
- Location or service area.
- Verification status.

### About the master

Explain the master’s teaching philosophy, history, approach and intended student audience.

The writing should be guided by the master’s own information rather than generated claims that cannot be substantiated.

### Martial arts and skills

Show the disciplines and programmes the master actually teaches.

Where relevant, include:

- Traditional weapons or forms.
- Self-defence.
- Competition training.
- Fitness and conditioning.
- Beginner programmes.
- Advanced training.

### Lineage and qualifications

Allow masters to share lineage, instructors, qualifications, grading, affiliations and relevant certifications.

Evidence-backed details should be distinguished from self-reported statements.

### Experience and achievements

Allow the master to showcase teaching experience, legitimate achievements, competition participation, awards and relevant milestones.

### Academies and locations

List the locations where the master teaches, with separate information for each branch or class venue.

### Classes and schedule

Show programmes, target audience, level, days, times, duration, pricing where available and whether prospective students can request a trial.

### Gallery and media

Support photographs and suitable video links that demonstrate the master’s work, class environment, training events or achievements.

Provide reporting and moderation controls for inappropriate or misleading content.

### Reviews

Display genuine student or parent reviews according to the platform’s review policy.

The system must not imply that every reviewer is a verified student unless the platform has actually established that connection.

### Events

Show upcoming workshops, seminars, grading sessions or competitions associated with the master.

### Contact and calls to action

Primary actions:

- Book a Trial.
- Ask a Question.
- View Academy.
- View Pro Site, if available.
- Register for an Event, where relevant.

WhatsApp or direct contact can be offered when appropriate, but should not be the only way to enquire.

## 8.3 Why it matters

The profile is the master’s permanent public identity within MastersCorner. It must serve as a trustworthy source of information and a practical conversion page.

## 8.4 Acceptance criteria

- A prospective student can understand what the master teaches and where.
- Credentials and verification are described accurately.
- The visitor can easily request a trial or ask a question.
- The profile is useful even when the master does not have a Pro Site.
- Unavailable information is omitted or clearly marked rather than fabricated.

---

# 9. Academy Directory and Academy Profiles

**Release phase: Phase 3 — academy directory and profiles; deeper branch management follows**

## 9.1 Purpose

Allow students to discover training centres and allow academy owners to represent their organisations independently of any single instructor.

An academy and an individual master are related but distinct entities.

One master may teach at multiple academies. One academy may have several instructors and programmes.

## 9.2 Academy directory

Visitors should be able to browse academies by:

- Location.
- Martial art.
- Programme or training objective.
- Suitable age group.
- Available class times.
- Facilities and relevant academy features, where provided.

## 9.3 Academy profile

Each academy page should support:

- Academy name and logo.
- Description and teaching approach.
- Address and area.
- Map or directions link.
- Contact options.
- Opening and class hours.
- Instructors associated with the academy.
- Martial arts taught.
- Available programmes.
- Class schedules.
- Fees or pricing information where provided.
- Gallery.
- Genuine reviews.
- Events.
- Enquiry or trial-booking actions.

## 9.4 Multiple locations

Academies with branches should be able to present a parent identity and distinct branch information.

Students must be able to determine which branch offers a particular class and schedule.

## 9.5 Why it matters

The academy is often the actual place where training occurs and payments are made. A master-centred directory alone cannot adequately represent multi-instructor centres or multi-branch businesses.

---

# 10. Class Finder

**Release phase: First release — Important discovery enhancement**

## 10.1 Purpose

Let students discover training opportunities by the class they need rather than requiring them to begin with a master’s name.

Example searches:

- Beginner Karate classes in Chennai.
- Children's Silambam classes near Tambaram.
- Women's self-defence classes.
- Adult Boxing classes in the evening.
- Weekend martial arts training.
- Competition coaching near Velachery.

## 10.2 Class information

Each class listing should include:

- Class or programme name.
- Martial art.
- Master or instructor.
- Academy and location.
- Intended audience and ability level.
- Schedule.
- Duration.
- Fee information, if available.
- Trial availability.
- Programme description.
- Enquiry or booking action.

## 10.3 Discovery logic

A class finder should show classes based on the information supplied by masters and academies. It must not suggest that a class is available at a time when the timetable does not support that claim.

If no suitable class is found, offer alternatives such as other days, nearby locations or related programmes.

## 10.4 Why it matters

Students think in terms of practical needs—location, time, budget and level—as often as they think in terms of martial arts styles.

---

# 11. Event and Tournament Directory

**Release phase: Phase 3 — High-value community feature**

## 11.1 Purpose

Create one place to discover martial arts events, including competitions, seminars, workshops, camps, demonstrations, grading sessions and guest training.

## 11.2 Event discovery

Visitors should be able to explore events by:

- Location.
- Date.
- Martial art.
- Event type.
- Audience or eligibility.
- Registration status.

## 11.3 Event page

Every event should include:

- Event title and banner.
- Organiser.
- Event type.
- Date and timings.
- Venue and location.
- Description and agenda.
- Eligible participants.
- Age groups and competition categories where applicable.
- Rules or requirements.
- Fees and included benefits.
- Registration deadline.
- Registration or enquiry action.
- Contact information.
- Cancellation or refund terms, where applicable.
- Relevant organiser and master profiles.

After an event, the organiser may publish results, photographs, highlights and follow-up information.

## 11.4 Event registration

The initial experience may allow registration enquiries or expressions of interest.

When paid registration is introduced, participants must see the total amount, payment terms, cancellation conditions and confirmation status clearly.

Organisers should be able to review registrations and communicate important updates.

## 11.5 Why it matters

Events create recurring reasons for students and masters to return to MastersCorner, help martial arts communities connect and provide additional monetisation opportunities.

---

# 12. Experience Card

**Release phase: Phase 3 — Important acquisition and monetisation feature (commercial terms unresolved, §35.1)**

## 12.1 Purpose

Make it easier for a new student to try martial arts without having to select a long-term academy membership immediately.

The Experience Card is intended to act as an entry point into discovering and trying suitable training opportunities.

Its exact commercial terms must be finalised before launch.

## 12.2 Proposed experience

1. A student discovers the Experience Card.
2. The student reads what it includes, its price if applicable, eligibility and validity.
3. The student selects a suitable master, academy or available experience.
4. The student requests or books a session.
5. The relevant master or academy receives the request.
6. The student receives confirmation and practical instructions.
7. After attending, the student can provide feedback and explore continued training.

## 12.3 Experience Card information

The product page should clearly state:

- What the card includes.
- Whether it covers one or multiple trial sessions.
- Participating masters and locations.
- Validity period.
- Eligibility requirements.
- Booking and cancellation rules.
- Any extra costs.
- Refund policy.
- How the student redeems the card.
- Who provides the class and who handles service issues.

## 12.4 Student Experience Card area

Students should be able to view:

- Card status.
- Available or remaining experiences, where applicable.
- Bookings.
- Redemption instructions.
- Expiry information.
- Cancellation status.
- Support options.

## 12.5 Master responsibilities

Masters should be able to see eligible requests, confirm attendance availability and understand the Experience Card terms.

They should not be asked to provide experiences outside the agreed commercial conditions.

## 12.6 Why it matters

The card can lower the psychological barrier to starting martial arts and create a repeatable customer-acquisition path for participating masters.

It should be launched only after the economics, participation terms, refunds and operational responsibilities are sufficiently clear.

---

# 13. Trial Booking and Enquiry Journey

**Release phase: Phase 2 — Core conversion capability**

## 13.1 Purpose

Turn discovery into meaningful action by allowing a student to express interest in a class or request a trial.

## 13.2 Booking request flow

The student should be able to:

1. Select a master, academy or class.
2. Choose an available class or preferred time where options are provided.
3. Enter the minimum information necessary to respond.
4. Add an optional message.
5. Review the request.
6. Submit it.
7. See a clear acknowledgement and next steps.

Do not present a request as a confirmed reservation until the relevant master or academy has accepted it or a confirmed-booking policy explicitly applies.

## 13.3 Booking states

The student should be able to distinguish:

- Request submitted.
- Awaiting response.
- Accepted or confirmed.
- Alternative time proposed.
- Cancelled.
- Completed.
- Declined or expired.

The master should receive the information needed to respond and manage the request.

## 13.4 Notifications

The product should provide appropriate confirmation and updates in a way the user can access.

The final notification channels may include email, in-product notifications and, when appropriate, SMS or WhatsApp.

Messages must be accurate and must not imply successful payment or booking when it has not occurred.

## 13.5 Enquiry without booking

Some students will have questions before they are ready to book.

Allow a simple enquiry form for questions about age suitability, fees, schedules, experience requirements and other relevant details.

## 13.6 Why it matters

An attractive directory creates limited value if students cannot take the next step easily. Booking and enquiry flows connect marketplace discovery to measurable results for masters.

---

# 14. Reviews, Ratings and Trust

**Release phase: Phase 3 — Foundational for long-term marketplace quality**

## 14.1 Purpose

Help prospective students understand other users’ experiences and allow masters to build credibility.

## 14.2 Review capabilities

Where eligible, users should be able to:

- Leave a rating.
- Share a written review.
- Describe the training experience.
- Report inappropriate reviews.
- Receive a response from the relevant master or academy.

Masters should not be able to remove legitimate negative feedback merely because it is unfavourable.

## 14.3 Review authenticity

The platform should have policies to limit fake reviews, spam, harassment, personal attacks and conflicts of interest.

A verified-student label should appear only when the platform can substantiate that status.

Ratings should be based on actual submitted reviews rather than demonstration data presented as genuine customer feedback. In the first release no rating and no review is displayed at all, because none can be substantiated (§30.2).

## 14.4 Review moderation

Administrators need ways to review reports, investigate suspicious activity, remove content that violates policy and record reasons for moderation decisions.

## 14.5 Why it matters

Martial arts instruction involves personal trust and long-term commitment. Credible reviews help students make better decisions while incentivising masters to maintain good service.

---

# 15. Master Onboarding and Account Creation

**Release phase: First release — Foundational supply-side journey**

## 15.1 Purpose

Make it easy for a genuine master or academy to join MastersCorner and create a useful public presence.

## 15.2 Onboarding journey

The master should be guided through a series of manageable steps:

1. Create an account.
2. Select the appropriate account type.
3. Enter basic identity and contact information.
4. Add a professional introduction.
5. Select martial arts taught.
6. Add experience, qualifications and lineage details where relevant.
7. Add academy locations.
8. Add at least one programme or class.
9. Upload photographs and relevant supporting materials.
10. Preview the public profile.
11. Submit for publication or verification as appropriate.

The user should understand what is required to publish a basic listing versus what is needed to obtain verification.

In the first release, step 1 is a working sign-up: email and password, with email verification where a mail provider is configured, followed by the master account type. Phone-based and social sign-in are not part of the first release. Steps 6 and 11 that depend on evidence and review (§16) arrive in Phase 2, and step 9 requires the media module that ships with the profile.

## 15.3 Progress indicators

Show profile-completion progress and provide useful suggestions for improving the listing.

Examples include adding a photograph, describing the class audience, specifying locations, adding schedules or completing verification.

Completion guidance should help users improve quality without implying that a fully completed profile is automatically verified.

## 15.4 Profile ownership

Masters should be able to request ownership of an existing listing, with an appropriate process to prevent unauthorised claims.

Administrators need a way to resolve ownership disputes.

## 15.5 Why it matters

The marketplace depends on having a broad and accurate supply of masters. A guided onboarding experience reduces friction and improves listing quality from the beginning.

---

# 16. Master Verification

**Release phase: Phase 2 — Trust foundation; operational detail can evolve**

## 16.1 Purpose

Give users better information about the reliability and background of a master without making verification claims stronger than the underlying evidence.

## 16.2 Proposed verification categories

The product may distinguish between:

- Basic account established.
- Identity or contact details checked.
- Qualifications or affiliation reviewed.
- Academy association confirmed.
- MastersCorner verified, according to a clearly defined verification policy.

These labels should be used only after the relevant checks exist and have been completed. Until the verification workflow exists (Phase 2) the first release displays no verification badge and no verification interface at all: a master record is simply unverified, and no copy implies otherwise (§31.9).

## 16.3 Verification process

A master should be able to:

1. Review the verification requirements.
2. Submit the required information or evidence.
3. See that the request has been received.
4. Check the request status.
5. Receive a request for more information if necessary.
6. Receive the decision and an explanation where appropriate.
7. Request reconsideration according to platform policy.

## 16.4 Administrator requirements

Administrators should be able to review submissions, request additional evidence, approve or reject applications and record decisions.

Verification expiry, renewal or suspension policies may be added when the programme matures.

## 16.5 Why it matters

Verification can become a major differentiator for MastersCorner. Its value depends on transparency, consistency and evidence—not simply on displaying a badge.

---

# 17. Master Dashboard

**Release phase: First release — Core business workspace (overview, profile, classes, Pro Site)**

## 17.1 Purpose

Give masters a single place to manage their public presence and see what is happening in their business.

## 17.2 Dashboard overview

The dashboard should highlight:

- Profile status and completeness.
- Verification status.
- New enquiries.
- Pending trial requests.
- Upcoming classes and events.
- Recent reviews.
- Pro Site status.
- Important tasks requiring attention.
- Relevant performance indicators when real data exists.

Avoid overwhelming new users with advanced analytics before they have received their first enquiry.

## 17.3 Useful quick actions

- Edit Profile.
- Add Class.
- Add Location.
- Respond to Enquiry.
- Manage Trial Requests.
- Publish Event.
- View Public Profile.
- Manage Pro Site.

## 17.4 Activity and reminders

The dashboard should help a master recognise outstanding tasks, such as unanswered enquiries, missing schedule information or an incomplete Pro Site setup.

Reminders should be relevant and manageable rather than distracting.

## 17.5 Why it matters

The dashboard turns MastersCorner from a static listing service into a tool masters have a reason to return to.

---

# 18. Leads and Enquiry Management

**Release phase: Phase 2 — Core value for masters**

## 18.1 Purpose

Help masters understand who is interested in training and follow up consistently.

## 18.2 Lead inbox

Each enquiry should display the relevant information available to the master:

- Student or guardian name.
- Contact method.
- Requested discipline or class.
- Preferred time, if provided.
- Enquiry date.
- Source page or campaign, where available.
- Message.
- Current status.

Sensitive information should be shown only to people who are authorised to access it.

## 18.3 Lead statuses

The master should be able to organise enquiries into useful stages such as:

- New.
- Contacted.
- Trial requested.
- Trial confirmed.
- Attended trial.
- Enrolled.
- Not proceeding.

These stages should be easy to understand and update.

## 18.4 Follow-up actions

A master should be able to record notes, mark a next action, change a lead’s status and use available contact methods.

The platform should not imply that a message has been sent unless it actually has.

## 18.5 Source tracking

Where practical, distinguish enquiries from the public directory, Pro Site, event page, Experience Card and other relevant channels.

This helps masters understand which services are generating value.

## 18.6 Why it matters

The number of enquiries is not enough. Masters need a practical way to turn interest into attended trial classes and ongoing students.

---

# 19. Students, Classes and Academy Operations

**Release phase: Phase 3 for students, class management and branches; Phase 4 for attendance, memberships and payments**

## 19.1 Purpose

Help masters manage basic academy activity without requiring them to adopt a separate complex business system immediately.

## 19.2 Student records

Masters should be able to keep appropriate records for students enrolled at their academy.

Potential information includes:

- Student name.
- Contact details where appropriate.
- Guardian contact for minors.
- Enrolment status.
- Programme or class.
- Start date.
- Relevant administrative notes.

The product must collect only the information needed for its intended purpose and protect it appropriately.

## 19.3 Classes and schedules

Masters should be able to create and maintain class information, including:

- Class name.
- Programme.
- Location.
- Target audience.
- Schedule.
- Capacity, where applicable.
- Fees.
- Trial availability.
- Status such as active, paused or full.

Schedule changes should be reflected wherever the class is displayed.

## 19.4 Attendance

A later iteration should allow masters to record attendance and quickly view participation.

The feature should suit both small traditional schools that prefer a simple student list and larger academies that manage multiple classes.

## 19.5 Memberships and payments

Membership administration can be added progressively, including membership status, fee schedules, due dates and payment records.

Actual payment collection must be governed by clear pricing, refunds, receipts and reconciliation policies.

## 19.6 Why it matters

Academy tools strengthen retention by addressing recurring needs after the master has joined and started receiving enquiries.

---

# 20. MastersCorner Pro Site

**Release phase: First release — a basic site, free for every master; advanced customisation follows (§21)**

## 20.1 Purpose

Allow every eligible master or academy to have a professional branded website without needing separate development or ongoing website maintenance. The Pro Site is included free of charge for every master in the first release (§21, ADR-002); paid tiers, custom domains and white-label options are later phases (§20.10).

Example concept: `mastername.masterscorner.in`

A later premium option may support a custom domain, such as `mastername.com`.

## 20.2 Product naming

Use **MastersCorner Pro Site** as the initial product name.

A MastersCorner subdomain is a branded site hosted within the MastersCorner service. A site with a custom domain and more extensive branding removal can be sold as a higher-tier white-label offering.

Avoid promising a fully unbranded experience on plans that still visibly use MastersCorner branding.

## 20.3 Site setup

A master should be able to:

1. Start with their existing MastersCorner profile.
2. Choose a visual theme.
3. Select a logo, photographs and accent colours.
4. Choose which sections to display.
5. Add or edit introductory copy and programme descriptions.
6. Preview the site on mobile and desktop.
7. Publish the website.
8. Return later to make changes.

Provide sensible defaults so that users without design experience can publish a polished site quickly.

The canonical public address is the master's MastersCorner subdomain (`{slug}.masterscorner.in`). Until that domain is delegated to the platform's DNS, the same site is reachable at a path address, and the console always displays the address that is live (ADR-004).

## 20.4 Standard Pro Site sections

A suitable starting set includes:

- Home.
- About the Master.
- About the Academy.
- Martial Arts and Programmes.
- Class Schedule.
- Locations.
- Achievements and Lineage.
- Gallery.
- Events.
- Reviews.
- Contact.
- Trial Booking.

Allow masters to hide optional sections when they are not relevant.

## 20.5 Homepage

The homepage should introduce the master or academy and provide a clear path to the primary action, usually booking a trial or making an enquiry.

It should present a professional visual identity and explain what makes the academy distinctive.

## 20.6 Programmes

Visitors should be able to understand the available programmes, intended audience, training objectives, levels and schedule.

Information should come from the master’s maintained profile and class information wherever possible.

## 20.7 Contact and enquiries

The site should offer clear contact options, location information and a simple enquiry or trial-booking journey.

Visitors should not have to search through the website to discover how to contact the master.

## 20.8 Site management

The master should be able to:

- Preview the website.
- Publish and unpublish it.
- Update content.
- Change supported branding options.
- See which sections are enabled.
- Open the public site.
- Manage the site plan.
- Request a custom-domain upgrade.

## 20.9 Shared information

The public MastersCorner profile and Pro Site should not become separate sources of conflicting information.

The master should maintain core facts, such as contact details, locations, disciplines and class schedules, once wherever possible.

The directory profile should focus on discovery and comparison. The Pro Site should focus on the master’s own story, programmes, community, brand and conversion.

## 20.10 Custom domains and white labeling

A premium offering may include:

- Custom domain.
- Expanded branding controls.
- Reduced or removed MastersCorner branding according to the selected plan.
- More layout and theme options.
- Enhanced enquiry and performance reporting.
- Additional marketing tools.

The product must clearly explain domain ownership, renewal responsibilities and what happens if a subscription ends.

## 20.11 Why it matters

The Pro Site creates recurring value for masters and strengthens the platform’s business model.

It is more valuable than a generic website builder because it can connect the branded website directly to master profiles, schedules, enquiries, bookings, reviews and events.

---

# 21. Subscription Plans and Monetisation

**Release phase: Phase 3 — paid plans arrive only after the free listing proves its value**

## 21.1 Purpose

Create a commercially sustainable platform without preventing students from discovering masters or forcing every instructor to pay before receiving basic value.

## 21.2 Proposed plan structure (Phase 3 — not part of the first release)

Until billing exists, every master receives the Pro capabilities free of charge: public profile, class schedule, Pro Site on a MastersCorner subdomain and the console. The structure below is the commercial model to validate later. The prices shown in the design prototype (₹799 and ₹1,999 per month) are illustrative only and are not commitments.

### Free Listing

For masters who want an initial presence.

Possible inclusions:

- Public master profile.
- Basic academy information.
- Martial arts and location information.
- Basic discovery participation.
- Enquiry capability.
- Limited photos or content options.

The free tier should be useful enough to encourage legitimate masters to join.

### Pro

For masters who want stronger online presentation and more business tools.

Possible inclusions:

- Pro Site on a MastersCorner subdomain.
- Enhanced profile and gallery.
- Class schedule management.
- Lead inbox.
- Trial enquiry management.
- Basic performance insights.
- Additional branding and content controls.

### Premium / White Label

For established masters and academies that need a more independent online identity.

Possible inclusions:

- Custom domain support.
- Expanded brand customisation.
- Reduced or removed platform branding according to plan.
- Enhanced insights.
- Additional lead and marketing tools.
- More academy management capability.
- Priority support where economically practical.

## 21.3 Pricing approach

Pricing should be researched and validated with actual masters before finalisation.

Illustrative early price hypotheses for India could be:

- Pro: approximately ₹499–₹999 per month.
- Premium: approximately ₹1,499–₹2,999 per month.

These are assumptions for market testing, not final prices or confirmed demand.

Offer appropriate annual pricing only after the value proposition and support costs are understood.

## 21.4 Additional revenue opportunities

Potential future revenue sources include:

- Paid event listings or organiser services.
- Event registration fees where justified.
- Experience Card sales.
- Transaction fees for supported bookings.
- Promotional placements that are explicitly labelled.
- Academy management upgrades.
- Additional website features.

Each revenue stream should be introduced only after its operational responsibilities and value to users are clear.

## 21.5 Subscription lifecycle

Users should be able to see their current plan, its features, renewal terms, billing history and available upgrades.

Cancellation and downgrade paths must be transparent.

If a subscription expires, explain clearly what happens to the Pro Site, custom domain, stored content and business tools. Never silently imply that a paid feature will remain available indefinitely.

## 21.6 Why it matters

Freemium discovery helps build marketplace coverage. Paid plans create recurring revenue by delivering ongoing business value to masters.

The goal is to monetise services that help masters grow—not simply charge for appearing in search results.

---

# 22. Student Accounts and Saved Items

**Release phase: Phase 3 — Introduce alongside more complete booking features**

## 22.1 Purpose

Allow students to manage their interactions with MastersCorner across multiple visits.

## 22.2 Student capabilities

A student account should support:

- Saved masters.
- Saved academies and classes.
- Trial requests and booking history.
- Event registrations.
- Experience Card status.
- Relevant notifications.
- Profile and contact preferences.
- Requests to correct or remove personal information, subject to applicable rules.

## 22.3 Guest access

Do not force users to create an account just to browse listings.

Account creation should be requested when it adds clear value, such as viewing booking history or managing an Experience Card.

## 22.4 Minors and guardians

Where a student is a minor, design appropriate guardian involvement into relevant communications, bookings and account activities.

Do not expose a child’s contact details or sensitive information publicly.

## 22.5 Why it matters

A persistent student experience supports repeat bookings, class participation, event registration and stronger relationships between students and masters.

---

# 23. Notifications and Communication

**Release phase: Phase 3 — Essential as transaction volume increases**

## 23.1 Purpose

Ensure users receive important information without needing to repeatedly check the platform.

## 23.2 Student notifications

Examples include:

- Enquiry acknowledgement.
- Trial request accepted or changed.
- Booking reminder.
- Event registration confirmation.
- Important event updates.
- Experience Card expiry or booking information.
- Responses from a master or academy.

## 23.3 Master notifications

Examples include:

- New enquiry.
- New trial request.
- Booking changes.
- New review.
- Event registration.
- Verification status update.
- Pro Site or subscription notice.

## 23.4 Communication rules

Messages should be accurate, relevant and actionable.

Marketing communications should be distinct from essential service messages and respect user preferences.

Automated reminders must not be sent as though a master has personally approved something unless approval occurred.

## 23.5 Why it matters

Fast and reliable communication reduces missed bookings, improves user confidence and helps masters respond while interest is still high.

---

# 24. Pro Site Performance and Insights

**Release phase: Phase 2 for basic insights; Phase 4 for advanced marketing tools**

## 24.1 Purpose

Help masters understand whether their public presence and website are attracting attention and generating enquiries.

## 24.2 Proposed insights

Depending on the plan and the availability of reliable measurements, display:

- Profile views.
- Pro Site visits.
- Enquiry count.
- Trial requests.
- Booking completion.
- Enquiry source.
- Popular programmes.
- Event interest.
- Changes over time.

Clearly define what each number represents.

Do not present estimated or incomplete measurements as precise business outcomes.

## 24.3 Recommended actions

Where enough evidence exists, offer practical suggestions such as:

- Add more profile photographs.
- Complete missing class information.
- Add a schedule.
- Respond to outstanding enquiries.
- Publish an upcoming event.
- Improve the Pro Site introduction.

Suggestions should remain helpful rather than implying guaranteed growth.

## 24.4 Why it matters

Insights help masters see concrete reasons to maintain their profiles and pay for tools that generate genuine value.

---

# 25. MastersCorner Administration and Moderation

**Release phase: Phase 2 — manual moderation covers the first release**

## 25.1 Purpose

Maintain marketplace quality, protect users and support legitimate masters.

## 25.2 Admin capabilities

The administrative workspace should support:

- Reviewing master submissions.
- Reviewing verification requests.
- Managing listing ownership claims.
- Editing or correcting listings when authorised.
- Reviewing reported profiles, reviews, photographs and events.
- Managing event publication and moderation.
- Handling disputes and support requests.
- Managing plan information and subscription-related support.
- Viewing platform activity at an appropriate aggregate level.
- Recording important moderation decisions.

## 25.3 Reporting

Users should be able to report:

- Incorrect information.
- Suspected impersonation.
- Misleading qualification or verification claims.
- Inappropriate photographs or content.
- Fake reviews.
- Suspicious events.
- Harassment or unsafe conduct.
- Unauthorised use of personal or commercial information.

## 25.4 Moderation principles

Moderation rules should be written and consistently applied.

Provide masters with reasonable notice and an explanation when action is taken against their listing, except where immediate action is necessary to protect users or an investigation.

Provide a path for appeal or correction where appropriate.

## 25.5 Why it matters

The platform’s credibility is a product feature. A directory that accepts unreviewed claims without clear reporting and moderation cannot reliably earn user trust.

---

# 26. Visual Identity and User Experience

## 26.1 Design direction

MastersCorner should combine the credibility of a modern directory with the confidence and identity of martial arts.

The visual identity should feel:

- Professional.
- Bold.
- Disciplined.
- Trustworthy.
- Modern.
- Community-oriented.
- Respectful of traditional martial arts.

A refined dark navy or near-black foundation, warm neutral surfaces and restrained crimson accents can provide a recognisable visual system. Colour should never be the only indicator of verification, status or errors.

## 26.2 Design inspiration

Use the Uniiti-to-Chennai-Dosa relationship as a product-model reference, not a literal visual template.

The central directory should feel efficient and discovery-oriented. Individual Pro Sites can be more expressive, using the master’s own identity, photography and martial arts discipline.

The public marketplace, management dashboard and individual master website can have different visual emphasis while remaining part of the same service.

## 26.3 Motion and interaction

The marketplace and dashboard should prioritise usability.

Use subtle transitions for navigation, filtering, opening panels, selecting tabs, displaying status changes and confirming actions.

Avoid excessive scroll-led animation in the master console, search results, booking flow and other task-oriented pages.

## 26.4 Responsive experience

All essential actions must work on a mobile phone.

Search controls, cards, forms, booking steps, dashboards and Pro Site previews should adapt to smaller displays without requiring horizontal scrolling for ordinary use.

## 26.5 Accessibility and clarity

Text must be readable, interactive targets should be easy to use, forms should clearly identify required information and error messages should explain how to correct a problem.

Important actions should use clear labels rather than ambiguous icons alone.

## 26.6 Design source of truth

`masterscorner.html` in the repository root is the visual source of truth for every screen in scope: layout, spacing, type scale, colour and component structure. Its palette (navy `#0b132b`, secondary navy `#111c39`, accent `#d14b5a`, paper `#f6f5f2`, ink `#172033`, muted `#5f6a82`, line `#dfe3ea`), its Outfit/Manrope type stack, its fluid `clamp()` type scale and its 980, 760 and 520 pixel breakpoints become Tailwind v4 theme tokens in `packages/ui/src/styles/globals.css`.

The prototype specifies appearance, not behaviour or content. Its ratings, review counts, fees, learner counts, plan badges and reference numbers are placeholders and must never reach a component as literals. Screens are ported route by route, the permitted differences are listed in `docs/design-alignment.md` §8, and new states or screens are added to the prototype first so that it stays the single reference (ADR-003).

---

# 27. Search Visibility and Content Quality

**Release phase: First release as a requirement; ongoing optimisation follows launch**

## 27.1 Purpose

Help students discover MastersCorner and relevant masters through useful, accurate public information.

## 27.2 Discovery pages

The product should support meaningful public pages for:

- Individual masters.
- Academies and branches.
- Martial arts.
- Classes and programmes.
- Locations.
- Events.
- Pro Sites.

Pages should be published only when they contain enough useful information to serve users.

## 27.3 Content quality

Each public page should explain something useful rather than merely repeat a place name and discipline.

Examples include a master’s actual teaching focus, an academy’s programmes, a genuine class schedule or a properly maintained event listing.

Do not generate large numbers of empty or misleading location pages solely to increase search visibility.

## 27.4 Pro Site distinction

The MastersCorner profile should primarily help students discover and compare masters.

The Pro Site should primarily help a master explain their identity, academy, programmes and community to visitors.

These pages should complement one another, rather than being redundant copies of the same text.

## 27.5 Why it matters

Search discovery can compound over time. High-quality public information benefits students and provides a durable acquisition channel for the platform.

---

# 28. Core End-to-End User Journeys

## Journey A: A beginner discovers martial arts

1. The student opens MastersCorner.
2. They search by location, discipline or training objective.
3. They review the results.
4. They open a master profile.
5. They compare qualifications, classes, location and reviews.
6. They ask a question or request a trial.
7. They receive confirmation of the submitted request.
8. The master responds.
9. The student attends a trial and decides whether to enrol.

**Success outcome:** A relevant student connects with a suitable master.

## Journey B: A parent finds a class for a child

1. The parent searches for children's classes in a preferred area.
2. They filter by relevant martial arts and times where available.
3. They open an academy or master profile.
4. They review the class audience, schedule and instructor information.
5. They request a trial.
6. They receive the next steps and attend the class.

**Success outcome:** The parent feels sufficiently informed to take a first step.

## Journey C: A master joins MastersCorner

1. The master creates an account.
2. They complete a guided profile.
3. They add the martial arts they teach and their locations.
4. They enter class information.
5. They upload photographs and supporting credentials where relevant.
6. They preview the profile.
7. The profile is published according to platform policy.
8. The master can request verification.
9. The master receives and manages enquiries.

**Success outcome:** A genuine master establishes a useful public presence without requiring a web designer.

## Journey D: A master launches a Pro Site

1. The master opens Pro Site Management.
2. They preview the site generated from their profile.
3. They choose a theme and make branding adjustments.
4. They review programmes, schedules, photos, locations and contact details.
5. They preview mobile and desktop layouts.
6. They publish the site.
7. Visitors can discover the site and submit enquiries.
8. The master reviews the results and updates the content over time.
9. The master may later upgrade to a custom domain.

**Success outcome:** The master has a professional website connected to their existing MastersCorner presence.

## Journey E: An organiser promotes an event

1. An authorised organiser creates an event listing.
2. They add dates, venue, eligibility, fees and registration information.
3. The event is published according to platform rules.
4. Students discover and review the event.
5. They register or enquire.
6. The organiser reviews registrations and communicates updates.
7. The event takes place.
8. Results or appropriate highlights are published.

**Success outcome:** Students discover legitimate events and organisers can manage participation more consistently.

## Journey F: A master converts an enquiry

1. A student submits a trial request.
2. The master receives the request.
3. The master reviews the intended class and preferred schedule.
4. They respond, confirm a slot or propose an alternative.
5. The student receives the update.
6. After the trial, the master updates the enquiry status.
7. If the student enrols, the master records the appropriate outcome.

**Success outcome:** MastersCorner provides measurable value by helping masters convert interest into participation.

---

# 29. Release Plan

The release plan follows the dependency of the user journeys, not the number of pages. The phases named here are the single source of truth for scope: a feature belongs to the phase named in this section regardless of the importance label used anywhere else in this document. Each phase is delivered as a series of pull requests, one per module slice (§37.3, §39).

## Phase 1 — First release (MVP)

Master accounts, master-owned classes and the free Pro Site. Defined in full in §30 and §39, and decided in `docs/decisions/ADR-002-mvp-scope-and-free-pro-site.md`.

Build:

- Platform foundations: development and production environments with separate databases, versioned migrations, pull-request checks (§37).
- Master sign-up, sign-in and account (§15).
- Master profile: identity, introduction, martial arts, locations, media (§8).
- Master-owned classes and schedules (§10, §19.3).
- Public home page and the For Masters acquisition page (§6).
- Public master registry, master profile and class listing (§6, §7, §10).
- Free Pro Site generated from profile and class data (§20).
- Console: overview, profile, classes, Pro Site (§17).

**Why first:** the marketplace is worthless without masters and class information, and the free Pro Site is what gives a master a reason to join.

## Phase 2 — Conversion

Turn discovery into enquiries and let masters answer them.

- Enquiry and trial-request flow with its request states (§13).
- Lead inbox and lead statuses (§18).
- Basic insights computed from real events (§24.2).
- Master verification workflow and the moderation workspace that reviews it (§16, §25).
- Profile-completion guidance derived from real fields (§15.3).

**Why second:** measurable enquiries are the value a master pays for later, and verification is what makes public claims trustworthy.

## Phase 3 — Recurring value and community

- Subscription plans and billing (§21).
- Reviews, ratings and moderation (§14).
- Academy as an organisation entity with instructors and branches (§9, §19.4).
- Events, registration of interest and organiser tooling (§11).
- Experience Card, once its commercial terms are settled (§12, §35.1).
- Student accounts, saved items and booking history (§22).
- Notifications (§23).

**Why third:** these only pay off once masters are publishing and answering enquiries.

## Phase 4 — Scale and operations

- Custom domains and white-label branding (§20.10).
- Advanced academy operations: attendance, memberships and payments (§19.4, §19.5).
- Location and discipline landing pages and broader regional coverage (§27).
- Advanced marketing and retention tooling (§24).
- SchoolConnect and the request network (§40).
- Localisation and accessibility work driven by real user needs (§26.5).

**Why fourth:** each item needs demonstrated demand, operational capacity or an established marketplace before it can be run responsibly.

---

# 30. MVP Scope and Non-Goals

## 30.1 MVP definition

The MVP is the smallest coherent product in which a martial arts master can create an account, publish a professional profile with classes and receive a branded website free of charge, and in which a visitor can find that master and those classes.

Modules, dependencies and build order are in §39. The decision record is `docs/decisions/ADR-002-mvp-scope-and-free-pro-site.md`.

## 30.2 Must have in the first release

- Master sign-up, sign-in and session handling.
- Master profile: identity, introduction, martial arts, years teaching, home city, teaching locations and profile photo.
- Media upload for the profile photo and the Pro Site logo.
- Classes: create, edit and remove a class with martial art, audience, level, schedule, location, fee (optional) and status.
- Public master registry with filters for martial art, location and audience.
- Public master profile page, without ratings, reviews, verification badges or trial actions in this release.
- Public class listing built from master-owned classes.
- Free Pro Site on a MastersCorner subdomain, generated from the same profile and class data.
- Console: overview, profile, classes and Pro Site.
- Home page presenting the real supply: search, featured masters, classes and the master call to action, plus the For Masters acquisition page. Sections whose modules do not exist are not rendered.
- Development and production environments with separate databases; every schema change is applied to development first (§37).
- One pull request per module slice, each reviewed on its own (§37.3).

## 30.3 Should have in the first release

- Email verification and password reset for master accounts.
- Empty, loading and error states for every public list and console screen.
- Metadata and structured data for master, class and Pro Site pages (§27).
- Input validation and rate limiting on authentication and public forms.

## 30.4 Not in the first release

- Enquiries, trial requests, bookings and the lead inbox (Phase 2).
- Verification badges and the verification workflow (Phase 2).
- Ratings, reviews and review moderation (Phase 3).
- Academy as an organisation entity, academy directory and academy pages (Phase 3).
- Events, Experience Card and paid registrations (Phase 3).
- Subscriptions, billing and invoices (Phase 3); custom domains and white-label branding (Phase 4).
- Student accounts, saved items and booking history (Phase 3).
- Notifications beyond account email (Phase 3).
- Student records, attendance, memberships and payments (Phase 4).
- Administration workspace, replaced by manual moderation until Phase 2 (§25).
- Native mobile application.
- SchoolConnect and the request network (§40).

The following remain out of scope as in earlier versions: a fully automated transaction marketplace, tournament scoring, payroll and accounting, an LMS, automated grading management, live-streamed training, guaranteed ranking or student acquisition, social networking, AI-generated or unverifiable credential claims, and full discipline and geographic coverage.

---

# 31. Business Rules and Product Guardrails

## 31.1 Listing and verification

A free listing is not the same as a verified listing.

A paid Pro Site is not the same as a verified listing.

Payment must not automatically grant credibility badges.

## 31.2 Booking status

A submitted request must not be represented as a confirmed appointment unless it has actually been confirmed.

When there is no real-time class availability, clearly describe the next step as a request.

## 31.3 Pricing information

Masters and organisers are responsible for keeping their prices accurate. Where pricing is not provided, the product should say so rather than inventing a figure.

Additional costs and relevant conditions should be visible before a user commits to a transaction.

## 31.4 Reviews

Reviews must follow clear rules for authenticity, harassment, conflicts of interest, correction and moderation.

Masters may respond to legitimate reviews but must not be able to secretly rewrite user feedback.

## 31.5 Paid promotion

Any paid placement or promotion must be recognisable as such.

The platform should not sell verification badges or imply that an advertised master is automatically the most qualified option.

## 31.6 Lead and relationship ownership

MastersCorner should remain a useful part of the enquiry and booking journey, but masters should have appropriate access to the information needed to serve students.

The product should encourage follow-up through reliable tools rather than unfairly preventing legitimate communication.

## 31.7 Pro Site ownership and cancellation

Masters must understand which parts of their website, domain and brand they control, what remains tied to their subscription and what happens after cancellation.

Terms should be available before the master purchases an upgrade.

## 31.8 Student privacy

Collect only the personal information necessary to deliver the service.

Protect minor-related information particularly carefully and avoid publicly displaying private contact details or student records.

## 31.9 Data shown in the product

A screen must not imply a fact the platform cannot substantiate. Verification status, ratings, review counts, learner numbers, plan tiers and fees are rendered only from stored data that the platform stands behind. Prototype values from the design file are never used as content, and an empty state says plainly that information is missing rather than filling the gap (§14.3, §16.2, §31.3).

---

# 32. Success Metrics

Metrics must describe real platform behaviour. Early targets should be established after observing genuine usage rather than presenting arbitrary figures as guaranteed outcomes. A measure is instrumented when the module it belongs to ships (§29): profile, class and Pro Site measures apply from the first release, enquiry and verification measures from Phase 2, review, event and Experience Card measures from Phase 3.

## 32.1 Marketplace supply

Measure:

- Number of complete master profiles.
- Number of academy profiles.
- Share of profiles with current locations and schedules.
- Verification application and completion rates.
- Number of active masters.
- Profile update frequency.

## 32.2 Student discovery

Measure:

- Search usage.
- Search-to-profile visits.
- Profile views.
- Saved masters and academies.
- Use of search filters.
- Searches that return few or no useful results.

## 32.3 Conversion

Measure:

- Profile-to-enquiry conversion.
- Profile-to-trial-request conversion.
- Trial request acceptance rate.
- Trial attendance rate where it can be measured reliably.
- Enquiry-to-enrolment outcomes where masters choose to record them.
- Time taken to respond to an enquiry.

## 32.4 Pro Site adoption

Measure:

- Eligible masters who start Pro Site setup.
- Setup completion rate.
- Published Pro Sites.
- Pro Site visits.
- Pro Site-to-enquiry conversion.
- Free-to-paid conversion.
- Subscription retention and cancellations.

## 32.5 Event and Experience Card performance

Measure:

- Events published.
- Event page visits.
- Registration or enquiry conversion.
- Event attendance where recorded.
- Experience Cards purchased or issued.
- Redemption and attendance rates.
- Refunds, disputes and user-reported issues.

## 32.6 Trust and quality

Measure:

- Profile reports.
- Verification review time.
- Review reports.
- Accuracy-related complaints.
- Resolution time for user reports.
- User-reported problems with bookings or event information.

## 32.7 Retention and business health

Measure:

- Returning students.
- Active master accounts.
- Monthly and annual subscription retention.
- Enquiries handled through MastersCorner.
- Revenue from subscriptions and supported transactions.
- Support burden per active master.

---

# 33. Product Risks and Mitigations

## Risk 1: Too few quality listings

A directory with many empty pages is not useful.

**Mitigation:** Launch with carefully recruited masters and academies in selected areas. Prioritise complete, accurate profiles over raw listing volume.

## Risk 2: Masters join but do not update information

Incorrect schedules or old contact details damage student trust.

**Mitigation:** Make updates easy, highlight stale information and send reasonable reminders to review key details.

## Risk 3: Masters do not pay for Pro Sites

A website builder alone may not be valuable enough.

**Mitigation:** Demonstrate concrete value through lead management, a professional presence, connected enquiries, schedules and measurable outcomes. Validate pricing before scaling.

## Risk 4: Poor-quality or misleading verification

A weak badge policy can damage the entire brand.

**Mitigation:** Define precise checks, communicate what each badge means and ensure administrators can investigate reports.

## Risk 5: Users bypass the platform after discovery

Direct communication may reduce visibility into outcomes.

**Mitigation:** Make bookings, enquiries and event registrations useful through confirmations, tracking and follow-up management, while preserving reasonable user choice.

## Risk 6: Pro Sites create duplicate or conflicting content

Separately maintained pages may display different timings or contact information.

**Mitigation:** Reuse maintained profile and class information and give each page a distinct purpose.

## Risk 7: Scope becomes too large

Marketplace, website builder, bookings, CRM, events and academy management can become overwhelming when built simultaneously.

**Mitigation:** Release in phases, prioritising accurate discovery and successful enquiry management before advanced operations.

## Risk 8: Traditional martial arts are poorly represented

A generic fitness directory may fail to capture lineage, cultural significance and relevant qualifications.

**Mitigation:** Allow suitable discipline-specific profile details and ensure that traditional arts are first-class marketplace categories.

---

# 34. Key Product Decisions

The following decisions define the initial product direction.

| Decision | Product direction | Reason |
|---|---|---|
| Core business model | Directory + master business tools + Pro Sites | Connects marketplace growth with recurring business revenue |
| Free access | Maintain a useful free listing | Encourages broad and diverse marketplace supply |
| Pro Site model | Generate a branded website from the master’s existing profile | Reduces setup effort and duplicated maintenance |
| Custom domain | Offer as an upgrade | Serves established masters and academies that need their own domain |
| Verification | Separate from paid subscriptions | Protects trust and avoids pay-to-verify perception |
| First transaction | Enquiry or trial request | Lower complexity than launching a full transaction marketplace |
| Initial geography | Build real coverage in selected locations before broad expansion | Prioritises useful local discovery over empty national coverage |
| Product identity | Specialist martial arts platform | Better serves masters and students than a generic website builder |
| Directory profile vs Pro Site | Discovery page vs branded academy experience | Provides distinct value without needless duplication |
| Academy support | Support both individual masters and multi-instructor academies | Reflects real-world teaching and business structures |
| First release scope | Master accounts, master-owned classes, public discovery and the free Pro Site | Proves supply and publishing before conversion, moderation and billing are built (§30) |
| Pro Site at launch | Free for every master | Defers billing until the value is proven (§20, §21, ADR-002) |
| Trust signals | No badge, rating or review until the underlying data exists | Protects credibility and avoids pay-to-verify or fabricated-proof perceptions (§14, §16, §31.9) |
| Environments | Separate development and production databases with versioned migrations | Production is never the first place a change runs (§37, ADR-001) |
| Delivery | One pull request per module slice | Keeps security and quality review tractable (§37.3) |
| Design | The HTML prototype is the visual source of truth and is ported into the application | Guarantees fidelity against a single reference (§26.6, §38, ADR-003) |
| Client scope | Web first; the native application is deferred | No native design exists and the first release does not need one (ADR-002) |

---

# 35. Open Business Decisions to Resolve Before Full Commercial Launch

These items require validation rather than assumptions. Each states the phase in which it must be settled; none of them blocks the first release except initial geographic coverage, which is a launch condition.

| # | Decision | Settled before |
| --- | --- | --- |
| 1 | Experience Card model (benefits, eligible experiences, validity, refunds, pricing) | Phase 3 |
| 2 | Verification standard (checks, reviewer, validity, meaning of each label) | Phase 2 |
| 3 | Subscription pricing (validated with real masters) | Phase 3 |
| 4 | Booking responsibilities (which requests need master acceptance, cancellation rules) | Phase 2 |
| 5 | Custom-domain policy (setup, renewal ownership, cancellation behaviour, branding removal) | Phase 4 |
| 6 | Lead attribution (what a master sees and how source is demonstrated) | Phase 2 |
| 7 | Reviews policy (who may review, disputes, evidence of a completed class) | Phase 3 |
| 8 | Initial geographic coverage (the localities and disciplines recruited first) | Before public launch |
| 9 | Event services (enquiries or registrations, and when paid registration is appropriate) | Phase 3 |
| 10 | Support and dispute handling (responsibility for class quality, listings, cancellations, events) | Phase 2 |

1. **Experience Card model:** Decide its exact benefits, eligible experiences, validity, refunds, pricing and who bears the cost of a trial.
2. **Verification standard:** Decide which checks are required, who performs them, how long they remain valid and what each badge communicates.
3. **Initial pricing:** Test subscription willingness to pay with traditional masters, individual instructors and multi-branch academies.
4. **Booking responsibilities:** Decide which bookings require master acceptance and what cancellation rules apply to each type.
5. **Custom-domain policy:** Finalise setup assistance, renewal ownership, cancellation behaviour and the level of branding removal included.
6. **Lead attribution:** Decide which enquiry information is available to masters and how MastersCorner demonstrates the source of an enquiry.
7. **Reviews policy:** Decide who can review, how to handle disputes and which signals establish a completed class or booking.
8. **Initial geographic coverage:** Choose the first localities and martial arts categories where the team can recruit quality supply.
9. **Event services:** Decide whether organisers initially receive enquiries or registrations, and when paid registrations become appropriate.
10. **Support and dispute handling:** Establish clear responsibility for class quality complaints, inaccurate listings, cancellations and event issues.

These decisions affect user trust, operating costs and profitability, so they should be settled before promising the associated features commercially.

---

# 36. Final Product Definition

MastersCorner is a connected marketplace and business platform for martial arts.

Its public side helps people discover masters, academies, classes and events. Its business side helps masters maintain professional profiles, receive enquiries, manage trial requests and progressively organise academy activity. Its Pro Site product gives masters a branded website that is connected to the same core presence.

The first release delivers the part of that vision that everything else depends on: a master creates an account, publishes a profile with real classes, and receives a branded website free of charge, while students can find that master and those classes. Conversion, trust, community and premium services follow in the phases set out in §29.

The central product loop is:

**Discover → Evaluate → Enquire → Attend → Enrol → Continue Training**

For masters, the corresponding loop is:

**Join → Establish Credibility → Publish → Receive Enquiries → Convert Students → Manage the Academy → Grow**

For MastersCorner, that creates a scalable business model:

**Useful listings build marketplace coverage. Marketplace coverage attracts students. Student interest creates value for masters. Pro Sites and business tools create recurring revenue. Better tools and more demand attract more masters.**

The initial priority is to make master profiles, class information and the free Pro Site real and accurate. Once masters are publishing, making enquiries and trials work reliably is the next step (§29), and Pro Sites at scale, Experience Cards, event services and academy management can expand the platform into a durable martial arts ecosystem.

**The guiding principle: MastersCorner should help students find the right training, help masters grow their work, and make both experiences better because they are connected to the same platform.**

---

# 37. Delivery Model: Environments, Migrations and Pull Requests

This section defines how changes reach people. It is the product-level statement of `docs/decisions/ADR-001-environment-and-migration-strategy.md`.

## 37.1 Environments

There are three environments, each with its own database branch and its own credentials; the preview environment is deferred for the first release (ADR-004):

| Environment | Application | Database | Purpose |
| --- | --- | --- | --- |
| Local development | Developer machine | Development database branch | Day-to-day work against realistic data |
| Preview (deferred) | Temporary deployment per pull request | Ephemeral database branch created from development | Added after launch, once the deployment path is proven (ADR-004) |
| Production | Live deployment | Production database branch | Real masters and real visitors |

Only production is deployed; development is the developer's machine pointed at the development database branch (ADR-001). Production is never the first place a change runs. A change is exercised against the development environment (and, once preview environments exist, in the pull request itself) before it is promoted. Preview environments are deferred for the first release: development is the only pre-production environment, and it is shared (ADR-004). Uploaded media branches with the database and its credentials are scoped to the branch, so a development image can never appear on a production Pro Site.

## 37.2 Database migrations

Schema changes travel as versioned migrations, never as ad-hoc scripts:

1. Edit the schema in `packages/db/src/schema`, then run `bun run db:generate` to write reviewable SQL into `packages/db/src/migrations`.
2. Review the generated SQL in the pull request.
3. Apply it to the development database with `bun run db:migrate` and verify the feature against that database.
4. Apply the same migration to production after the change is merged and verified.

Migrations are additive first: add columns and tables, backfill, switch the code over, and remove the old shape in a later migration once nothing uses it. `drizzle-kit push` is allowed only against disposable development databases and is never used against production. Every schema-changing pull request carries its migration and the evidence that it was applied and exercised on development.

## 37.3 Pull requests

Work is delivered as a series of small pull requests, one per module slice (§39), rather than as one large change at the end:

- One module slice per pull request: schema, server procedure, UI and tests for that slice.
- The pull request states which PRD section and which ADR it implements, and what was verified and how.
- No pull request merges with a migration that was not applied to the development database, or with a screen that links to a destination that does not exist.
- Reviewers see a diff that can be read in one sitting, which is what keeps security and quality review effective.
- Production deployment happens only from the main branch, after the same code has been verified in development.

## 37.4 Quality gates

Every pull request must pass, at minimum:

- `bun run check-types` — TypeScript across the workspace.
- `bun run check` — Biome/Ultracite lint and formatting.
- `bun run build` — web and server production builds.
- `bun run test` — automated tests once the runner exists (it arrives with the platform module).
- Migration present and applied where the schema changed.
- A smoke check of the changed path in the development environment (sign-up, profile edit, class create, Pro Site render, as applicable).

No continuous integration workflow exists in the repository today; adding it is part of the platform module in the first release.

---

# 38. Design Source of Truth

`masterscorner.html` in the repository root is the visual source of truth for every screen in scope. Section 26.6 records the tokens and the rules for using the prototype; `docs/design-alignment.md` holds the screen-by-screen mapping, the contradictions that were resolved, and the deviation register.

Rules:

- A screen ships pixel-perfect against the prototype except for the documented deviations.
- The prototype is not a source of data or behaviour. Sample ratings, review counts, fees, learner counts, plan badges and reference numbers are placeholders and never become component content.
- Screens that the prototype does not contain (master sign-up, console class management, media upload, empty states, publish flow) are designed in the same visual language and recorded in `docs/design-alignment.md` §7 before they are built.
- When a shipped screen needs to change, the prototype is updated first so it remains the single reference.

---

# 39. Capability Map (First Release)

Stable module identifiers. Specs, plans and pull requests select work by these ids.

| Module id | Responsibility | Depends on |
| --- | --- | --- |
| `platform` | Environments, database branches, versioned migrations, pull-request checks, deployment wiring | — |
| `identity` | Master account: sign-up, sign-in, session, account type, password reset | `platform` |
| `master-profile` | Public identity: name, martial arts, years teaching, home city, introduction, teaching locations, profile photo | `identity` |
| `media` | Upload and storage for profile photo, logo and later gallery items | `identity` |
| `classes` | Master-owned classes and schedules, plus the public class listing built from them | `master-profile` |
| `directory` | Home page, master registry with filters, master profile page, For Masters page (public read paths) | `master-profile`, `classes` |
| `pro-site` | Free branded site generated from profile and class data, plus its console settings | `master-profile`, `classes` |

Build order: `platform` → `identity` → `media`, `master-profile` → `classes` → `directory` → `pro-site`.

Pull-request boundaries follow the same order: platform foundations; identity; master profile with media; classes; public registry and master profile; home page; For Masters page; Pro Site. Each module is specified, planned and implemented on its own before the next one starts.

---

# 40. Recorded Future Scope from the Design Prototype

The prototype contains two flows that this PRD does not cover. They are recorded here so the design work is not lost and so nobody treats them as missing requirements.

## 40.1 SchoolConnect

A structured school programme offering: MastersCorner coordinates instructors, programme delivery, replacement instructors and event support for schools. Designed in the prototype at `/schools`, with a request form and a confirmation screen.

The flow is an operational service, not marketplace software: it requires committed instructor supply, scheduling, quality control, invoicing and dispute handling, and it competes for the same master time that the marketplace needs. It stays out of scope until there is evidence of school demand and capacity to operate it.

## 40.2 Request network

A request-and-matching flow for referees and judges, instructors and coaches, volunteers and event crew, demonstration teams, self-defence workshops and tournament operations. Designed in the prototype at `/requests` and `/request-success`.

Same reasoning as SchoolConnect: matching and staffing is an operations workload with its own liability, pricing and fulfilment obligations. It becomes worthwhile once there is a dense, reliable supply of masters and officials.

Neither flow is referenced from any navigation or footer while it is unbuilt.

---
