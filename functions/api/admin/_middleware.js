import { requireAccessUser } from "../../_lib/access.js";
import { json, errorResponse } from "../../_lib/http.js";

export async function onRequest(context) {
  try {
    const user = await requireAccessUser(context);
    if (!user) {
      return json({ error: "未通过 Cloudflare Access" }, 401);
    }

    context.data.user = user;
    return context.next();
  } catch (error) {
    return errorResponse(error, error.status || 500);
  }
}
