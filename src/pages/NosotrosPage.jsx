import React from 'react';
import '../assets/styles/StaticPage.css';

function NosotrosPage() {
  return (
    <div className="static-page-container">
      <h1>Equipo HTML3</h1>

      <p>
        Somos un grupo de estudiantes de Ingeniería Civil
        de la Pontificia Universidad Católica de Chile, cursando Tecnologías y 
        Aplicaciones Web (IIC2513) en el semestre 2025-2.
      </p>

      <p>
        Este proyecto es el resultado de nuestro trabajo en la implementación de un 
        backend con Koa.js y un frontend con React.
      </p>

      <section className="team-section">
        <h2>Integrantes</h2>

        <div className="team-member-card">
          <h3>Tomas Vargas</h3>
          <p>Dato Freak: Le tengo fobia a las aves</p>
          <p>Email: t.vargas.b@uc.cl</p>
        </div>

        <div className="team-member-card">
          <h3>Cristian Troncoso</h3>
          <p>Dato Freak: algo</p>
          <p>Email: indicar mail</p>
        </div>

        <div className="team-member-card">
          <h3>Nicolás Van Weezel</h3>
          <p>Dato Freak: algo</p>
          <p>Email: nvanweezel@uc.cl</p>
        </div>
      </section>
    </div>
  );
}

export default NosotrosPage;
