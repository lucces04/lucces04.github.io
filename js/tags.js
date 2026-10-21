(function () {
  blogData.ensurePosts().then(function () {
  var params = new URLSearchParams(location.search);
  var current = params.get("t");
  var counts = Object.create(null);
  blogData.posts.forEach(function (post) {
    (post.tags || []).forEach(function (tag) {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  var tags = Object.keys(counts).map(function (name) {
    return { name: name, count: counts[name] };
  }).sort(function (a, b) {
    if (a.count !== b.count) return b.count - a.count;
    return a.name < b.name ? -1 : 1;
  });

  function cloud() {
    if (!tags.length) return "";
    return '<div class="tag-cloud">' + tags.map(function (tag) {
      var size = Math.min(18, 13 + tag.count);
      var active = current === tag.name ? " is-active" : "";
      return (
        '<a class="' + active.trim() + '" style="font-size:' + size + 'px" href="tags.html?t=' +
        encodeURIComponent(tag.name) + '">' + Blog.escapeHtml(tag.name) +
        '<span class="tag-count">' + tag.count + "</span></a>"
      );
    }).join("") + "</div>";
  }

  var html = "";
  if (!current) {
    html =
      '<p class="kicker">标签</p><h1 class="page-title">标签</h1>' +
      '<p class="lede">按语言、工具或方法找跨分类的文章。</p>' +
      (tags.length ? cloud() : '<div class="empty"><p>还没有标签。</p></div>');
  } else if (!counts[current]) {
    document.title = "标签不存在 — 明灿·技术·随想";
    html =
      '<p class="kicker">标签</p><h1 class="page-title">没有这个标签</h1>' +
      '<div class="empty"><p>没有带「' + Blog.escapeHtml(current) + '」的文章。</p><p><a href="tags.html">返回全部标签</a></p></div>' +
      cloud();
  } else {
    document.title = current + " — 明灿·技术·随想";
    var matched = blogData.posts.filter(function (post) {
      return (post.tags || []).indexOf(current) !== -1;
    });
    var view = Blog.paginate(matched, Blog.parsePage(params), blogData.pageSize);
    html =
      '<p class="kicker">标签</p><h1 class="page-title">' + Blog.escapeHtml(current) + "</h1>" +
      '<p class="filter-bar"><span class="muted">' + matched.length + ' 篇</span><a href="tags.html">清除筛选</a></p>' +
      cloud() +
      '<div class="section-gap">' +
      Blog.renderPostList(view.items, blogData.categories) +
      Blog.renderPager(view.current, view.total, function (n) {
        var href = "tags.html?t=" + encodeURIComponent(current);
        return n === 1 ? href : href + "&page=" + n;
      }) +
      "</div>";
  }

  document.getElementById("main").innerHTML = html;
  }).catch(function () {
    document.getElementById("main").innerHTML = '<div class="empty"><p>文章没有加载成功。</p></div>';
  });
})();
