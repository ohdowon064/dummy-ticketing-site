import React, { useState, useEffect } from "react";

// 1. 타입 정의 (Types)
type Step = "login" | "date" | "seat" | "captcha";

interface Seat {
  id: string;
  row: number;
  col: number;
  is_booked: boolean;
}

// 2. 메인 컴포넌트
export default function App() {
  const [step, setStep] = useState<Step>("login");
  const [dates, setDates] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState<string>("");
  const [captchaImg, setCaptchaImg] = useState<string>("");

  // [NEW] 결제 팝업 상태
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // [NEW] Iframe 메시지 리스너 (결제 완료 감지)
  // 교육 포인트: window.postMessage를 이용한 Cross-Origin(또는 Same-Origin) 통신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안상 origin 체크를 하는 것이 좋으나, 여기서는 같은 도메인이므로 생략하거나 간단히 확인
      if (event.data === "PAYMENT_SUCCESS") {
        // 결제 성공 메시지를 받으면 실제 예매 API 호출
        finalizeBooking();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedSeat, captchaInput]); // 의존성 추가: 최신 상태 참조

  // 1. 로그인
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const usernameInput = form.elements.namedItem(
      "username"
    ) as HTMLInputElement;
    const passwordInput = form.elements.namedItem(
      "password"
    ) as HTMLInputElement;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput.value,
          password: passwordInput.value,
        }),
      });
      if (res.ok) {
        setStep("date");
        loadDates();
      } else {
        alert("Login Failed (Try: admin / 1234)");
      }
    } catch {
      alert("Network Error");
    }
  };

  const loadDates = async () => {
    try {
      const res = await fetch("/api/dates");
      const data: string[] = await res.json();
      setDates(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSeats = async () => {
    try {
      const res = await fetch("/api/seats");
      if (!res.ok) throw new Error();
      const data: Seat[] = await res.json();
      setSeats(data);
      setStep("seat");
    } catch {
      alert("Unauthorized or Session Expired");
      setStep("login");
    }
  };

  const refreshCaptcha = () => {
    setCaptchaImg(`/api/captcha?t=${Date.now()}`);
  };

  // [CHANGED] 예매 버튼 클릭 시 -> 결제 팝업 오픈
  const openPaymentModal = () => {
    if (!selectedSeat || !captchaInput) {
      alert("좌석 선택 및 캡차 입력을 완료해주세요.");
      return;
    }

    // 1. 로딩 시작 (Wait 연습용)
    setIsPaymentLoading(true);
    setShowPaymentModal(true);

    // 2. 1.5초 뒤에 Iframe 로드 (로딩 끝)
    // 교육 포인트: 동적 요소 등장 대기 (Explicit Wait)
    setTimeout(() => {
      setIsPaymentLoading(false);
    }, 1500);
  };

  // [NEW] 실제 예매 확정 API (Iframe에서 호출됨)
  const finalizeBooking = async () => {
    setShowPaymentModal(false); // 팝업 닫기

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seat_id: selectedSeat, captcha: captchaInput }),
      });

      if (res.ok) {
        alert("🎉 예매가 최종 확정되었습니다! (Booking Confirmed)");
        window.location.reload();
      } else {
        const msg = await res.text();
        alert(`예매 실패: ${msg}`);
        refreshCaptcha();
        setCaptchaInput("");
      }
    } catch {
      alert("Booking Request Failed");
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333" }}>
        🎟️ Ticket Practice Ground
      </h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "40px" }}>
        웹 자동화 및 크롤링 연습을 위한 더미 사이트입니다.
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        {step === "login" && (
          <form
            onSubmit={handleLogin}
            id="login-form"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              maxWidth: "300px",
              margin: "0 auto",
            }}
          >
            <h2 style={{ textAlign: "center" }}>Login Required</h2>
            <div>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Username (admin)
              </label>
              <input
                name="username"
                placeholder="admin"
                required
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Password (1234)
              </label>
              <input
                name="password"
                type="password"
                placeholder="1234"
                required
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <button
              type="submit"
              id="btn-login"
              style={{
                padding: "10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </form>
        )}

        {step === "date" && (
          <div id="date-selection" style={{ textAlign: "center" }}>
            <h2>Select Date</h2>
            <p>관람하실 날짜를 선택해주세요.</p>
            {dates.length === 0 ? (
              <p>Loading dates...</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
              >
                {dates.map((date) => (
                  <button
                    key={date}
                    className="date-btn"
                    onClick={loadSeats}
                    style={{
                      padding: "15px 25px",
                      fontSize: "16px",
                      cursor: "pointer",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    {date}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "seat" && (
          <div id="seat-map-container" style={{ textAlign: "center" }}>
            <h2>Select Seat</h2>
            <p>
              원하는 좌석을 선택하세요. (흰색: 가능, 회색: 불가, 보라색: 선택됨)
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 40px)",
                gap: "8px",
                justifyContent: "center",
                margin: "30px 0",
              }}
            >
              {seats.map((seat) => (
                <div
                  key={seat.id}
                  data-seat-id={seat.id}
                  className={`seat ${seat.is_booked ? "booked" : "available"} ${
                    selectedSeat === seat.id ? "selected" : ""
                  }`}
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: seat.is_booked
                      ? "#e0e0e0"
                      : selectedSeat === seat.id
                      ? "#9c27b0"
                      : "#ffffff",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    color: seat.is_booked
                      ? "#999"
                      : selectedSeat === seat.id
                      ? "white"
                      : "black",
                    cursor: seat.is_booked ? "not-allowed" : "pointer",
                  }}
                  onClick={() => !seat.is_booked && setSelectedSeat(seat.id)}
                  title={seat.id}
                >
                  {seat.row}-{seat.col}
                </div>
              ))}
            </div>

            {selectedSeat && (
              <div style={{ marginTop: "20px" }}>
                <p>
                  선택된 좌석: <strong>{selectedSeat}</strong>
                </p>
                <button
                  id="btn-next-step"
                  onClick={() => {
                    setStep("captcha");
                    refreshCaptcha();
                  }}
                  style={{
                    padding: "10px 30px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  다음 단계 (Next Step)
                </button>
              </div>
            )}
          </div>
        )}

        {step === "captcha" && (
          <div
            id="captcha-popup"
            style={{
              textAlign: "center",
              border: "2px solid #dc3545",
              padding: "30px",
              borderRadius: "8px",
              backgroundColor: "#fff5f5",
            }}
          >
            <h2 style={{ color: "#dc3545" }}>Security Check</h2>
            <p>부정 예매 방지를 위해 아래 문자를 입력하세요.</p>

            <div style={{ margin: "20px 0" }}>
              {captchaImg && (
                <img
                  src={captchaImg}
                  alt="captcha"
                  id="captcha-img"
                  style={{ border: "1px solid #ccc", marginBottom: "10px" }}
                />
              )}
              <br />
              <button
                onClick={refreshCaptcha}
                style={{
                  fontSize: "12px",
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                이미지 새로고침
              </button>
            </div>

            <div
              style={{ display: "flex", justifyContent: "center", gap: "10px" }}
            >
              <input
                value={captchaInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCaptchaInput(e.target.value)
                }
                placeholder="6자리 숫자 입력"
                id="captcha-input"
                style={{
                  padding: "10px",
                  fontSize: "16px",
                  width: "150px",
                  textAlign: "center",
                }}
              />
              {/* [CHANGED] 버튼 클릭 시 바로 예매가 아니라 결제 팝업 오픈 */}
              <button
                id="btn-open-payment"
                onClick={openPaymentModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                결제하기 (Pay)
              </button>
            </div>
          </div>
        )}

        {/* [NEW] 결제 모달 (Iframe) */}
        {showPaymentModal && (
          <div
            id="payment-modal"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999, // CSS 가림 현상 방지
            }}
          >
            <div
              style={{
                background: "white",
                width: "400px",
                height: "400px",
                padding: "10px",
                position: "relative",
                borderRadius: "8px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              }}
            >
              {isPaymentLoading ? (
                <div
                  id="payment-loading"
                  style={{ textAlign: "center", marginTop: "150px" }}
                >
                  <h3>결제 모듈 로딩중...</h3>
                  <div
                    className="spinner"
                    style={{
                      margin: "10px auto",
                      width: "30px",
                      height: "30px",
                      border: "3px solid #f3f3f3",
                      borderTop: "3px solid #3498db",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
                // [교육 포인트] Iframe Context Switching
                <iframe
                  id="payment-frame"
                  src="/payment"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    borderRadius: "4px",
                  }}
                  title="payment"
                />
              )}
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  background: "#333",
                  color: "white",
                  border: "2px solid white",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                X
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
