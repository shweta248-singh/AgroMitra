import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { sendOtpEmail } from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendRegisterOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("otp_verifications")
      .update({ is_used: true })
      .eq("email", email)
      .eq("purpose", "register");

    const hashedOtp = await bcrypt.hash(otp, 10);

    const { error } = await supabaseAdmin.from("otp_verifications").insert({
      email,
      otp_code: hashedOtp,
      purpose: "register",
      expires_at: expiresAt,
      is_used: false,
    });

    if (error) throw error;

    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "OTP send failed" });
  }
}

export async function verifyRegisterOtp(req, res) {
  try {
    const { full_name, email, phone, password, role, otp, gst_number, gst_verified, business_name } = req.body;

    if (!full_name || !email || !password || !role || !otp) {
      return res.status(400).json({ message: "All required fields are missing" });
    }

    // 1. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    const { data: otpRecords, error: otpError } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("purpose", "register")
      .eq("is_used", false)
      .order("created_at", { ascending: false });

    if (otpError || !otpRecords || otpRecords.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    let otpRecord = null;
    for (const record of otpRecords) {
      const isMatch = await bcrypt.compare(otp, record.otp_code);
      if (isMatch) {
        otpRecord = record;
        break;
      }
    }

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // 7. Normalize role
    const safeRole = String(role || "buyer").trim().toLowerCase();
    const finalRole = safeRole === "seller" ? "farmer" : safeRole;

    // 1 & 4. Create or find Supabase Auth user
    let userId = null;

    // Try to create the user first
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        role: finalRole
      }
    });

    if (authError) {
      // If user already exists, find them by email
      if (authError.message.includes("already registered") || authError.status === 422) {
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingAuthUser = usersData.users.find(u => u.email === normalizedEmail);
        if (!existingAuthUser) {
          throw new Error("User already registered but could not be retrieved.");
        }
        userId = existingAuthUser.id;

        // Force update the user to be confirmed and have correct metadata/password
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: { full_name, phone, role: finalRole }
        });
      } else {
        throw authError;
      }
    } else {
      userId = authData.user.id;
    }

    // 9. Log Auth User status
    console.log("AUTH USER CREATED/FOUND:", userId);

    // 6. Upsert public.profiles
    const profileData = {
      id: userId,
      full_name,
      email: normalizedEmail,
      phone,
      role: finalRole,
      is_active: true,
      is_verified: true,
      updated_at: new Date().toISOString()
    };

    // If role is farmer, add GST details if present
    if (finalRole === "farmer" && gst_number) {
      profileData.gst_number = gst_number;
      profileData.gst_verified = gst_verified || false;
      profileData.business_name = business_name || null;
      profileData.gst_verified_at = gst_verified ? new Date().toISOString() : null;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profileData);

    if (profileError) {
      console.error("Supabase Admin profiles upsert error:", profileError.message);
      throw profileError;
    }

    // 9. Log Profile status
    console.log("PROFILE UPSERT SUCCESS:", normalizedEmail);

    // Mark OTP as used
    await supabaseAdmin
      .from("otp_verifications")
      .update({ is_used: true })
      .eq("id", otpRecord.id);

    res.status(201).json({
      message: "Registration successful",
      user: { id: userId, email: normalizedEmail },
    });
  } catch (error) {
    console.error("REGISTRATION FLOW ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed"
    });
  }
}

export async function saveLoginLog(req, res) {
  try {
    const { user_id, email, role } = req.body;

    if (!user_id || !email || !role) {
      return res.status(400).json({ message: "Login log data missing" });
    }

    const { error } = await supabaseAdmin.from("login_logs").insert({
      user_id,
      email,
      role,
    });

    if (error) throw error;

    res.json({ message: "Login saved" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Login log failed" });
  }
}