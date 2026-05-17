document.addEventListener("DOMContentLoaded", function () {
    const consent = localStorage.getItem("bizTrackCookieConsent");

    if (!consent) {
        const banner = document.createElement("div");
        banner.id = "cookie-banner";
        banner.innerHTML = `
            <p>
                BizTrack uses localStorage to save your products, orders, expenses, language preference, and cookie consent choice.
                <a href="privacy.html">Privacy Policy</a>
            </p>
            <button id="accept-cookies" type="button">Accept</button>
        `;

        document.body.appendChild(banner);

        document.getElementById("accept-cookies").addEventListener("click", function () {
            localStorage.setItem("bizTrackCookieConsent", "accepted");
            banner.style.display = "none";
        });
    }
});