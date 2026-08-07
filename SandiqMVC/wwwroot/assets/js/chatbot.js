import { getLang } from "./i18n-utils.js";

const strings = {
    az: {
        title: "Kömək",
        welcome: "Salam! Sənə necə kömək edə bilərəm?",
        placeholder: "Sualını yaz...",
        thinking: "Yazır...",
        error: "Bağlantı xətası baş verdi. Bir az sonra yenidən cəhd et.",
    },
    ru: {
        title: "Помощь",
        welcome: "Здравствуйте! Чем могу помочь?",
        placeholder: "Напишите вопрос...",
        thinking: "Печатает...",
        error: "Ошибка соединения. Попробуйте ещё раз чуть позже.",
    },
    en: {
        title: "Help",
        welcome: "Hi! How can I help you?",
        placeholder: "Type your question...",
        thinking: "Typing...",
        error: "Connection error. Please try again in a moment.",
    },
};

const lang = getLang();
const t = strings[lang] || strings.az;

const toggle = document.getElementById("chatbotToggle");
const panel = document.getElementById("chatbotPanel");
const closeBtn = document.getElementById("chatbotClose");
const titleEl = document.getElementById("chatbotTitle");
const messagesEl = document.getElementById("chatbotMessages");
const form = document.getElementById("chatbotForm");
const input = document.getElementById("chatbotInput");

if (toggle && panel && closeBtn && titleEl && messagesEl && form && input) {
    titleEl.textContent = t.title;
    input.placeholder = t.placeholder;

    let history = [];
    let opened = false;

    toggle.addEventListener("click", () => {
        panel.classList.toggle("hidden");
        if (!panel.classList.contains("hidden") && !opened) {
            opened = true;
            addMessage("bot", t.welcome);
            input.focus();
        }
    });

    closeBtn.addEventListener("click", () => {
        panel.classList.add("hidden");
    });

    function addMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = `chatbot-msg chatbot-msg--${role}`;
        msg.textContent = text;
        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return msg;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        input.value = "";
        input.disabled = true;
        addMessage("user", message);

        const thinkingMsg = addMessage("bot", t.thinking);
        thinkingMsg.classList.add("chatbot-msg--thinking");

        try {
            const response = await fetch("/Chat/Ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, lang, history }),
            });

            if (!response.ok) throw new Error("Request failed");

            const data = await response.json();
            thinkingMsg.remove();
            addMessage("bot", data.reply);

            history.push({ role: "user", text: message });
            history.push({ role: "model", text: data.reply });
            if (history.length > 20) history = history.slice(-20);
        } catch (err) {
            thinkingMsg.remove();
            addMessage("bot", t.error);
        } finally {
            input.disabled = false;
            input.focus();
        }
    });
}
