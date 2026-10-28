// 818 Accounting Serve: free consultation questionnaire
// Shows one question at a time, then opens the visitor's email app with the
// answers addressed to Garo (the site is static, so there is no server to send it).

(function () {
  var form = document.getElementById("quiz-form");
  if (!form) return;

  // 2026 federal brackets (IRS Rev. Proc. 2025-32): [top of bracket, rate].
  // Update these and the standard deductions each year.
  var TAX = {
    single: { std: 16100, brackets: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]] },
    joint: { std: 32200, brackets: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]] },
    head: { std: 24150, brackets: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]] }
  };
  var INCOME_MAX = 500000;

  var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
  var count = document.getElementById("quiz-count");
  var bar = document.getElementById("quiz-bar");
  var back = document.getElementById("quiz-back");
  var error = document.getElementById("quiz-error");
  var slider = document.getElementById("income");
  var current = steps[0];
  var usingPointer = false;

  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

  function value(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  }

  function values(name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }

  // Questions that apply to this visitor, in order (the done screen is not counted)
  function questions() {
    return steps.filter(function (s) {
      if (s.dataset.step === "done") return false;
      var rule = s.dataset.ifWork;
      return !rule || rule.split("|").indexOf(value("work")) !== -1;
    });
  }

  function show(next, backwards) {
    current.classList.remove("is-active", "from-left");
    next.classList.toggle("from-left", !!backwards);
    next.classList.add("is-active");
    current = next;
    error.textContent = "";

    var list = questions();
    var i = list.indexOf(next);
    var done = next.dataset.step === "done";
    count.textContent = done ? "All done" : "Question " + (i + 1) + " of " + list.length;
    bar.style.width = (done ? 100 : (i / list.length) * 100) + "%";
    back.hidden = done || i === 0;

    var focusable = done ? next : next.querySelector("input");
    if (focusable) focusable.focus({ preventScroll: true });
  }

  function valid(step) {
    var name = step.dataset.step;
    if (step.querySelector('input[type="radio"]') && !value(name)) return "Please choose an answer.";
    if (name === "help" && !values("help").length) return "Please pick at least one.";
    if (name === "plans" && !values("plans").length) return "Please pick at least one, or None of these.";
    if (name === "contact") {
      if (!form.elements.name.value.trim()) return "Please enter your name.";
      if (!form.elements.email.checkValidity() || !form.elements.email.value.trim()) return "Please enter a valid email so Garo can reach you.";
    }
    return "";
  }

  function goNext() {
    var problem = valid(current);
    if (problem) { error.textContent = problem; return; }
    var list = questions();
    var next = list[list.indexOf(current) + 1];
    if (next) show(next);
  }

  back.addEventListener("click", function () {
    var list = questions();
    var prev = list[list.indexOf(current) - 1];
    if (prev) show(prev, true);
  });

  form.addEventListener("click", function (e) {
    if (e.target.closest("[data-next]")) goNext();
  });

  form.addEventListener("change", function (e) {
    var input = e.target;
    // Single-choice questions move on by themselves after a short pause when
    // clicked (keyboard users arrow through options and press Enter or Next)
    if (input.type === "radio" && usingPointer) {
      var step = current;
      setTimeout(function () { if (current === step) goNext(); }, 280);
    }
    // "None of these" clears the other plans, and picking a plan clears it
    if (input.type === "checkbox" && input.checked) {
      form.querySelectorAll('input[name="' + input.name + '"]').forEach(function (other) {
        if (other !== input && (input.hasAttribute("data-exclusive") || other.hasAttribute("data-exclusive"))) other.checked = false;
      });
    }
    if (input.name === "filing") updateEstimate();
  });

  form.addEventListener("pointerdown", function () { usingPointer = true; });

  // Enter moves forward instead of submitting early
  form.addEventListener("keydown", function (e) {
    usingPointer = false;
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && current.dataset.step !== "contact") {
      e.preventDefault();
      goNext();
    }
  });

  // Income slider and tax estimate
  function incomeLabel() {
    var n = Number(slider.value);
    return n >= INCOME_MAX ? money(INCOME_MAX) + "+" : money(n);
  }

  function updateEstimate() {
    var income = Number(slider.value);
    var filing = value("filing");
    var table = filing === "Married filing jointly" ? TAX.joint : filing === "Head of household" ? TAX.head : TAX.single;
    var taxable = Math.max(0, income - table.std);
    var tax = 0, floor = 0, top = 0;
    for (var i = 0; i < table.brackets.length && taxable > floor; i++) {
      var ceiling = table.brackets[i][0];
      tax += (Math.min(taxable, ceiling) - floor) * table.brackets[i][1];
      top = table.brackets[i][1];
      floor = ceiling;
    }

    document.getElementById("income-value").textContent = incomeLabel();
    document.getElementById("est-tax").textContent = money(tax);
    document.getElementById("est-bracket").textContent = Math.round(top * 100) + "%";
    document.getElementById("est-rate").textContent = (income ? (tax / income) * 100 : 0).toFixed(1) + "%";
    slider.style.setProperty("--fill", (income / INCOME_MAX) * 100 + "%");

    var note = "Rough estimate for a " + (filing && filing !== "Not sure" ? filing.toLowerCase() : "single") +
      " filer using the 2026 standard deduction, before credits. California tax is not included.";
    if (value("work") === "Business owner" || value("work") === "Both") note += " Business income also owes self-employment tax.";
    document.getElementById("est-note").textContent = note;
  }

  slider.addEventListener("input", updateEstimate);
  updateEstimate();

  // Send: open the visitor's email app with every answer filled in
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var problem = valid(current);
    if (problem) { error.textContent = problem; return; }

    var name = form.elements.name.value.trim();
    var lines = [
      "Free consultation request",
      "",
      "Name: " + name,
      "Email: " + form.elements.email.value.trim(),
      "Phone: " + (form.elements.phone.value.trim() || "Not given"),
      "",
      "Filing status: " + value("filing"),
      "Income from: " + value("work")
    ];
    if (questions().indexOf(form.querySelector('[data-step="business"]')) !== -1) lines.push("Business setup: " + value("business"));
    lines.push(
      "Household income: about " + incomeLabel(),
      "Wants help with: " + values("help").join(", "),
      "Plans this year: " + values("plans").join(", ")
    );
    var notes = form.elements.notes.value.trim();
    if (notes) lines.push("", "Notes: " + notes);

    window.location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Free consultation request from " + name) +
      "&body=" + encodeURIComponent(lines.join("\n"));
    show(form.querySelector('[data-step="done"]'));
  });

  show(current);
})();
