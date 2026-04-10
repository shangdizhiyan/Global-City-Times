function resolveApiBaseUrl() {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const runtimeApiBaseUrl = params.get("apiBaseUrl");
    if (runtimeApiBaseUrl) {
      return runtimeApiBaseUrl;
    }
  }

  return import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8787";
}

const API_BASE_URL = resolveApiBaseUrl();

export async function fetchCountryDirectory({ refresh = false } = {}) {
  const url = new URL("/api/countries", API_BASE_URL);
  if (refresh) {
    url.searchParams.set("refresh", "1");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
