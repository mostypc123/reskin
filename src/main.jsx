import ReactDOM from "react-dom/client";
import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

import App from "./App";

(() => {
	invoke("init");
})();

document.addEventListener("contextmenu", event => event.preventDefault());

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);