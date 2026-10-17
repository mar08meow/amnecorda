export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

export const errorResponse = (error, fallbackStatus = 500) =>
  json(
    { error: error?.message || "Request failed" },
    error?.status || fallbackStatus
  );
