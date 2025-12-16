# Domain Linking Instructions for GoDaddy

This guide will help you link your GoDaddy domain to your Epulse landing page.

## Option 1: Using GitHub Pages (Recommended for Static Sites)

### Step 1: Set up GitHub Pages
1. Create a GitHub repository for your project
2. Push the `landing-page` folder contents to the repository
3. Go to repository Settings > Pages
4. Select the branch and folder to deploy from
5. GitHub will provide you with a URL (e.g., `username.github.io/repo-name`)

### Step 2: Configure GoDaddy DNS
1. Log in to your GoDaddy account
2. Go to "My Products" > "DNS" for your domain
3. Add the following DNS records:

**For root domain (e.g., example.com):**
- Type: A
- Name: @
- Value: 185.199.108.153
- TTL: 600 seconds

Add three more A records with these IPs:
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

**For www subdomain:**
- Type: CNAME
- Name: www
- Value: your-username.github.io
- TTL: 1 Hour

### Step 3: Configure Custom Domain in GitHub
1. In your GitHub repository, go to Settings > Pages
2. Under "Custom domain", enter your domain name (e.g., example.com)
3. Check "Enforce HTTPS" (recommended)
4. Wait for DNS check to complete (can take up to 24 hours)

---

## Option 2: Using Netlify (Easy Drag-and-Drop)

### Step 1: Deploy to Netlify
1. Go to [netlify.com](https://www.netlify.com) and sign up
2. Drag and drop the `landing-page` folder to Netlify
3. Netlify will provide you with a URL (e.g., `random-name.netlify.app`)

### Step 2: Configure Custom Domain
1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Enter your GoDaddy domain name
4. Netlify will provide DNS configuration instructions

### Step 3: Update GoDaddy DNS
1. Log in to GoDaddy
2. Go to DNS settings for your domain
3. Add the DNS records provided by Netlify (typically):
   - Type: A or CNAME
   - Point to Netlify's servers

---

## Option 3: Using Vercel

### Step 1: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Import your project from GitHub or upload directly
3. Vercel will deploy and provide a URL

### Step 2: Add Custom Domain
1. In Vercel dashboard, go to your project
2. Click "Settings" > "Domains"
3. Add your custom domain
4. Vercel will provide DNS configuration

### Step 3: Configure GoDaddy
1. Update DNS records in GoDaddy as instructed by Vercel
2. Typically:
   - Type: A or CNAME
   - Value: Provided by Vercel

---

## Option 4: Traditional Web Hosting

If you have web hosting with GoDaddy:

### Step 1: Upload Files
1. Log in to your GoDaddy hosting account
2. Open cPanel or File Manager
3. Navigate to `public_html` or `www` directory
4. Upload all files from the `landing-page` folder

### Step 2: Configure Domain
1. In GoDaddy, ensure your domain points to your hosting
2. Domain should automatically resolve to your landing page
3. Access via your domain (e.g., https://yourdomain.com)

---

## Important Notes

### DNS Propagation
- DNS changes can take 1-48 hours to propagate globally
- Use [whatsmydns.net](https://www.whatsmydns.net) to check propagation status

### SSL/HTTPS
- Always enable HTTPS for security
- GitHub Pages, Netlify, and Vercel provide free SSL certificates
- For traditional hosting, you may need to enable SSL in cPanel

### File Structure
The landing page files should be in the root directory:
```
/
├── index.html
└── styles.css
```

### Testing
Before DNS propagation completes:
- Test using the temporary URL provided by your hosting platform
- Verify all links and resources load correctly
- Test on mobile devices

---

## Troubleshooting

### Domain not resolving
- Wait 24-48 hours for DNS propagation
- Clear browser cache
- Use incognito mode
- Check DNS records are correct

### SSL certificate errors
- Ensure HTTPS is enabled on hosting platform
- Wait for certificate provisioning (can take 24 hours)
- Check that DNS records are correct

### Resources not loading
- Verify all file paths are correct
- Check file permissions (644 for files, 755 for directories)
- Ensure files are uploaded to correct directory

---

## Support Resources

- **GoDaddy Support**: https://www.godaddy.com/help
- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Netlify Docs**: https://docs.netlify.com
- **Vercel Docs**: https://vercel.com/docs

---

## Quick Start Checklist

- [ ] Choose hosting platform (GitHub Pages, Netlify, Vercel, or traditional)
- [ ] Deploy landing page files
- [ ] Get DNS configuration from hosting provider
- [ ] Update GoDaddy DNS records
- [ ] Enable HTTPS/SSL
- [ ] Wait for DNS propagation
- [ ] Test your domain
- [ ] Verify all functionality works