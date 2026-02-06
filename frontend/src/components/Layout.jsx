import { Outlet, useLocation } from "react-router-dom";
import { FiDroplet } from 'react-icons/fi';
import Footer from './Footer';

function Layout() {
  const location = useLocation();
  
  // La page Home a son propre layout complet
  if (location.pathname === "/") {
    return <Outlet />;
  }

  return (
    <>
      <nav className="header">
        <a href="/" className="logo"><FiDroplet style={{ marginRight: 8 }} />JusTogo</a>
        <div className="nav">
          <a href="/#produits">Nos Jus</a>
          <a href="/track">Suivi</a>
        </div>
      </nav>
      
      <main style={{ minHeight: "80vh", padding: "40px 24px" }}>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default Layout;
