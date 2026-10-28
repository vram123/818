// 818 Accounting Serve: site scripts

var CONTACT_EMAIL = "garog@818accountingserve.com";

// Footer year
var year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Contact form: the site is static (GitHub Pages), so open the visitor's
// email app with the message filled in.
var contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = contactForm.elements.name.value.trim();
    var email = contactForm.elements.email.value.trim();
    var message = contactForm.elements.message.value.trim();
    var subject = "Website inquiry from " + name;
    var body = message + "\n\nName: " + name + "\nEmail: " + email;
    window.location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    document.getElementById("form-note").textContent =
      "Opening your email app. If nothing happens, email us at " + CONTACT_EMAIL + ".";
  });
}

// Newsletter signup
var newsletter = document.getElementById("newsletter-form");
if (newsletter) {
  newsletter.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = newsletter.elements.email.value.trim();
    window.location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Newsletter signup") +
      "&body=" + encodeURIComponent("Please add " + email + " to the newsletter.");
  });
}
