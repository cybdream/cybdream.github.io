# cybdream 개발 블로그

PKMA / DeliveryFlow / Hangul Romanization / AI·개발 / 개발일지를 위한 GitHub Pages 정적 사이트입니다. Node.js 22와 Markdown 변환 라이브러리 `marked`만 사용합니다. 사이트 제목·주소·카테고리는 `site.json`, 디자인은 `assets/style.css`에서 관리합니다.

## 로컬 빌드

```sh
npm ci
npm test
npm run build
```

결과는 `dist/`에 생성됩니다. 로컬 HTTP 서버의 루트를 `dist/`로 설정해서 확인하세요. 사용자 사이트 `https://cybdream.github.io`의 루트 배포용이며 프로젝트 하위 경로 배포는 지원하지 않습니다.

## GitHub Pages 설정

저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 선택합니다. `.github/workflows/pages.yml`은 PR에서 테스트와 빌드를 실행하고, main 변경 시 검증에 성공한 `dist/`만 배포합니다. Pages 활성화 전에는 deploy 작업이 실패할 수 있습니다. 활성화 후 Actions에서 수동으로 다시 실행할 수 있습니다.

## 초안 → 사용자 확인 → 게시 승인

1. 초안은 로컬 `_drafts/` 또는 개인 비공개 저장소에 작성합니다. `_drafts/`는 git에서 제외하고 빌드에서도 읽지 않습니다.
2. 사용자가 본문·사실관계·공개 범위를 확인합니다.
3. 해당 글에 대한 명시적 게시 승인을 받은 뒤에만 `content/posts/`로 이동합니다.
4. `status`를 `published`로 변경하고 실제 게시일, `approval.by: cybdream`, 승인일을 기록합니다.
5. 테스트와 빌드 결과를 확인하고 main에 반영합니다.

**public 저장소의 파일과 커밋 이력은 공개됩니다.** `draft` 상태는 웹사이트 제외만 보장하므로 비공개 초안을 public 저장소에 커밋하지 마세요. 승인 필드는 형식 검증이며 사람의 실제 승인 여부를 자동으로 인증하지 않습니다. 자동화 담당자는 사용자의 승인을 직접 확인해야 합니다.

## 글 형식

`content/posts/YYYY-MM-DD-slug.md`에 아래처럼 JSON front matter와 Markdown 본문을 작성합니다. `---` 사이에는 YAML 대신 **유효한 JSON**을 사용합니다.

```markdown
---
{
  "title": "글 제목",
  "slug": "post-slug",
  "date": "2026-10-05",
  "description": "목록과 검색에 표시할 요약",
  "categories": ["pkma", "devlog"],
  "status": "draft",
  "approval": null
}
---
## 본문

Markdown으로 작성합니다.
```

카테고리 키: `pkma`, `deliveryflow`, `hangul-romanization`, `ai-development`, `devlog`.
게시 승인 후에만 `"status": "published"`, `"approval": {"by": "cybdream", "date": "실제 승인일 YYYY-MM-DD"}`로 변경합니다. 승인 없는 published 글, 잘못된 날짜·카테고리·중복 slug는 빌드를 실패시킵니다. 다른 상태의 글은 목록·본문·사이트맵 모두에서 제외합니다.

Markdown은 저장소 소유자가 검토한 콘텐츠만 입력합니다. raw HTML도 허용하므로 외부 입력을 검토 없이 넣지 마세요. 빌드는 저장소 전체를 복사하지 않고 HTML·CSS·사이트맵만 생성합니다.

첫 글 초안은 비공개 보관 원칙에 따라 public 저장소 밖에서 관리합니다. 현재 공개 게시글은 없습니다. 라이선스는 아직 지정하지 않았습니다.
