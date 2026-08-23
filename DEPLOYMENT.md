# Eventora Cloud Deployment Guide (Vercel & Render)

This guide provides step-by-step instructions for deploying **Eventora**:
- **Backend (Node.js/Express & MongoDB)** ➔ Hosted on **Render**
- **Frontend (React/Vite)** ➔ Hosted on **Vercel**

---

## 1. Backend Deployment on Render (`server/`)

1. **Push Code to GitHub**: Ensure your repository is pushed to GitHub.
2. **Create Web Service on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
   - Connect your GitHub repository.
   - Set **Root Directory**: `server`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `node server.js` (or `npm start`)
3. **Configure Render Environment Variables**:
   Add the following variables under **Environment**:
   - `PORT`: `5000` (or leave default assigned by Render)
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/eventora?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_super_secret_jwt_key_here`
   - `CLIENT_URL`: `https://your-app-name.vercel.app` (Your Vercel URL once deployed)
   - **Nodemailer SMTP Setup (For Real Live Email Delivery)**:
     - `EMAIL_USER`: `your-gmail@gmail.com`
     - `EMAIL_PASS`: `xxxx xxxx xxxx xxxx` *(Generate 16-digit App Password from Google Account -> Security -> 2-Step Verification -> App Passwords)*
     - `EMAIL_HOST`: `smtp.gmail.com`
     - `EMAIL_PORT`: `465`

4. **Deploy**: Render will automatically build and start your server (e.g. `https://eventora-backend.onrender.com`).
   - Test by visiting `https://eventora-backend.onrender.com/api/health` — it should return `{ status: "OK" }`.

---

## 2. Frontend Deployment on Vercel (`client/`)

1. **Create Project on Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/) and click **Add New...** ➔ **Project**.
   - Select your GitHub repository.
   - Set **Framework Preset**: `Vite`
   - Set **Root Directory**: `client`
2. **Configure Vercel Environment Variables**:
   Add the following under **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://eventora-backend.onrender.com/api` (Replace with your actual Render API URL)
3. **Deploy**: Click **Deploy**.
   - `client/vercel.json` will automatically handle SPA client-side routing so pages like `/admin`, `/event/:id`, and `/dashboard` reload smoothly.

---

## 3. Verifying Nodemailer Real Emails

When hosted on cloud servers (Render), outgoing SMTP connection port 465/587 is open.
- Once `EMAIL_USER` and `EMAIL_PASS` (16-char App Password) are set on Render:
  - Users entering an email address during booking will receive **real 6-digit OTP codes directly in their Gmail inbox**.
  - All OTPs remain safely backed up in MongoDB Atlas & logged in Render server logs.
