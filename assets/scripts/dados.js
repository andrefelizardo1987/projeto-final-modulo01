import { converterCatalogo } from "./motor.js";

// O caminho nasce perto deste arquivo para também funcionar quando o site estiver em uma subpasta.
const caminhoPadrao = new URL("../data/vagas.json", import.meta.url);

function criarEstado(estado, mensagem, vagas = [], invalidos = []) {
  return { estado, mensagem, vagas, invalidos };
}

// A tela recebe um aviso no começo e outro no fim, como acompanhar uma encomenda.
export async function carregarVagas({
  buscar = fetch,
  aoMudarEstado = () => {},
  caminho = caminhoPadrao,
} = {}) {
  if (typeof buscar !== "function" || typeof aoMudarEstado !== "function") {
    throw new TypeError("A busca e o aviso de estado devem ser funções.");
  }

  aoMudarEstado(criarEstado("carregando", "Carregando vagas de exemplo..."));

  let resultado;
  let origemErro = "rede";

  try {
    const resposta = await buscar(caminho);
    origemErro = "http";

    if (!resposta.ok) {
      throw new Error("Resposta HTTP sem sucesso.");
    }

    origemErro = "json";
    const registros = await resposta.json();
    origemErro = "dados";
    const { vagas, invalidos } = converterCatalogo(registros);

    if (vagas.length === 0) {
      const mensagem = invalidos.length > 0
        ? "Nenhuma vaga válida foi encontrada no catálogo."
        : "Nenhuma vaga de exemplo está disponível no momento.";
      resultado = criarEstado("vazio", mensagem, [], invalidos);
    } else {
      const mensagem = vagas.length === 1
        ? "1 vaga de exemplo carregada. Preencha o perfil para analisar."
        : `${vagas.length} vagas de exemplo carregadas. Preencha o perfil para analisar.`;
      resultado = criarEstado(
        "sucesso",
        mensagem,
        vagas,
        invalidos,
      );
    }
  } catch {
    // A pessoa vê uma mensagem clara; detalhes técnicos ficam fora da interface.
    resultado = {
      ...criarEstado("erro", "Não foi possível carregar as vagas de exemplo."),
      origemErro,
    };
  }

  aoMudarEstado(resultado);
  return resultado;
}

// O salvamento local do perfil será acrescentado na etapa de persistência.
