# SkillForge — Deployment Guide

All code is now pushed to GitHub. Follow these steps to deploy.

---

## Architecture

- **Frontend (React + Vite)** → Deploy to **Vercel**
- **Backend (Spring Boot + PostgreSQL)** → Deploy to **Render**

---

## 1️⃣ Deploy Backend to Render

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **PostgreSQL**
3. Name: `skillforge-db`
4. Region: Choose closest to you
5. Plan: **Free** (or Starter for production)
6. Click **Create Database**
7. Copy the **Internal Database URL** (starts with `postgresql://...`)

### Step 2: Deploy Spring Boot Server

1. Click **New** → **Web Service**
2. Connect your GitHub repo: `Prabhu686/Skillforge-AI-adaptive-onboard-engine`
3. Configure:
   - **Name**: `skillforge-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `springboot-server`
   - **Runtime**: `Java`
   - **Build Command**: `mvn clean install -DskipTests`
   - **Start Command**: `java -jar target/skillforge-server-0.0.1-SNAPSHOT.jar`
   - **Instance Type**: Free (or Starter)

4. **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   DATABASE_URL=<paste Internal Database URL from Step 1>
   DB_USER=<from Render DB dashboard>
   DB_PASSWORD=<from Render DB dashboard>
   OPENAI_API_KEY=<your OpenAI key — optional, falls back to taxonomy>
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```

5. Click **Create Web Service**
6. Wait 5-10 minutes for build to complete
7. Copy the **Service URL** (e.g., `https://skillforge-backend.onrender.com`)

---

## 2️⃣ Deploy Frontend to Vercel

### Step 1: Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import `Prabhu686/Skillforge-AI-adaptive-onboard-engine`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Set Environment Variable

1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_URL=https://skillforge-backend.onrender.com
   ```
   (Use the Render backend URL from Step 1.2.7)

3. Click **Save**

### Step 3: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes
3. Copy your Vercel URL (e.g., `https://skillforge-ai.vercel.app`)

---

## 3️⃣ Update Backend CORS

1. Go back to **Render** → Your Spring Boot service
2. Update `CLIENT_URL` environment variable to your Vercel URL:
   ```
   CLIENT_URL=https://skillforge-ai.vercel.app
   ```
3. Click **Save Changes** (service will auto-redeploy)

---

## 4️⃣ Test the Deployment

1. Open your Vercel URL
2. Click **Get Started** → Upload a resume PDF + job description PDF
3. Click **Analyse My Skills**
4. Verify:
   - Resume score appears
   - Salary estimate shows
   - Roadmap loads
   - Voice Quiz works
   - AI Interview works
   - Resume Builder generates .docx

---

## 🔧 Troubleshooting

### Backend not responding
- Check Render logs: Dashboard → Your service → Logs
- Verify `DATABASE_URL` is set correctly
- Ensure PostgreSQL database is running

### Frontend shows "Server error"
- Check `VITE_API_URL` in Vercel environment variables
- Verify backend URL is correct (no trailing slash)
- Check browser console for CORS errors

### CORS errors
- Verify `CLIENT_URL` in Render backend matches your Vercel URL exactly
- Redeploy backend after changing `CLIENT_URL`

### OpenAI features not working
- Add `OPENAI_API_KEY` to Render environment variables
- System falls back to taxonomy-based extraction if key is missing

---

## 📊 Free Tier Limits

### Render (Backend)
- 750 hours/month free
- Spins down after 15 min inactivity (cold start ~30s)
- 512 MB RAM

### Vercel (Frontend)
- 100 GB bandwidth/month
- Unlimited deployments
- Instant global CDN

### PostgreSQL (Render)
- 1 GB storage
- 90 days retention
- Auto-expires after 90 days on free plan

---

## 🚀 Production Recommendations

1. **Upgrade Render to Starter ($7/mo)** — no cold starts, 1 GB RAM
2. **Add custom domain** in Vercel settings
3. **Enable HTTPS** (automatic on both platforms)
4. **Set up monitoring** — Render has built-in metrics
5. **Add rate limiting** to prevent API abuse
6. **Use environment-specific configs** for dev/staging/prod

---

## 📝 Environment Variables Summary

### Render Backend
```
DATABASE_URL=postgresql://...
DB_USER=skillforge_user
DB_PASSWORD=<generated>
OPENAI_API_KEY=sk-... (optional)
CLIENT_URL=https://your-vercel-app.vercel.app
```

### Vercel Frontend
```
VITE_API_URL=https://skillforge-backend.onrender.com
```

---

## ✅ Deployment Checklist

- [x] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Spring Boot backend deployed to Render
- [ ] Environment variables set in Render
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set in Vercel
- [ ] `CLIENT_URL` updated in Render backend
- [ ] Test full flow: upload → analyze → results → quiz → interview → builder

---

## 🎯 Next Steps

1. Deploy backend to Render (10 min)
2. Deploy frontend to Vercel (5 min)
3. Test the live app
4. Share the Vercel URL!

Your app will be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

---

**Need help?** Check Render logs and Vercel deployment logs for errors.
