import React, { useEffect } from "react";

const PageWrapper = ({ title, children }) => {
    useEffect(() => {
        // Atualiza o título da página
        if (title) {
            document.title = title;
        }
    }, [title]); // Reexecuta o efeito apenas quando o título muda

    return <>{children}</>; // Renderiza os componentes filhos
};

export default PageWrapper;
