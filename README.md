# Dummy Ticketing Site

이 프로젝트는 Go 백엔드와 React 프론트엔드로 구성된 예매 사이트 예제입니다. Makefile을 통해 개발 및 빌드 작업을 간편하게 수행할 수 있습니다.

## 주요 Makefile 명령어

| 명령어            | 설명 |
|-------------------|------|
| make help         | 사용 가능한 모든 명령어와 설명을 출력합니다. |
| make tree         | node_modules를 제외한 프로젝트 디렉토리 구조를 트리 형태로 출력합니다. |
| make all          | 모든 의존성 설치 후 개발 모드로 실행합니다. (setup + dev) |
| make clean        | 전체 프로젝트의 빌드 파일 및 의존성을 정리합니다. |
| make setup        | Go 모듈 및 프론트엔드(pnpm) 의존성을 모두 설치합니다. |
| make dev          | 백엔드와 프론트엔드 개발 서버를 동시에 실행합니다. |
| make build        | 전체 배포용 바이너리를 빌드합니다. |
| make dev-backend  | Go 백엔드 개발 서버를 실행합니다. |
| make build-backend| Go 백엔드 배포용 바이너리를 빌드합니다. |
| make setup-frontend| 프론트엔드 의존성을 설치합니다. |
| make dev-frontend | 프론트엔드 개발 서버를 실행합니다. |
| make build-frontend| 프론트엔드 배포용 빌드(dist 생성)를 수행합니다. |
| make clean-frontend| 프론트엔드 node_modules 및 dist 디렉토리를 정리합니다. |
| make clean-backend| Go 빌드 파일 및 바이너리를 정리합니다. |

## 사용 예시

```sh
# 의존성 설치
make setup

# 개발 서버 실행 (백엔드 & 프론트엔드)
make dev

# 배포용 빌드
make build

# 프로젝트 구조 확인
make tree

# 전체 정리
make clean
```

## 참고
- 프론트엔드 디렉토리: `frontend/`
- 백엔드 진입점: `main.go` 또는 `cmd/main.go`
- pnpm이 필요합니다. (프론트엔드)
- Go 1.18+ 권장

자세한 명령어 설명은 `make help`로 확인하세요.
