/* =========================================================
   GHOST WRITER — main.js
   Real AI-powered email analysis frontend
   Backend: FastAPI + NVIDIA AI
   ========================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------
     CONFIGURATION
  ----------------------------------------------------- */


  const API_URL = "https://ghost-writer-l93x.onrender.com/api/analyze";


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
  let finalReplyText = "";

  // Stores the latest AI response
  let currentAnalysis = null;


  /* -----------------------------------------------------
     STAGE SWITCHING
  ----------------------------------------------------- */

  function showStage(stage) {
    [stageInput, stageLoading, stageResults].forEach((el) => {
      el.hidden = el !== stage;
    });
  }


  /* -----------------------------------------------------
     ACCESSIBILITY STATUS
  ----------------------------------------------------- */

  function announce(message) {
    liveStatus.textContent = message;
  }


  /* -----------------------------------------------------
     ERROR HANDLING
  ----------------------------------------------------- */

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;

    announce(message);
  }


  function clearError() {
    formError.hidden = true;
    formError.textContent = "";
  }


  /* -----------------------------------------------------
     ANALYZE EMAIL — REAL BACKEND
  ----------------------------------------------------- */

  analyzeBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    // Validate input
    if (!email) {
      showError("Paste an email before analyzing.");
      emailInput.focus();
      return;
    }

    clearError();

    // Disable button while request is running
    analyzeBtn.disabled = true;

    // Show loading screen
    showStage(stageLoading);
    announce("Analyzing email with AI...");

    try {
      /*
       * Send email to FastAPI backend.
       *
       * Backend expects:
       *
       * {
       *   "email": "..."
       * }
       */

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email: email
        })
      });


      /* -------------------------------------------------
         HANDLE HTTP ERRORS
      ------------------------------------------------- */

      if (!response.ok) {
        let errorMessage = "The AI service returned an error.";

        try {
          const errorData = await response.json();

          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (error) {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }


      /* -------------------------------------------------
         READ AI RESPONSE
      ------------------------------------------------- */

      const data = await response.json();

      currentAnalysis = data;


      /* -------------------------------------------------
         VALIDATE RESPONSE
      ------------------------------------------------- */

      if (
        !data ||
        typeof data !== "object" ||
        !data.intent ||
        !data.tone ||
        !data.context ||
        !data.requested_action ||
        !Array.isArray(data.responses)
      ) {
        throw new Error(
          "The AI returned an incomplete response."
        );
      }

      if (data.responses.length !== 3) {
        throw new Error(
          "The AI did not return exactly 3 response choices."
        );
      }


      /* -------------------------------------------------
         RENDER RESULTS
      ------------------------------------------------- */

      renderAnalysis(data);
      renderChoices(data.responses);

      showStage(stageResults);

      announce(
        "Analysis complete. Three response choices are ready."
      );

    } catch (error) {
      console.error("Ghost Writer API error:", error);

      showStage(stageInput);

      let message = error.message;

      /*
       * Helpful message if the backend isn't running.
       */

      if (
        error instanceof TypeError ||
        message.includes("Failed to fetch") ||
        message.includes("NetworkError")
      ) {
        message =
          "Cannot connect to Ghost Writer backend. Make sure FastAPI is running at http://127.0.0.1:8000.";
      }

      showError(message);

      emailInput.focus();

    } finally {
      analyzeBtn.disabled = false;
    }
  });


  /* -----------------------------------------------------
     CLEAR ERROR WHEN USER TYPES
  ----------------------------------------------------- */

  emailInput.addEventListener("input", () => {
    if (!formError.hidden) {
      clearError();
    }
  });


  /* -----------------------------------------------------
     RENDER: AI ANALYSIS
  ----------------------------------------------------- */

  function renderAnalysis(data) {
    analysisIntent.textContent = data.intent;
    analysisTone.textContent = data.tone;
    analysisContext.textContent = data.context;
    analysisAction.textContent = data.requested_action;
  }


  /* -----------------------------------------------------
     RENDER: AI RESPONSE CHOICES
  ----------------------------------------------------- */

  function renderChoices(responses) {
    selectedChoiceId = null;
    finalReplyText = "";

    finalAction.hidden = true;
    choicesGrid.innerHTML = "";


    /*
     * Convert backend responses into frontend choice objects.
     */

    const choices = responses.map((response, index) => {
      let id;

      if (response.type === "Enthusiastic Yes") {
        id = "yes";
      } else if (response.type === "Professional Refusal") {
        id = "refuse";
      } else if (response.type === "Negotiation") {
        id = "negotiate";
      } else {
        id = `choice-${index + 1}`;
      }

      return {
        id: id,
        title: response.type,
        description: response.description,
        reply: response.text,
        alternates: []
      };
    });


    choices.forEach((choice) => {
      choicesGrid.appendChild(
        buildChoiceCard(choice)
      );
    });
  }


  /* -----------------------------------------------------
     BUILD RESPONSE CARD
  ----------------------------------------------------- */

  function buildChoiceCard(choice) {
    const card = document.createElement("article");

    card.className = "choice-card";
    card.dataset.choiceId = choice.id;


    /* -----------------------------------------------
       HEADER
    ----------------------------------------------- */

    const head = document.createElement("div");

    head.className = "choice-head";


    const title = document.createElement("h4");

    title.className = "choice-title";
    title.textContent = choice.title;


    head.appendChild(title);
    card.appendChild(head);


    /* -----------------------------------------------
       DESCRIPTION
    ----------------------------------------------- */

    const desc = document.createElement("p");

    desc.className = "choice-desc";
    desc.textContent = choice.description;

    card.appendChild(desc);


    /* -----------------------------------------------
       REPLY BODY
    ----------------------------------------------- */

    const body = document.createElement("p");

    body.className = "choice-body";
    body.textContent = choice.reply;

    card.appendChild(body);


    /* -----------------------------------------------
       ACTIONS
    ----------------------------------------------- */

    const actions = document.createElement("div");

    actions.className = "choice-actions";


    const actionsLeft = document.createElement("div");

    actionsLeft.className = "choice-actions-left";


    const copyBtn = makeIconButton(
      "Copy",
      "fa-regular fa-copy"
    );


    const editBtn = makeIconButton(
      "Edit",
      "fa-regular fa-pen-to-square"
    );


    const regenBtn = makeIconButton(
      "Regenerate",
      "fa-solid fa-rotate"
    );


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


    /* -------------------------------------------------
       COPY
    ------------------------------------------------- */

    copyBtn.addEventListener("click", () => {
      const text = body.textContent;

      copyToClipboard(text).then(() => {
        flashButton(
          copyBtn,
          "✓ Copied",
          "fa-solid fa-check"
        );

        announce("Reply copied to clipboard.");
      });
    });


    /* -------------------------------------------------
       EDIT
    ------------------------------------------------- */

    editBtn.addEventListener("click", () => {
      enterEditMode(
        card,
        body,
        choice
      );
    });


    /* -------------------------------------------------
       REGENERATE
       -----------------------------------------------
       The current NVIDIA backend returns one reply
       for each choice. There is no regeneration endpoint
       yet, so this button provides a clear message rather
       than pretending to generate a new AI reply.
    ------------------------------------------------- */

    regenBtn.addEventListener("click", () => {
      showRegenerateMessage(regenBtn);
    });


    /* -------------------------------------------------
       USE THIS REPLY
    ------------------------------------------------- */

    useBtn.addEventListener("click", () => {
      selectChoice(
        choice.id,
        card,
        useBtn,
        body.textContent
      );
    });


    return card;
  }


  /* -----------------------------------------------------
     ICON BUTTON
  ----------------------------------------------------- */

  function makeIconButton(label, iconClass) {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "icon-btn";

    const icon = document.createElement("i");

    icon.className = iconClass;
    icon.setAttribute("aria-hidden", "true");


    const text = document.createElement("span");

    text.textContent = label;


    btn.appendChild(icon);
    btn.appendChild(text);


    return btn;
  }


  /* -----------------------------------------------------
     REGENERATE MESSAGE
  ----------------------------------------------------- */

  function showRegenerateMessage(button) {
    const original = button.innerHTML;

    button.classList.add("is-success");

    button.innerHTML =
      '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>' +
      '<span>Use Analyze Again</span>';


    announce(
      "Regenerate is not available yet. Analyze the email again for a new AI response."
    );


    window.setTimeout(() => {
      button.classList.remove("is-success");
      button.innerHTML = original;
    }, 2200);
  }


  /* -----------------------------------------------------
     BUTTON FLASH
  ----------------------------------------------------- */

  function flashButton(
    btn,
    tempLabel,
    tempIconClass
  ) {
    const original = btn.innerHTML;

    btn.classList.add("is-success");

    btn.innerHTML =
      `<i class="${tempIconClass}" aria-hidden="true"></i>` +
      `<span>${tempLabel.replace("✓ ", "")}</span>`;


    window.setTimeout(() => {
      btn.classList.remove("is-success");
      btn.innerHTML = original;
    }, 1600);
  }


  /* -----------------------------------------------------
     CLIPBOARD
  ----------------------------------------------------- */

  function copyToClipboard(text) {
    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      return navigator.clipboard
        .writeText(text)
        .catch(() => fallbackCopy(text));
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
        console.error(
          "Clipboard fallback failed:",
          err
        );
      }

      document.body.removeChild(temp);

      resolve();
    });
  }


  /* -----------------------------------------------------
     EDIT MODE
  ----------------------------------------------------- */

  function enterEditMode(
    card,
    bodyEl,
    choice
  ) {
    if (
      card.querySelector(".choice-edit-area")
    ) {
      return;
    }


    const textarea =
      document.createElement("textarea");

    textarea.className =
      "choice-edit-area";

    textarea.value =
      bodyEl.textContent;


    const controls =
      document.createElement("div");

    controls.className =
      "choice-actions-left";

    controls.style.marginBottom =
      "12px";


    /* -----------------------------------------------
       SAVE BUTTON
    ----------------------------------------------- */

    const saveBtn =
      document.createElement("button");

    saveBtn.type = "button";

    saveBtn.className =
      "icon-btn";

    saveBtn.innerHTML =
      '<i class="fa-solid fa-check" aria-hidden="true"></i>' +
      "<span>Save</span>";


    /* -----------------------------------------------
       CANCEL BUTTON
    ----------------------------------------------- */

    const cancelBtn =
      document.createElement("button");

    cancelBtn.type = "button";

    cancelBtn.className =
      "icon-btn";

    cancelBtn.innerHTML =
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
      "<span>Cancel</span>";


    controls.appendChild(saveBtn);
    controls.appendChild(cancelBtn);


    bodyEl.replaceWith(textarea);

    textarea.insertAdjacentElement(
      "afterend",
      controls
    );

    textarea.focus();


    /* -----------------------------------------------
       SAVE
    ----------------------------------------------- */

    saveBtn.addEventListener(
      "click",
      () => {
        const newText =
          textarea.value.trim() ||
          bodyEl.textContent;


        bodyEl.textContent =
          newText;

        choice.reply =
          newText;


        textarea.replaceWith(
          bodyEl
        );

        controls.remove();


        if (
          card.classList.contains(
            "is-selected"
          )
        ) {
          updateFinalCopySource(
            newText
          );
        }


        announce(
          "Reply edited successfully."
        );
      }
    );


    /* -----------------------------------------------
       CANCEL
    ----------------------------------------------- */

    cancelBtn.addEventListener(
      "click",
      () => {
        textarea.replaceWith(
          bodyEl
        );

        controls.remove();

        announce(
          "Reply editing cancelled."
        );
      }
    );
  }


  /* -----------------------------------------------------
     SELECTION
  ----------------------------------------------------- */

  function selectChoice(
    choiceId,
    card,
    useBtn,
    text
  ) {
    /*
     * Reset every card
     */

    choicesGrid
      .querySelectorAll(
        ".choice-card"
      )
      .forEach((c) => {
        c.classList.remove(
          "is-selected"
        );


        const btn =
          c.querySelector(
            ".btn-use"
          );


        if (btn) {
          btn.classList.remove(
            "is-selected"
          );

          btn.textContent =
            "Use This Reply";
        }
      });


    selectedChoiceId =
      choiceId;


    card.classList.add(
      "is-selected"
    );


    useBtn.classList.add(
      "is-selected"
    );


    useBtn.innerHTML = "";

    useBtn.textContent =
      "✓ Selected";


    updateFinalCopySource(
      text
    );


    finalAction.hidden =
      false;


    announce(
      "Reply selected. You can copy the final reply."
    );
  }


  /* -----------------------------------------------------
     FINAL COPY
  ----------------------------------------------------- */

  function updateFinalCopySource(text) {
    finalReplyText = text;
  }


  finalCopyBtn.addEventListener(
    "click",
    () => {
      if (!finalReplyText) {
        return;
      }


      copyToClipboard(
        finalReplyText
      ).then(() => {
        const original =
          finalCopyBtn.innerHTML;


        finalCopyBtn.innerHTML =
          '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied';


        announce(
          "Final reply copied to clipboard."
        );


        window.setTimeout(() => {
          finalCopyBtn.innerHTML =
            original;
        }, 1600);
      });
    }
  );


  /* -----------------------------------------------------
     START OVER
  ----------------------------------------------------- */

  startOverBtn.addEventListener(
    "click",
    () => {
      emailInput.value = "";

      clearError();

      selectedChoiceId = null;

      finalReplyText = "";

      currentAnalysis = null;

      choicesGrid.innerHTML = "";

      finalAction.hidden = true;

      showStage(stageInput);

      announce(
        "Ready for a new email."
      );

      emailInput.focus();
    }
  );


  /* -----------------------------------------------------
     KEYBOARD SHORTCUT
     Ctrl/Cmd + Enter = Analyze
  ----------------------------------------------------- */

  emailInput.addEventListener(
    "keydown",
    (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter"
      ) {
        e.preventDefault();

        if (!analyzeBtn.disabled) {
          analyzeBtn.click();
        }
      }
    }
  );


  /* -----------------------------------------------------
     INITIAL STATE
  ----------------------------------------------------- */

  showStage(stageInput);

  announce(
    "Ghost Writer is ready."
  );

})();