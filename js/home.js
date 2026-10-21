(function () {
  blogData.ensurePosts().then(function () {
  var posts = blogData.posts;
  var page = Blog.parsePage(new URLSearchParams(location.search));
  var view = Blog.paginate(posts, page, blogData.pageSize);
  var author = blogData.author;
  var chips = blogData.categories.map(function (category) {
    return '<a href="categories.html?c=' + encodeURIComponent(category.id) + '">' + Blog.escapeHtml(category.name) + "</a>";
  }).join("");
  var tags = author.identity.map(function (item) {
    return "<li>" + Blog.escapeHtml(item) + "</li>";
  }).join("");
  var list = posts.length
    ? Blog.renderPostList(view.items, blogData.categories)
    : '<div class="empty"><p>还没有发布文章</p></div>';

  document.getElementById("main").innerHTML =
    '<header class="identity">' +
      '<p class="kicker">mingcan.ai</p>' +
      "<h1>明灿·技术·随想</h1>" +
      '<p class="lede">' + Blog.escapeHtml(author.tagline) + "</p>" +
      '<ul class="identity-tags">' + tags + "</ul>" +
    "</header>" +
    '<nav class="cat-chips" aria-label="分类">' + chips + "</nav>" +
    list +
    Blog.renderPager(view.current, view.total, function (n) {
      return n === 1 ? "index.html" : "index.html?page=" + n;
    }) +
    '<aside class="author-teaser">' +
      '<p class="kicker">关于我</p>' +
      "<p>" + Blog.escapeHtml(author.teaser) + "</p>" +
      '<a class="text-link" href="about.html">查看关于我</a>' +
    "</aside>";
  }).catch(function () {
    document.getElementById("main").innerHTML = '<div class="empty"><p>文章没有加载成功。</p></div>';
  });
})();
