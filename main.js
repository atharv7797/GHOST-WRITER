/* =========================================================
   GHOST WRITER — main.js
   Mock AI-powered email reply generator (frontend-only)
   ========================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------
     MOBILE MENU
  ----------------------------------------------------- */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  function openMenu() {
    mobileMenu.hidden = false;
    hamburgerBtn.setAttribute("aria-expanded", "true");
    hamburgerBtn.setAttribute("aria-label", "Close menu");
  }

  function closeMenu() {
    mobileMenu.hidden = true;
    hamburgerBtn.setAttribute("aria-expanded", "false");
    hamburgerBtn.setAttribute("aria-label", "Open menu");
  }

  function isMenuOpen() {
    return !mobileMenu.hidden;
  }

  hamburgerBtn.addEventListener("click", () => {
    isMenuOpen() ? closeMenu() : openMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMenuOpen()) {
      closeMenu();
      hamburgerBtn.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!isMenuOpen()) return;
    const clickedInsideMenu = mobileMenu.contains(e.target);
    const clickedHamburger = hamburgerBtn.contains(e.target);
    if (!clickedInsideMenu && !clickedHamburger) {
      closeMenu();
    }
  });

  mobileMenu.querySelectorAll(".mobile-link").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && isMenuOpen()) {
      closeMenu();
    }
  });

  /* -----------------------------------------------------
     MOCK AI DATA
  ----------------------------------------------------- */

  const MOCK_ANALYSIS = {
    intent: "Collaboration Request",
    tone: "Professional / Friendly",
    context: "The sender is asking whether you are interested in working together.",
    action: "Respond regarding the collaboration opportunity.",
  };

  const MOCK_CHOICES = [
    {
      id: "yes",
      title: "Enthusiastic Yes",
      description: "Accept the opportunity with a confident and positive response.",
      reply:
        "Thanks for reaching out! I'd be happy to explore the collaboration. I'd love to hear more about the project, timeline, and next steps.",
      alternates: [
        "This sounds great — count me in. Send over the details whenever you're ready and I'll take a look right away.",
        "I'd genuinely love to work on this together. Let me know the next step and I'll make time for it this week.",
      ],
    },
    {
      id: "refuse",
      title: "Professional Refusal",
      description: "Decline politely while keeping the relationship positive.",
      reply:
        "Thank you for reaching out and considering me for this opportunity. I appreciate the invitation, but I'm unable to take on new collaborations at the moment.",
      alternates: [
        "I really appreciate you thinking of me for this. Unfortunately my plate is full right now, so I'll have to pass this time.",
        "Thanks so much for the offer — it means a lot. I'm not able to commit to anything new at the moment, but I hope we can revisit this later.",
      ],
    },
    {
      id: "negotiate",
      title: "Negotiation",
      description: "Show interest while asking for more information before committing.",
      reply:
        "Thanks for getting in touch. I'm interested in learning more about the collaboration. Could you share the scope, timeline, deliverables, and budget so I can take a closer look?",
      alternates: [
        "This could be a good fit — before I commit, could you send over the scope, timeline, and budget so I can review the details?",
        "Glad you reached out. I'd like to understand the deliverables and timeline a bit better first — could you share those details?",
      ],
    },
  ];

  /* -----------------------------------------------------
     ELEMENT REFERENCES
  ----------------------------------------------------- */

  const emailInput = document.getElementById("emailInput");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const formError = document.getElementById("formError");

  const stageInput = document.getElementById("stageInput");
  const stageLoading = document.getElementById("stageLoading");
  const stageResults = document.getElementById("stageResults");

  const analysisIntent = document.getElementById("analysisIntent");
  const analysisTone = document.getElementById("analysisTone");
  const analysisContext = document.getElementById("analysisContext");
  const analysisAction = document.getElementById("analysisAction");

  const choicesGrid = document.getElementById("choicesGrid");
  const finalAction = document.getElementById("finalAction");
  const finalCopyBtn = document.getElementById("finalCopyBtn");

  const startOverBtn = document.getElementById("startOverBtn");
  const liveStatus = document.getElementById("liveStatus");

  let selectedChoiceId = null;

  /* -----------------------------------------------------
     STAGE SWITCHING
  ----------------------------------------------------- */

  function showStage(stage) {
    [stageInput, stageLoading, stageResults].forEach((el) => {
      el.hidden = el !== stage;
    });
  }

  function announce(message) {
    liveStatus.textContent = message;
  }

  /* -----------------------------------------------------
     ANALYZE FLOW
  ----------------------------------------------------- */

  analyzeBtn.addEventListener("click", () => {
    const value = emailInput.value.trim();

    if (!value) {
      formError.hidden = false;
      emailInput.focus();
      return;
    }

    formError.hidden = true;
    analyzeBtn.disabled = true;

    showStage(stageLoading);
    announce("Analyzing email...");

    const delay = 1000 + Math.floor(Math.random() * 500); // 1000–1500ms

    window.setTimeout(() => {
      renderAnalysis();
      renderChoices();
      showStage(stageResults);
      announce("Analysis complete. Three response choices are ready.");
      analyzeBtn.disabled = false;
    }, delay);
  });

  emailInput.addEventListener("input", () => {
    if (!formError.hidden) formError.hidden = true;
  });

  /* -----------------------------------------------------
     RENDER: ANALYSIS
  ----------------------------------------------------- */

  function renderAnalysis() {
    analysisIntent.textContent = MOCK_ANALYSIS.intent;
    analysisTone.textContent = MOCK_ANALYSIS.tone;
    analysisContext.textContent = MOCK_ANALYSIS.context;
    analysisAction.textContent = MOCK_ANALYSIS.action;
  }

  /* -----------------------------------------------------
     RENDER: CHOICES
  ----------------------------------------------------- */

  function renderChoices() {
    selectedChoiceId = null;
    finalAction.hidden = true;
    choicesGrid.innerHTML = "";

    MOCK_CHOICES.forEach((choice) => {
      choicesGrid.appendChild(buildChoiceCard(choice));
    });
  }

  function buildChoiceCard(choice) {
    const card = document.createElement("article");
    card.className = "choice-card";
    card.dataset.choiceId = choice.id;

    const head = document.createElement("div");
    head.className = "choice-head";

    const title = document.createElement("h4");
    title.className = "choice-title";
    title.textContent = choice.title;
    head.appendChild(title);

    card.appendChild(head);

    const desc = document.createElement("p");
    desc.className = "choice-desc";
    desc.textContent = choice.description;
    card.appendChild(desc);

    const body = document.createElement("p");
    body.className = "choice-body";
    body.textContent = choice.reply;
    card.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "choice-actions";

    const actionsLeft = document.createElement("div");
    actionsLeft.className = "choice-actions-left";

    const copyBtn = makeIconButton("Copy", "fa-regular fa-copy");
    const editBtn = makeIconButton("Edit", "fa-regular fa-pen-to-square");
    const regenBtn = makeIconButton("Regenerate", "fa-solid fa-rotate");

    actionsLeft.appendChild(copyBtn);
    actionsLeft.appendChild(editBtn);
    actionsLeft.appendChild(regenBtn);

    const useBtn = document.createElement("button");
    useBtn.type = "button";
    useBtn.className = "btn-use";
    useBtn.textContent = "Use This Reply";

    actions.appendChild(actionsLeft);
    actions.appendChild(useBtn);
    card.appendChild(actions);

    /* ---- Copy ---- */
    copyBtn.addEventListener("click", () => {
      const text = body.textContent;
      copyToClipboard(text).then(() => {
        flashButton(copyBtn, "✓ Copied", "fa-solid fa-check");
      });
    });

    /* ---- Edit ---- */
    editBtn.addEventListener("click", () => {
      enterEditMode(card, body, choice);
    });

    /* ---- Regenerate ---- */
    let regenIndex = 0;
    regenBtn.addEventListener("click", () => {
      if (!choice.alternates || choice.alternates.length === 0) return;
      const pool = [choice.reply, ...choice.alternates];
      regenIndex = (regenIndex + 1) % pool.length;
      body.textContent = pool[regenIndex];
      choice.reply = pool[regenIndex];

      if (card.classList.contains("is-selected")) {
        updateFinalCopySource(choice.reply);
      }
    });

    /* ---- Use This Reply ---- */
    useBtn.addEventListener("click", () => {
      selectChoice(choice.id, card, useBtn, body.textContent);
    });

    return card;
  }

  function makeIconButton(label, iconClass) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-btn";
    btn.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i><span>${label}</span>`;
    return btn;
  }

  function flashButton(btn, tempLabel, tempIconClass) {
    const original = btn.innerHTML;
    btn.classList.add("is-success");
    btn.innerHTML = `<i class="${tempIconClass}" aria-hidden="true"></i><span>${tempLabel.replace("✓ ", "")}</span>`;
    window.setTimeout(() => {
      btn.classList.remove("is-success");
      btn.innerHTML = original;
    }, 1600);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise((resolve) => {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        /* no-op: clipboard unavailable */
      }
      document.body.removeChild(temp);
      resolve();
    });
  }

  /* ---- Edit mode ---- */

  function enterEditMode(card, bodyEl, choice) {
    if (card.querySelector(".choice-edit-area")) return; // already editing

    const textarea = document.createElement("textarea");
    textarea.className = "choice-edit-area";
    textarea.value = bodyEl.textContent;

    const controls = document.createElement("div");
    controls.className = "choice-actions-left";
    controls.style.marginBottom = "12px";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "icon-btn";
    saveBtn.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i><span>Save</span>`;

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "icon-btn";
    cancelBtn.innerHTML = `<i class="fa-solid fa-xmark" aria-hidden="true"></i><span>Cancel</span>`;

    controls.appendChild(saveBtn);
    controls.appendChild(cancelBtn);

    bodyEl.replaceWith(textarea);
    textarea.insertAdjacentElement("afterend", controls);
    textarea.focus();

    saveBtn.addEventListener("click", () => {
      const newText = textarea.value.trim() || bodyEl.textContent;
      bodyEl.textContent = newText;
      choice.reply = newText;
      textarea.replaceWith(bodyEl);
      controls.remove();

      if (card.classList.contains("is-selected")) {
        updateFinalCopySource(newText);
      }
    });

    cancelBtn.addEventListener("click", () => {
      textarea.replaceWith(bodyEl);
      controls.remove();
    });
  }

  /* ---- Selection ---- */

  let finalReplyText = "";

  function selectChoice(choiceId, card, useBtn, text) {
    // Reset every card
    choicesGrid.querySelectorAll(".choice-card").forEach((c) => {
      c.classList.remove("is-selected");
      const btn = c.querySelector(".btn-use");
      btn.classList.remove("is-selected");
      btn.textContent = "Use This Reply";
    });

    selectedChoiceId = choiceId;
    card.classList.add("is-selected");
    useBtn.classList.add("is-selected");
    useBtn.innerHTML = "";
    useBtn.textContent = "✓ Selected";

    updateFinalCopySource(text);
    finalAction.hidden = false;
    announce("Reply selected. You can copy the final reply.");
  }

  function updateFinalCopySource(text) {
    finalReplyText = text;
  }

  finalCopyBtn.addEventListener("click", () => {
    if (!finalReplyText) return;
    copyToClipboard(finalReplyText).then(() => {
      const original = finalCopyBtn.innerHTML;
      finalCopyBtn.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i> Copied`;
      window.setTimeout(() => {
        finalCopyBtn.innerHTML = original;
      }, 1600);
    });
  });

  /* -----------------------------------------------------
     START OVER
  ----------------------------------------------------- */

  startOverBtn.addEventListener("click", () => {
    emailInput.value = "";
    formError.hidden = true;
    selectedChoiceId = null;
    finalReplyText = "";
    showStage(stageInput);
    announce("Ready for a new email.");
    emailInput.focus();
  });
})();
