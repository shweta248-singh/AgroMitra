import { supabaseAdmin } from "../config/supabaseAdmin.js";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendAadhaarOtp(req, res) {
  console.log("SEND AADHAAR OTP CONTROLLER HIT");
  try {
    console.log("=========================================");
    console.log("[DEBUG] API HIT: POST /api/auth/seller/send-aadhaar-otp");
    
    const { email, phone, aadhaar_number } = req.body;

    if (!email || !phone || !aadhaar_number) {
      console.log("[DEBUG] Validation Failed: Missing fields");
      return res.status(400).json({ message: "Email, phone, and Aadhaar number are required" });
    }

    // Validate 12 digit Aadhaar
    if (!/^\d{12}$/.test(aadhaar_number)) {
      console.log("[DEBUG] Validation Failed: Invalid Aadhaar format");
      return res.status(400).json({ message: "Aadhaar number must be 12 digits" });
    }

    const aadhaar_last4 = aadhaar_number.slice(-4);
    const otp = generateOtp();
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEBUG] Generated OTP:", otp);
    }
    
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    console.log("[DEBUG] Inserting into Supabase seller_aadhaar_verifications table...");
    // Insert into seller_aadhaar_verifications table
    const { error } = await supabaseAdmin.from("seller_aadhaar_verifications").insert({
      email,
      phone,
      aadhaar_last4,
      otp_code: otp,
      expires_at: expiresAt,
      is_verified: false,
    });

    if (error) {
      console.error("[DEBUG] Supabase Aadhaar Insert Error:", error);
      throw error;
    }

    console.log("[DEBUG] Insert successful.");

    // MOCK SMS SENDING
    if (process.env.NODE_ENV !== "production") {
      console.log("=========================================");
      console.log(`[MOCK SMS] To: ${phone}`);
      console.log(`[MOCK SMS] OTP: ${otp}`);
      console.log("=========================================");
    }

    res.json({ message: "Aadhaar OTP sent successfully" });
  } catch (error) {
    console.error("[DEBUG] Catch Block Error:", error);
    res.status(500).json({ message: error.message || "Aadhaar OTP send failed" });
  }
}

export async function verifyAadhaarOtp(req, res) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    // Find the latest unverified OTP for this phone
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from("seller_aadhaar_verifications")
      .select("*")
      .eq("phone", phone)
      .eq("otp_code", otp)
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Mark as verified
    const { error: updateError } = await supabaseAdmin
      .from("seller_aadhaar_verifications")
      .update({ is_verified: true })
      .eq("id", otpRecord.id);

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: "Aadhaar OTP verified successfully",
      aadhaar_last4: otpRecord.aadhaar_last4,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Aadhaar OTP verification failed" });
  }
}
