import { json } from "../../_lib/http.js";

export async function onRequestGet(context) {
  const user = context.data.user || {};
  return json({
    email: user.email || "",
    sub: user.sub || "",
  });
}
