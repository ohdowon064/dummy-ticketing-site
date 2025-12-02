// Package main provides a dummy ticketing server for web automation practice.
package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"math/big"
	mrand "math/rand" // Aliased for clarity vs crypto/rand
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/ohdowon064/dummy-ticketing-site/frontend"
)

// 1. React 빌드 파일 임베딩 (frontend/dist 폴더 경로 지정)

// 2. 데이터 모델
type Seat struct {
	ID       string `json:"id"`
	Row      int    `json:"row"`
	Col      int    `json:"col"`
	IsBooked bool   `json:"is_booked"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type BookRequest struct {
	SeatID  string `json:"seat_id"`
	Captcha string `json:"captcha"`
}

// 3. 인메모리 저장소
var (
	seats        = make([]Seat, 0)
	captchaStore = make(map[string]string) // SessionID -> CaptchaValue
	mutex        sync.Mutex
)

func init() {
	// 10x10 좌석 초기화
	for r := 1; r <= 10; r++ {
		for c := 1; c <= 10; c++ {
			id := fmt.Sprintf("SEAT-%d-%d", r, c)
			// 랜덤하게 예약된 좌석 생성 (30% 확률)
			isBooked := mrand.Intn(100) < 30
			seats = append(seats, Seat{ID: id, Row: r, Col: c, IsBooked: isBooked})
		}
	}
}

// secureRandomString generates a random string using crypto/rand
func secureRandomString(n int) string {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano()) // Fallback
	}
	return hex.EncodeToString(bytes)
}

// secureRandomNumber generates a 6-digit random number string
func secureRandomNumber() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	return fmt.Sprintf("%06d", n.Int64())
}

func main() {
	mux := http.NewServeMux()

	// --- [API 핸들러] ---

	// 1) 로그인
	mux.HandleFunc("POST /api/login", func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}

		if req.Username == "admin" && req.Password == "1234" {
			http.SetCookie(w, &http.Cookie{
				Name:     "session_token",
				Value:    "valid-session-xyz",
				Path:     "/",
				HttpOnly: true,
				Expires:  time.Now().Add(24 * time.Hour),
			})
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": "Login Success"})
		} else {
			http.Error(w, "Invalid Credentials", http.StatusUnauthorized)
		}
	})

	// 2) 날짜 목록
	mux.HandleFunc("GET /api/dates", func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(1 * time.Second)
		dates := []string{"2025-12-24", "2025-12-25", "2026-01-01"}
		_ = json.NewEncoder(w).Encode(dates)
	})

	// 3) 좌석 정보
	mux.HandleFunc("GET /api/seats", func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil || cookie.Value != "valid-session-xyz" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		mutex.Lock()
		defer mutex.Unlock()
		_ = json.NewEncoder(w).Encode(seats)
	})

	// 4) 캡차 이미지
	mux.HandleFunc("GET /api/captcha", func(w http.ResponseWriter, r *http.Request) {
		code := secureRandomNumber()
		captchaID := secureRandomString(16)
		http.SetCookie(w, &http.Cookie{Name: "captcha_id", Value: captchaID, Path: "/"})

		mutex.Lock()
		captchaStore[captchaID] = code
		mutex.Unlock()

		w.Header().Set("Content-Type", "image/svg+xml")
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")

		fmt.Fprintf(w, `<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
			<rect width="100%%" height="100%%" fill="#f0f0f0"/>
			<text x="50%%" y="50%%" font-size="30" font-family="Arial" font-weight="bold" fill="black" text-anchor="middle" dominant-baseline="middle" letter-spacing="5">%s</text>
			<line x1="10" y1="10" x2="190" y2="70" stroke="gray" stroke-width="2"/>
		</svg>`, code)
	})

	// 5) 예매 요청
	mux.HandleFunc("POST /api/book", func(w http.ResponseWriter, r *http.Request) {
		var req BookRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}

		cID, err := r.Cookie("captcha_id")
		if err != nil {
			http.Error(w, "Captcha expired", http.StatusBadRequest)
			return
		}

		mutex.Lock()
		defer mutex.Unlock()

		realCode, exists := captchaStore[cID.Value]
		if !exists || realCode != req.Captcha {
			http.Error(w, "Incorrect Captcha", http.StatusForbidden)
			return
		}
		delete(captchaStore, cID.Value)

		for i, s := range seats {
			if s.ID == req.SeatID {
				if s.IsBooked {
					http.Error(w, "Already Booked", http.StatusConflict)
					return
				}
				seats[i].IsBooked = true
				_ = json.NewEncoder(w).Encode(map[string]string{"status": "success", "seat_id": s.ID})
				return
			}
		}
		http.Error(w, "Seat not found", http.StatusNotFound)
	})

	// 6) [NEW] 결제 팝업 (Iframe용 HTML)
	// 교육 포인트: Iframe Context Switching 연습용
	mux.HandleFunc("/payment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		html := `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Secure Payment</title>
			<style>
				body { font-family: sans-serif; padding: 20px; background: #f9f9f9; }
				.box { background: white; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
				button { background: #007bff; color: white; border: none; padding: 10px 20px; cursor: pointer; width: 100%; margin-top: 10px; }
				button:disabled { background: #ccc; cursor: not-allowed; }
				
				.form-group { margin-bottom: 15px; }
				label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
				input[type="text"], input[type="password"] { 
					padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;
				}
				.card-inputs { display: flex; gap: 5px; }
				.card-inputs input { width: 25%; text-align: center; }
				.row { display: flex; gap: 15px; }
				.col { flex: 1; }
			</style>
		</head>
		<body>
			<div class="box">
				<h3>결제 정보 입력 (Payment Info)</h3>
				<hr/>
				
				<!-- 결제 수단 -->
				<div class="form-group">
					<label><input type="radio" name="pay_method" value="card" checked> 신용카드 (Credit Card)</label>
					<label><input type="radio" name="pay_method" value="bank"> 무통장입금</label>
				</div>

				<!-- 이름 -->
				<div class="form-group">
					<label for="input-name">이름 (Name)</label>
					<input type="text" id="input-name" placeholder="홍길동" style="width: 100%;">
				</div>

				<!-- 전화번호 -->
				<div class="form-group">
					<label for="input-phone">전화번호 (Phone)</label>
					<input type="text" id="input-phone" placeholder="010-1234-5678" style="width: 100%;">
				</div>

				<!-- 카드번호 (4개로 분리) -->
				<div class="form-group">
					<label>신용카드 번호 (Card Number)</label>
					<div class="card-inputs">
						<input type="text" id="input-card-1" maxlength="4" placeholder="0000">
						<input type="text" id="input-card-2" maxlength="4" placeholder="0000">
						<input type="text" id="input-card-3" maxlength="4" placeholder="0000">
						<input type="text" id="input-card-4" maxlength="4" placeholder="0000">
					</div>
				</div>

				<!-- CVC & 비밀번호 -->
				<div class="row">
					<div class="col form-group">
						<label for="input-cvc">CVC (3자리)</label>
						<input type="password" id="input-cvc" maxlength="3" placeholder="***" style="width: 100%;">
					</div>
					<div class="col form-group">
						<label for="input-pwd">비밀번호 앞 2자리</label>
						<input type="password" id="input-pwd" maxlength="2" placeholder="**" style="width: 100%;">
					</div>
				</div>
				
				<hr/>
				
				<label style="font-weight: normal; font-size: 14px;">
					<input type="checkbox" id="chk_agree" onchange="toggleButton()">
					(필수) 결제 약관에 동의합니다.
				</label>
				<br/>
				
				<button id="btn_pay" disabled onclick="processPayment()">결제하기 (Pay)</button>
			</div>

			<script>
				function toggleButton() {
					const agree = document.getElementById('chk_agree').checked;
					document.getElementById('btn_pay').disabled = !agree;
				}

				function processPayment() {
					// 간단한 유효성 검사 (입력 확인)
					const ids = ['input-name', 'input-phone', 'input-card-1', 'input-card-2', 'input-card-3', 'input-card-4', 'input-cvc', 'input-pwd'];
					for (let id of ids) {
						if (!document.getElementById(id).value) {
							alert('모든 정보를 입력해주세요. (Please fill all fields)');
							document.getElementById(id).focus();
							return;
						}
					}

					// 부모 창(React)으로 메시지 전송
					window.parent.postMessage('PAYMENT_SUCCESS', '*');
				}
			</script>
		</body>
		</html>
		`
		fmt.Fprint(w, html)
	})

	// --- [정적 파일 서빙] ---
	fsys, _ := fs.Sub(frontend.DistFS, "dist")
	fileServer := http.FileServer(http.FS(fsys))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api") || r.URL.Path == "/payment" {
			// API나 Payment 요청이 라우팅되지 않고 여기까지 오면 404
			if r.URL.Path == "/payment" {
				// 위에서 핸들링 했어야 함. 중복 방지 로직.
				return
			}
			http.NotFound(w, r)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/")
		if f, err := fsys.Open(path); err == nil {
			f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}

		content, err := http.FS(fsys).Open("index.html")
		if err != nil {
			http.Error(w, "Index not found", http.StatusInternalServerError)
			return
		}
		defer content.Close()

		stat, _ := content.Stat()
		http.ServeContent(w, r, "index.html", stat.ModTime(), content)
	})

	server := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 3 * time.Second,
	}

	fmt.Println("🎟️  Ticket Practice Server running on http://localhost:8080")
	log.Fatal(server.ListenAndServe())
}
