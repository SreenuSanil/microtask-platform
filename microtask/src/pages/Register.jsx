import { useState } from "react";
import "./Register.css";
import logo from "../assets/tasknest.png";
import Home_bg from "../assets/Home-bg.png";
import { useNavigate } from "react-router-dom";



const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [paymentInfo, setPaymentInfo] = useState(null);

  const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  phone: "",
  pincode: "",
  city: "",
  skills: "",
  availability: "",
  organization: "",
  taskType: "",
  profileImage: null
});


const [errors, setErrors] = useState({});
const [paymentDone, setPaymentDone] = useState(false);


const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

const handleImageChange = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  // ✅ 2MB check
  if (file.size > 2 * 1024 * 1024) {
    alert("File is more than 2MB");
    e.target.value = ""; // reset input
    return;
  }

  setFormData({
    ...formData,
    profileImage: file,
  });
};


const handleWorkerPayment = async () => {
  try {
    // 1️⃣ create order from backend
    const res = await fetch(
      "http://localhost:5000/api/payment/create-order",
      { method: "POST" }
    );

    const order = await res.json();

    // 2️⃣ Razorpay options
    const options = {
      key: "rzp_test_RS7N4gK5yMwA9E", 
      amount: order.amount,
      currency: "INR",
      name: "TaskNest",
      description: "Worker Registration Fee",
      order_id: order.id,

      handler: async function (response) {
        // 3️⃣ verify payment
        const verifyRes = await fetch(
          "http://localhost:5000/api/payment/verify-payment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          }
        );

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          // ✅ PAYMENT SUCCESS
          
          setPaymentInfo({
  orderId: verifyData.payment.orderId,
  paymentId: verifyData.payment.paymentId,
  signature: verifyData.payment.signature,
});
setPaymentDone(true);

          alert("Payment successful (Test Mode)");
        } else {
          alert("Payment verification failed");
        }
      },

      theme: { color: "#2f80ed" },
    };

    // 4️⃣ open Razorpay checkout
    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error(error);
    alert("Payment failed");
  }
};




const validateForm = () => {
  let newErrors = {};

  if (!formData.name.trim()) {
    newErrors.name = "Full name is required";
  }

  if (!formData.email) {
    newErrors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = "Enter a valid email";
  }

  if (!formData.password) {
    newErrors.password = "Password is required";
  } else if (formData.password.length < 6) {
    newErrors.password = "Password must be at least 6 characters";
  }
  if (!formData.phone) {
  newErrors.phone = "Phone number is required";
} else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
  newErrors.phone = "Enter a valid 10-digit phone number";
}

if (!formData.pincode) {
  newErrors.pincode = "Pincode is required";
} else if (!/^\d{6}$/.test(formData.pincode)) {
  newErrors.pincode = "Enter a valid 6-digit pincode";
}

