function goToProtectedArea() {
  const token = localStorage.getItem("studyhub_token");
  if (token) {
    window.location.href = "http://localhost:5173/dashboard";
    return;
  }
  window.location.href = "http://localhost:5173/login";
}

document.getElementById("getStartedBtn").addEventListener("click", goToProtectedArea);
document.getElementById("dashboardLink").addEventListener("click", (event) => {
  event.preventDefault();
  goToProtectedArea();
});
