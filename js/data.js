/* 分类、作者信息在这里。文章正文在 article/*.txt。
   列表页通过 ensurePosts 读取全部文章。进入某一篇时，loadArticle 只读取 article 里对应的那一个文件。
   每篇文章开头逐行写 slug、title、date、category、tags、excerpt，有更新时间时再写 updated。
   tags 用逗号分隔。单独一行 --- 之后是正文。
   新增文章：把 txt 放进 article，并把它的路径加进 articleFiles。 */
(function (factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.blogData = api;
})(function () {
  var articleFiles = [
    "article/config-boundary.txt",
    "article/go-errors.txt",
    "article/pg-indexes.txt",
    "article/split-services.txt",
    "article/dist-notes.txt",
    "article/http-cache.txt",
    "article/small-cli.txt",
    "article/actionable-logs.txt",
    "article/tidy-desk.txt",
    "article/letter-next-year.txt",
    "article/read-by-boundary.txt"
  ];

  var categories = [
    { id: "notes", name: "技术笔记", desc: "实现细节、排错过程和可以复用的写法。" },
    { id: "architecture", name: "架构设计", desc: "边界、取舍，以及系统怎么拆才站得住。" },
    { id: "learning", name: "学习记录", desc: "读完材料和做过练习之后留下的结构。" },
    { id: "oss", name: "开源项目", desc: "自己做过的小工具，以及范围为什么停在这里。" },
    { id: "life", name: "生活随笔", desc: "工作台之外，和写作、习惯有关的零星记录。" }
  ];

  var author = {
    name: "明灿",
    role: "后端工程师",
    tagline: "记录技术、架构与思考的个人博客",
    identity: ["后端工程师", "关注可维护性", "长期记录"],
    teaser: "明灿，做后端开发。这里存放技术笔记、架构取舍和学习过程里值得留下的部分。",
    bio: "我是明灿，做后端开发，平时写服务接口、数据模型和发布相关的代码。我关心边界清不清楚、一年后还能否读懂，以及一次故障里日志能不能把事情串起来。这个站点用来存放这些笔记，也存放少量和工作台有关的随笔。",
    email: "hello@mingcan.ai",
    github: "https://github.com/mingcan",
    skills: [
      { name: "后端", items: ["Go", "Python", "HTTP API"] },
      { name: "架构", items: ["服务边界", "配置管理", "可观测性"] },
      { name: "数据库", items: ["PostgreSQL", "索引", "事务"] },
      { name: "前端", items: ["HTML", "CSS", "少量 JavaScript"] },
      { name: "运维", items: ["Linux", "Docker", "日志与部署"] }
    ],
    timeline: [
      { time: "2024 — 至今", role: "个人技术博客", desc: "把做过的取舍、读过的材料和排错过程写成可以复查的笔记。" },
      { time: "2021 — 至今", role: "后端开发", desc: "参与业务接口、数据模型和发布流程，注意力放在边界和可维护性上。" },
      { time: "2018 — 2021", role: "补系统基础", desc: "集中练习 HTTP、关系数据库、Linux，以及一门主力后端语言。" }
    ],
    projects: [
      { name: "configload", desc: "把环境变量和默认值收成一个已经校验过的配置入口。", tags: ["Go", "配置"], href: "post.html?slug=config-boundary" },
      { name: "reqlog", desc: "给 HTTP 服务补上带请求编号、能按一次访问过滤的日志。", tags: ["Go", "日志"], href: "post.html?slug=actionable-logs" },
      { name: "blogkit", desc: "只做三件事的命令行：新建草稿、检查内部链接、生成静态页。", tags: ["命令行"], href: "post.html?slug=small-cli" }
    ],
    principles: "本站把版面让给正文。文章以原创笔记为主，代码和结论尽量写到可以对照。分类、标签和归档用来接上相关的下一篇。不放弹窗，也不把更新频率写成成绩。"
  };

  function parseArticle(text) {
    var source = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    var marker = "\n---\n";
    var splitAt = source.indexOf(marker);
    if (splitAt === -1) {
      throw new Error("文章缺少正文分隔行 ---");
    }
    var fields = {};
    source.slice(0, splitAt).split("\n").forEach(function (line) {
      if (!line.trim()) return;
      var index = line.indexOf(":");
      if (index === -1) return;
      fields[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    });
    ["slug", "title", "date", "category", "tags", "excerpt"].forEach(function (key) {
      if (!fields[key]) throw new Error("文章缺少字段 " + key);
    });
    var article = {
      slug: fields.slug,
      title: fields.title,
      date: fields.date,
      category: fields.category,
      tags: fields.tags.split(",").map(function (tag) { return tag.trim(); }).filter(Boolean),
      excerpt: fields.excerpt,
      content: source.slice(splitAt + marker.length).replace(/\n$/, "")
    };
    if (fields.updated) article.updated = fields.updated;
    return article;
  }

  function sortPosts(posts) {
    return posts.slice().sort(function (a, b) {
      if (a.date === b.date) return a.slug < b.slug ? -1 : 1;
      return a.date < b.date ? 1 : -1;
    });
  }

  function missingError(file) {
    var error = new Error("无法读取文章：" + file);
    error.missing = true;
    return error;
  }

  var textCache = Object.create(null);

  function readText(file) {
    if (textCache[file]) return textCache[file];
    var pending;
    if (typeof window === "undefined") {
      var fs = require("fs");
      var path = require("path");
      var full = path.join(__dirname, "..", file);
      pending = fs.existsSync(full)
        ? Promise.resolve(fs.readFileSync(full, "utf8"))
        : Promise.reject(missingError(file));
    } else {
      pending = fetch(file).then(function (response) {
        if (response.status === 404) throw missingError(file);
        if (!response.ok) throw new Error("无法读取文章：" + file);
        return response.text();
      });
    }
    textCache[file] = pending.catch(function (error) {
      delete textCache[file];
      throw error;
    });
    return textCache[file];
  }

  function articleFile(slug) {
    if (!/^[a-z0-9-]+$/.test(slug || "")) return "";
    return "article/" + slug + ".txt";
  }

  var api = {
    categories: categories,
    author: author,
    posts: [],
    pageSize: 5,
    ready: null
  };

  api.loadArticle = function (slug) {
    var file = articleFile(slug);
    if (!file) return Promise.reject(missingError(slug || ""));
    return readText(file).then(parseArticle);
  };

  api.ensurePosts = function () {
    if (!api.ready) {
      api.ready = Promise.all(articleFiles.map(function (file) {
        return readText(file).then(parseArticle);
      })).then(function (posts) {
        api.posts = sortPosts(posts);
        return api.posts;
      });
    }
    return api.ready;
  };

  return api;
});
