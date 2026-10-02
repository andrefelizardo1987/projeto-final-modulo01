import { converterCatalogo, normalizarHabilidades } from "./motor.js";

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
        ? "1 vaga carregada. Preencha o perfil para analisar."
        : `${vagas.length} vagas carregadas. Preencha o perfil para analisar.`;
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

export const CHAVE_PERFIL = "kingdev:perfil:v2";
const areasPermitidas = ["Front-End", "Back-End", "FullStack"];
const estadosPermitidos = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
const estadosCivisPermitidos = ["Solteiro", "Casado", "Viúvo"];

function selecionarDadosParaSalvar(perfil) {
  if (perfil === null || typeof perfil !== "object" || Array.isArray(perfil)) return null;

  const {
    nome, idade, dataNascimento, email, celular, cidade, estado, estadoCivil,
    possuiVeiculo, areaInteresse, habilidades, tempoExperienciaMeses,
  } = perfil;

  if (typeof nome !== "string" || nome.trim().length < 2) return null;
  if (!Number.isSafeInteger(idade) || idade < 0) return null;
  if (typeof dataNascimento !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) return null;
  const nascimento = new Date(`${dataNascimento}T00:00:00Z`);
  if (Number.isNaN(nascimento.getTime()) || nascimento.toISOString().slice(0, 10) !== dataNascimento || nascimento > new Date()) return null;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+$/.test(email.trim())) return null;
  if (typeof celular !== "string" || !/^[\d\s()+-]+$/.test(celular.trim())) return null;
  if (!/^(55)?\d{11}$/.test(celular.replace(/\D/g, ""))) return null;
  if (typeof cidade !== "string" || cidade.trim().length < 2) return null;
  if (!estadosPermitidos.has(estado) || !estadosCivisPermitidos.includes(estadoCivil)) return null;
  if (typeof possuiVeiculo !== "boolean") return null;
  if (!areasPermitidas.includes(areaInteresse) || !Array.isArray(habilidades)) return null;
  if (!habilidades.every((habilidade) => typeof habilidade === "string" && habilidade.trim())) return null;
  if (!Number.isSafeInteger(tempoExperienciaMeses) || tempoExperienciaMeses < 0) return null;

  const habilidadesLimpas = normalizarHabilidades(habilidades);
  if (habilidadesLimpas.length === 0) return null;

  // Copiamos somente os campos do formulário para restaurar o mesmo perfil depois.
  return {
    nome: nome.trim(), idade, dataNascimento, email: email.trim(), celular: celular.trim(),
    cidade: cidade.trim(), estado, estadoCivil, possuiVeiculo, areaInteresse,
    habilidades: habilidadesLimpas, tempoExperienciaMeses,
  };
}

export function salvarPerfil(perfil, armazenamento) {
  const dadosDoFormulario = selecionarDadosParaSalvar(perfil);
  if (!dadosDoFormulario) return { estado: "invalido" };

  try {
    // O navegador guarda texto; JSON.stringify transforma nosso objeto em texto.
    (armazenamento ?? globalThis.localStorage).setItem(CHAVE_PERFIL, JSON.stringify(dadosDoFormulario));
    return { estado: "salvo" };
  } catch {
    // A comparação continua funcionando mesmo quando o navegador bloqueia o armazenamento.
    return { estado: "indisponivel" };
  }
}

export function recuperarPerfil(armazenamento) {
  let textoSalvo;

  try {
    textoSalvo = (armazenamento ?? globalThis.localStorage).getItem(CHAVE_PERFIL);
  } catch {
    return { estado: "indisponivel", perfil: null };
  }

  if (textoSalvo === null) return { estado: "ausente", perfil: null };

  try {
    // JSON.parse devolve o objeto; conferimos seus campos antes de usá-lo na tela.
    const perfil = selecionarDadosParaSalvar(JSON.parse(textoSalvo));
    return perfil ? { estado: "recuperado", perfil } : { estado: "invalido", perfil: null };
  } catch {
    return { estado: "invalido", perfil: null };
  }
}
