import { handleVercelLiveReview } from "./_proofrank.js";
import { createDirectFetchText } from "../app/src/liveFetchers.js";

const PUBLIC_REVIEW_HOSTS = [
  "github.com",
  "api.github.com",
  "raw.githubusercontent.com",
  "github.io",
  "vercel.app",
  "netlify.app",
  "pages.dev",
  "nativelyai.app",
  "web.app",
  "firebaseapp.com",
  "huggingface.co",
  "hf.space",
  "streamlit.app",
  "replit.app",
  "replit.dev",
  "onrender.com",
  "fly.dev",
  "railway.app",
  "up.railway.app",
  "glitch.me"
];

export default function handler(request, response) {
  return handleVercelLiveReview(request, response, "/api/review-project", {
    allowAnonymousPost: true,
    authToken: "",
    allowedHosts: PUBLIC_REVIEW_HOSTS,
    liveCollectors: {
      collectionMode: "direct-fetch",
      fetchText: createDirectFetchText()
    }
  });
}
