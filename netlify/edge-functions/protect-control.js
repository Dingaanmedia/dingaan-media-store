export default async (request, context) => {
  const url = new URL(request.url);

  // Only protect /control/*
  if (!url.pathname.startsWith("/control/")) {
    return context.next();
  }

  const user = Netlify.env.get("CONTROL_USER");
  const pass = Netlify.env.get("CONTROL_PASS");

  if (!user || !pass) {
    return new Response("Control panel locked. Missing env vars.", { status: 401 });
  }

  const auth = request.headers.get("authorization") || "";
  const expected = "Basic " + btoa(`${user}:${pass}`);

  if (auth !== expected) {
    return new Response("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Dingaan Media Control"' },
    });
  }

  return context.next();
};
