
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Finance Hub 2.0 - Setup Guide

This comprehensive personal finance dashboard requires Supabase for data synchronization and account management.

## Database Setup (Mandatory)

To make the application fully functional, follow these steps:

1. Go to your [Supabase Dashboard](https://app.supabase.com/).
2. Select your project and navigate to the **SQL Editor** from the left sidebar.
3. Open a "New Query" and paste the contents of the `schema.sql` file.
4. Click **Run**.

This will create:
- The `user_data` table to store your transactions and settings.
- Row Level Security policies to keep your data private.
- The `delete_user_account` function for the account deletion feature.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
3. Run the app:
   `npm run dev`

## Supabase Configuration
Your app is pre-configured to connect to the Supabase instance. If you need to change it, check `supabaseClient.ts`.
