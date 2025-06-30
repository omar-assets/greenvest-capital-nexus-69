## Project Overview
Building a Merchant Cash Advance (MCA) CRM system that replicates Dragin.io functionality. The system processes funding applications from email intake through funding completion, with integrated OCR for document processing and automated underwriting capabilities.

## Technical Architecture
- **Frontend**: Lovable.dev (React + Tailwind CSS)
- **Backend**: Supabase (PostgreSQL database, Auth, Storage, Edge Functions)
- **File Storage**: Supabase Storage for documents
- **Authentication**: Supabase Auth with email/password

## Core Business Workflow
1. **Email Received** → Application arrives via email with attachments
2. **Document Processing** → MoneyThumb OCR extracts bank statement data
3. **Pre-Qualification** → Automated checks based on extracted financials
4. **Underwriting Review** → Manual review with AI-assisted insights
5. **Offer Generation** → Create and send funding offers
6. **Contract Execution** → E-signature and funding

## Key Features from Dragin.io
- **Deal Pipeline**: Kanban board with drag-and-drop between stages
- **Document Management**: Upload, OCR processing, and data extraction
- **Automated Scoring**: Bank statement analysis with risk metrics
- **Offer Calculator**: Dynamic pricing with factor rates and daily payments
- **Activity Tracking**: Complete audit trail of all deal activities
- **ISO Portal**: Broker-specific views and commission tracking


## Database Design Principles
- Let Supabase create tables incrementally as features are added
- Use UUID for all primary keys
- Implement RLS (Row Level Security) for data access control
- Store sensitive API keys in Supabase secrets
- Use JSONB for flexible OCR result storage

## UI/UX Guidelines
- **Primary Color**: #0066CC (Professional Blue)
- **Success**: #10B981 (Green) 
- **Warning**: #F59E0B (Amber)
- **Danger**: #EF4444 (Red)
- **Layout**: Card-based with subtle shadows (shadow-sm)
- **Spacing**: Consistent use of Tailwind spacing (p-4, gap-4)
- **Components**: Rounded corners (rounded-lg), hover states
- **Mobile**: Responsive design with mobile-first approach

## Security Requirements
- All API keys stored as Supabase secrets
- MoneyThumb webhook authentication required
- File uploads limited to PDF format
- Maximum file size: 10MB
- Implement request rate limiting
- Sanitize all user inputs

## Development Approach
- Build incrementally - one feature at a time
- Use Chat Mode for debugging
- Test each feature before moving to next
- Keep prompts specific and focused
- Reference this knowledge base in prompts