if (!formData.city.trim()) {
  newErrors.city = "City is required";
}


  if (role === "worker") {
    if (!formData.skills.trim()) {
      newErrors.skills = "Skills are required";
    }
  }

  if (role === "provider") {
    if (!formData.organization.trim()) {
      newErrors.organization = "Organization name is required";
    }
    if (!formData.taskType.trim()) {
      newErrors.taskType = "Task type is required";
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const scrollToFirstError = (errors) => {
  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    document.getElementById(firstErrorField)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};


const handleSubmit = async (e) => {
  e.preventDefault();

  // worker payment check
  if (role === "worker" && !paymentDone) {
    alert("Please complete payment before registering");
    return;
  }

  const isValid = validateForm();
  if (!isValid) {
    scrollToFirstError(errors);
    return;
  }

  try {
    const formPayload = new FormData();

    Object.keys(formData).forEach((key) => {
      formPayload.append(key, formData[key]);
    });

    formPayload.append("role", role);

    // 🔐 BACKEND PAYMENT ENFORCEMENT (IMPORTANT)
if (role === "worker") {
  if (!paymentInfo) {
    alert("Payment not verified");
    return;
  }

  formPayload.append(
    "payment",
    JSON.stringify(paymentInfo)
  );
}



    const response = await fetch(
      "http://localhost:5000/api/auth/register",
      {
        method: "POST",
        body: formPayload, // ✅ no headers
      }
    );

    const data = await response.json();

if (response.ok) {
  localStorage.setItem("verifyEmail", formData.email);
  navigate("/verify-email", {
    state: { email: formData.email },
  });
}
 else {
      alert(data.error || "Registration failed");
    }
  } catch (error) {
    console.error(error);
    alert("Server error");
  }
};




  return (
    <div className="register-root">

        <div className="register-card">
 
         <div className="back-home">
         <button
           type="button"
            onClick={() => {
              if (role) {
                setRole("");       // go back to role selection
            } else {
               window.location.href = "/"; // go back to home
            }
       }}
          title="Go Back"
          className="back-arrow"
          >
         ←
         </button>
        

          {/* Logo */}
          <div className="register-logo">
            <img src={logo} alt="TaskNest Logo" />
          </div>

          <h2>Create Your Account</h2>
          <p className="register-subtext">
            Choose your role and start using TaskNest
          </p>

          {/* ROLE SELECTION */}
          {!role && (
            <div className="role-selection">
              <button onClick={() => setRole("worker")}>
                I want to work
              </button>
              <button onClick={() => setRole("provider")}>
                I want to post tasks
              </button>
            </div>
          )}

          {/* REGISTRATION FORM */}
          {role && (
            <form className="register-form" onSubmit={handleSubmit}>


              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
                {errors.name && <span className="error">{errors.name}</span>}

              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input
                 type="email"
                 id="email"
                 name="email"
                 value={formData.email}
                 onChange={handleChange}
                 placeholder="Enter your email"
                />
                {errors.email && <span className="error">{errors.email}</span>}

              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                />
                 {errors.password && <span className="error">{errors.password}</span>}

              </div>

              <div className="input-group">
  <label>Phone Number</label>
  <input
    type="tel"
    id="phone"
    name="phone"
    value={formData.phone}
    onChange={handleChange}
    placeholder="Enter 10-digit phone number"
  />
  {errors.phone && <span className="error">{errors.phone}</span>}
</div>

<div className="input-group">
  <label>Pincode</label>
  <input
    type="text"
    id="pincode"
    name="pincode"
    value={formData.pincode}
    onChange={handleChange}
    placeholder="Enter your area pincode"
  />
  {errors.pincode && <span className="error">{errors.pincode}</span>}
</div>

<div className="input-group">
  <label>City</label>
  <input
    type="text"
    id="city"
    name="city"
    value={formData.city}
    onChange={handleChange}
    placeholder="Enter your city"
  />
  {errors.city && <span className="error">{errors.city}</span>}
</div>
<div className="input-group">
  <label>Profile Photo</label>
  <input
    type="file"
    id="profileImage"
    accept="image/*"
    onChange={handleImageChange}
  />
</div>



              {/* WORKER-SPECIFIC FIELDS */}
              {role === "worker" && (
                <>
                  <div className="input-group">
                    <label>Skills</label>
                    <input
                      type="text"
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="Eg: Plumbing, Local Service, Tutoring"
                    />
                    {errors.skills && <span className="error">{errors.skills}</span>}
                  </div>

                </>
              )}

{role === "worker" && (
  <div className="input-group worker-payment">
    {!paymentDone ? (
      <button type="button" onClick={handleWorkerPayment}>
        Pay Registration Fee
      </button>
    ) : (
      <p className="payment-success">✅ Payment Completed</p>
    )}
  </div>
)}



              {/* PROVIDER-SPECIFIC FIELDS */}
              {role === "provider" && (
                <>
                  <div className="input-group">
                    <label>Organization / Business Name</label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="Eg: Startup / Shop / Individual"
                    />
                    {errors.organization && <span className="error">{errors.organization}</span>}
                  </div>

                  <div className="input-group">
                    <label>Type of Tasks</label>
                    <input
                      type="text"
                      id="taskType"
                      name="taskType"
                      value={formData.taskType}
                      onChange={handleChange}
                      placeholder="Eg: Driving, Plumbing, Local services"
                    />
                    {errors.taskType && <span className="error">{errors.taskType}</span>}
                  </div>
                </>
              )}

              <button type="submit" className="register-btn-primary">
                Create Account
              </button>

              <div className="register-footer">
                <p>
                  Already have an account?{"  "}
                  <a href="/login"> Login</a>
                </p>
              </div>

            </form>
          )}

        </div>
      </div>

    </div>
  );
};

export default Register;
