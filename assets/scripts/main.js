// Este é o ponto de entrada: ele junta os dados, a conta e a parte que aparece na tela.
import { carregarVagas, recuperarPerfil, salvarPerfil } from "./dados.js";
import { criarAnalisador } from "./motor.js";
import { iniciarInterface } from "./ui.js";

const analisar = criarAnalisador();
let catalogo = { estado: "carregando", vagas: [], mensagem: "Carregando vagas de exemplo..." };

const tela = iniciarInterface((perfil) => {
  // Guardamos o perfil completo para que os campos voltem preenchidos na próxima visita.
  tela.mostrarEstadoDoPerfilSalvo(salvarPerfil(perfil));

  if (catalogo.estado !== "sucesso") {
    tela.mostrarMensagem(catalogo.mensagem);
    return;
  }

  // O motor chama a função da tela só depois que termina de comparar as vagas.
  analisar(perfil, catalogo.vagas, (relatorio) => tela.mostrarRelatorio(perfil, relatorio));
});

// Ao abrir a página, os dados salvos voltam aos campos correspondentes.
tela.restaurarPerfil(recuperarPerfil());

carregarVagas({
  aoMudarEstado(estado) {
    catalogo = estado;
    tela.mostrarEstadoDasVagas(estado);
  },
});
