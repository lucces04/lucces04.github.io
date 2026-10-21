(function () {
  var params = new URLSearchParams(location.search);
  var slug = params.get("slug");
  var main = document.getElementById("main");

  function showMissing() {
    document.title = "文章不存在 — 明灿·技术·随想";
    main.innerHTML =
      '<div class="wrap"><p class="kicker">404</p><h1 class="page-title">文章不存在</h1>' +
      '<div class="empty"><p>没有找到这篇文章。链接可能写错了，或者文章已经撤下。</p>' +
      '<p><a href="index.html">返回首页</a></p></div></div>';
  }

  function showPager(post) {
    var pager = document.querySelector(".post-pager");
    if (!pager) return;
    blogData.ensurePosts().then(function (posts) {
      var index = -1;
      for (var i = 0; i < posts.length; i++) {
        if (posts[i].slug === post.slug) index = i;
      }
      if (index === -1) return;
      var newer = index > 0 ? posts[index - 1] : null;
      var older = index < posts.length - 1 ? posts[index + 1] : null;
      var html = "";
      if (newer) {
        html +=
          '<a class="prev" href="post.html?slug=' + encodeURIComponent(newer.slug) + '"><span class="dir">← 上一篇</span><span class="ttl">' +
          Blog.escapeHtml(newer.title) + "</span></a>";
      }
      if (older) {
        html +=
          '<a class="next" href="post.html?slug=' + encodeURIComponent(older.slug) + '"><span class="dir">下一篇 →</span><span class="ttl">' +
          Blog.escapeHtml(older.title) + "</span></a>";
      }
      pager.innerHTML = html;
    });
  }

  if (!slug) {
    showMissing();
    return;
  }

  blogData.loadArticle(slug).then(function (post) {
    var rendered = Blog.renderMarkdown(post.content);
    var minutes = Blog.readingMinutes(post.content);
    var category = Blog.catName(blogData.categories, post.category);
    document.title = post.title + " — 明灿·技术·随想";
    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", post.excerpt);

    var meta =
      '<time datetime="' + Blog.escapeHtml(post.date) + '">' + Blog.escapeHtml(post.date) + "</time>";
    if (post.updated && post.updated !== post.date) {
      meta += '<span class="sep">·</span><span>更新于 <time datetime="' + Blog.escapeHtml(post.updated) + '">' + Blog.escapeHtml(post.updated) + "</time></span>";
    }
    meta +=
      '<span class="sep">·</span><a href="categories.html?c=' + encodeURIComponent(post.category) + '">' +
      Blog.escapeHtml(category) + "</a>" +
      '<span class="sep">·</span><span>约 ' + minutes + " 分钟</span>";

    var tags = (post.tags || []).map(function (tag) {
      return '<a href="tags.html?t=' + encodeURIComponent(tag) + '">' + Blog.escapeHtml(tag) + "</a>";
    }).join("");

    var toc = Blog.renderToc(rendered.toc);
    var tocMobile = toc
      ? '<details class="toc-mobile"><summary>目录</summary><nav class="toc" aria-label="目录">' + toc + "</nav></details>"
      : "";
    var tocDesktop = toc
      ? '<aside class="toc-desktop"><nav class="toc" aria-label="目录"><p class="toc-title">目录</p>' + toc + "</nav></aside>"
      : "";

    main.innerHTML =
      '<div class="post-layout"><article>' +
        '<header class="post-header"><h1>' + Blog.escapeHtml(post.title) + "</h1>" +
        '<p class="post-meta">' + meta + "</p>" +
        (tags ? '<div class="post-tags">' + tags + "</div>" : "") +
        tocMobile +
        "</header>" +
        '<div class="article">' + rendered.html + "</div>" +
        (tags ? '<div class="end-tags"><p class="end-label">标签</p><div class="post-tags">' + tags + "</div></div>" : "") +
        '<p class="copyright">本文为原创。转载请注明作者明灿与本文链接，并保留原文意思。</p>' +
        '<nav class="post-pager" aria-label="相邻文章"></nav>' +
        '<a class="back-link" href="index.html">返回文章列表</a>' +
      "</article>" + tocDesktop + "</div>";

    Blog.spyHeadings();
    if (location.hash) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
    showPager(post);
  }).catch(function (error) {
    if (error && error.missing) {
      showMissing();
      return;
    }
    document.title = "文章没有加载成功 — 明灿·技术·随想";
    main.innerHTML =
      '<div class="wrap"><p class="kicker">404</p><h1 class="page-title">文章没有加载成功</h1>' +
      '<p><a href="index.html">返回首页</a></p></div>';
  });
})();
