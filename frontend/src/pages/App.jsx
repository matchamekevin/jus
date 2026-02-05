import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import NosJus from "./NosJus";
import Contact from "./Contact";
import Track from "./Track";
import Confirmation from "./Confirmation";

// Modals
import AuthModal from "../components/AuthModal";
import AccountModal from "../components/AccountModal";
import CartModal from "../components/CartModal";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nos-jus" element={<NosJus />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/suivi" element={<Track />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="*" element={<Home />} />
      </Routes>

      {/* Modals globaux */}
      <AuthModal />
      <AccountModal />
      <CartModal />
    </>
  );
}

export default App;
