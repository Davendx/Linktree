export const config = { runtime: "edge" };

/** * 1. PROFILE CONFIGURATION
 * Edit these values to update your "Linktree" page.
 */
const PROFILE_CONFIG = {
  name: "David",
  title: "Software Engineer & Designer",
  // Add a direct link to an image (e.g., from GitHub or an image host)
  avatarUrl: "https://github.com/Davendx.png", 
  links: [
    { label: "Follow me on X", url: "https://x.com/your-username" },
    { label: "GitHub Portfolio", url: "https://github.com/Davendx" },
    { label: "Recent Projects", url: "#" },
    { label: "Contact", url: "mailto:hello@example.com" },
  ]
};

/** * 2. SYSTEM CONFIGURATION
 */
const DATA_ENDPOINT = (process.env.DATA_API_ENDPOINT || "").replace(/\/$/, "");
const STANDARD_HEADERS = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate", 
  "proxy-authorization", "te", "trailer", "transfer-encoding", 
  "upgrade", "forwarded", "x-forwarded-host", "x-forwarded-proto", 
  "x-forwarded-port"
]);

/**
 * 3. HTML GENERATOR (The "Landing Page")
 */
function generateLandingPage() {
  const linkButtons = PROFILE_CONFIG.links
    .map(link => `<a href="${link.url}" class="btn">${link.label}</a>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${PROFILE_CONFIG.name} | Portfolio</title>
    <style>
        body { font-family: -apple-system, sans-serif; background: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; color: #333; }
        .card { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; width: 100%; max-width: 320px; }
        .avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 2px solid #eee; }
        h1 { font-size: 1.2rem; margin: 0; }
        p { color: #777; font-size: 0.85rem; margin: 0.5rem 0 1.5rem; }
        .btn { display: block; background: #000; color: white; padding: 12px; margin: 8px 0; border-radius: 8px; text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.8; }
    </style>
</head>
<body>
    <div class="card">
        <img src="${PROFILE_CONFIG.avatarUrl}" alt="Profile" class="avatar">
        <h1>${PROFILE_CONFIG.name}</h1>
        <p>${PROFILE_CONFIG.title}</p>
        ${linkButtons}
    </div>
</body>
</html>
`;
}

/**
 * 4. MAIN HANDLER (The Relay)
 */
export default async function handler(req) {
  const url = new URL(req.url);
  
  // Root path serves the Landing Page
  if (url.pathname === "/" || url.pathname === "") {
    return new Response(generateLandingPage(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }

  // Sub-paths act as the relay
  if (!DATA_ENDPOINT) {
    return new Response("Service Unavailable", { status: 503 });
  }

  try {
    const remoteUrl = DATA_ENDPOINT + url.pathname + url.search;
    const outboundHeaders = new Headers();
    let sourceIp = null;

    for (const [key, value] of req.headers) {
      if (STANDARD_HEADERS.has(key)) continue;
      if (key.startsWith("x-vercel-")) continue;
      if (key === "x-real-ip") { sourceIp = value; continue; }
      if (key === "x-forwarded-for") { if (!sourceIp) sourceIp = value; continue; }
      outboundHeaders.set(key, value);
    }
    
    if (sourceIp) outboundHeaders.set("x-forwarded-for", sourceIp);

    const method = req.method;
    return await fetch(remoteUrl, {
      method,
      headers: outboundHeaders,
      body: (method !== "GET" && method !== "HEAD") ? req.body : undefined,
      duplex: "half",
      redirect: "manual",
    });
  } catch (err) {
    return new Response("Internal Server Error", { status: 500 });
  }
}