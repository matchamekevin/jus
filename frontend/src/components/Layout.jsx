import { Outlet, useLocation } from "react-router-dom";

function Layout() {
  const location = useLocation();
  
  // La page Home a son propre layout complet
  if (location.pathname === "/") {
    return <Outlet />;
  }

  return (
    <>
      <nav className="header">
        <a href="/" className="logo">🥤 JusTogo</a>
        <div className="nav">
          <a href="/#produits">Nos Jus</a>
          <a href="/track">Suivi</a>
        </div>
      </nav>
      
      <main style={{ minHeight: "80vh", padding: "40px 24px" }}>
        <Outlet />
      </main>

      <footer className="footer">
        <p>🥤 JusTogo · Jus naturels du Togo</p>
        <p>© 2026</p>
      </footer>
    </>
  );
}

export default Layout;
