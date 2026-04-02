// Auto-detect API URL based on environment
if (window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")) {
    window.API_BASE = "http://localhost:5000/api";
} else {
    // On Vercel, use relative path to same domain
    window.API_BASE = `${window.location.origin}/api`;
}
