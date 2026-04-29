# ─────────────────────────────────────────────
# 복붙전권대사 Admin — 개발 편의 명령어 모음
# ─────────────────────────────────────────────

.PHONY: help init env install dev build lint preview clean

help: ## 사용 가능한 명령어 목록
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── 초기 세팅 ──────────────────────────────

init: env install ## 최초 세팅 (env → install)

env: ## .env 파일 생성 (.env.example 복사, 이미 있으면 스킵)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env 파일 생성 완료 (.env.example 복사)"; \
	else \
		echo ".env 파일 이미 존재 — 스킵"; \
	fi

install: ## npm 패키지 설치
	npm install

# ── 개발 ─────────────────────────────────

dev: ## 개발 서버 실행
	npm run dev

build: ## 프로덕션 빌드
	npm run build

lint: ## ESLint 실행
	npm run lint

preview: ## 빌드 결과 미리보기
	npm run preview

# ── 정리 ─────────────────────────────────

clean: ## 빌드 캐시 삭제
	rm -rf dist node_modules/.vite
