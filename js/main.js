(function () {
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    var meta = document.getElementById("theme-color");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0D1117" : "#ffffff");
    var button = document.getElementById("theme-toggle");
    if (button) {
      button.setAttribute("aria-label", theme === "dark" ? "切换为浅色主题" : "切换为深色主题");
    }
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (err) {}
    }
  }

  applyTheme(currentTheme(), false);

  var themeButton = document.getElementById("theme-toggle");
  if (themeButton) {
    themeButton.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }

  try {
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    var onScheme = function () {
      var stored = null;
      try {
        stored = localStorage.getItem("theme");
      } catch (err) {}
      if (stored === "light" || stored === "dark") return;
      applyTheme(media.matches ? "dark" : "light", false);
    };
    if (media.addEventListener) media.addEventListener("change", onScheme);
  } catch (err) {}

  var navCheck = document.getElementById("nav-check");
  var navToggle = document.getElementById("nav-toggle");
  if (navCheck && navToggle) {
    var syncNav = function () {
      var open = navCheck.checked;
      navToggle.textContent = open ? "关闭" : "菜单";
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    navCheck.addEventListener("change", syncNav);
    syncNav();
  }

  var footerLinks = document.getElementById("footer-links");
  if (footerLinks && window.blogData && blogData.author) {
    var author = blogData.author;
    footerLinks.innerHTML =
      '<a href="mailto:' + Blog.escapeHtml(author.email) + '">' + Blog.escapeHtml(author.email) + "</a>" +
      '<a href="' + Blog.escapeHtml(author.github) + '" target="_blank" rel="noopener noreferrer">GitHub</a>';
  }

  var lightbox = document.createElement("div");
  lightbox.id = "lightbox";
  lightbox.className = "lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = '<button type="button" class="lightbox-close">关闭</button><div class="lightbox-frame"></div>';
  document.body.appendChild(lightbox);
  var lastFocus = null;

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    lightbox.querySelector(".lightbox-frame").innerHTML = "";
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }

  function openLightbox(source) {
    var frame = lightbox.querySelector(".lightbox-frame");
    var clone = source.cloneNode(true);
    clone.removeAttribute("data-zoom");
    frame.innerHTML = "";
    frame.appendChild(clone);
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add("no-scroll");
    lightbox.querySelector(".lightbox-close").focus();
  }

  lightbox.addEventListener("click", function () {
    closeLightbox();
  });

  document.addEventListener("click", function (event) {
    var copyButton = event.target.closest(".copy-btn");
    if (copyButton) {
      var code = copyButton.closest(".codeblock").querySelector("code");
      var text = code ? code.textContent : "";
      var done = function (ok) {
        copyButton.textContent = ok ? "已复制" : "复制失败";
        copyButton.classList.toggle("is-done", ok);
        window.clearTimeout(copyButton._timer);
        copyButton._timer = window.setTimeout(function () {
          copyButton.textContent = "复制";
          copyButton.classList.remove("is-done");
        }, 1600);
      };
      var fallback = function () {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try {
          ok = document.execCommand("copy");
        } catch (err) {
          ok = false;
        }
        document.body.removeChild(area);
        done(ok);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    }

    var zoom = event.target.closest("[data-zoom]");
    if (zoom && !event.target.closest("#lightbox")) {
      event.preventDefault();
      openLightbox(zoom);
    }

    var tocLink = event.target.closest(".toc a");
    if (tocLink) {
      var id = decodeURIComponent(tocLink.getAttribute("href").slice(1));
      var target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (window.Blog && Blog.setTocActive) Blog.setTocActive(id);
      history.replaceState(null, "", "#" + id);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    closeLightbox();
    if (navCheck && navCheck.checked) {
      navCheck.checked = false;
      navCheck.dispatchEvent(new Event("change"));
    }
  });
})();
