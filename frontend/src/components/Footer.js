import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function Footer() {
  const footerStyle = {
    backgroundColor: "#efefef", 
    color: "#5b0d30",
    padding: "7px 0",
    position: "relative",  

    width: "100%",
    zIndex: 1000,
    marginTop: "100px",  // Garante que o footer fica na parte inferior da tela
  };

  const iconColors = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    twitter: "#1DA1F2",
    linkedin: "#0077B5",
  };

  const hoverColors = {
    facebook: "#145DBF", // Azul mais escuro
    instagram: "#D32E50", // Rosa mais vibrante
    twitter: "#1488C6", // Azul mais forte
    linkedin: "#005582", // Azul escuro
  };

  const iconStyle = {
    fontSize: "1.6rem",
    margin: "0 15px",
    transition: "transform 0.3s, color 0.3s",
  };

  const handleHover = (e, hover = true, color) => {
    e.target.style.transform = hover ? "scale(1.3)" : "scale(1)";
    e.target.style.color = hover ? color : ""; // Cor no hover
  };

  return (
    
    <footer style={footerStyle} className="text-center">
      <div className="container">
        <p className="mb-3" style={{ fontSize: "1.1rem", fontWeight: "500" }}>
          Siga-nos nas redes sociais
        </p>
        <div>
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
        <p className="mt-3" style={{ fontSize: "0.9rem" }}>
          &copy; {new Date().getFullYear()} <b>Fisiomais</b>. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
