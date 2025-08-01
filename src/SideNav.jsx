import "./SideNav.css";

export default function ({ onNavigate }) {
	const buttons = [
		{
			label: "Home",
			color: "#22332B",
			action: () => {
				if (onNavigate) onNavigate('home');
			},
		}, {
			label: "Theme Bundler",
			color: "#243B24",
			action: () => {
				if (onNavigate) onNavigate('bundler');
			}
		}, {
			label: "Theme Installer",
			color: "#3B2424",
			action: () => {
				if (onNavigate) onNavigate('installer');
			}
		}
	];
	return (
		<div id="sidenav">
			{buttons.map((button, i) => (
				<button
					key={i}
					className = "sidenav-button"
					style = {{
						backgroundColor: button.color,
						top: `${i * 70}px`
					}}
					onClick={ button.action }
				>
				{ button.label }
				</button>
			))}
		</div>
	);
};