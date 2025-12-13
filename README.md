# Fort Dodge Islamic Center - Website

A modern, full-featured website for the Fort Dodge Islamic Center (Darul Arqum) built with Next.js. This project provides a comprehensive CMS for managing content, prayer times, events, donations, and community resources.

## 🕌 About

This website serves the Muslim community in Fort Dodge, Iowa, providing:
- Daily prayer times and Friday prayer schedules
- Community resources and services
- Donation management
- Event calendar
- Islamic education resources
- Administrative content management system

## ✨ Features

### Developer Features
- **Environment Variable Validation**: Automatic validation on startup with helpful error messages
- **Type-Safe Environment Access**: TypeScript-safe environment variable getters
- **Configuration Management**: Centralized environment configuration

### Public Features
- **Home Page**: Dynamic hero section, prayer times, Friday prayers, donation section
- **About Us**: Organization information, board of directors, governance structure
- **Ramadan**: Special Ramadan content and schedules
- **Donate**: Multiple donation options with QR codes and payment links
- **Resources**: 
  - Request a Speaker
  - Request a Visit
  - Visitors Guide
  - Islamic Prayer Guide
  - Islamic School Information
  - Elections & Nominations
  - Membership Applications
  - Financial Assistance
  - Door Access Requests
  - Basement Reservation
- **New Muslims**: Resources for new converts
- **Report a Death**: Community death reporting system
- **Contact**: Contact information and forms

### Admin Features
- **Content Management System**: Full admin panel for managing all page content
- **Section-Based Editing**: Edit individual sections of pages independently
- **Image Management**: Upload, manage, and delete images from Supabase Storage
- **Page Visibility Control**: Show/hide pages from navigation
- **Real-time Updates**: Changes reflect immediately on the frontend
- **Form Management**: Manage all form submissions and content

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.8 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19.2.0, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Storage)
- **Email**: Nodemailer
- **Fonts**: Geist Sans & Geist Mono

## 📁 Project Structure

```
fort-dodge/
├── app/
│   ├── about/              # About page and components
│   ├── admin/              # Admin CMS panel
│   │   ├── components/     # Admin shared components
│   │   └── [page]/         # Admin pages for each section
│   ├── api/                # API routes
│   │   ├── [resource]/     # Resource endpoints
│   │   └── [resource]/update-section/  # Update endpoints
│   ├── components/         # Shared React components
│   ├── donate/              # Donation page
│   ├── new-musilm/         # New Muslims page
│   ├── ramadan/            # Ramadan page
│   ├── report-death/       # Death reporting page
│   ├── resources/          # Resources pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── sitemap.ts          # Dynamic sitemap
│   └── robots.ts           # Robots.txt
├── lib/
│   ├── *.service.ts        # Service layer for data operations
│   ├── supabase.ts         # Supabase client configuration
│   ├── storage.service.ts  # Image storage utilities
│   ├── seo.ts              # SEO metadata generation
│   ├── env.ts              # Environment variable validation
│   └── validate-env.ts     # Startup validation
├── public/
│   └── images/             # Static images
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Email service credentials (for contact forms)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fort-dodge
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Supabase Service Role Key (Recommended for admin features)
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Site Configuration (Optional - defaults to https://arqum.org)
   NEXT_PUBLIC_SITE_URL=https://your-domain.com

   # Email Configuration (Required for contact forms)
   # All email variables must be set together for email functionality to work
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   EMAIL_FROM=noreply@your-domain.com
   EMAIL_TO=admin@your-domain.com
   ```

   **Email Configuration Notes**:
   - All email variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_TO`) must be set together
   - If any email variable is missing, email functionality will be disabled
   - The app includes automatic environment variable validation on startup with detailed error messages
   - SMTP connection is verified before sending emails, providing clear error messages if configuration is incorrect

   **Common SMTP Providers**:
   - **Gmail**: `smtp.gmail.com`, port `587` (requires app password, not regular password)
   - **Outlook/Hotmail**: `smtp-mail.outlook.com`, port `587`
   - **SendGrid**: `smtp.sendgrid.net`, port `587` (requires API key as password)
   - **Mailgun**: `smtp.mailgun.org`, port `587`
   - **Custom SMTP**: Use your provider's SMTP settings

   **Gmail Setup**:
   1. Enable 2-factor authentication on your Google account
   2. Generate an app password: Google Account → Security → App passwords
   3. Use the app password (16 characters, may include spaces) as `SMTP_PASS`
   4. Set `SMTP_USER` to your Gmail address
   5. Set `EMAIL_FROM` to your Gmail address (or a verified alias)

4. **Set up Supabase**
   
   - Create a Supabase project
   - Set up the following tables:
     - `Home` - Home page content
     - `About` - About page content
     - `Ramadan` - Ramadan page content
     - `Donate` - Donation page content
     - `Resources` - Resources page content
     - `Contact` - Contact information
     - And other resource-specific tables
   - Create a Storage bucket named `Public`
   - Create a folder `Home` inside the `Public` bucket
   - Configure RLS policies for storage access

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 Admin Panel

Access the admin panel at `/admin` (e.g., `http://localhost:3000/admin`)

### Admin Features:
- **Home Page Editor**: Manage hero, prayer times, Friday prayers, donations, quick links, and calendar
- **Page Editors**: Edit content for About, Ramadan, Donate, Resources, etc.
- **Visibility Toggle**: Show/hide pages from public navigation
- **Image Upload**: Upload and manage images for all sections
- **Section Management**: Enable/disable individual sections

