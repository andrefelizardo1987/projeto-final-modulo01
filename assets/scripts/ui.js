// A interface ficará aqui para que as regras de comparação não dependam do HTML.
export function iniciarInterface() {
  const formulario = document.querySelector("#formulario-perfil");
  const status = document.querySelector("#status-analise");
  let estadoDasVagas = "carregando";

  // Seguramos o envio para a página não recarregar antes de termos resultados para mostrar.
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (estadoDasVagas === "sucesso") {
      status.textContent = "As vagas estão prontas. A comparação do perfil será ligada na próxima etapa.";
    }
  });

  // O mesmo lugar da tela mostra carregamento, sucesso, lista vazia ou erro.
  return function mostrarEstadoDasVagas({ estado, mensagem }) {
    estadoDasVagas = estado;
    status.textContent = mensagem;
  };
}
