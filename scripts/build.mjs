import { readFile, readdir, mkdir, writeFile, rm, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';

export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;

export async function build(root = process.cwd()) {
  const config = await readJSON(join(root, 'site.json'));
  const output = join(root, 'dist');
  const posts = [];
  const slugs = new Set();
  for (const file of await readdir(join(root, 'content/posts'))) {
    if (!file.endsWith('.md')) continue;
    const source = await readFile(join(root, 'content/posts', file), 'utf8');
    // JSON front matter keeps the toolchain small: no YAML parser or framework.
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) throw new Error(`${file}: JSON front matter required`);
    const meta = JSON.parse(match[1]);
    if (meta.status !== 'published') continue;
    if (!meta.approval || meta.approval.by !== 'cybdream' || !validDate(meta.approval.date)) throw new Error(`${file}: explicit owner approval required`);
    if (!meta.title || !meta.description || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug) || !validDate(meta.date)) throw new Error(`${file}: invalid title, description, slug or date`);
    if (!Array.isArray(meta.categories) || !meta.categories.length || meta.categories.some(c => !config.categories.some(category => category.slug === c))) throw new Error(`${file}: invalid categories`);
    if (slugs.has(meta.slug)) throw new Error(`${file}: duplicate slug`);
    slugs.add(meta.slug);
    posts.push({...meta, html: marked.parse(match[2])});
  }
  posts.sort((a,b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  // Only generated pages and explicitly selected CSS enter the deployment artifact.
  await rm(output, {recursive:true, force:true});
  await mkdir(join(output, 'assets'), {recursive:true});
  await copyFile(join(root, 'assets/style.css'), join(output, 'assets/style.css'));
  const nav = config.categories.map(c => `<a href="/categories/${c.slug}/">${escape(c.name)}</a>`).join('');
  const page = (title, body, path, description = config.description) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · ${escape(config.title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(config.url + path)}"><link rel="stylesheet" href="/assets/style.css"></head>
<body><a class="skip" href="#main">본문으로 이동</a><header><a class="brand" href="/">${escape(config.title)}</a><nav aria-label="카테고리">${nav}<a href="/about/">소개</a></nav></header><main id="main">${body}</main><footer>cybdream · 프로젝트와 배움의 기록 <a href="https://github.com/cybdream">GitHub</a></footer></body></html>`;
  const write = async (path, html) => { await mkdir(resolve(output, path, '..'), {recursive:true}); await writeFile(join(output, path), html); };
  const listing = items => items.length ? `<ul class="posts">${items.map(p=>`<li><time datetime="${p.date}">${p.date}</time><h2><a href="/posts/${p.slug}/">${escape(p.title)}</a></h2><p>${escape(p.description)}</p></li>`).join('')}</ul>` : '<p class="empty">아직 공개된 글이 없습니다. 준비가 끝난 기록부터 차근차근 올리겠습니다.</p>';
  await write('index.html', page('홈', `<section class="hero"><p class="eyebrow">BUILD · LEARN · RECORD</p><h1>만들면서 배우고,<br>배운 것을 기록합니다.</h1><p>${escape(config.description)}</p></section><section><h2>주요 카테고리</h2><div class="cards">${config.categories.map(c=>`<a class="card" href="/categories/${c.slug}/"><h3>${escape(c.name)}</h3><p>${escape(c.description)}</p></a>`).join('')}</div></section><section><h2>최근 글</h2>${listing(posts)}</section>`, '/'));
  for (const category of config.categories) await write(`categories/${category.slug}/index.html`, page(category.name, `<h1>${escape(category.name)}</h1><p>${escape(category.description)}</p>${listing(posts.filter(p=>p.categories.includes(category.slug)))}`, `/categories/${category.slug}/`));
  for (const post of posts) await write(`posts/${post.slug}/index.html`, page(post.title, `<article><time datetime="${post.date}">${post.date}</time><h1>${escape(post.title)}</h1><p>${post.categories.map(slug=>`<a href="/categories/${slug}/">${escape(config.categories.find(c=>c.slug===slug).name)}</a>`).join(' · ')}</p><div class="prose">${post.html}</div></article>`, `/posts/${post.slug}/`, post.description));
  await write('about/index.html', page('소개', '<h1>개발과 의사결정의 기록</h1><p>PKMA, DeliveryFlow, Hangul Romanization을 중심으로 구현 과정과 배운 점을 기록하는 공간입니다.</p><p>기술 실험과 개발일지도 함께 다룹니다. 검토와 게시 승인을 마친 글만 공개합니다.</p>', '/about/'));
  await write('404.html', page('페이지를 찾을 수 없습니다', '<h1>페이지를 찾을 수 없습니다.</h1><p><a href="/">홈으로 돌아가기</a></p>', '/404.html'));
  await writeFile(join(output, '.nojekyll'), '');
  await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${config.url}/sitemap.xml\n`);
  const paths = ['/', '/about/', ...config.categories.map(c=>`/categories/${c.slug}/`), ...posts.map(p=>`/posts/${p.slug}/`)];
  await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`<url><loc>${escape(config.url+p)}</loc></url>`).join('')}</urlset>`);
  return {posts:posts.length, pages:paths.length+1};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(await build());
