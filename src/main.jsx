// Import necessary components
import ReactDOM from "react-dom/client";
import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
// Import the App component
import App from "./App";

// Invoke the backend init() function
(() => {
	invoke("init");
})();

document.addEventListener("contextmenu", event => event.preventDefault());

// Render the application view with the App component
ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);