document.addEventListener("DOMContentLoaded", function () {
    const consent = localStorage.getItem("bizTrackCookieConsent");

    if (!consent) {
        const savedLanguage = localStorage.getItem("bizTrackLanguage") || "en";

        const translations = {
            en: {
                message: "BizTrack uses localStorage to save your products, orders, expenses, language preference, and cookie consent choice.",
                privacyPolicy: "Privacy Policy",
                accept: "Accept"
            },
            zh: {
                message: "BizTrack 使用 localStorage 保存您的产品、订单、支出、语言偏好和 cookie 同意选择。",
                privacyPolicy: "隐私政策",
                accept: "接受"
            }
        };

        const text = translations[savedLanguage] || translations.en;

        const banner = document.createElement("div");
        banner.id = "cookie-banner";
        banner.innerHTML = `
            <p>
                ${text.message}
                <a href="privacy.html">${text.privacyPolicy}</a>
            </p>
            <button id="accept-cookies" type="button">${text.accept}</button>
        `;

        document.body.appendChild(banner);

        document.getElementById("accept-cookies").addEventListener("click", function () {
            localStorage.setItem("bizTrackCookieConsent", "accepted");
            banner.style.display = "none";
        });
    }
});