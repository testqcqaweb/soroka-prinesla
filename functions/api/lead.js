/**
 * Cloudflare Pages Function mirror: POST /api/lead
 * Prefer the dedicated Worker for GitHub Pages hosting.
 */
import worker from "../../worker/lead.js";

export async function onRequestOptions(context) {
  return worker.fetch(new Request(context.request.url, { method: "OPTIONS" }), context.env);
}

export async function onRequestPost(context) {
  return worker.fetch(context.request, context.env);
}
