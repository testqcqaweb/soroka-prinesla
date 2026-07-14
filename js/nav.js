const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");

if (header && toggle && nav) {
  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  };

  toggle.addEventListener("click", () => {
    setOpen(!header.classList.contains("is-open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}
