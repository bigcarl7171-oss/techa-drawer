# AI 협업 운영 가이드

이 문서는 사람과 AI가 함께 참고하는 운영 문서이며, 에이전트가 매 작업마다 읽어야 하는 프롬프트가 아니다.

## 역할

- **ChatGPT:** 분석, 설계, 리뷰를 담당한다.
- **Codex:** 사이트 개발과 저장소 유지보수를 담당한다. `feature/`, `fix/`, `chore/` 브랜치를 사용하며 `main`을 직접 수정하지 않는다.
- **Claude:** 기존 콘텐츠 작성과 `techa-publish` 자동 발행을 담당한다. 정상적인 `techa-publish` 발행은 `main` 직접 push의 예외다.
- Claude에게 사이트 구조, CSS, JavaScript, 배포 설정 변경을 요청할 때는 별도 브랜치를 사용한다.

## 협업 원칙

- 한 브랜치에는 한 명의 writer만 둔다. Claude와 Codex가 같은 브랜치를 동시에 수정하지 않는다.
- AI 간 인계에는 branch명, commit SHA, 변경 파일, 테스트 결과를 반드시 남긴다.
- 이어받는 AI는 채팅 기억이 아니라 Git commit과 저장소 문서를 기준으로 작업한다.
- Codex 작업 중 Claude가 `main`에 새 매거진을 발행할 수 있으므로 최종 병합 전에 최신 `main` 동기화가 필수다.
- `.agents/skills`와 `.claude/skills`에는 동일 스킬 사본이 있다. 임의로 한쪽만 수정하지 말고 `skills-lock.json`의 `source`를 기준으로 관리한다.
