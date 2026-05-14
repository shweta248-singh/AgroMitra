// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { generateToken } from "../utils/generateToken.js";
// import { OAuth2Client } from "google-auth-library";
// import { sendEmail } from "../utils/sendEmail.js";
// import { generateOTP } from "../utils/generateOTP.js";
// import { supabase } from "../config/supabase.js";

// /**
//  * =========================
//  * COMMON VALIDATION FUNCTION
//  * =========================
//  */
// const validateUser = (name, email, password) => {
//   if (!name || !email || !password) {
//     return "All fields required";
//   }

//   const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;

//   if (!passwordRegex.test(password)) {
//     return "Password must contain letter, number & special character";
//   }

//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return "Invalid email format";
//   }

//   return null;
// };

// /**
//  * =========================
//  * REGISTER USER (Buyer or Seller)
//  * =========================
//  */
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, role, full_name } = req.body;
    
//     const userName = name || full_name;

//     const errorMsg = validateUser(userName, email, password);
//     if (errorMsg) {
//       return res.status(400).json({ message: errorMsg });
//     }

//     const assignedRole = role === "seller" || role === "farmer" ? "farmer" : "buyer";

//     // 🔍 CHECK DUPLICATE FROM DB
//     const { data: existingUser } = await supabase
//       .from("users")
//       .select("*")
//       .eq("email", email)
//       .single();

//     if (existingUser) {
//       // If already verified
//       if (existingUser.is_verified) {
//         return res.status(400).json({ message: "Email already registered" });
//       } else {
//         // Delete unverified existing user to allow re-registration
//         await supabase.from("users").delete().eq("email", email);
//       }
//     }

//     // 🔐 HASH PASSWORD
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 🔢 OTP GENERATE
//     const otp = generateOTP();
//     console.log(`[DEBUG] Generated OTP for ${email}: ${otp}`);

//     // 💾 SAVE IN DATABASE
//     const { error } = await supabase.from("users").insert([
//       {
//         name: userName,
//         email,
//         password: hashedPassword,
//         role: assignedRole,
//         is_verified: false,
//         otp,
//         otp_expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
//         otp_attempts: 0,
//       },
//     ]);

//     if (error) {
//       return res.status(400).json({ message: error.message });
//     }

//     try {
//       await sendEmail(email, otp);
//     } catch (emailErr) {
//       console.error("Error sending email:", emailErr);
//       return res.status(500).json({ message: "Registration successful, but failed to send OTP email. Please check your SMTP configuration." });
//     }

//     res.status(201).json({
//       message: "Registered successfully. Please verify OTP sent to your email.",
//     });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * =========================
//  * REGISTER SELLER (Alias)
//  * =========================
//  */
// export const registerSeller = async (req, res) => {
//   req.body.role = "seller";
//   return registerUser(req, res);
// };

// /**
//  * =========================
//  * VERIFY OTP
//  * =========================
//  */
// export const verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const { data: user, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("email", email)
//       .single();

//     if (error || !user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     if (user.is_verified) {
//       return res.status(400).json({ message: "User is already verified" });
//     }

//     if (user.otp_attempts >= 5) {
//       return res.status(429).json({ message: "Too many attempts. Please register again." });
//     }

//     if (new Date() > new Date(user.otp_expiry)) {
//       return res.status(400).json({ message: "OTP expired" });
//     }

//     if (user.otp !== otp) {
//       await supabase.from("users").update({ otp_attempts: user.otp_attempts + 1 }).eq("email", email);
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     // Success
//     const { error: updateError } = await supabase
//       .from("users")
//       .update({
//         is_verified: true,
//         otp: null,
//         otp_expiry: null,
//         otp_attempts: 0,
//       })
//       .eq("email", email);

//     if (updateError) {
//       throw updateError;
//     }

//     res.json({ message: "Email verified successfully" });

//   } catch (error) {
//     console.error("Verify OTP error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * =========================
//  * LOGIN
//  * =========================
//  */
// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const { data: user, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("email", email)
//       .single();

//     if (error || !user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     if (!user.is_verified) {
//       return res.status(403).json({ message: "Please verify your email first" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = generateToken({
//       id: user.id,
//       email: user.email,
//       role: user.role,
//     });

//     res.json({
//       message: "Login successful",
//       token,
//       role: user.role,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       }
//     });

//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * =========================
//  * GOOGLE LOGIN
//  * =========================
//  */
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// export const googleLogin = async (req, res) => {
//   try {
//     const { token } = req.body;

//     if (!process.env.GOOGLE_CLIENT_ID) {
//       return res.status(500).json({ message: "Google Client ID not configured" });
//     }

//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const { email, name, sub } = payload;

//     let { data: user } = await supabase
//       .from("users")
//       .select("*")
//       .eq("email", email)
//       .single();

//     if (!user) {
//       // Create user
//       const { data: newUser, error } = await supabase.from("users").insert([
//         {
//           name,
//           email,
//           password: null,
//           role: "buyer",
//           is_verified: true, // Google accounts are implicitly verified
//         },
//       ]).select().single();
      
//       if (error) throw error;
//       user = newUser;
//     }

