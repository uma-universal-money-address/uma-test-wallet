export const fetchWithRedirect = async (
  url: string,
  options: RequestInit = {},
) => {
  const res = await fetch(url, {
    ...options,
  });

  if (res.redirected) {
    const json = await res.json();
    if (json.logged_in) {
      window.location.href = window.location.origin + "/wallet";
    } else if (window.location.pathname !== "/") {
      // Redirect to home page if not already there
      window.location.href = window.location.origin;
    }
  }

  return res;
};
