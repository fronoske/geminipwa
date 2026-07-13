// src/layout-runtime.js is generated from this file. Edit this TypeScript source instead.
function updateMessageMaxWidthVar() {
    const container = elements.messageContainer;
    if (!container)
        return;
    const maxWidthPx = container.clientWidth * 0.8;
    document.documentElement.style.setProperty('--message-max-width', `${maxWidthPx}px`);
}
let resizeTimer;
window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateMessageMaxWidthVar, 150);
});
