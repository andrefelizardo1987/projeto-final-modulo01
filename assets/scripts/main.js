// Este é o ponto de entrada: ele junta os dados, a conta e a parte que aparece na tela.
import { carregarVagas, recuperarPerfil, salvarPerfil } from "./dados.js";
import { criarAnalisador } from "./motor.js";
import { iniciarInterface } from "./ui.js";

const analisar = criarAnalisador();
let catalogo = { estado: "carregando", vagas: [], mensagem: "Carregando vagas de exemplo..." };

let carregamentoVagas;
const tela = iniciarInterface(async (perfil) => {
  // Guardamos o perfil completo para que os campos voltem preenchidos na próxima visita.
  tela.mostrarEstadoDoPerfilSalvo(salvarPerfil(perfil));

  // Se a pessoa clicar antes do fim do fetch, esperamos os dados para não perder a análise.
  if (catalogo.estado === "carregando") await carregamentoVagas;

  if (catalogo.estado !== "sucesso") {
    tela.mostrarMensagem(catalogo.mensagem);
    return;
  }

  // O motor chama a função da tela só depois que termina de comparar as vagas.
  analisar(perfil, catalogo.vagas, (relatorio) => tela.mostrarRelatorio(perfil, relatorio));
});

// Ao abrir a página, os dados salvos voltam aos campos correspondentes.
tela.restaurarPerfil(recuperarPerfil());

carregamentoVagas = carregarVagas({
  aoMudarEstado(estado) {
    catalogo = estado;
    tela.mostrarEstadoDasVagas(estado);
  },
});