//     const jwtToken = generateToken({
//       id: user.id,
//       email: user.email,
//       role: user.role,
//     });

//     res.json({
//       message: "Google login successful",
//       token: jwtToken,
//       user: {
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });

//   } catch (error) {
//     console.error("Google login error:", error);
//     res.status(401).json({ message: "Invalid Google token", error: error.message });
//   }
// };


import { OAuth2Client } from "google-auth-library";
import { generateToken } from "../utils/generateToken.js";
import { supabase } from "../config/supabase.js";

const validateUser = (name, email, password) => {
  if (!name || !email || !password) {
    return "All fields required";
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;

  if (!passwordRegex.test(password)) {
    return "Password must contain letter, number & special character";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  return null;
};

export const registerUser = async (req, res) => {
  try {
    const { name, full_name, email, password, role, phone, gst_number } = req.body;

    const userName = name || full_name;
    const normalizedEmail = email?.trim().toLowerCase();

    const errorMsg = validateUser(userName, normalizedEmail, password);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const assignedRole =
      role === "seller" || role === "farmer" ? "farmer" : "buyer";

    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: frontendUrl ? `${frontendUrl}/login` : undefined,
        data: {
          name: userName,
          full_name: userName,
          phone: phone || "",
          role: assignedRole,
        },
      },
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    const authUser = authData?.user;

    if (!authUser) {
      return res.status(400).json({
        message: "Registration failed. Please try again.",
      });
    }

    await supabase.from("users").upsert(
      {
        id: authUser.id,
        name: userName,
        email: normalizedEmail,
        role: assignedRole,
        phone: phone || null,
        gst_number: assignedRole === "farmer" ? gst_number || null : null,
        is_verified: false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    return res.status(201).json({
      message:
        "Registration successful. Please check your email and confirm your account before login.",
      user: {
        id: authUser.id,
        name: userName,
        email: normalizedEmail,
        role: assignedRole,
        is_verified: false,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const registerSeller = async (req, res) => {
  req.body.role = "seller";
  return registerUser(req, res);
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (authError) {
      if (
        authError.message?.toLowerCase().includes("email not confirmed") ||
        authError.message?.toLowerCase().includes("not confirmed")
      ) {
        return res.status(403).json({
          message: "Please confirm your email first. Check your inbox.",
        });
      }

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const authUser = authData.user;

    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!user) {
      const role = authUser.user_metadata?.role || "buyer";
      const name =
        authUser.user_metadata?.name ||
        authUser.user_metadata?.full_name ||
        normalizedEmail.split("@")[0];

      const { data: createdUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            id: authUser.id,
            name,
            email: normalizedEmail,
            role,
            is_verified: true,
          },
        ])
        .select("*")
        .single();

      if (createError) {
        return res.status(400).json({ message: createError.message });
      }

      user = createdUser;
    } else if (!user.is_verified) {
      const { data: updatedUser } = await supabase
        .from("users")
        .update({
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id)
        .select("*")
        .single();

      user = updatedUser || user;
    }

    const token = generateToken({
      id: authUser.id,
      email: normalizedEmail,
      role: user.role,
    });

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: {
        id: authUser.id,
        name: user.name,
        email: normalizedEmail,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  return res.status(410).json({
    message:
      "OTP verification is disabled. Please use Supabase email confirmation.",
  });
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        message: "Google Client ID not configured",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    const normalizedEmail = email.trim().toLowerCase();

    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!user) {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            name,
            email: normalizedEmail,
            role: "buyer",
            is_verified: true,
          },
        ])
        .select("*")
        .single();

      if (error) throw error;
      user = newUser;
    }

    const jwtToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      message: "Google login successful",
      token: jwtToken,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({
      message: "Invalid Google token",
      error: error.message,
    });
  }
};

export const registerProfile = async (req, res) => {
  try {
    const { name, full_name, email, phone, role, gst_number } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const userName = name || full_name;
    const newRole = role === "seller" || role === "farmer" ? "farmer" : "buyer";

    if (!normalizedEmail || !userName || !newRole) {
      return res.status(400).json({
        message: "Name, email and role are required",
      });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    let finalRole = newRole;

    if (existingUser?.role) {
      const oldRole = existingUser.role;

      if (oldRole === newRole) {
        finalRole = oldRole;
      } else if (
        (oldRole === "buyer" && newRole === "farmer") ||
        (oldRole === "farmer" && newRole === "buyer") ||
        oldRole === "both"
      ) {
        finalRole = "both";
      }
    }

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          name: existingUser.name || userName,
          phone: phone || existingUser.phone || null,
          role: finalRole,
          gst_number: gst_number || existingUser.gst_number || null,
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("email", normalizedEmail)
        .select("*")
        .single();

      if (updateError) {
        return res.status(400).json({ message: updateError.message });
      }

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    }

    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          name: userName,
          email: normalizedEmail,
          phone: phone || null,
          role: finalRole,
          gst_number: gst_number || null,
          is_verified: true,
        },
      ])
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(201).json({
      message: "Profile created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Register profile error:", error);
    return res.status(500).json({ message: error.message });
  }
};
