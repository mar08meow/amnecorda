import { commitFiles } from "../../_lib/github.js";
import { json, errorResponse } from "../../_lib/http.js";

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const changes = body?.changes;
    const message = body?.message;

    if (!Array.isArray(changes) || !changes.length) {
      return json({ error: "changes 不能为空" }, 400);
    }

    const commit = await commitFiles(
      context.env,
      changes,
      message || "Admin update"
    );

    return json({
      commit: commit.html_url,
      sha: commit.sha,
    });
  } catch (error) {
    return errorResponse(error, error.status || 500);
  }
}
