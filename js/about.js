(function () {
  var author = blogData.author;
  var skills = author.skills.map(function (group) {
    var items = group.items.map(function (item) {
      return "<li>" + Blog.escapeHtml(item) + "</li>";
    }).join("");
    return '<section class="skill-group"><h3>' + Blog.escapeHtml(group.name) + "</h3><ul>" + items + "</ul></section>";
  }).join("");
  var timeline = author.timeline.map(function (item) {
    return (
      "<li><p class=\"time\">" + Blog.escapeHtml(item.time) + "</p><h3>" +
      Blog.escapeHtml(item.role) + "</h3><p>" + Blog.escapeHtml(item.desc) + "</p></li>"
    );
  }).join("");
  var projects = author.projects.map(function (project) {
    var external = /^https?:\/\//i.test(project.href);
    var tags = project.tags.map(function (tag) { return Blog.escapeHtml(tag); }).join(" · ");
    return (
      '<article class="project-card"><h3><a href="' + Blog.escapeHtml(project.href) + '"' +
      (external ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" +
      Blog.escapeHtml(project.name) + "</a></h3><p>" + Blog.escapeHtml(project.desc) +
      '</p><p class="mini-tags">' + tags + "</p></article>"
    );
  }).join("");

  document.getElementById("main").innerHTML =
    '<header class="about-head">' +
      '<div class="avatar" aria-hidden="true">明</div>' +
      "<div><p class=\"kicker\">关于我</p><h1>" + Blog.escapeHtml(author.name) + "</h1>" +
      '<p class="role">' + Blog.escapeHtml(author.role) + "</p>" +
      "<p>" + Blog.escapeHtml(author.bio) + "</p></div>" +
    "</header>" +
    '<section class="about-section"><h2>技能栈</h2><div class="skill-grid">' + skills + "</div></section>" +
    '<section class="about-section"><h2>经历</h2><ol class="timeline">' + timeline + "</ol></section>" +
    '<section class="about-section"><h2>开源项目与作品</h2><div class="project-grid">' + projects + "</div></section>" +
    '<section class="about-section"><h2>联系方式</h2><ul class="contact-list">' +
      '<li><a href="mailto:' + Blog.escapeHtml(author.email) + '">' + Blog.escapeHtml(author.email) + "</a></li>" +
      '<li><a href="' + Blog.escapeHtml(author.github) + '" target="_blank" rel="noopener noreferrer">GitHub</a></li>' +
    "</ul></section>" +
    '<section class="about-section"><h2>关于本站</h2><p>' + Blog.escapeHtml(author.principles) + "</p></section>";
})();
