import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, copyFile, writeFile, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {build} from '../scripts/build.mjs';

test('publication gate, rendering, links and draft exclusion', async () => {
  const root = await mkdtemp(join(tmpdir(), 'blog-check-'));
  try {
    await mkdir(join(root,'content/posts'),{recursive:true});
    await mkdir(join(root,'assets'));
    await mkdir(join(root,'_drafts'));
    await copyFile('site.json',join(root,'site.json'));
    await copyFile('assets/style.css',join(root,'assets/style.css'));
    await writeFile(join(root,'_drafts/private.md'),'PRIVATE_DRAFT_SENTINEL');
    const post = {title:'승인된 테스트 글',description:'검증용',slug:'test-post',date:'2026-10-05',categories:['pkma','devlog'],status:'draft',approval:null};
    const save = async meta => writeFile(join(root,'content/posts/test.md'),`---\n${JSON.stringify(meta)}\n---\n## 내용\n\n**검증**\n`);
    await save(post);
    assert.equal((await build(root)).posts,0);
    assert.ok(!(await readFile(join(root,'dist/index.html'),'utf8')).includes(post.title));
    await save({...post,status:'published'});
    await assert.rejects(()=>build(root), /approval required/);
    const published = {...post,status:'published',approval:{by:'cybdream',date:'2026-10-05'}};
    await save({...published,categories:['unknown']});
    await assert.rejects(()=>build(root), /invalid categories/);
    await save({...published,date:'2026-02-30'});
    await assert.rejects(()=>build(root), /invalid title/);
    await save(published);
    assert.equal((await build(root)).posts,1);
    assert.match(await readFile(join(root,'dist/posts/test-post/index.html'),'utf8'), /<strong>검증<\/strong>/);
    assert.match(await readFile(join(root,'dist/categories/pkma/index.html'),'utf8'), /승인된 테스트 글/);
    assert.match(await readFile(join(root,'dist/sitemap.xml'),'utf8'), /posts\/test-post/);
    await save(post);
    await build(root);
    const files = await readdir(join(root,'dist'),{recursive:true});
    assert.ok(!files.some(file=>file.includes('_drafts') || file.includes('test-post') || file.endsWith('.md')));
    for (const file of files.filter(file=>file.endsWith('.html'))) {
      const html = await readFile(join(root,'dist',file),'utf8');
      assert.ok(!html.includes('PRIVATE_DRAFT_SENTINEL'));
      for (const [,href] of html.matchAll(/href="(\/[^"#]*)"/g)) {
        const target = href.endsWith('/') ? href+'index.html' : href;
        await readFile(join(root,'dist',target));
      }
    }
  } finally { await rm(root,{recursive:true,force:true}); }
});
