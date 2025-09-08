import "./ThemeRow.css";
import ThemeCard from "./ThemeCard";

export default function ThemeRow({ title, themes, onThemeClick }) {
  return (
    <div className="theme-row">
      <div className="theme-row-header">
        <h2 className="theme-row-title">{title}</h2>
      </div>
      <div className="theme-row-scroll">
        <div className="theme-list-horizontal">
          {themes.map(theme => (
            <ThemeCard key={theme.name} theme={theme} onClick={() => onThemeClick && onThemeClick(theme)} />
          ))}
        </div>
      </div>
    </div>
  );
}