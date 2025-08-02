import ReactDOM from "react-dom/client";
import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import App from "./App";
import SideNav from "./SideNav";

(() => {
	invoke("init");
})();

document.addEventListener("contextmenu", event => event.preventDefault());
// Removed splashscreen logic

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

// (async () => {
// 	await invoke("init").then((a) => {
// 		console.log("Tauri initialized", a);
// 	});
// })();

// (async () => {
// 	useEffect(() => {
// 		const unlisten = listen("welcome", (event) => {
// 			console.log("Received event:", event.payload);
// 			console.log(event);
// 		});
// 		return () => {
// 			unlisten.then(f => f());
// 		};
// 	}, []);
// })();