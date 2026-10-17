import { assertAllowedPath, getFile } from "../../_lib/github.js";
import { json, errorResponse } from "../../_lib/http.js";

export async function onRequestGet(context) {
  try {
    const path = new URL(context.request.url).searchParams.get("path");
    if (!path) return json({ error: "缺少 path 参数" }, 400);

    assertAllowedPath(path);
    const file = await getFile(context.env, path);
    return json({ path, content: file.content });
  } catch (error) {
    return errorResponse(error, error.status || 500);
  }
}
