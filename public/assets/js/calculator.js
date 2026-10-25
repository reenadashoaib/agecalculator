(function () {
  "use strict";

  var form = document.getElementById("age-form");
  if (!form) return;

  var DAY_MS = 86400000;
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var ZODIAC = [
    // [last month (1-12), last day, sign]: each sign runs up to and including this date
    [1, 19, "Capricorn"], [2, 18, "Aquarius"], [3, 20, "Pisces"], [4, 19, "Aries"],
    [5, 20, "Taurus"], [6, 20, "Gemini"], [7, 22, "Cancer"], [8, 22, "Leo"],
    [9, 22, "Virgo"], [10, 22, "Libra"], [11, 21, "Scorpio"], [12, 21, "Sagittarius"],
    [12, 31, "Capricorn"]
  ];

  var dobInput = document.getElementById("dob");
  var onInput = document.getElementById("on-date");
  var errorEl = document.getElementById("form-error");
  var results = document.getElementById("results");
  var numberFormat = new Intl.NumberFormat("en-US");
  var tickTimer = null;

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return numberFormat.format(n); }
  function plural(n, word) { return n === 1 ? word : word + "s"; }

  // All dates are handled as UTC midnights so daylight saving never shifts a day.
  function parseDate(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1, d = +m[3];
    var date = new Date(Date.UTC(y, mo, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo || date.getUTCDate() !== d) return null;
    return date;
  }

  function toInputValue(date) { return date.toISOString().slice(0, 10); }

  function today() {
    var now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  // Adds whole months, using the last day of the month when the day doesn't exist
  // (31 January + 1 month = 28 or 29 February).
  function addMonths(date, n) {
    var y = date.getUTCFullYear();
    var m = date.getUTCMonth() + n;
    var lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay)));
  }

  function wholeMonthsBetween(from, to) {
    var n = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
    if (addMonths(from, n) > to) n -= 1;
    return n;
  }

  function daysBetween(from, to) { return Math.round((to - from) / DAY_MS); }

  function zodiacSign(date) {
    var month = date.getUTCMonth() + 1;
    var day = date.getUTCDate();
    for (var i = 0; i < ZODIAC.length; i++) {
      if (month < ZODIAC[i][0] || (month === ZODIAC[i][0] && day <= ZODIAC[i][1])) return ZODIAC[i][2];
    }
    return "Capricorn";
  }

  function longDate(date) {
    return WEEKDAYS[date.getUTCDay()] + " " + date.getUTCDate() + " " + MONTHS[date.getUTCMonth()] + " " + date.getUTCFullYear();
  }

  function calculate(dob, on) {
    var months = wholeMonthsBetween(dob, on);
    var years = Math.floor(months / 12);
    var days = daysBetween(addMonths(dob, months), on);
    var totalDays = daysBetween(dob, on);
    var next = addMonths(dob, (years + 1) * 12);
    return {
      years: years,
      months: months % 12,
      days: days,
      totalMonths: months,
      totalDays: totalDays,
      isBirthday: months % 12 === 0 && days === 0 && years > 0,
      nextBirthday: next,
      daysToNext: daysBetween(on, next),
      turning: years + 1
    };
  }

  function showError(message, input) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    dobInput.removeAttribute("aria-invalid");
    onInput.removeAttribute("aria-invalid");
    if (input) {
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
    dobInput.removeAttribute("aria-invalid");
    onInput.removeAttribute("aria-invalid");
  }

  function secondsAlive(dob) {
    // Midnight on the birth date in the visitor's own time zone
    var born = new Date(dob.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate());
    return Math.max(0, Math.floor((Date.now() - born.getTime()) / 1000));
  }

  function render(dob, on, r) {
    var isToday = on.getTime() === today().getTime();

    $("r-intro").textContent = isToday
      ? "You are"
      : "On " + longDate(on) + " you " + (on > today() ? "will be" : "were");
    $("r-years").textContent = fmt(r.years);
    $("r-years-unit").textContent = plural(r.years, "year");
    $("r-months").textContent = r.months;
    $("r-months-unit").textContent = plural(r.months, "month");
    $("r-days").textContent = r.days;
    $("r-days-unit").textContent = plural(r.days, "day");

    $("t-months").textContent = fmt(r.totalMonths);
    $("t-weeks").textContent = fmt(Math.floor(r.totalDays / 7)) + (r.totalDays % 7 ? " and " + (r.totalDays % 7) + " " + plural(r.totalDays % 7, "day") : "");
    $("t-days").textContent = fmt(r.totalDays);
    $("t-hours").textContent = fmt(r.totalDays * 24);
    $("t-minutes").textContent = fmt(r.totalDays * 1440);
    $("t-weekday").textContent = WEEKDAYS[dob.getUTCDay()];
    $("t-zodiac").textContent = zodiacSign(dob);

    var heading, detail;
    if (r.isBirthday) {
      heading = isToday ? "Happy birthday!" : "That's a birthday.";
      detail = (isToday ? "You turn " + r.years + " today." : "Turning " + r.years + " that day.") +
        " The next one is in " + fmt(r.daysToNext) + " days.";
    } else {
      heading = fmt(r.daysToNext) + " " + plural(r.daysToNext, "day") + " until you turn " + r.turning;
      detail = "Your next birthday is on " + longDate(r.nextBirthday) + ".";
    }
    var birthday = $("r-birthday");
    birthday.innerHTML = "<p><strong></strong></p><p></p>";
    birthday.querySelector("strong").textContent = heading;
    birthday.querySelectorAll("p")[1].textContent = detail;

    clearInterval(tickTimer);
    var seconds = $("r-seconds");
    $("r-live").hidden = !isToday;
    if (isToday) {
      seconds.textContent = fmt(secondsAlive(dob));
      tickTimer = setInterval(function () { seconds.textContent = fmt(secondsAlive(dob)); }, 1000);
    } else {
      seconds.textContent = fmt(r.totalDays * 86400);
    }

    var firstShow = results.hidden;
    results.hidden = false;
    results.classList.remove("is-new");
    void results.offsetWidth; // restart the entrance animation
    results.classList.add("is-new");
    if (firstShow && window.matchMedia("(max-width: 640px)").matches) {
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function updateUrl(dob, on) {
    var params = new URLSearchParams();
    params.set("dob", toInputValue(dob));
    if (on.getTime() !== today().getTime()) params.set("on", toInputValue(on));
    history.replaceState(null, "", "?" + params.toString());
  }

  function run(fromUser) {
    clearError();
    if (!dobInput.value) {
      showError("Enter your date of birth.", fromUser ? dobInput : null);
      return;
    }
    var dob = parseDate(dobInput.value);
    if (!dob) {
      showError("Enter a full date of birth, including day, month and year.", dobInput);
      return;
    }
    var on = onInput.value ? parseDate(onInput.value) : today();
    if (!on) {
      showError("Enter a full date for “Age on”, or clear it to use today.", onInput);
      return;
    }
    if (dob > on) {
      showError("Your date of birth is after the “Age on” date. Choose an earlier date of birth or a later “Age on” date.", dobInput);
      return;
    }
    if (dob.getUTCFullYear() < 1900) {
      showError("Enter a date of birth from 1900 onwards.", dobInput);
      return;
    }

    render(dob, on, calculate(dob, on));
    updateUrl(dob, on);
    // ads.js listens for this to time the full-screen ad
    if (fromUser) document.dispatchEvent(new CustomEvent("age:calculated"));
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    run(true);
  });

  $("copy-link").addEventListener("click", function () {
    var status = $("copy-status");
    var url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { status.textContent = "Link copied"; },
        function () { status.textContent = "Copy this link from the address bar"; }
      );
    } else {
      status.textContent = "Copy this link from the address bar";
    }
    setTimeout(function () { status.textContent = ""; }, 3000);
  });

  // Defaults, plus a shared result from the link (?dob=1990-05-14&on=2030-01-01)
  var todayValue = toInputValue(today());
  dobInput.max = todayValue;
  onInput.value = todayValue;
  var params = new URLSearchParams(window.location.search);
  if (parseDate(params.get("dob"))) {
    dobInput.value = params.get("dob");
    if (parseDate(params.get("on"))) onInput.value = params.get("on");
    run(false);
  }
})();
