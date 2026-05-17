// SIDEBAR TOGGLE

function openSidebar() {
  const side = document.getElementById("sidebar");
  const toggleButton = document.querySelector(".sidebar-toggle");
  const closeButton = document.querySelector(".sidebar-close");
  const shouldOpen = side.style.display !== "block";

  side.style.display = shouldOpen ? "block" : "none";

  if (toggleButton) {
    toggleButton.setAttribute("aria-expanded", String(shouldOpen));
  }

  if (shouldOpen && closeButton) {
    closeButton.focus();
  }
}

function closeSidebar() {
  const side = document.getElementById("sidebar");
  const toggleButton = document.querySelector(".sidebar-toggle");

  side.style.display = "none";

  if (toggleButton) {
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.focus();
  }
}

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;