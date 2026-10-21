(function (factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.Blog = api;
})(function () {
  var KEYWORDS = {
    go: ["func", "return", "if", "else", "package", "import", "var", "type", "struct", "error", "nil", "for", "range", "defer", "string", "map", "int", "bool", "const", "case", "switch", "break", "continue", "interface", "true", "false"],
    sql: ["select", "from", "where", "create", "index", "on", "and", "or", "insert", "into", "table", "explain", "order", "by", "desc", "asc", "limit", "primary", "key", "not", "null"],
    js: ["const", "let", "var", "function", "return", "if", "else", "async", "await", "import", "from", "new", "class", "this", "true", "false", "null", "undefined"],
    bash: ["echo", "cd", "export", "if", "then", "fi", "for", "do", "done", "set"],
    python: ["def", "return", "if", "else", "elif", "import", "from", "none", "class", "for", "in", "while", "true", "false", "and", "or", "not", "with", "as"]
  };

  var LINE_COMMENT = {
    go: "//",
    js: "//",
    sql: "--",
    bash: "#",
    python: "#"
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function keywordSet(lang) {
    var list = KEYWORDS[lang];
    var set = Object.create(null);
    if (!list) return set;
    for (var i = 0; i < list.length; i++) set[list[i]] = true;
    return set;
  }

  function span(className, text) {
    return '<span class="' + className + '">' + escapeHtml(text) + "</span>";
  }

  function highlight(code, lang) {
    var key = (lang || "").toLowerCase();
    if (!KEYWORDS[key] && !LINE_COMMENT[key]) return escapeHtml(code);
    var keys = keywordSet(key);
    var comment = LINE_COMMENT[key];
    var allowBlock = key === "go" || key === "js" || key === "sql";
    var allowTick = key === "go" || key === "js";
    var i = 0;
    var out = "";
    var len = code.length;

    while (i < len) {
      if (comment && code.slice(i, i + comment.length) === comment) {
        var end = code.indexOf("\n", i);
        var j = end === -1 ? len : end;
        out += span("tok-cmt", code.slice(i, j));
        i = j;
        continue;
      }
      if (allowBlock && code.slice(i, i + 2) === "/*") {
        var blockEnd = code.indexOf("*/", i + 2);
        var bj = blockEnd === -1 ? len : blockEnd + 2;
        out += span("tok-cmt", code.slice(i, bj));
        i = bj;
        continue;
      }
      var c = code.charAt(i);
      if (c === '"' || c === "'" || (c === "`" && allowTick)) {
        var s = i + 1;
        while (s < len) {
          if (code.charAt(s) === "\\" && c !== "`") {
            s += 2;
            continue;
          }
          if (c === "'" && code.charAt(s) === "'" && code.charAt(s + 1) === "'") {
            s += 2;
            continue;
          }
          if (code.charAt(s) === c) {
            s += 1;
            break;
          }
          s += 1;
        }
        out += span("tok-str", code.slice(i, s));
        i = s;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        var w = i + 1;
        while (w < len && /[A-Za-z0-9_]/.test(code.charAt(w))) w += 1;
        var word = code.slice(i, w);
        var cls = "";
        if (keys[word.toLowerCase()]) cls = "tok-kw";
        else if (i > 0 && code.charAt(i - 1) === ".") cls = "tok-fn";
        else if (code.charAt(w) === "(") cls = "tok-fn";
        out += cls ? span(cls, word) : escapeHtml(word);
        i = w;
        continue;
      }
      if (/[0-9]/.test(c) && (i === 0 || !/[A-Za-z0-9_]/.test(code.charAt(i - 1)))) {
        var n = i + 1;
        while (n < len && /[0-9]/.test(code.charAt(n))) n += 1;
        out += span("tok-num", code.slice(i, n));
        i = n;
        continue;
      }
      out += escapeHtml(c);
      i += 1;
    }
    return out;
  }

  function safeHref(href) {
    var value = String(href || "").trim();
    if (/^(javascript|data):/i.test(value)) return "#";
    return value;
  }

  function inline(src) {
    var re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    var html = "";
    var last = 0;
    var match;
    while ((match = re.exec(src))) {
      html += escapeHtml(src.slice(last, match.index));
      if (match[0].charAt(0) === "!") {
        html += '<img src="' + escapeHtml(safeHref(match[2])) + '" alt="' + escapeHtml(match[1]) + '" data-zoom="1">';
      } else if (match[4] !== undefined) {
        var href = safeHref(match[5]);
        var external = /^https?:\/\//i.test(href);
        html += '<a href="' + escapeHtml(href) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + escapeHtml(match[4]) + "</a>";
      } else if (match[6] !== undefined) {
        html += "<code>" + escapeHtml(match[6]) + "</code>";
      } else if (match[7] !== undefined) {
        html += "<strong>" + escapeHtml(match[7]) + "</strong>";
      } else if (match[8] !== undefined) {
        html += "<em>" + escapeHtml(match[8]) + "</em>";
      }
      last = match.index + match[0].length;
    }
    html += escapeHtml(src.slice(last));
    return html;
  }

  function renderDiagram(caption) {
    var text = caption || "配置从程序边缘进入";
    return (
      '<figure class="figure"><svg data-zoom="1" viewBox="0 0 720 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      escapeHtml(text) +
      '"><title>' +
      escapeHtml(text) +
      '</title><g fill="none" stroke="currentColor" stroke-width="1.2"><rect x="16" y="18" width="168" height="40"/><rect x="16" y="70" width="168" height="40"/><rect x="16" y="122" width="168" height="40"/><rect x="286" y="62" width="168" height="56"/><rect x="536" y="62" width="168" height="56"/><path d="M184 38 H230 V90 H286"/><path d="M184 90 H286"/><path d="M184 142 H230 V90"/><path d="M454 90 H536"/></g><g fill="currentColor" font-size="15" font-family="PingFang SC, sans-serif"><text x="100" y="43" text-anchor="middle">环境变量</text><text x="100" y="95" text-anchor="middle">配置文件</text><text x="100" y="147" text-anchor="middle">默认值</text><text x="370" y="86" text-anchor="middle">加载并校验</text><text x="370" y="106" text-anchor="middle">一个入口</text><text x="620" y="96" text-anchor="middle">业务代码</text></g></svg><figcaption>' +
      escapeHtml(text) +
      "</figcaption></figure>"
    );
  }

  function isTableLine(line) {
    return /^\s*\|/.test(line);
  }

  function isSeparator(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  function splitRow(line) {
    var trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    return trimmed.split("|").map(function (cell) {
      return cell.trim();
    });
  }

  function isBlockStart(line) {
    var t = line.trim();
    return (
      t.startsWith("#") ||
      t.startsWith(">") ||
      t.startsWith("::diagram") ||
      t.startsWith("@@FENCE") ||
      t.startsWith("|") ||
      /^[-*] /.test(t) ||
      /^\d+\. /.test(t)
    );
  }

  function renderMarkdown(markdown) {
    var source = String(markdown || "").replace(/\r\n/g, "\n");
    var fences = [];
    source = source.replace(/```([^\n`]*)\n([\s\S]*?)```/g, function (_, lang, code) {
      var index = fences.length;
      fences.push({
        lang: String(lang || "").trim().toLowerCase(),
        code: code.replace(/\n$/, "")
      });
      return "\n\n@@FENCE" + index + "@@\n\n";
    });

    var lines = source.split("\n");
    var html = "";
    var toc = [];
    var headingCount = 0;
    var i = 0;

    function addHeading(level, text) {
      headingCount += 1;
      var id = "s" + headingCount;
      var clamped = level < 2 ? 2 : level > 3 ? 3 : level;
      toc.push({ level: clamped, id: id, text: text });
      return "<h" + clamped + ' id="' + id + '">' + escapeHtml(text) + "</h" + clamped + ">";
    }

    while (i < lines.length) {
      var line = lines[i];
      var trim = line.trim();
      if (!trim) {
        i += 1;
        continue;
      }

      var fence = /^@@FENCE(\d+)@@$/.exec(trim);
      if (fence) {
        var block = fences[Number(fence[1])];
        var label = block.lang || "text";
        html +=
          '<div class="codeblock"><div class="codeblock-bar"><span>' +
          escapeHtml(label) +
          '</span><button type="button" class="copy-btn">复制</button></div><pre><code>' +
          highlight(block.code, block.lang) +
          "</code></pre></div>";
        i += 1;
        continue;
      }

      if (trim.startsWith("::diagram")) {
        html += renderDiagram(trim.replace(/^::diagram\s*/, ""));
        i += 1;
        continue;
      }

      var heading = /^(#{1,4})\s+(.+)$/.exec(trim);
      if (heading) {
        html += addHeading(heading[1].length, heading[2].trim());
        i += 1;
        continue;
      }

      if (trim.startsWith(">")) {
        var quote = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          quote.push(lines[i].trim().replace(/^>\s?/, ""));
          i += 1;
        }
        html += "<blockquote><p>" + inline(quote.join(" ")) + "</p></blockquote>";
        continue;
      }

      if (/^[-*] /.test(trim)) {
        var items = [];
        while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
          items.push(inline(lines[i].trim().replace(/^[-*] /, "")));
          i += 1;
        }
        html += "<ul>" + items.map(function (item) { return "<li>" + item + "</li>"; }).join("") + "</ul>";
        continue;
      }

      if (/^\d+\. /.test(trim)) {
        var ordered = [];
        while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
          ordered.push(inline(lines[i].trim().replace(/^\d+\. /, "")));
          i += 1;
        }
        html += "<ol>" + ordered.map(function (item) { return "<li>" + item + "</li>"; }).join("") + "</ol>";
        continue;
      }

      if (isTableLine(line)) {
        var rows = [];
        while (i < lines.length && isTableLine(lines[i])) {
          rows.push(lines[i]);
          i += 1;
        }
        if (rows.length >= 2 && isSeparator(rows[1])) {
          var head = splitRow(rows[0]);
          var body = rows.slice(2).map(splitRow);
          html +=
            '<div class="table-wrap"><table><thead><tr>' +
            head.map(function (cell) { return "<th>" + inline(cell) + "</th>"; }).join("") +
            "</tr></thead><tbody>" +
            body.map(function (row) {
              return "<tr>" + row.map(function (cell) { return "<td>" + inline(cell) + "</td>"; }).join("") + "</tr>";
            }).join("") +
            "</tbody></table></div>";
        }
        continue;
      }

      var paragraph = [trim];
      i += 1;
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
        paragraph.push(lines[i].trim());
        i += 1;
      }
      var raw = paragraph.join(" ");
      var imageOnly = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(raw);
      if (imageOnly) {
        html +=
          '<figure class="figure"><img src="' +
          escapeHtml(safeHref(imageOnly[2])) +
          '" alt="' +
          escapeHtml(imageOnly[1]) +
          '" data-zoom="1">' +
          (imageOnly[3] ? "<figcaption>" + escapeHtml(imageOnly[3]) + "</figcaption>" : "") +
          "</figure>";
      } else {
        html += "<p>" + inline(raw) + "</p>";
      }
    }

    return { html: html, toc: toc };
  }

  function catName(categories, id) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id) return categories[i].name;
    }
    return id;
  }

  function renderPostList(posts, categories) {
    if (!posts.length) return "";
    return (
      '<div class="post-list">' +
      posts.map(function (post) {
        var tags = (post.tags || []).map(function (tag) {
          return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");
        return (
          '<article class="post-item"><a class="post-link" href="post.html?slug=' +
          encodeURIComponent(post.slug) +
          '"><h2>' +
          escapeHtml(post.title) +
          '</h2><p class="post-meta"><time datetime="' +
          escapeHtml(post.date) +
          '">' +
          escapeHtml(post.date) +
          '</time><span class="sep">·</span><span>' +
          escapeHtml(catName(categories, post.category)) +
          '</span></p><p class="excerpt">' +
          escapeHtml(post.excerpt) +
          '</p><p class="mini-tags">' +
          tags +
          "</p></a></article>"
        );
      }).join("") +
      "</div>"
    );
  }

  function pageWindow(current, total) {
    var pages = [];
    for (var i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - current) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== "…") pages.push("…");
    }
    return pages;
  }

  function renderPager(current, total, hrefFor) {
    if (total <= 1) return "";
    var prev = current === 1
      ? '<span class="page-nav is-disabled">上一页</span>'
      : '<a class="page-nav" href="' + hrefFor(current - 1) + '">上一页</a>';
    var next = current === total
      ? '<span class="page-nav is-disabled">下一页</span>'
      : '<a class="page-nav" href="' + hrefFor(current + 1) + '">下一页</a>';
    var nums = pageWindow(current, total).map(function (item) {
      if (item === "…") return '<span class="page-gap">…</span>';
      if (item === current) return '<span class="page-num is-current" aria-current="page">' + item + "</span>";
      return '<a class="page-num" href="' + hrefFor(item) + '">' + item + "</a>";
    }).join("");
    return '<nav class="pager" aria-label="分页">' + prev + '<span class="page-nums">' + nums + "</span>" + next + "</nav>";
  }

  function readingMinutes(markdown) {
    var stripped = String(markdown || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/::diagram.*$/gm, "")
      .replace(/[#>*|`\[\]!-]/g, "");
    var count = stripped.replace(/\s+/g, "").length;
    return Math.max(1, Math.round(count / 380));
  }

  function parsePage(params) {
    var page = parseInt(params.get("page") || "1", 10);
    if (!isFinite(page) || page < 1) return 1;
    return page;
  }

  function paginate(items, page, perPage) {
    var total = Math.max(1, Math.ceil(items.length / perPage) || 1);
    var current = Math.min(page, total);
    var start = (current - 1) * perPage;
    return {
      total: items.length ? total : 1,
      current: current,
      items: items.slice(start, start + perPage)
    };
  }

  function renderToc(toc) {
    if (!toc.length) return "";
    return toc.map(function (item) {
      return '<a class="level-' + item.level + '" href="#' + item.id + '">' + escapeHtml(item.text) + "</a>";
    }).join("");
  }

  function setTocActive(id) {
    var links = document.querySelectorAll(".toc a");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("is-active", links[i].getAttribute("href") === "#" + id);
    }
  }

  function spyHeadings() {
    if (!("IntersectionObserver" in window)) return;
    var heads = Array.prototype.slice.call(document.querySelectorAll(".article h2[id], .article h3[id]"));
    if (!heads.length) return;
    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setTocActive(visible[0].target.id);
    }, { rootMargin: "-72px 0px -55% 0px", threshold: [0, 1] });
    heads.forEach(function (head) { observer.observe(head); });
  }

  return {
    escapeHtml: escapeHtml,
    highlight: highlight,
    renderMarkdown: renderMarkdown,
    renderPostList: renderPostList,
    renderPager: renderPager,
    readingMinutes: readingMinutes,
    parsePage: parsePage,
    paginate: paginate,
    catName: catName,
    renderToc: renderToc,
    setTocActive: setTocActive,
    spyHeadings: spyHeadings
  };
});
