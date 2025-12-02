import React, { useState, useEffect } from 'react';

// 1. 타입 정의 (Types)
type Step = 'login' | 'date' | 'seat' | 'captcha';

interface Seat {
  id: string;
  row: number;
  col: number;
  is_booked: boolean;
}

// 2. 메인 컴포넌트
export default function App() {
  const [step, setStep] = useState<Step>('login');
  const [dates, setDates] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [captchaImg, setCaptchaImg] = useState<string>('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'PAYMENT_SUCCESS') {
        finalizeBooking();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedSeat, captchaInput]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const usernameInput = form.elements.namedItem('username') as HTMLInputElement;
    const passwordInput = form.elements.namedItem('password') as HTMLInputElement;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.value, password: passwordInput.value }),
      });
      if (res.ok) {
        setStep('date');
        loadDates();
      } else {
        alert('Login Failed (Try: admin / 1234)');
      }
    } catch {
      alert('Network Error');
    }
  };

  const loadDates = async () => {
    try {
      const res = await fetch('/api/dates');
      const data: string[] = await res.json();
      setDates(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSeats = async () => {
    try {
      const res = await fetch('/api/seats');
      if (!res.ok) throw new Error();
      const data: Seat[] = await res.json();
      setSeats(data);
      setStep('seat');
    } catch {
      alert('Unauthorized or Session Expired');
      setStep('login');
    }
  };

  const refreshCaptcha = () => {
    setCaptchaImg(`/api/captcha?t=${Date.now()}`);
  };

  const openPaymentModal = () => {
    if (!selectedSeat || !captchaInput) {
      alert('좌석 선택 및 캡차 입력을 완료해주세요.');
      return;
    }
    
    setIsPaymentLoading(true);
    setShowPaymentModal(true);

    setTimeout(() => {
      setIsPaymentLoading(false);
    }, 1500);
  };

  const finalizeBooking = async () => {
    setShowPaymentModal(false);

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: selectedSeat, captcha: captchaInput }),
      });

      if (res.ok) {
        alert('🎉 예매가 최종 확정되었습니다! (Booking Confirmed)');
        window.location.reload();
      } else {
        const msg = await res.text();
        alert(`예매 실패: ${msg}`);
        refreshCaptcha();
        setCaptchaInput('');
      }
    } catch {
      alert('Booking Request Failed');
    }
  };

  return (
    // [Layout] 전체 화면 중앙 정렬을 위한 Flex 컨테이너
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f8f9fa', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      
      {/* [Card] 중앙 카드 영역 */}
      <div style={{ 
        width: '100%', 
        maxWidth: '700px', 
        padding: '40px', 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        margin: 'auto'
      }}>
        
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>🎟️ Ticket Practice Ground</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px', fontSize: '14px' }}>
          웹 자동화 및 크롤링 연습을 위한 더미 사이트입니다.
        </p>

        {step === 'login' && (
          <form onSubmit={handleLogin} id="login-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ textAlign: 'center', margin: 0 }}>Login Required</h2>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Username (admin)</label>
              <input name="username" placeholder="admin" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Password (1234)</label>
              <input name="password" type="password" placeholder="1234" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" id="btn-login" style={{ padding: '14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              Login
            </button>
          </form>
        )}

        {step === 'date' && (
          <div id="date-selection" style={{ textAlign: 'center' }}>
            <h2>Select Date</h2>
            <p style={{marginBottom: '20px'}}>관람하실 날짜를 선택해주세요.</p>
            {dates.length === 0 ? <p>Loading dates...</p> : (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {dates.map(date => (
                  <button 
                    key={date} 
                    className="date-btn" 
                    onClick={loadSeats}
                    style={{ padding: '15px 25px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#f1f3f5', border: '1px solid #dee2e6', borderRadius: '8px', fontWeight: '500', color: '#333' }}
                  >
                    {date}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'seat' && (
          <div id="seat-map-container" style={{ textAlign: 'center' }}>
            <h2>Select Seat</h2>
            <p style={{fontSize: '14px', color: '#666'}}>원하는 좌석을 선택하세요.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px', fontSize: '12px' }}>
              <span style={{display: 'flex', alignItems: 'center'}}><div style={{width: 12, height: 12, background: '#fff', border: '1px solid #ccc', marginRight: 5}}></div>가능</span>
              <span style={{display: 'flex', alignItems: 'center'}}><div style={{width: 12, height: 12, background: '#e0e0e0', border: '1px solid #ccc', marginRight: 5}}></div>불가</span>
              <span style={{display: 'flex', alignItems: 'center'}}><div style={{width: 12, height: 12, background: '#9c27b0', border: '1px solid #ccc', marginRight: 5}}></div>선택</span>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(10, 1fr)', 
              gap: '6px', 
              maxWidth: '400px',
              margin: '0 auto 30px auto'
            }}>
              {seats.map(s => (
                <div
                  key={s.id}
                  data-seat-id={s.id}
                  className={`seat ${s.is_booked ? 'booked' : 'available'} ${selectedSeat === s.id ? 'selected' : ''}`}
                  style={{
                    aspectRatio: '1/1',
                    backgroundColor: s.is_booked ? '#e0e0e0' : (selectedSeat === s.id ? '#9c27b0' : '#ffffff'),
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: s.is_booked ? '#999' : (selectedSeat === s.id ? 'white' : 'black'),
                    cursor: s.is_booked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => !s.is_booked && setSelectedSeat(s.id)}
                  title={s.id}
                >
                  {s.row}-{s.col}
                </div>
              ))}
            </div>
            
            {selectedSeat && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{margin: '0 0 10px 0'}}>선택된 좌석: <strong>{selectedSeat}</strong></p>
                <button 
                  id="btn-next-step" 
                  onClick={() => { setStep('captcha'); refreshCaptcha(); }}
                  style={{ padding: '12px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}
                >
                  다음 단계 (Next Step)
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'captcha' && (
          <div id="captcha-popup" style={{ textAlign: 'center', border: '1px solid #ffc9c9', padding: '30px', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
            <h2 style={{ color: '#e03131', marginTop: 0 }}>Security Check</h2>
            <p style={{color: '#666', fontSize: '14px'}}>부정 예매 방지를 위해 문자를 입력하세요.</p>
            
            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {captchaImg && <img src={captchaImg} alt="captcha" id="captcha-img" style={{ border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px', maxWidth: '100%' }} />}
              <button onClick={refreshCaptcha} style={{ fontSize: '13px', padding: '6px 12px', cursor: 'pointer', background: 'white', border: '1px solid #ccc', borderRadius: '4px' }}>이미지 새로고침 ↻</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                value={captchaInput} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaptchaInput(e.target.value)} 
                placeholder="6자리 숫자 입력" 
                id="captcha-input"
                style={{ padding: '12px', fontSize: '18px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '6px', letterSpacing: '5px' }}
              />
              <button 
                id="btn-open-payment" 
                onClick={openPaymentModal} 
                style={{ padding: '14px', backgroundColor: '#e03131', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
              >
                결제하기 (Pay)
              </button>
            </div>
          </div>
        )}

      </div>

      {showPaymentModal && (
        <div id="payment-modal" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(3px)'
        }}>
          <div style={{ background: 'white', width: '400px', height: '450px', padding: '0', position: 'relative', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {isPaymentLoading ? (
              <div id="payment-loading" style={{ textAlign: 'center', marginTop: '180px' }}>
                <h3 style={{color: '#333'}}>결제 모듈 로딩중...</h3>
                <div className="spinner" style={{margin: '15px auto', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <iframe 
                id="payment-frame" 
                src="/payment" 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="payment"
              />
            )}
            <button 
              onClick={() => setShowPaymentModal(false)} 
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}