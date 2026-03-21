import { NavLink } from "react-router-dom";

const links = [
  { to: "/",        label: "Home"           },
  { to: "/upload",  label: "Analyse"        },
  { to: "/builder", label: "Resume Builder" },
  { to: "/compare", label: "Compare"        },
  { to: "/tips",    label: "Interview Tips" },
];

export default function Navbar() {
  return (
    <nav style={{
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      padding: "0 1.5rem", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: "56px", position: "sticky",
      top: 0, zIndex: 100,
    }}>
      <NavLink to="/" style={{ fontWeight: 800, fontSize: "1.1rem",
                                color: "var(--text)", textDecoration: "none" }}>
        SkillForge
      </NavLink>
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            style={({ isActive }) => ({
              padding: "0.4rem 0.9rem", borderRadius: "8px",
              fontSize: "0.88rem", fontWeight: 600, textDecoration: "none",
              color: isActive ? "#fff" : "var(--muted)",
              background: isActive ? "var(--accent)" : "transparent",
              transition: "all 0.15s",
            })}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
