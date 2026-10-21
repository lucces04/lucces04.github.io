(function () {
  blogData.ensurePosts().then(function () {
  var posts = blogData.posts;
  var main = document.getElementById("main");
  if (!posts.length) {
    main.innerHTML =
      '<p class="kicker">归档</p><h1 class="page-title">归档</h1>' +
      '<div class="empty"><p>还没有发布文章</p></div>';
    return;
  }

  var earliest = posts[posts.length - 1].date;
  var years = [];
  var yearMap = Object.create(null);
  posts.forEach(function (post) {
    var parts = post.date.split("-");
    var year = parts[0];
    var month = parts[1];
    if (!yearMap[year]) {
      yearMap[year] = { year: year, months: [], monthMap: Object.create(null) };
      years.push(yearMap[year]);
    }
    if (!yearMap[year].monthMap[month]) {
      yearMap[year].monthMap[month] = { month: month, posts: [] };
      yearMap[year].months.push(yearMap[year].monthMap[month]);
    }
    yearMap[year].monthMap[month].posts.push(post);
  });

  var yearNav = years.map(function (group) {
    return '<a href="#y' + group.year + '">' + group.year + "</a>";
  }).join("");

  var body = years.map(function (group) {
    var months = group.months.map(function (month) {
      var items = month.posts.map(function (post) {
        return (
          '<li class="archive-item"><time datetime="' + Blog.escapeHtml(post.date) + '">' +
          Blog.escapeHtml(post.date.slice(5)) + "</time><a href=\"post.html?slug=" +
          encodeURIComponent(post.slug) + '">' + Blog.escapeHtml(post.title) +
          '</a><span class="archive-cat">' + Blog.escapeHtml(Blog.catName(blogData.categories, post.category)) + "</span></li>"
        );
      }).join("");
      return '<h3 class="month-label">' + String(Number(month.month)) + ' 月</h3><ul class="archive-list">' + items + "</ul>";
    }).join("");
    return '<section class="year-block" id="y' + group.year + '"><h2>' + group.year + "</h2>" + months + "</section>";
  }).join("");

  main.innerHTML =
    '<p class="kicker">归档</p>' +
    '<h1 class="page-title">归档</h1>' +
    '<p class="stats">共 ' + posts.length + " 篇文章 · " + blogData.categories.length + " 个分类 · 最早发布于 " + earliest + "</p>" +
    '<nav class="year-nav" aria-label="年份">' + yearNav + "</nav>" +
    body;
  }).catch(function () {
    document.getElementById("main").innerHTML = '<div class="empty"><p>文章没有加载成功。</p></div>';
  });
})();
