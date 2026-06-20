---
doc_type: operation
project: crack
status: active
source_type: user_decision
confidence: high
needs_verification: false
last_reviewed: 2026-06-20
tags: [operations, onedrive, safety]
---

# OneDrive 사용 주의

이 프로젝트는 OneDrive 내부에 위치합니다.

## 주의사항

- Obsidian과 Codex가 동시에 같은 파일을 수정하면 충돌이 생길 수 있습니다.
- OneDrive 동기화 중 대량 이동·이름 변경을 하면 반영이 지연될 수 있습니다.
- 같은 볼트를 Obsidian Sync와 OneDrive로 동시에 동기화하지 않습니다.
- `conflict`, `복사본`, `copy`가 포함된 파일은 자동으로 정본화하지 않습니다.
- 충돌 파일은 정본 문서와 변경 기록을 기준으로 비교한 뒤 수동 병합합니다.

## 권장 운영

1. Codex 작업 전에 Obsidian 편집 내용을 저장합니다.
2. Codex 작업 중에는 같은 파일을 Obsidian에서 동시에 편집하지 않습니다.
3. Codex 작업 후 Obsidian에서 변경 내용을 확인합니다.
4. 대량 구조 변경 후 OneDrive 동기화 완료 여부를 확인합니다.
5. 중요한 변경은 Git 커밋으로 기준점을 남깁니다.

## 충돌 발견 시

1. 두 파일을 모두 보존합니다.
2. 임의로 최신 파일을 선택하지 않습니다.
3. 사용자에게 충돌 경로와 차이를 보고합니다.
4. 사용자 확인 후 정본에 병합하고 변경 기록을 남깁니다.
