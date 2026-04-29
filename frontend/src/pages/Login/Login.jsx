import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import "./login.css";

export default function Login() {
  const { login, isLoggingIn } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const validateFormValues = () => {
    if (!formData.email) return toast.error("Email is required");
    if (!formData.password) return toast.error("Password is required");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters long");
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validate = validateFormValues();
    if (validate === true) {
      login(formData);
    }
  };

  const FloatingOrb = ({ className, delay = 0 }) => (
    <div
      className={`floating-orb ${className}`}
      style={{
        animationDelay: `${delay}s`,
      }}
    />
  );

  return (
    <div className="login-page">
      {/* Floating Orbs */}
      <FloatingOrb className="orb orb-1" delay={0} />
      <FloatingOrb className="orb orb-2" delay={2} />
      <FloatingOrb className="orb orb-3" delay={4} />
      <div className="grid-pattern" />

      <div className="form-container">
        <div className="form-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue Real Time
            Collaborative To-Do Board</p>
        </div>
        <form onSubmit={handleSubmit} className="form-div">
          <div className="form-box">
            {/* Email */}
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className={`icon ${focusedField === "email" ? "active" : ""}`} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  autoComplete="off"
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className={`icon ${focusedField === "password" ? "active" : ""}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-visibility"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={isLoggingIn}
              className="submit-button"
              type="submit"
            >
              {isLoggingIn ? (
                <div className="loading">
                  <div className="spinner" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="login-content">
                  <LogIn />
                  <span>Sign In</span>
                </div>
              )}
            </button>

            {/* Footer */}
            <p className="footer-text">
              Don't have an account?{" "}
              <Link to="/signup" className="link">Sign Up</Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}
