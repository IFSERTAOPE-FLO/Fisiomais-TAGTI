import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function Footer() {
  const footerStyle = {
    backgroundColor: "#f8f9fa", // Fundo suave
    padding: "10px 0", // Reduzido o espaçamento interno
    position: "relative",
    width: "100%",
    marginTop: "50px", // Margem superior reduzida
    boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.1)", // Sombra adicionada diretamente
  };

  const iconColors = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    twitter: "#1DA1F2",
    linkedin: "#0077B5",
  };

  const hoverColors = {
    facebook: "#145DBF",
    instagram: "#D32E50",
    twitter: "#1488C6",
    linkedin: "#005582",
  };

  const iconStyle = {
    fontSize: "1.5rem", // Reduzido o tamanho dos ícones
    margin: "0 10px", // Reduzido o espaçamento entre ícones
    transition: "transform 0.3s, color 0.3s",
  };

  const handleHover = (e, hover = true, color) => {
    e.target.style.transform = hover ? "scale(1.2)" : "scale(1)";
    e.target.style.color = hover ? color : ""; // Cor no hover
  };

  return (
    <footer style={footerStyle} className="text-center">
      <div className="container">
        <p className="text-secondary mb-2" style={{ fontSize: "1rem" }}>
          Siga-nos nas redes sociais
        </p>
        <div className="mb-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...iconStyle, color: iconColors.facebook }}
            onMouseEnter={(e) => handleHover(e, true, hoverColors.facebook)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            <i className="bi bi-facebook"></i>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...iconStyle, color: iconColors.instagram }}
            onMouseEnter={(e) => handleHover(e, true, hoverColors.instagram)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            <i className="bi bi-instagram"></i>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...iconStyle, color: iconColors.twitter }}
            onMouseEnter={(e) => handleHover(e, true, hoverColors.twitter)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            <i className="bi bi-twitter"></i>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...iconStyle, color: iconColors.linkedin }}
            onMouseEnter={(e) => handleHover(e, true, hoverColors.linkedin)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            <i className="bi bi-linkedin"></i>
          </a>
        </div>
        <p className="text-secondary" style={{ fontSize: "0.8rem" }}>
          &copy; {new Date().getFullYear()} <b className="text-primary">Fisiomais</b>. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
