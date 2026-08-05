import { getLang } from "./i18n-utils.js";
import { chatbotData } from "./chatbot-data.js";

const lang = getLang();
const data = chatbotData[lang] || chatbotData.az;

const toggle = document.getElementById("chatbotToggle");
const panel = document.getElementById("chatbotPanel");
const closeBtn = document.getElementById("chatbotClose");
const titleEl = document.getElementById("chatbotTitle");
const body = document.getElementById("chatbotBody");

if (toggle && panel && closeBtn && titleEl && body) {
  titleEl.textContent = data.title;

  toggle.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden") && body.children.length === 0) {
      renderCategories();
    }
  });

  closeBtn.addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  function backButton(onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chatbot-back-btn";
    btn.textContent = "‹ " + data.backButton;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function optionButton(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chatbot-option-btn";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function renderCategories() {
    body.innerHTML = "";

    const welcome = document.createElement("p");
    welcome.className = "chatbot-welcome";
    welcome.textContent = data.welcome;
    body.appendChild(welcome);

    const list = document.createElement("div");
    list.className = "chatbot-options";
    data.categories.forEach((cat, catIndex) => {
      list.appendChild(optionButton(cat.title, () => renderQuestions(catIndex)));
    });
    body.appendChild(list);
  }

  function renderQuestions(catIndex) {
    const cat = data.categories[catIndex];
    body.innerHTML = "";
    body.appendChild(backButton(renderCategories));

    const heading = document.createElement("p");
    heading.className = "chatbot-heading";
    heading.textContent = cat.title;
    body.appendChild(heading);

    const list = document.createElement("div");
    list.className = "chatbot-options";
    cat.questions.forEach((item, qIndex) => {
      list.appendChild(optionButton(item.q, () => renderAnswer(catIndex, qIndex)));
    });
    body.appendChild(list);
  }

  function renderAnswer(catIndex, qIndex) {
    const cat = data.categories[catIndex];
    const item = cat.questions[qIndex];
    body.innerHTML = "";
    body.appendChild(backButton(() => renderQuestions(catIndex)));

    const q = document.createElement("p");
    q.className = "chatbot-question";
    q.textContent = item.q;
    body.appendChild(q);

    const a = document.createElement("p");
    a.className = "chatbot-answer";
    a.textContent = item.a;
    body.appendChild(a);

    body.appendChild(optionButton(data.backToMenu, renderCategories));
  }
}
