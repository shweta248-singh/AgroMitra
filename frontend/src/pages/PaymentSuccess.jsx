import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import axios from 'axios'
import { useLanguage } from '../context/LanguageContext'
import '../components/landing.css'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Merchant Configuration
const MERCHANT_UPI  = import.meta.env.VITE_MERCHANT_UPI_ID || 'abhaypandey092004-2@oksbi'
const MERCHANT_NAME = 'AgroMitra'

/** Detect if the device is a mobile device */
const isMobileDevice = () => {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export default function PaymentSuccess() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  
  const [visible, setVisible] = useState(false)
  const [showPayNow, setShowPayNow] = useState(false)
  const [transactionId, setTransactionId] = useState("");

  // Persistence: Read from state or localStorage
  const orderId = state?.orderId || localStorage.getItem('lastOrderId')
  const amount  = state?.amount  || localStorage.getItem('lastOrderAmount') || 0
  const method  = state?.method  || 'cod'

  console.log("PAYMENT SUCCESS ORDER ID:", orderId);

  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Standard UPI deep link
  const upiUrl = `upi://pay?pa=${MERCHANT_UPI}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Order #' + (orderId || ''))}`;

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const shortId = orderId ? String(orderId).slice(0, 8).toUpperCase() : 'N/A'

  /** Handle UPI App redirection (Mobile Only) */
  const handlePayWithApp = () => {
    if (!isMobileDevice()) {
      alert("Desktop par UPI app open nahi hota. QR scan karein.");
      return;
    }
    window.location.href = upiUrl;
  }

  /** Update payment status via backend */
  const handlePaymentDone = async () => {
    const orderId = localStorage.getItem("lastOrderId");
    const token = localStorage.getItem("token");

    if (!orderId) {
      alert("Order ID missing");
      navigate("/my-orders");
      return;
    }

    if (!transactionId) {
      alert("Please enter UPI Transaction ID");
      return;
    }

    if (!token) {
      alert("Session expired. Please login again.");
      navigate('/buyer-login');
      return;
    }

    setProcessing(true)
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/orders/${orderId}/payment-status`,
        {
          transaction_id: transactionId,
          payment_method: "UPI",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("PAYMENT VERIFIED - Navigating to order-confirmed", { orderId, transactionId, amount });

      // Save confirmed order data for OrderConfirmed page (survives refresh)
      localStorage.setItem('confirmedOrderId', orderId);
      localStorage.setItem('confirmedTransactionId', transactionId);
      localStorage.setItem('confirmedAmount', amount);

      // Cleanup old pending keys
      localStorage.removeItem('lastOrderId')
      localStorage.removeItem('lastOrderAmount')
      localStorage.removeItem('orderId')

      // Redirect with full state
      navigate("/order-confirmed", {
        state: {
          orderId: orderId,
          transactionId: transactionId,
          amount: amount,
        }
      });

    } catch (err) {
      console.error("Payment Verification Error:", err);
      
      // Auto-logout on 401
      if (err.response?.status === 401) {
        localStorage.clear();
        sessionStorage.clear();
        alert("Your session has expired. Please login again.");
        navigate('/buyer-login');
        return;
      }

      alert(err.response?.data?.message || err.message || 'Failed to update payment status')
    } finally {
      setProcessing(false)
    }
  }

  const copyUpiId = () => {
    navigator.clipboard.writeText(MERCHANT_UPI)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="paysuccess-page">
      <div className={`paysuccess-card ${visible ? 'paysuccess-card--in' : ''}`}>
        
        {/* Status Icon */}
        <div className="paysuccess-icon-wrap">
          <div className="paysuccess-icon pending">
             <div className="pending-timer">⏳</div>
          </div>
        </div>

        <h1 className="paysuccess-heading">{t('paymentPage.success') || 'Order Placed!'}</h1>
        <p className="paysuccess-sub">Your order has been placed. Payment is pending.</p>

        {/* Info Card */}
        <div className="paysuccess-details">
          <div className="paysuccess-row">
            <span>Order ID</span>
            <strong>#{shortId}</strong>
          </div>
          <div className="paysuccess-row">
            <span>Payable Amount</span>
            <strong className="amount-text">₹{amount}</strong>
          </div>
          <div className="paysuccess-row">
            <span>Status</span>
            <span className="status-badge pending">⏳ PENDING</span>
          </div>
        </div>

        {/* UPI Payment Flow */}
        <div className="upi-flow-container">
           {!showPayNow ? (
              <button className="pay-now-trigger" onClick={() => setShowPayNow(true)}>
                 💳 Pay via UPI Now
              </button>
           ) : (
              <div className="upi-qr-section">
                 <div className="upi-id-box">
                    <code>{MERCHANT_UPI}</code>
                    <button onClick={copyUpiId} title="Copy UPI ID">
                      {copied ? '✅' : '📋'}
                    </button>
                 </div>

                 <div className="qr-container">
                    <QRCodeSVG value={upiUrl} size={200} includeMargin={true} />
                 </div>
                 
                 <p className="qr-instruction">Scan with GPay, PhonePe, or Paytm</p>

                 <div className="upi-input-group">
                    <label>Enter UPI Transaction ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789012" 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="txn-input"
                    />
                 </div>

                 <div className="action-buttons-group">
                    <button className="btn-app-pay" onClick={handlePayWithApp}>
                       🚀 Pay with UPI App
                    </button>
                    <button 
                      className="btn-verify-pay" 
                      onClick={handlePaymentDone}
                      disabled={processing}
                    >
                       {processing ? 'Verifying...' : '✅ I Have Paid'}
                    </button>
                 </div>

                 <button className="btn-back-mini" onClick={() => setShowPayNow(false)}>
                    Go Back
                 </button>
              </div>
           )}
        </div>

        {/* Navigation Actions */}
        <div className="paysuccess-actions">
          <Link to="/my-orders" className="btn-primary-pro">
            📦 View My Orders
          </Link>
          <Link to="/" className="btn-secondary-pro">
            🏠 Back to Home
          </Link>
        </div>
      </div>

      <style>{`
        .paysuccess-page { display: flex; align-items: center; justify-content: center; min-height: 90vh; padding: 20px; }
        .paysuccess-card { background: white; width: 100%; max-width: 480px; padding: 40px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; transform: translateY(20px); opacity: 0; transition: all 0.5s ease; }
        .paysuccess-card--in { transform: translateY(0); opacity: 1; }
        
        .paysuccess-icon-wrap { margin-bottom: 24px; }
        .pending-timer { font-size: 50px; animation: pulse 2s infinite; }
        
        .paysuccess-heading { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
        .paysuccess-sub { color: #64748b; margin-bottom: 32px; }
        
        .paysuccess-details { background: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #e2e8f0; }
        .paysuccess-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
        .paysuccess-row span { color: #64748b; }
        .amount-text { color: #15803d !important; font-size: 18px; }
        
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .status-badge.pending { background: #fef9c3; color: #854d0e; }
        
        .upi-flow-container { margin-bottom: 32px; }
        .pay-now-trigger { width: 100%; background: #15803d; color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        
        .upi-qr-section { background: white; border: 1px solid #e2e8f0; padding: 24px; border-radius: 20px; }
        .upi-id-box { display: flex; align-items: center; justify-content: center; gap: 10px; background: #f1f5f9; padding: 8px 16px; border-radius: 10px; margin-bottom: 20px; }
        .upi-id-box code { font-size: 13px; color: #475569; }
        
        .upi-input-group { text-align: left; margin-bottom: 24px; }
        .upi-input-group label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
        .txn-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 15px; outline: none; }
        .txn-input:focus { border-color: #2563eb; ring: 2px solid #dbeafe; }
        
        .action-buttons-group { display: flex; flex-direction: column; gap: 12px; }
        .btn-app-pay { background: #2563eb; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn-verify-pay { background: #16a34a; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn-back-mini { background: none; border: none; color: #94a3b8; font-size: 13px; margin-top: 16px; cursor: pointer; }
        
        .paysuccess-actions { display: flex; flex-direction: column; gap: 12px; }
        .btn-primary-pro { background: #1e293b; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 600; }
        .btn-secondary-pro { background: #f1f5f9; color: #475569; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 600; }

        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
      `}</style>
    </section>
  )
}
