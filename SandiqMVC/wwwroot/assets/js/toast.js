let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.className = "toast-container";
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

function showToast(message, type = "success") {
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.textContent = message;
    getToastContainer().appendChild(el);

    requestAnimationFrame(() => el.classList.add("toast--visible"));

    setTimeout(() => {
        el.classList.remove("toast--visible");
        el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, 2500);
}