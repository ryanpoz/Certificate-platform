# Certificate Platform - Sprint 1 & 2

A proof-of-concept certificate platform for issuing and managing digital certificates. Built as a lower-cost alternative to Accredible for academies and training programs.

## Features

### Sprint 1: Academy Setup & Issuing
**Workflow 1: Academy Setup**
- **Sign up / Sign in** with magic link authentication
- **Academy settings**: branding (name, brand color, website), email configuration
- **Course management**: create courses with codes, descriptions, validity periods, and CTAs
- **Certificate templates**: customizable templates with merge fields and live preview
- **Custom fields**: define additional fields for certificates

**Workflow 2: Certificate Issuing**
- **Bulk upload**: CSV/XLSX file upload (up to 5,000 rows)
- **Column mapping**: automatic and manual column mapping with saved preferences
- **Validation**: row-by-row validation with error reporting (created/skipped/error)
- **Draft creation**: validated rows become unpublished drafts
- **Publishing**: idempotent batch publishing (safe to retry)
- **Single-person form**: issue individual certificates
- **Unpublished draft count**: visible throughout the interface

### Sprint 2: Learner Experience ✨ NEW
**Workflow 3: Certificate Viewing & Verification**
- **Public certificate page**: Branded page at `/c/{number}` with status badge (valid/expired/revoked)
- **Email delivery**: Resend integration with fallback to console logging
- **PDF generation**: Downloadable PDF with QR code for verification
- **LinkedIn integration**: One-click "Add to LinkedIn" button with pre-filled certification data
- **Share functionality**: Copy link button for easy sharing
- **CTA tracking**: Automatic UTM parameters added to academy call-to-action links
- **Event logging**: Track page views, PDF downloads, LinkedIn clicks, CTA clicks with bot filtering
- **QR code verification**: Scannable QR code on certificates links to public page
- **Preview mode**: Mark certificates as preview to exclude from usage tracking

### Data Model
- Academies, Users, Courses, Templates, Custom Fields
- Learners, Certificates, Batches, Events

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **File parsing**: xlsx (SheetJS)
- **Authentication**: Magic link with JWT (jose)
- **Email**: Resend API with console fallback
- **PDF Generation**: Puppeteer
- **QR Codes**: qrcode npm package
- **Bot Filtering**: isbot npm package
- **Deployment**: Vercel-ready (or any Node.js host)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud like Neon, Supabase)

