import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../assets/styles/NavBar.css';


function NavBar() {
  const { token, logout, user } = useAuth();

  return (
    <nav className="navbar"> 
      <div className="nav-links">
        <Link to="/">Home (STAR RISK)</Link>
        <Link to="/instrucciones">Instrucciones</Link>
        <Link to="/nosotros">Nosotros</Link>
        {token && <Link to="/juego">Ir a Partida</Link>}
        {token && user?.rol === 'admin' && (<Link to="/admin/dashboard">Admin Dashboard</Link>)}
        {token && (
            <>
                <Link to="/juego">Jugar</Link>
                <Link to="/historial">Historial</Link>
            </>
        )}
      </div>

      <div className="nav-auth">
        {token ? (
          <>
            <button onClick={logout} className="nav-button-logout">
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/registro">Registro</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;