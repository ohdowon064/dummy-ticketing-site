APP_NAME := $(shell basename $(PWD))
GO_MAIN_CMD := ./cmd/main.go
FRONTEND_DIR := frontend
FRONTEND_DIST_DIR := $(FRONTEND_DIR)/dist

.PHONY: all clean setup dev build dev-backend dev-frontend build-frontend clean-frontend help

# help 타겟을 추가하고, 각 타겟에 ##로 설명을 달아주면 grep으로 목록을 뽑아냄.
help:
	@echo "Usage: make <target>"
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?##"}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: tree
tree: ## 프로젝트 디렉토리 구조를 트리 형태로 출력합니다.
	@tree -I 'node_modules'

all: setup dev ## 모든 것을 설치하고 개발 모드로 실행합니다. (setup + dev)

clean: clean-frontend clean-backend ## 전체 프로젝트의 빌드 파일 및 의존성을 정리합니다.
clean-backend: ## Go 빌드 파일 및 바이너리를 정리합니다.
	@echo "--- Cleaning Go Build and Binary ---"
	@go clean
	@rm -f $(APP_NAME)
	@echo "Go cleanup complete."

setup: setup-go setup-frontend ## 모든 의존성(Go 모듈 및 pnpm)을 설치합니다.

dev: dev-backend & dev-frontend ## 전체 개발 모드 실행 (백엔드 & 프론트엔드 동시 실행).

build: build-frontend build-backend ## 전체 배포용 바이너리를 빌드합니다.

setup-go: ## Go 모듈 의존성을 설치합니다. (go mod tidy)
	@echo "--- Installing Go dependencies ---"
	@go mod tidy
	@echo "Go setup complete."

dev-backend: setup-go ## Go 백엔드 개발 서버를 실행합니다.
	@echo "--- Starting Go Backend Server ---"
	@go run $(GO_MAIN_CMD)

build-backend: setup-go ## Go 백엔드 배포용 바이너리를 빌드합니다.
	@echo "--- Building Go Backend Binary ---"
	@go build -o $(APP_NAME) $(GO_MAIN_CMD)

build-backend-all: build-frontend setup-go ## 여러 OS/아키텍처용 Go 바이너리 빌드(darwin_arm64, darwin_amd64, windows_amd64, linux_amd64)
	@echo "--- Building for darwin/arm64 ---"
	GOOS=darwin GOARCH=arm64 go build -o $(APP_NAME)_darwin_arm64 $(GO_MAIN_CMD)
	@echo "--- Building for darwin/amd64 ---"
	GOOS=darwin GOARCH=amd64 go build -o $(APP_NAME)_darwin_amd64 $(GO_MAIN_CMD)
	@echo "--- Building for windows/amd64 ---"
	GOOS=windows GOARCH=amd64 go build -o $(APP_NAME)_windows_amd64.exe $(GO_MAIN_CMD)
	@echo "--- Building for linux/amd64 ---"
	GOOS=linux GOARCH=amd64 go build -o $(APP_NAME)_linux_amd64 $(GO_MAIN_CMD)

setup-frontend: ## pnpm 의존성을 설치합니다.
	@echo "--- Installing frontend dependencies via pnpm ---"
	@cd $(FRONTEND_DIR) && pnpm install

dev-frontend: setup-frontend ## 프론트엔드 개발 서버를 실행합니다.
	@echo "--- Starting frontend development server ---"
	@cd $(FRONTEND_DIR) && pnpm dev

build-frontend: setup-frontend ## 프론트엔드 배포용 빌드(dist 생성)를 수행합니다.
	@echo "--- Building frontend for production ---"
	@cd $(FRONTEND_DIR) && pnpm build

clean-frontend: ## 프론트엔드 node_modules 및 dist 디렉토리를 정리합니다.
	@echo "--- Cleaning up frontend node_modules and dist ---"
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(FRONTEND_DIST_DIR)
	@echo "Frontend cleanup complete."