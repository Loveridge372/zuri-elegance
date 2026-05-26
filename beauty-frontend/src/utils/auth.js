export function getLoggedInUser() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user || null;
  } catch {
    return null;
  }
}

export function getUserId() {
  const user = getLoggedInUser();
  return user?.id || null;
}

export function getToken() {
  return localStorage.getItem("token");
}
