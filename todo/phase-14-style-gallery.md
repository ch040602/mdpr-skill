# Phase 14 — Style Gallery

## Goal

동일한 Slide Element IR로 여러 visual profile 결과를 생성해 디자인 다양화를 검토할 수 있게 한다.

## Tasks

- [x] `--style-gallery` CLI 구현.
- [x] Element IR를 한 번만 생성하고 profile별로 재사용.
- [x] profile별 StyledDeckIR 생성.
- [x] profile별 PPTX/HTML/PDF output 생성.
- [x] gallery manifest JSON 생성.
- [x] profile별 inspect JSON 저장.
- [x] theme color slot 유지 확인.
- [x] 실패한 profile은 전체 gallery를 중단할지 partial output할지 정책 결정.

## Output convention

```text
dist/style-gallery/
  manifest.json
  friendly-dashboard/deck.pptx
  friendly-dashboard/inspect.json
  layered-product/deck.pptx
  layered-product/inspect.json
  minimal-system/deck.pptx
  minimal-system/inspect.json
```

## Acceptance

- [x] 같은 Element IR checksum을 모든 profile이 공유한다.
- [x] profile별 recipe/variant 선택 차이가 inspect에 기록된다.
- [x] PPTX theme color binding이 유지된다.
