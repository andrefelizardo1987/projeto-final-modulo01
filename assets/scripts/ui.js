// A interface ficará aqui para que as regras de comparação não dependam do HTML.
export function iniciarInterface() {
  const formulario = document.querySelector("#formulario-perfil");
  const status = document.querySelector("#status-analise");

  // Seguramos o envio para a página não recarregar antes de termos resultados para mostrar.
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    status.textContent = "A comparação com vagas será disponibilizada em breve.";
  });
}
