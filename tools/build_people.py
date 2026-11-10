#!/usr/bin/env python3
"""Render the bilingual directory from its curated, public JSON source.

Run from anywhere: python tools/build_people.py
Only people/people.json is an input. Keep private research outside this repository.
"""
from datetime import date, timedelta
from html import escape
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {
    "AI": ("ai", "AI"), "生物科技": ("biotech", "Biotech"),
    "商业": ("business", "Business"), "人生": ("life", "Life"),
    "投资": ("investing", "Investing"), "投资人": ("investing", "Investing"),
}
KINDS = {
    "interview": ("访谈", "Interview"), "podcast": ("播客", "Podcast"),
    "article": ("文章", "Article"), "talk": ("演讲", "Talk"),
    "archive": ("资料入口", "Archive"), "video": ("视频", "Video"),
}


def e(value):
    return escape(str(value), quote=True)


def link(url, label):
    parsed = urlsplit(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError(f"Expected an HTTPS source: {url}")
    return f'<a href="{e(url)}" rel="noopener noreferrer">{e(label)}</a>'


def person_html(person, language, order, checked):
    zh = language == "zh"
    name = person["name"] if zh else person["name_en"]
    alternate = person["name_en"] if zh else person["name"]
    alt = f'<span class="person-name-alt">{e(alternate)}</span>' if alternate != name else ""
    cats = list(dict.fromkeys(CATEGORIES[c][0] for c in person["categories"]))
    labels = " · ".join(c if zh else CATEGORIES[c][1] for c in person["categories"])
    updates = sorted(person["updates"], key=lambda item: item.get("date", ""), reverse=True)
    dated = [u for u in updates if u.get("date") and u["kind"] != "archive"]
    latest = dated[0]["date"] if dated else ""
    recent = bool(latest and date.fromisoformat(latest) >= date.fromisoformat(checked) - timedelta(days=92))
    search = " ".join([person["name"], person["name_en"], *person.get("aliases", []),
                       *person["categories"], person["current_zh"], person["current_en"],
                       person["bio_zh"], person["bio_en"], *person["ideas_zh"], *person["ideas_en"]])
    latest_copy = (f'收录内容 · {latest}' if zh else f'Selected work · {latest}') if latest else ("本人主页与资料入口" if zh else "Official profiles & archives")
    history = "".join(f'<li>{e(x)}</li>' for x in person[f"history_{language}"])
    ideas = "".join(f'<li>{e(x)}</li>' for x in person[f"ideas_{language}"])
    links = "".join(link(item["url"], item.get("label_en", item["label"]) if not zh else item["label"]) for item in person["links"])
    update_rows = []
    for item in updates:
        title = item.get("title_en") or item["title"] if not zh else item["title"]
        kind = KINDS.get(item["kind"], ("资料", "Resource"))[0 if zh else 1]
        undated = ("持续更新 / 存档" if zh else "Ongoing / archive") if item["kind"] == "archive" else ("日期未确认" if zh else "Date unconfirmed")
        when = f'<time datetime="{e(item["date"])}">{e(item["date"])}</time>' if item.get("date") else f'<span>{undated}</span>'
        note = item.get(f"note_{language}", "")
        video = f'<p>{link(item["video_url"], "观看视频" if zh else "Watch video")}</p>' if item.get("video_url") and item["video_url"] != item["url"] else ""
        update_rows.append(f'<li class="person-update"><div class="person-update-meta">{when}<span>{e(kind)}</span></div><div>{link(item["url"], title)}<p>{e(note)}</p>{video}</div></li>')
    update_section = f'<section class="person-updates"><h3>{"近期与代表资料" if zh else "Recent & selected work"}</h3><ul>{"".join(update_rows)}</ul></section>' if update_rows else ''
    sources = "".join(link(item["url"], item.get("title_en", item["title"]) if not zh else item["title"]) for item in person["sources"])
    return f'''<details class="person" id="{e(person['id'])}" data-order="{order}" data-categories="{' '.join(cats)}" data-latest="{e(latest)}" data-recent="{str(recent).lower()}" data-search="{e(search)}">
  <summary><div><h2 class="person-name">{e(name)}{alt}</h2><span class="person-category">{e(labels)}</span></div><div class="person-summary-copy"><span class="person-current">{e(person[f'current_{language}'])}</span><span class="person-latest">{e(latest_copy)}</span></div></summary>
  <div class="person-body">
    <p class="person-bio">{e(person[f'bio_{language}'])}</p>
    <div class="person-columns"><section><h3>{'经历与贡献' if zh else 'Background & contributions'}</h3><ul>{history}</ul></section><section><h3>{'值得思考的问题' if zh else 'Questions worth exploring'}</h3><ul>{ideas}</ul></section></div>
    <div class="person-links">{links}</div>
    {update_section}
    <div class="person-sources"><span>{'资料来源' if zh else 'Sources'}</span>{sources}<a href="#{e(person['id'])}">{'此人链接' if zh else 'Link to this person'}</a></div>
  </div>
</details>'''


def render(data, language):
    zh = language == "zh"
    title = "我关注的人" if zh else "People I learn from"
    owner = "宁辉" if zh else "Hui Ning"
    description = "从研究者、创造者与投资人的一手表达中，理解 AI、生命科学、商业和人生。" if zh else "Learning about AI, life sciences, business and life through researchers, builders and investors in their own words."
    assets = "../../assets/" if zh else "../assets/"
    canonical = "https://alexbiotech.github.io/" + ("zh/" if zh else "") + "people/"
    nav_items = [("principles", "悟道" if zh else "Principles"), ("ai", "AI"), ("biotechnology", "生物科技" if zh else "Biotech"), ("blog", "博客" if zh else "Blog"), ("people", "人物" if zh else "People"), ("about", "关于" if zh else "About")]
    nav = "".join(f'<a href="{"./" if slug == "people" else "../" + slug + "/"}" class="domain-nav"{" aria-current=" + chr(34) + "page" + chr(34) if slug == "people" else ""}>{label}</a>' for slug, label in nav_items)
    switch = '<a class="language-switch" href="../../people/" lang="en-US" hreflang="en-US" aria-label="Switch to English">English</a>' if zh else '<a class="language-switch" href="../zh/people/" lang="zh-CN" hreflang="zh-CN" aria-label="切换到中文">中文</a>'
    categories = [("all", "全部" if zh else "All"), ("ai", "AI"), ("biotech", "生物科技" if zh else "Biotech"), ("business", "商业" if zh else "Business"), ("life", "人生" if zh else "Life"), ("investing", "投资人" if zh else "Investing")]
    buttons = "".join(f'<button type="button" data-category-filter="{key}" aria-pressed="{str(key == "all").lower()}">{label}</button>' for key, label in categories)
    profiles = "\n".join(person_html(p, language, i, data["updated"]) for i, p in enumerate(data["people"]))
    count = len(data["people"])
    intro = "我想理解技术如何改变世界，也想理解人如何思考、创造和生活。这里收集我愿意持续阅读的人，以及他们亲自表达的观点。" if zh else "I want to understand how technology changes the world, and how people think, build and live. These are people whose work I want to follow, with links to their ideas in their own words."
    context = "AI 是当前最关注的方向，也延伸到生命科学、商业、人生与投资。点击姓名，查看经历、思考线索和原始资料。" if zh else "AI is my main focus, alongside life sciences, business, life and investing. Open a name for background, questions and original sources."
    freshness = "内容日期标在每条资料旁；持续更新的主页与历史资料会单独标注。" if zh else "Dated work appears with its publication date. Ongoing pages and archives are labeled separately."
    return f'''<!doctype html>
<html lang="{'zh-CN' if zh else 'en-US'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#fafafa">
  <title>{title} · {owner}</title>
  <meta name="description" content="{e(description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Hui Ning">
  <meta property="og:title" content="{title} · {owner}">
  <meta property="og:description" content="{e(description)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:locale" content="{'zh_CN' if zh else 'en_US'}">
  <link rel="canonical" href="{canonical}">
  <link rel="alternate" hreflang="en-US" href="https://alexbiotech.github.io/people/">
  <link rel="alternate" hreflang="zh-CN" href="https://alexbiotech.github.io/zh/people/">
  <link rel="alternate" hreflang="x-default" href="https://alexbiotech.github.io/people/">
  <link rel="icon" href="{assets}favicon.svg" type="image/svg+xml">
  <link rel="preload" href="{assets}manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{assets}site.css?v=6">
  <link rel="stylesheet" href="{assets}people.css?v=1">
  <script src="{assets}interactions.js?v=2" defer></script>
  <script src="{assets}people.js?v=1" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">{'跳到正文' if zh else 'Skip to content'}</a>
  <div class="site-shell">
    <header class="masthead">
      <a href="../" class="identity">{owner}</a>
      <nav aria-label="{'栏目与语言' if zh else 'Sections and language'}">{nav}{switch}</nav>
    </header>
    <main id="main" tabindex="-1" class="reading people-page">
      <a href="../" class="back"><span class="link-mark">{'首页' if zh else 'Home'}</span></a>
      <div class="reading-layout reading-layout-wide">
        <h1>{title}</h1>
        <div class="people-intro"><p class="lead">{intro}</p><div class="people-context"><p>{context}</p><p>{'资料核对于' if zh else 'Last reviewed'} <time datetime="{data['updated']}">{data['updated']}</time> · {count} {'位人物' if zh else 'people'}</p></div></div>
      </div>
      <form class="people-toolbar" role="search" aria-label="{'筛选人物' if zh else 'Find people'}" hidden>
        <div class="people-controls">
          <div class="people-field"><label for="people-search">{'搜索姓名、机构或话题' if zh else 'Search names, organizations or topics'}</label><input id="people-search" type="search" autocomplete="off" placeholder="{'例如：智能体、基因编辑、决策' if zh else 'Try: agents, gene editing, decisions'}"></div>
          <div class="people-field"><label for="people-sort">{'排序' if zh else 'Sort by'}</label><select id="people-sort"><option value="default">{'领域顺序 · AI 优先' if zh else 'By field · AI first'}</option><option value="recent">{'收录内容日期' if zh else 'Date of selected work'}</option></select></div>
        </div>
        <div class="people-categories" role="group" aria-label="{'关注领域' if zh else 'Fields of interest'}">{buttons}</div>
        <label class="people-recent"><input type="checkbox" id="people-recent">{'仅看本次整理日前约三个月内有收录内容的人' if zh else 'Only people with selected work in the three months before this review'}</label>
      </form>
      <noscript><p class="people-nojs">{'可直接展开下方人物阅读；开启 JavaScript 后可搜索和筛选。' if zh else 'Open any person below to read. Enable JavaScript to search and filter.'}</p></noscript>
      <div class="people-results"><p id="people-count" role="status" aria-live="polite">{'显示' if zh else 'Showing'} {count} / {count} {'位' if zh else 'people'}</p><p>{'点击姓名展开' if zh else 'Open a name to read more'}</p></div>
      <div class="people-list">{profiles}</div>
      <div class="people-empty" hidden><p>{'没有匹配的人物。可以换个词，或清除筛选。' if zh else 'No matching people. Try another term or clear the filters.'}</p><button type="button" class="people-reset" data-reset-people>{'清除筛选' if zh else 'Clear filters'}</button></div>
      <p class="people-note">{freshness} {'这里记录的是学习兴趣与阅读线索，不代表赞同某个人的全部观点。' if zh else 'This is a collection of learning interests and reading leads, not an endorsement of every view a person holds.'}</p>
    </main>
    <footer><a href="mailto:nh21@tsinghua.org.cn">nh21@tsinghua.org.cn</a><nav aria-label="{'公开学术主页' if zh else 'Academic profiles'}"><a href="../about/">{'关于' if zh else 'About'}</a><a href="https://scholar.google.com/citations?user=Jzg5EIkAAAAJ" lang="en">Google Scholar</a><a href="https://orcid.org/0000-0002-6909-4282" lang="en">ORCID</a></nav></footer>
  </div>
  <div class="pointer-halo" aria-hidden="true"></div>
</body>
</html>
'''


def main():
    data = json.loads((ROOT / "people/people.json").read_text())
    date.fromisoformat(data["updated"])
    seen = set()
    for person in data["people"]:
        if person["id"] in seen:
            raise ValueError(f"Duplicate person: {person['id']}")
        seen.add(person["id"])
        if not person["sources"] or not person["links"]:
            raise ValueError(f"Missing sources or links: {person['id']}")
        for item in person["updates"]:
            if item.get("date") and date.fromisoformat(item["date"]) > date.fromisoformat(data["updated"]):
                raise ValueError(f"Future-dated item: {person['id']}")
    for language, target in [("en", "people/index.html"), ("zh", "zh/people/index.html")]:
        output = ROOT / target
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(render(data, language), encoding="utf-8")
    print(f"Rendered {len(data['people'])} profiles in two languages.")


if __name__ == "__main__":
    main()
