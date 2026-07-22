# Production Deployment Guide

## Removing Demo Account

Before deploying to production, you must remove the demo account from the admin login page to prevent unauthorized access.

### Steps to Remove Demo Account

1. **Edit the login page**
   - File: `src/app/(auth)/login/page.tsx`
   - Remove or comment out the demo credentials section (lines 313-323)

2. **Remove demo constants**
   - File: `src/app/(auth)/login/page.tsx`
   - Remove or comment out lines 21-22:
     ```typescript
     const DEMO_EMAIL = "admin@Nexo Bank.ca";
     const DEMO_PASSWORD = "admin123";
     ```

3. **Update login logic**
   - File: `src/app/(auth)/login/page.tsx`
   - Remove the demo login check in `handleSubmit` function (lines 85-108)
   - Keep only the real Supabase auth flow (lines 110-162)

4. **Remove Create Super Admin button (optional)**
   - File: `src/app/(auth)/login/page.tsx`
   - After creating the initial super admin, you may want to remove the "Create Super Admin" button (lines 325-335)
   - This prevents unauthorized admin creation in production

### Before Production Checklist

- [ ] Remove demo credentials from login page
- [ ] Remove demo email/password constants
- [ ] Remove demo login logic from handleSubmit
- [ ] Create at least one super admin using the "Create Super Admin" page
- [ ] Test real admin login flow
- [ ] Remove or secure the "Create Super Admin" button
- [ ] Verify demo account cannot access the system
- [ ] Update environment variables for production
- [ ] Enable proper authentication cookies (secure, httpOnly)
- [ ] Review and update CORS settings if needed

### Security Notes

1. **Demo Account Security**: The demo account (admin@Nexobank.ca / admin123) is for development/testing only. It must be removed before production deployment.

2. **Super Admin Creation**: The "Create Super Admin" feature should only be available during initial setup. Consider:
   - Removing the button after initial admin creation
   - Adding authentication to the create-super-admin page
   - Limiting access to specific IP addresses during setup

3. **Cookie Security**: In production, ensure cookies are set with:
   - `Secure` flag (HTTPS only)
   - `HttpOnly` flag (prevent XSS)
   - `SameSite=Strict` or `SameSite=Lax`

4. **Environment Variables**: Ensure all sensitive data (API keys, database URLs) are stored in environment variables and not committed to version control.

### Post-Deployment Verification

After deploying to production:

1. Try to login with demo credentials - should fail
2. Login with real super admin credentials - should succeed
3. Verify admin name appears correctly in the header
4. Test all admin features work correctly
5. Check security logs for any unauthorized access attempts

### Rollback Plan

If issues arise after deployment:

1. Keep a backup of the pre-production code
2. Have database backups ready
3. Document the exact changes made for demo removal
4. Test rollback procedure in staging environment first
