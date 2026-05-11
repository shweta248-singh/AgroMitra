import { supabase } from "../config/supabase.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized. No token provided." });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    req.user = user; // attach supabase user data

    // Fetch additional role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      req.user.role = profile.role;
      // Handle "both" role for compatibility with frontend/middleware that checks roles array
      if (profile.role === "both") {
        req.user.roles = ["buyer", "farmer", "both"];
      } else {
        req.user.roles = [profile.role];
      }
    } else {
      req.user.role = user.user_metadata?.role || 'buyer';
      req.user.roles = [req.user.role];
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};
export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};
