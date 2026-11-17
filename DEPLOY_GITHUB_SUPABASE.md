# Nmat Al Nahdat EMS — GitHub & Supabase Setup Guide

## 1. Supabase Connection (Already Configured)
Your existing Supabase project is already connected in `src/lib/supabase.ts`:
- **Project URL**: `https://nwwxnscugselsofebrwd.supabase.co`
- **Publishable Key**: Configured in `src/lib/supabase.ts`
- **Tables Used**: `app_data` (`saudi_ems_employees`, `saudi_ems_companies`, `saudi_ems_payments`, `saudi_ems_settings`, `saudi_ems_logs`) & `workspace_members`
- **Storage Bucket**: `worker-documents`

### Supabase Auth URL Checklist (Important for GitHub Pages)
In your Supabase Dashboard → **Authentication → URL Configuration**:
1. **Site URL**: `https://nmatalnahdatest-cmyk.github.io/nmat-al-nahdat/`
2. **Redirect URLs**: Add `https://nmatalnahdatest-cmyk.github.io/nmat-al-nahdat/**`

## 2. Deploying to GitHub Pages
1. Extract this ZIP and push all files (including `.github/workflows/deploy.yml`) to the `main` branch of your GitHub repository `nmatalnahdatest-cmyk/nmat-al-nahdat`.
2. Open your GitHub repository → **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. The workflow will automatically run `npm install` and `vite build --base=/nmat-al-nahdat/` and publish your site to:
   `https://nmatalnahdatest-cmyk.github.io/nmat-al-nahdat/`

## 3. Local Development
```bash
npm install
npm run dev
```
