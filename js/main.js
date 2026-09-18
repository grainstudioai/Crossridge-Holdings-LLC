/*
 * Crossridge Holdings LLC — site behavior
 * No external libraries: keeps JS lightweight for Core Web Vitals.
 *
 * IMPORTANT (before launch):
 *  - LEAD_ENDPOINT below must point to a real server-side endpoint that
 *    validates and stores submissions (and forwards spam-filtered leads to
 *    email/CRM). Never trust the honeypot field alone for spam protection —
 *    it's a first line of defense only; also rate-limit and validate on the
 *    server per CLAUDE.md security rules.
 *  - ANALYTICS_ENDPOINT / trackEvent() is a stub. Wire it to GA4, or
 *    whatever analytics platform is chosen, before launch.
 */

(function () {
  "use strict";

  var LEAD_ENDPOINT = ""; // TODO: set real backend endpoint, e.g. "/api/lead"

  /* ---------------- Analytics stub ---------------- */
  function trackEvent(name, detail) {
    // TODO: replace with real analytics call (gtag, plausible, etc.)
    if (window.dataLayer && typeof window.dataLayer.push === "function") {
      window.dataLayer.push({ event: name, ...detail });
    } else if (window.console) {
      console.debug("[track]", name, detail || {});
    }
  }

  /* ---------------- Sticky header ---------------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var scrollDepthMarks = [25, 50, 75, 100];
  var scrollDepthHit = {};
  document.addEventListener(
    "scroll",
    function () {
      var doc = document.documentElement;
      var scrolled = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
      scrollDepthMarks.forEach(function (mark) {
        if (scrolled >= mark && !scrollDepthHit[mark]) {
          scrollDepthHit[mark] = true;
          trackEvent("scroll_depth", { percent: mark });
        }
      });
    },
    { passive: true }
  );

  /* ---------------- Mobile menu ---------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  var mobileMenuClose = document.querySelector(".mobile-menu-close");

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var firstLink = mobileMenu.querySelector("a");
    if (firstLink) firstLink.focus();
  }
  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    });
  }
  if (mobileMenuClose) mobileMenuClose.addEventListener("click", closeMenu);
  document.querySelectorAll(".mobile-menu a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------------- Hero audience toggle ---------------- */
  var audienceTabs = document.querySelectorAll(".audience-tab");
  audienceTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-audience");

      audienceTabs.forEach(function (t) {
        var isActive = t === tab;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", String(isActive));
      });

      document.querySelectorAll(".audience-panel").forEach(function (panel) {
        var isMatch = panel.id === "panel-" + target;
        panel.toggleAttribute("hidden", !isMatch);
        panel.classList.toggle("is-active", isMatch);
        // Panels start hidden, so their .reveal children never intersect
        // the scroll-reveal observer below until shown — reveal them
        // immediately rather than waiting on it.
        if (isMatch) {
          panel.querySelectorAll(".reveal").forEach(function (el) {
            el.classList.add("is-visible");
          });
        }
      });

      trackEvent("audience_toggle", { audience: target });
    });
  });

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");

      document.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
          openItem.querySelector(".faq-answer").style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove("is-open");
        question.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        item.classList.add("is-open");
        question.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
        trackEvent("faq_open", { question: question.textContent.trim() });
      }
    });
  });

  /* ---------------- Lead forms ---------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[\d\s()+.-]{7,20}$/;

  function setFieldError(field, message) {
    field.classList.toggle("has-error", Boolean(message));
    var msgEl = field.querySelector(".form-error-msg");
    if (msgEl) msgEl.textContent = message || "";
  }

  function validateForm(form) {
    var valid = true;

    var address = form.querySelector('[name="address"]');
    if (address) {
      var addressField = address.closest(".form-field");
      if (!address.value.trim() || address.value.trim().length < 5) {
        setFieldError(addressField, "Please enter the property address.");
        valid = false;
      } else {
        setFieldError(addressField, "");
      }
    }

    ["firstName", "lastName"].forEach(function (name) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return;
      var field = input.closest(".form-field");
      if (!input.value.trim()) {
        setFieldError(field, "Required.");
        valid = false;
      } else {
        setFieldError(field, "");
      }
    });

    var email = form.querySelector('[name="email"]');
    if (email && email.value.trim()) {
      var emailField = email.closest(".form-field");
      if (!EMAIL_RE.test(email.value.trim())) {
        setFieldError(emailField, "Please enter a valid email address.");
        valid = false;
      } else {
        setFieldError(emailField, "");
      }
    }

    var phone = form.querySelector('[name="phone"]');
    if (phone) {
      var phoneField = phone.closest(".form-field");
      if (!phone.value.trim()) {
        setFieldError(phoneField, phone.required ? "Please enter a phone number." : "");
        if (phone.required) valid = false;
      } else if (!PHONE_RE.test(phone.value.trim())) {
        setFieldError(phoneField, "Please enter a valid phone number.");
        valid = false;
      } else {
        setFieldError(phoneField, "");
      }
    }

    var consent = form.querySelector('[name="consent"]');
    if (consent) {
      var consentField = consent.closest(".form-field");
      if (!consent.checked) {
        setFieldError(consentField, "Please check the box to continue.");
        valid = false;
      } else {
        setFieldError(consentField, "");
      }
    }

    return valid;
  }

  // Full lead-capture form (lives inside the modal). This is the only form
  // that actually submits data anywhere.
  function handleLeadForm(form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot spam check: a real visitor never fills this hidden field.
      var honeypot = form.querySelector('[name="website"]');
      if (honeypot && honeypot.value) {
        return; // silently drop suspected bot submission
      }

      if (!validateForm(form)) {
        trackEvent("form_error", { formId: form.id });
        var firstError = form.querySelector(".has-error input, .has-error textarea");
        if (firstError) firstError.focus();
        return;
      }

      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = "Submitting...";
      }

      var payload = Object.fromEntries(new FormData(form).entries());
      delete payload.website;
      delete payload.consent;

      var finish = function () {
        var container = form.parentElement;
        var success = container ? container.querySelector(".form-success") : null;
        form.classList.add("is-hidden");
        if (success) success.classList.add("is-visible");
        trackEvent("form_submit", { formId: form.id });
      };

      if (LEAD_ENDPOINT) {
        fetch(LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then(function (res) {
            if (!res.ok) throw new Error("Request failed");
            finish();
          })
          .catch(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = submitBtn.dataset.originalText;
            }
            alert(
              "Something went wrong sending your information. Please call us directly or try again."
            );
          });
      } else {
        // No backend configured yet in this template — see LEAD_ENDPOINT above.
        console.warn(
          "Crossridge site: LEAD_ENDPOINT is not configured. Form data was not sent anywhere.",
          payload
        );
        finish();
      }
    });
  }

  document.querySelectorAll("form.lead-form").forEach(handleLeadForm);

  /* ---------------- Modals (lead + cash buyer) ---------------- */
  var activeModal = null;
  var lastFocusedBeforeModal = null;

  function resetModalForm(modalEl) {
    var form = modalEl.querySelector("form");
    var success = modalEl.querySelector(".form-success");
    if (form) {
      form.reset();
      form.classList.remove("is-hidden");
      form.querySelectorAll(".has-error").forEach(function (field) {
        setFieldError(field, "");
      });
    }
    if (success) success.classList.remove("is-visible");
  }

  function openModal(modalEl, focusFieldId, prefill) {
    if (!modalEl) return;
    resetModalForm(modalEl);

    if (prefill) {
      Object.keys(prefill).forEach(function (id) {
        var field = document.getElementById(id);
        if (field) field.value = prefill[id];
      });
    }

    lastFocusedBeforeModal = document.activeElement;
    activeModal = modalEl;
    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    var focusField = focusFieldId && document.getElementById(focusFieldId);
    if (focusField) focusField.focus();

    trackEvent("modal_open", { modalId: modalEl.id });
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeModal = null;
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === "function") {
      lastFocusedBeforeModal.focus();
    }
  }

  function openLeadModal(prefillAddress) {
    var modalEl = document.getElementById("lead-modal");
    var prefill = prefillAddress ? { "modal-address": prefillAddress } : null;
    openModal(modalEl, prefillAddress ? "modal-first-name" : "modal-address", prefill);
  }

  document.querySelectorAll(".js-open-modal").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openLeadModal();
    });
  });

  document.querySelectorAll(".js-open-buyer-modal").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openModal(document.getElementById("buyer-modal"), "buyer-first-name");
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
    overlay.querySelectorAll("[data-close-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeModal(overlay);
      });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && activeModal) {
      closeModal(activeModal);
    }
  });

  // Address-only "mini" forms (hero + final CTA): they don't submit on
  // their own — they hand the address to the modal, which collects the
  // rest of the contact info and performs the actual submission.
  document.querySelectorAll("form.lead-form-mini").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var honeypot = form.querySelector('[name="website"]');
      if (honeypot && honeypot.value) return;

      if (!validateForm(form)) {
        var firstError = form.querySelector(".has-error input");
        if (firstError) firstError.focus();
        return;
      }

      var address = form.querySelector('[name="address"]');
      trackEvent("mini_form_submit", { formId: form.id });
      openLeadModal(address ? address.value.trim() : "");
      form.reset();
    });
  });

  /* ---------------- Outbound click tracking ---------------- */
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener("click", function () {
      trackEvent("phone_click", { href: link.getAttribute("href") });
    });
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener("click", function () {
      trackEvent("email_click", { href: link.getAttribute("href") });
    });
  });
  document.querySelectorAll('[data-cta]').forEach(function (el) {
    el.addEventListener("click", function () {
      trackEvent("cta_click", { cta: el.getAttribute("data-cta") });
    });
  });
})();
