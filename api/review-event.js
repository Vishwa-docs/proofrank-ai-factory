import { handleVercelLiveReview } from "./_proofrank.js";

export default function handler(request, response) {
  return handleVercelLiveReview(request, response, "/api/review-event");
}
