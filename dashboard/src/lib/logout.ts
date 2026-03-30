export const logout = () => {
  // Clear auth tokens
  localStorage.removeItem("accessToken");

  localStorage.removeItem("user");
  localStorage.removeItem("utm");

  window.location.href = "/auth/login";
};
