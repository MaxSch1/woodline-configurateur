import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Routeur a diese : l'application s'ouvre depuis n'importe ou — serveur de dev,
        apercu du build, hebergement statique sans regle de reecriture, ou fichier
        ouvert a la main. Aucune route ne peut plus rendre un 404 ni une page blanche. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
