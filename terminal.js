// Fake fish-style terminal easter egg.
// Open: press "t" (outside inputs), click the footer "❯ terminal" trigger,
// or click the hero prompt line. Close: `exit`, Escape, or the ✕.
(() => {
  const PAGES = {
    about: "index.html",
    projects: "projects.html",
    skills: "skills.html",
    contact: "contact.html",
  };

  const RASPBERRY = String.raw`
   .~~.   .~~.
  '. \ ' ' / .'
   .~ .~~~..~.
  : .~.'~'.~. :
 ~ (   ) (   ) ~
( : '~'.~.'~' : )
 ~ .~ (   ) ~. ~
  (  : '~' :  )
   '~ .~~~. ~'
       '~'`;

  let overlay = null;
  let body = null;
  let input = null;
  const history = [];
  let histIdx = 0;

  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const promptHtml =
    '<span class="t-user">dima</span>@pizero <span class="t-path">~</span> <span class="t-sign">❯</span> ';

  function print(html, cls = "") {
    const line = document.createElement("div");
    line.className = "t-line " + cls;
    line.innerHTML = html;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function neofetch() {
    const info = [
      ["host", "Raspberry Pi Zero 2 W"],
      ["server", "apache2 + cloudflared"],
      ["shell", "fish (the imaginary kind)"],
      ["theme", "gruvbox + phthalo green"],
      ["resolution", `${window.innerWidth}x${window.innerHeight}`],
      ["visitor", "you, apparently"],
    ];
    const art = RASPBERRY.split("\n");
    const rows = Math.max(art.length, info.length);
    let out = "";
    for (let i = 0; i < rows; i++) {
      const left = (art[i] || "").padEnd(20);
      const right = info[i - 2]
        ? `<span class="t-sign">${info[i - 2][0]}</span>: ${esc(info[i - 2][1])}`
        : "";
      out += `<span class="t-art">${esc(left)}</span> ${right}\n`;
    }
    print(`<pre>${out}</pre>`);
  }

  const commands = {
    help() {
      print(
        "commands: <span class='t-sign'>help</span> whoami neofetch ls cd &lt;page&gt; uptime clear sudo exit"
      );
    },
    whoami() {
      print(
        "Dima — M.Sc. computer science student, builds things where software meets hardware."
      );
    },
    neofetch,
    ls() {
      print(
        Object.keys(PAGES)
          .map((p) => `<span class="t-path">${p}/</span>`)
          .join("  ") + "  <span class='t-muted'>secrets/ (permission denied)</span>"
      );
    },
    cd(arg) {
      const target = PAGES[(arg || "").replace(/\/$/, "")];
      if (target) {
        print(`opening <span class="t-path">${arg}</span> …`);
        setTimeout(() => (location.href = target), 350);
      } else if (!arg || arg === "~") {
        print("already home.");
      } else {
        print(`cd: The directory '${esc(arg)}' does not exist`, "t-err");
      }
    },
    uptime() {
      fetch("status.json", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((s) => {
          const d = Math.floor(s.uptime_s / 86400);
          const h = Math.floor((s.uptime_s % 86400) / 3600);
          const m = Math.floor((s.uptime_s % 3600) / 60);
          print(
            `up ${d}d ${h}h ${m}m · cpu ${s.temp.toFixed(1)}°C · load ${s.load}` +
              " <span class='t-muted'>(live from the actual pi)</span>"
          );
        })
        .catch(() => print("status.json unreachable — am I even running?", "t-err"));
    },
    clear() {
      body.innerHTML = "";
    },
    sudo() {
      print("Nice try. This incident will be reported to absolutely no one.", "t-err");
    },
    exit: close,
  };
  commands.open = commands.cd;

  function run(raw) {
    const value = raw.trim();
    print(promptHtml + esc(value), "t-echo");
    if (!value) return;
    history.push(value);
    histIdx = history.length;
    const [cmd, ...args] = value.split(/\s+/);
    const fn = commands[cmd.toLowerCase()];
    if (fn) fn(args.join(" "));
    else print(`fish: Unknown command: ${esc(cmd)}`, "t-err");
  }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "term-overlay";
    overlay.innerHTML =
      '<div class="term" role="dialog" aria-label="terminal">' +
      '<div class="term-bar"><span>dima@pizero: ~</span>' +
      '<button class="term-close" aria-label="close">✕</button></div>' +
      '<div class="term-body"></div>' +
      '<div class="term-input-row">' +
      `<span class="t-prompt">${promptHtml}</span>` +
      '<input class="term-input" type="text" autocomplete="off" spellcheck="false" aria-label="terminal input">' +
      "</div></div>";
    document.body.appendChild(overlay);

    body = overlay.querySelector(".term-body");
    input = overlay.querySelector(".term-input");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
      else input.focus();
    });
    overlay.querySelector(".term-close").addEventListener("click", close);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        run(input.value);
        input.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (histIdx > 0) input.value = history[--histIdx] || "";
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histIdx < history.length) input.value = history[++histIdx] || "";
      }
    });

    print("Welcome to the pi. Type <span class='t-sign'>help</span> to look around.");
  }

  function open() {
    if (!overlay) build();
    overlay.classList.add("visible");
    input.focus();
    window.__lenis?.stop();
  }

  function close() {
    if (overlay) overlay.classList.remove("visible");
    window.__lenis?.start();
  }

  document.addEventListener("keydown", (e) => {
    const typing = /^(input|textarea)$/i.test(document.activeElement?.tagName || "");
    if (e.key === "Escape") close();
    else if (e.key === "t" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      open();
    }
  });

  document.querySelectorAll(".term-open, .hero-prompt").forEach((el) => {
    el.addEventListener("click", open);
    el.style.cursor = "pointer";
  });
})();
