(function () {
  blogData.ensurePosts().then(function () {
  var params = new URLSearchParams(location.search);
  var currentId = params.get("c");
  var current = null;
  if (currentId) {
    for (var i = 0; i < blogData.categories.length; i++) {
      if (blogData.categories[i].id === currentId) current = blogData.categories[i];
    }
  }

  var counts = Object.create(null);
  blogData.posts.forEach(function (post) {
    counts[post.category] = (counts[post.category] || 0) + 1;
  });

  var grid = '<div class="cat-grid">' + blogData.categories.map(function (category) {
    var active = current && current.id === category.id ? " is-active" : "";
    return (
      '<a class="cat-card' + active + '" href="categories.html?c=' + encodeURIComponent(category.id) + '">' +
      "<h2>" + Blog.escapeHtml(category.name) + "</h2>" +
      "<p>" + Blog.escapeHtml(category.desc) + "</p>" +
      '<span class="cat-count">' + (counts[category.id] || 0) + " 篇</span></a>"
    );
  }).join("") + "</div>";

  var html = "";
  if (!currentId) {
    html =
      '<p class="kicker">分类</p><h1 class="page-title">分类</h1>' +
      '<p class="lede">按主题进入一个分类，顺着文章连续往下读。</p>' +
      grid;
  } else if (!current) {
    document.title = "分类不存在 — 明灿·技术·随想";
    html =
      '<p class="kicker">分类</p><h1 class="page-title">没有这个分类</h1>' +
      '<div class="empty"><p>这个分类不存在，或链接里的名称已经改过。</p><p><a href="categories.html">查看全部分类</a></p></div>';
  } else {
    document.title = current.name + " — 明灿·技术·随想";
    var matched = blogData.posts.filter(function (post) { return post.category === current.id; });
    var view = Blog.paginate(matched, Blog.parsePage(params), blogData.pageSize);
    var list = matched.length
      ? Blog.renderPostList(view.items, blogData.categories) + Blog.renderPager(view.current, view.total, function (n) {
          var href = "categories.html?c=" + encodeURIComponent(current.id);
          return n === 1 ? href : href + "&page=" + n;
        })
      : '<div class="empty"><p>这个分类下还没有文章。</p><p><a href="categories.html">查看全部分类</a></p></div>';
    html =
      '<p class="kicker">分类</p><h1 class="page-title">' + Blog.escapeHtml(current.name) + "</h1>" +
      '<p class="lede">' + Blog.escapeHtml(current.desc) + "</p>" +
      '<p class="filter-bar"><a href="categories.html">查看全部分类</a></p>' +
      grid +
      '<div class="section-gap">' + list + "</div>";
  }

  document.getElementById("main").innerHTML = html;
  }).catch(function () {
    document.getElementById("main").innerHTML = '<div class="empty"><p>文章没有加载成功。</p></div>';
  });
})();
