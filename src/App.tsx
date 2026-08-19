import { useState } from "react";
import "./App.css";

//state variables to handle loading and message
function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");

  //function to handle signup,
  // when being clicked the function updates the loading state to true and clears any previous messages.
  // It then sends a POST request to the signup endpoint with the email and password.
  //  If the response is not ok,
  // it throws an error with the message from the response.
  // If the signup is successful,
  //  it stores the token in the local storage and updates the message state to indicate success.
  //  If the request fails, it catches the error and updates the message state with the error message.
  // Finally, it sets the loading state back to false.
  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("dailyflow-token", data.token);
      setMessage("Signup successfull");
      console.log("Login response:", data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      setMessage(errorMessage);
      console.error("Login error", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ padding: "40px" }}>
      <button onClick={handleSignUp} disabled={loading}>
        {loading ? "Signing up..." : "Sign up"}
      </button>

      {message && <p>{message}</p>}
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
      />
    </div>
  );
}
export default App;