## Local Setup

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd certificate-platform
npm install
\`\`\`

### 2. Set Up Environment Variables

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and add your database connection:

\`\`\`env
DATABASE_URL=postgresql://user:password@localhost:5432/certificate_platform
JWT_SECRET=<generate with: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=<get from resend.com/api-keys - optional, falls back to console>
\`\`\`

### 3. Create Database and Push Schema

\`\`\`bash
# If using a cloud provider like Neon, create the database there first
# Then push the schema:
npm run db:push
\`\`\`

### 4. Seed Test Data

\`\`\`bash
npm run db:seed
\`\`\`

This creates:
- Motion Academy (sample academy)
- Admin user: `admin@motionapp.com`
- Creative Strategy Bootcamp course with template

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 6. Log In

1. Go to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Enter: `admin@motionapp.com`
3. Check the terminal console for the magic link (email is stubbed in Sprint 1)
4. Click the link to sign in

## Testing the Workflow

### Complete Academy Setup (Workflow 1 - Sprint 1)

1. After logging in, go to **Settings** and verify the academy details
2. Go to **Dashboard** and click on "Creative Strategy Bootcamp"
3. Review the course details and certificate template
4. Click "Edit Template" to modify merge fields
5. Preview shows how the certificate will look with dummy data

### Issue Certificates in Bulk (Workflow 2 - Sprint 1)

1. Click **"Issue Certificates"** from the course page
2. Upload a test CSV file (use `test-graduates.csv` or `test-graduates-500.csv`)
3. Map columns to Name, Email, and Issue Date (optional)
4. Review validation results (valid/skipped/errors)
5. Click **"Create Drafts"** to generate unpublished certificates
6. View drafts in the **Certificates** page
7. Click **"Publish"** to publish certificates and send emails

### View & Share Certificate (Workflow 3 - Sprint 2) ✨ NEW

1. After publishing, check console for email log (or Resend dashboard if API key is set)
2. Copy the certificate URL from the email or logs
3. Visit the certificate page at `/c/{certificate-number}`
4. Verify the following features:
   - Certificate displays with valid status badge
   - QR code is visible and scannable
   - **"Download PDF"** button generates PDF with QR code
   - **"Add to LinkedIn"** button opens LinkedIn with pre-filled data
   - **"Copy Link"** button copies the certificate URL
   - Call-to-action button (if configured) has UTM parameters
5. Open the PDF and verify QR code links back to the certificate page
6. Click the LinkedIn button and verify certification form is pre-filled

### Test Event Logging (Sprint 2) ✨ NEW

1. Visit a published certificate page
2. Click each action button (Download PDF, Add to LinkedIn, CTA)
3. Check the database `events` table to see tracked events:
   - `page_view` (with bot filtering)
   - `pdf_download`
   - `linkedin_add_click`
   - `cta_click`
4. Test with preview mode by adding `?preview=true` to URL - events should not be tracked

### Issue Single Certificate

1. From the course page, click **"Issue Single Certificate"**
2. Fill in name, email, issue date
3. Optionally check "Publish immediately"
4. Submit to create the certificate
5. If published, email will be sent (or logged to console)

### Sample CSV Format

Create a file named `test-graduates.csv`:

\`\`\`csv
Name,Email,Date
John Doe,john@example.com,2024-01-15
Jane Smith,jane@example.com,2024-01-15
Alex Johnson,alex@example.com,2024-01-15
\`\`\`

For a 500-row test, duplicate rows or generate using a script.

## Running Tests

\`\`\`bash
npm test
\`\`\`

Tests cover:
- Import validation logic (required fields, email format, duplicates)
- Row status accounting (valid/error/skip counts)
- Publish idempotency (safe to retry)
- Email normalization
- Custom fields mapping

## Project Structure

\`\`\`
certificate-platform/
├── app/
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # Admin interface
│   │   ├── settings/         # Academy settings
│   │   ├── courses/          # Course management
│   │   │   ├── [id]/         # Course detail, template editor
│   │   │   │   ├── issue/    # Bulk upload wizard
│   │   │   │   └── single/   # Single certificate form
│   │   └── certificates/     # Certificate list
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts         # Database schema
│   │   └── index.ts          # Database connection
│   ├── import/
│   │   ├── parser.ts         # CSV/XLSX parsing and validation
│   │   └── actions.ts        # Server actions for import
│   └── utils/
│       ├── auth.ts           # JWT helpers
│       ├── session.ts        # Session management
│       └── helpers.ts        # Certificate numbers, merge fields, etc.
├── scripts/
│   └── seed.ts               # Database seed script
├── __tests__/
│   └── import.test.ts        # Import validation tests
├── drizzle.config.ts         # Drizzle ORM config
├── jest.config.js            # Jest config
└── package.json
\`\`\`

## Key Design Decisions

### 1. Certificate Number Format
Generated as `{COURSE_CODE}-{RAND}-{RAND}` (e.g., `CSB-7F3Q-92XD`) using nanoid with a custom alphabet (no ambiguous characters).

### 2. Idempotent Publishing
Certificates have an `unpublished` → `published` status transition. Re-running publish on already-published certificates is safe and does nothing.

### 3. Validation Before Import
All rows are validated client-side first, showing errors/skips before any database writes. This gives users a chance to fix errors before committing.

### 4. Email Normalization
Emails are normalized (lowercased, trimmed) and stored in `emailNormalised` to prevent duplicates like `John@Example.com` vs `john@example.com`.

### 5. Merge Fields
Templates support: `{{learner.name}}`, `{{course.name}}`, `{{issue_date}}`, `{{expiry_date}}`, `{{certificate.number}}`, `{{custom.<key>}}`.

## What's Stubbed (Out of Sprint 1 Scope)

- **Email sending**: Console logs instead of actual email delivery
- **Certificate public pages**: Learner-facing certificate view (Sprint 2)
- **PDF generation**: Not yet implemented (Sprint 2)
- **Results dashboard**: Analytics and engagement tracking (Sprint 3)
- **API/webhook issuing**: Only manual upload/form supported
- **Billing**: Not implemented

## Sprint 1 Acceptance Criteria Status

✅ **W1-1**: New user → previewed certificate in ≤15 minutes  
✅ **W1-2**: Required fields enforced on certificates  
✅ **W1-3**: Merge fields render in preview  
✅ **W1-4**: Branding applied throughout interface  

✅ **W2-1**: 500-row CSV uploads and publishes end-to-end  
✅ **W2-2**: Every row accounted for (created/skipped/error)  
✅ **W2-3**: Publish is idempotent  
✅ **W2-4**: Unpublished draft count visible  
✅ **W2-5**: Single-person form issues certificate  

## Decisions for Ryan

### 1. Template Designer
Currently templates are text-based. Should Sprint 2 include:
- Visual template editor with drag-drop?
- Or continue with HTML/CSS templates edited in code?

### 2. Email Provider
Sprint 1 stubs email. For Sprint 2:
- Use Postmark, Resend, or AWS SES?
- Budget: Resend has a generous free tier (100 emails/day)

### 3. Validity Period Display
Should expired certificates:
- Show a red "Expired" badge but remain accessible?
- Or redirect to an "expired" message page?

### 4. Custom Fields Limit
How many custom fields per academy?
- Suggest: 20 fields max (can increase in production)

### 5. Batch Size Limit
Currently 5,000 rows per upload. For production:
- Keep at 5,000?
- Or increase to 25,000 with async processing?

## Next Steps (Sprint 2 & 3)

**Sprint 2** focuses on the learner experience:
- Certificate public page (desktop/mobile)
- PDF generation with QR code
- Add to LinkedIn integration
- Email delivery webhooks
- OG share images

**Sprint 3** adds management and analytics:
- Certificate list with filters/search
- Edit, reissue, revoke
- Results dashboard (funnel, engagement)
- Nightly expiry job

## Support

For questions or issues, contact the development team or open an issue in the repository.

## License

[To be determined]
