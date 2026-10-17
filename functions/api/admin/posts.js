import { getFile } from "../../_lib/github.js";
import { json, errorResponse } from "../../_lib/http.js";

export async function onRequestGet(context) {
  try {
    const file = await getFile(context.env, "data/posts.json");
    const posts = file.content ? JSON.parse(file.content) : [];
    return json({ posts: Array.isArray(posts) ? posts : [] });
  } catch (error) {
    return errorResponse(error, error.status || 500);
  }
}
