"use client";

import { useRef, useState } from "react";
import { useLang } from "@/lib/client/lang";
import { getCart, getFavorites } from "@/lib/client/store";

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

interface Message {
  role: "bot" | "user";
  text: string;
  thinking?: boolean;
}

/** Chat widget from _Layout.cshtml with the behaviour of chatbot.js. */
export default function Chatbot() {
  const { lang } = useLang();
  const s = strings[lang] ?? strings.az;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const opened = useRef(false);
  const history = useRef<{ role: string; text: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight }));

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !opened.current) {
      opened.current = true;
      setMessages([{ role: "bot", text: s.welcome }]);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: message }, { role: "bot", text: s.thinking, thinking: true }]);
    scrollDown();

    let reply: string;
    try {
      const cart = getCart().map((i) => ({ productId: i.productId, title: i.title, price: i.price, quantity: i.quantity }));
      const favorites = getFavorites().map((i) => ({ productId: i.productId, title: i.title, price: i.price, quantity: 1 }));
      const res = await fetch("/Chat/Ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, lang, history: history.current, cart, favorites }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { reply: string };
      reply = data.reply;
      history.current.push({ role: "user", text: message }, { role: "model", text: data.reply });
      if (history.current.length > 20) history.current = history.current.slice(-20);
    } catch {
      reply = s.error;
    }

    setMessages((m) => [...m.filter((x) => !x.thinking), { role: "bot", text: reply }]);
    setBusy(false);
    scrollDown();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div id="chatbotWidget" className="chatbot-widget">
      <button id="chatbotToggle" className="chatbot-toggle" type="button" aria-label="Kömək" onClick={toggle}>
        💬
      </button>
      <div id="chatbotPanel" className={`chatbot-panel${open ? "" : " hidden"}`}>
        <div className="chatbot-panel__header">
          <span id="chatbotTitle">{s.title}</span>
          <button id="chatbotClose" className="chatbot-panel__close" type="button" aria-label="Bağla" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div id="chatbotMessages" ref={bodyRef} className="chatbot-panel__body">
          {messages.map((m, i) => (
            <div key={i} className={`chatbot-msg chatbot-msg--${m.role}${m.thinking ? " chatbot-msg--thinking" : ""}`}>
              {m.text}
            </div>
          ))}
        </div>
        <form id="chatbotForm" className="chatbot-panel__form" onSubmit={onSubmit}>
          <input
            id="chatbotInput"
            ref={inputRef}
            type="text"
            autoComplete="off"
            placeholder={s.placeholder}
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
          />
          <button id="chatbotSendBtn" type="submit" aria-label="Göndər">
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
