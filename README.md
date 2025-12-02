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

## 배포 파일 안내

이 저장소에는 주요 OS/아키텍처(darwin_arm64, darwin_amd64, windows_amd64, linux_amd64)용 백엔드 실행 파일이 함께 제공됩니다.

의존성 설치 없이, 본인 OS에 맞는 파일만 실행하면 바로 서버를 사용할 수 있습니다.

예시:
- macOS(Apple Silicon): `./dummy-ticketing-site_darwin_arm64`
- macOS(Intel): `./dummy-ticketing-site_darwin_amd64`
- Windows: `dummy-ticketing-site_windows_amd64.exe`
- Linux: `./dummy-ticketing-site_linux_amd64`

프론트엔드 빌드 결과물(`frontend/dist`)도 포함되어 있다면 별도 설치 없이 바로 사용 가능합니다.

## 참고
- 프론트엔드 디렉토리: `frontend/`
- 백엔드 진입점: `main.go` 또는 `cmd/main.go`
- pnpm이 필요합니다. (프론트엔드)
- Go 1.18+ 권장

자세한 명령어 설명은 `make help`로 확인하세요.