### Admin Routes:
- `/admin/home` - Home page editor
- `/admin/about` - About page editor
- `/admin/ramadan` - Ramadan page editor
- `/admin/donate` - Donation page editor
- `/admin/resources` - Resources management
- And more...

## 🗄️ Database Schema

The project uses Supabase (PostgreSQL) with JSON columns for flexible content storage. Each page typically has:
- `id` - Primary key
- `data` - JSON column containing page sections
- `page_name` - Page identifier
- `created_at` - Timestamp
- `updated_at` - Timestamp

## 🖼️ Image Management

Images are stored in Supabase Storage:
- **Bucket**: `Public`
- **Default Folder**: `Home`
- Images can be uploaded through the admin panel
- Automatic cleanup of invalid image references
- Support for legacy `/images/` paths

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/home` - Get home page content
- `GET /api/about` - Get about page content
- `GET /api/ramadan` - Get Ramadan content
- `GET /api/donate` - Get donation page content
- `GET /api/resources` - Get resources content
- `GET /api/contact` - Get contact information
- `GET /api/page-visibility` - Get page visibility status

### Admin Endpoints
- `POST /api/home/update-section` - Update home section
- `POST /api/[page]/update-section` - Update page section
- `POST /api/upload-image` - Upload image to storage
- `POST /api/delete-image` - Delete image from storage
- `POST /api/update-page-visibility` - Update page visibility
- `POST /api/send-email` - Send email notifications

## 🎨 Styling

The project uses Tailwind CSS 4 for styling:
- Custom color scheme (sky-800, sky-900)
- Responsive design (mobile-first)
- Component-based styling
- Dark mode support (if needed)

## 🔍 SEO Features

- Dynamic metadata generation per page
- Open Graph tags
- Twitter Card support
- JSON-LD structured data
- Dynamic sitemap generation
- Robots.txt configuration
- Canonical URLs

## 📧 Email Functionality

Contact forms and notifications use Nodemailer with enhanced error handling:

### Features
- **SMTP Connection Verification**: Tests connection before sending emails
- **Detailed Error Messages**: Clear error messages indicating missing configuration or connection issues
- **TLS/SSL Support**: Automatic TLS encryption for secure email transmission
- **Error Handling**: Handles common SMTP errors (authentication, connection, timeout)
- **Debug Logging**: Detailed console logs for troubleshooting

### Email Forms
The following forms send email notifications:
- Contact form submissions
- Membership applications
- Door access requests
- Basement reservations
- Financial assistance applications
- Death report notifications
- Speaker requests
- Visit requests
- And other form submissions

### Troubleshooting Email Issues

If you encounter email errors:

1. **"SMTP not configured on server"**: 
   - Check that all email environment variables are set in `.env.local`
   - Restart your Next.js server after adding/changing environment variables
   - Verify all required fields: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_TO`

2. **"SMTP authentication failed"**:
   - Verify `SMTP_USER` and `SMTP_PASS` are correct
   - For Gmail, ensure you're using an app password, not your regular password
   - Check that 2-factor authentication is enabled (for Gmail)

3. **"SMTP connection failed"**:
   - Verify `SMTP_HOST` and `SMTP_PORT` are correct
   - Check your network connection
   - Ensure your firewall allows outbound connections on the SMTP port
   - For Gmail, verify you're using port 587 (not 465 unless using secure connection)

4. **Check server logs**: The email endpoint provides detailed debug information in the console

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The project can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform
- Self-hosted with Node.js

**Important**: When deploying, make sure to add all environment variables in your hosting platform's dashboard, including the complete email configuration.

### Build for Production

```bash
npm run build
npm run start
```

**Note**: After adding or changing environment variables, you must restart the server for changes to take effect. Environment variables are loaded at startup.

## 🔧 Configuration

### Environment Variable Validation

The project includes automatic environment variable validation that runs on app startup:

- **Required variables**: Must be set or the app will fail to start
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Recommended variables**: Should be set for full functionality
  - `SUPABASE_SERVICE_ROLE_KEY` (required for image uploads and admin features)

- **Optional variables**: Have defaults or are only needed for specific features
  - `NEXT_PUBLIC_SITE_URL` (defaults to `https://arqum.org`)
  
- **Email variables**: All must be set together if using email functionality
  - `SMTP_HOST` - SMTP server hostname
  - `SMTP_PORT` - SMTP server port (defaults to 587 if not set)
  - `SMTP_USER` - SMTP authentication username
  - `SMTP_PASS` - SMTP authentication password
  - `EMAIL_FROM` - Default sender email address
  - `EMAIL_TO` - Default recipient email address

Validation errors will be displayed in the console with clear messages about what's missing. The validation also checks for:
- Valid URL formats
- Minimum key lengths
- Complete email configuration (all email vars must be set together if any are provided)
- Missing email configuration fields are clearly identified

### Supabase Setup

1. Create tables with JSON `data` columns
2. Set up Storage bucket and folders
3. Configure RLS policies
4. Add service role key for admin operations

### Image Storage

- Default bucket: `Public`
- Default folder: `Home`
- Supported formats: JPG, PNG, GIF, WebP
- Max file size: 5MB

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Support

For issues or questions:
- Check the admin panel documentation
- Review API endpoint documentation
- Contact the development team

## 🙏 Acknowledgments

- Fort Dodge Islamic Center community
- Next.js team
- Supabase team
- All contributors

---

**Built with ❤️ for the Fort Dodge Islamic Center community**
