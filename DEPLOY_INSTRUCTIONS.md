# Production Deployment Instructions - OrderSync Website

## Quick Start

### 1. Prerequisites
- Git installed
- GitHub account and repository created
- `gh-pages` package installed

### 2. Deploy to GitHub Pages

```bash
# Navigate to dist-website folder
cd dist-website

# Initialize Git (if not already done)
git init
git add .
git commit -m "Initial commit: OrderSync production website"

# Add GitHub remote (replace with your repo details)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Deploy to GitHub Pages (choose one method)

# Method A: Using gh-pages CLI
npm install gh-pages --save-dev
npm run deploy

# Method B: Manual deployment
git branch -M gh-pages
git push -u origin gh-pages --force
```

### 3. What's in dist-website

```
dist-website/
├── index.html                 # Main landing page (self-contained HTML)
├── LandingPage.js           # React bundle (from CDN)
├── components/
│   ├── SEO.js              # SEO component bundle
│   └── WaitlistModal.js     # Modal component bundle
├── logo.svg                 # Logo
├── terms.html               # Terms page
├── privacy.html             # Privacy page
└── manifest.json             # Manifest (if needed)
```

### 4. GitHub Pages Configuration

Once deployed to GitHub Pages, your site will be available at:
`https://YOUR_USERNAME.github.io/YOUR_REPO/`

### 5. Production Features

✅ **Mobile-First Responsive Design**
- Sticky header with burger menu
- Agitation grid stacks on mobile
- Touch-friendly tap targets (44px+)
- Fluid padding: `px-4 sm:px-6 lg:px-8`

✅ **Professional Content**
- "Built by sellers, for sellers" About section
- "Trusted by 500+ Social Sellers" badge
- "I'll take the Gold Vintage Locket for $65..." demo message
- Live system status: "🟢 Systems Operational | ⚡ Gemini 3 Flash Online"

✅ **Lead Generation**
- WaitlistModal component with email capture
- Form validation and loading states
- LocalStorage persistence (replace with API)
- Success confirmation with email display

✅ **Legal & Trust**
- Non-affiliation disclaimer
- Privacy Policy and Terms of Service links
- All CTAs lead to waitlist (not Stripe)

### 6. Next Steps (Post-Deployment)

1. **Enable GitHub Pages** in your repository settings
2. **Monitor deployment** at `https://YOUR_USERNAME.github.io/YOUR_REPO/`
3. **Waitlist Management** - Set up email collection and CRM
4. **Analytics** - Add Google Analytics/Plausible
5. **Custom Domain** - Configure custom domain when ready

### 7. Troubleshooting

**If build fails:**
- Ensure all React components have proper imports
- Check that `vite.config.js` points to the correct paths
- Clear node_modules and reinstall dependencies

**If deployment fails:**
- Verify GitHub repository exists and is public
- Check that `gh-pages` branch exists on remote
- Ensure `dist-website` folder contains all files

### 8. Environment Variables for Future Stripe Integration

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...
```

---

## 🚀 Ready for Launch

Your OrderSync website is now production-ready with:
- ✅ Mobile-first responsive design
- ✅ Professional copy and branding
- ✅ Lead generation waitlist system
- ✅ Legal compliance features
- ✅ Self-contained HTML deployment
- ✅ GitHub Pages integration ready

Deploy now and start collecting leads!