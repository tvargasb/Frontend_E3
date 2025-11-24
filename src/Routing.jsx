import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar'; 
import HomePage from './pages/HomePage';
import InstruccionesPage from './pages/InstruccionesPage';
import NosotrosPage from './pages/NosotrosPage';
import GamePage from './pages/GamePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RutaProtegida from './components/RutaProtegida';
import LobbyPage from './pages/LobbyPage';
import SalaEsperaPage from './pages/SalaEsperaPage';
import RutaAdmin from './components/RutaAdmin';
import AdminDashboardPage from './pages/AdminDashboardPage';
import HistoryPage from './pages/HistoryPage';


function Routing() {
  return (
    <>
      <NavBar /> 
      <main className="page-content">
        <Routes>

          {/*Rutas publicas*/}
          <Route path="/" element={<HomePage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/instrucciones" element={<InstruccionesPage />} />
          <Route path="/nosotros" element={<NosotrosPage />} />

          {/*Ruta protegida*/}
          <Route 
            path="/juego" 
            element={
              <RutaProtegida>
                <LobbyPage/>
              </RutaProtegida>
            } 
          />
          <Route 
            path="/partida/:id" 
            element={
              <RutaProtegida>
                <SalaEsperaPage />
              </RutaProtegida>
            }
            />
          <Route 
            path="/juego/:id" 
            element={
              <RutaProtegida>
                <GamePage /> 
              </RutaProtegida>
            }
          />
          <Route 
            path="/historial" 
            element={
              <RutaProtegida>
                <HistoryPage />
              </RutaProtegida>
            } 
          />
          {/* Ruta protegida para admin */}
          <Route 
            path="/admin/dashboard" 
            element={
              <RutaAdmin>
                <AdminDashboardPage />
              </RutaAdmin>
            }
            />
        </Routes>        
      </main>
    </>
  );
}

export default Routing;