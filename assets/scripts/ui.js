import { normalizarHabilidades } from "./motor.js";

const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function criarElemento(tipo, texto, classe = "") {
  const elemento = document.createElement(tipo);
  // textContent mostra o que foi digitado como texto, sem transformá-lo em código HTML.
  elemento.textContent = texto;
  if (classe) elemento.className = classe;
  return elemento;
}

function criarListaDeHabilidades(habilidades) {
  const lista = document.createElement("ul");
  const itens = habilidades.length > 0 ? habilidades : ["Nenhuma"];
  itens.forEach((habilidade) => lista.append(criarElemento("li", habilidade)));
  return lista;
}

function criarCartaoDaVaga(resultado) {
  const { vaga, percentual, classificacao, habilidadesAtendidas, habilidadesFaltantes } = resultado;
  const cartao = document.createElement("article");
  cartao.className = "cartao-vaga";

  cartao.append(
    criarElemento("h3", vaga.cargo),
    criarElemento("p", vaga.empresa),
    criarElemento("p", `Modalidade: ${vaga.modalidade}`),
    criarElemento("p", `Salário de exemplo: ${dinheiro.format(vaga.salario)}`),
    criarElemento("p", `Compatibilidade: ${percentual}% — ${classificacao}`, "percentual-vaga"),
  );

  const atendidas = document.createElement("div");
  atendidas.className = "grupo-habilidades";
  atendidas.append(criarElemento("h4", "Habilidades atendidas"), criarListaDeHabilidades(habilidadesAtendidas));

  const faltantes = document.createElement("div");
  faltantes.className = "grupo-habilidades";
  faltantes.append(criarElemento("h4", "Habilidades faltantes"), criarListaDeHabilidades(habilidadesFaltantes));

  cartao.append(atendidas, faltantes);
  return cartao;
}

export function iniciarInterface(aoEnviarPerfil) {
  const formulario = document.querySelector("#formulario-perfil");
  const status = document.querySelector("#status-analise");
  const campos = {
    nome: document.querySelector("#nome"),
    habilidades: document.querySelector("#habilidades"),
    experiencia: document.querySelector("#experiencia"),
  };
  const radiosArea = Array.from(formulario.querySelectorAll('input[name="area"]'));
  const contadorVagasCompativeis = document.querySelector("#contador-vagas-compativeis");
  const resumo = document.querySelector("#resumo-perfil");
  const listaDeVagas = document.querySelector("#lista-vagas");
  const melhorVaga = document.querySelector("#melhor-vaga");
  const melhorVagaConteudo = document.querySelector("#melhor-vaga-conteudo");
  const recomendacao = document.querySelector("#recomendacao");
  const recomendacaoConteudo = document.querySelector("#recomendacao-conteudo");
  const tituloResultados = document.querySelector("#titulo-resultados");

  function validarPerfil() {
    const nome = campos.nome.value.trim();
    // Só um botão de rádio pode estar marcado; sem escolha, a área fica vazia.
    const areaInteresse = radiosArea.find((radio) => radio.checked)?.value ?? "";
    const habilidades = normalizarHabilidades(campos.habilidades.value.split(","));
    const mesesDigitados = campos.experiencia.value.trim();
    const tempoExperienciaMeses = Number(mesesDigitados);

    const erros = {
      nome: nome.length >= 2 ? "" : "Informe um nome com pelo menos 2 caracteres.",
      area: areaInteresse ? "" : "Informe sua área de interesse.",
      habilidades: habilidades.length > 0 ? "" : "Informe pelo menos uma habilidade.",
      experiencia: /^\d+$/.test(mesesDigitados) && Number.isSafeInteger(tempoExperienciaMeses)
        ? ""
        : "Informe um número inteiro de meses igual ou maior que zero.",
    };

    let primeiroInvalido = null;

    // O erro fica perto do campo e o primeiro problema recebe o foco do teclado.
    Object.entries(erros).forEach(([nomeCampo, mensagem]) => {
      const camposDoGrupo = nomeCampo === "area" ? radiosArea : [campos[nomeCampo]];
      document.querySelector(`#${nomeCampo}-erro`).textContent = mensagem;

      camposDoGrupo.forEach((campo) => {
        if (mensagem) campo.setAttribute("aria-invalid", "true");
        else campo.removeAttribute("aria-invalid");
      });
      if (mensagem) primeiroInvalido ??= camposDoGrupo[0];
    });

    if (primeiroInvalido) {
      status.textContent = "Corrija os campos indicados e tente novamente.";
      primeiroInvalido.focus();
      return null;
    }

    return { nome, areaInteresse, habilidades, tempoExperienciaMeses };
  }

  // Evitamos o recarregamento para que a nova análise substitua a anterior na mesma página.
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const perfil = validarPerfil();
    if (perfil) aoEnviarPerfil(perfil);
  });

  function mostrarRelatorio(perfil, relatorio) {
    const meses = perfil.tempoExperienciaMeses;
    resumo.replaceChildren(
      criarElemento("h3", `Perfil de ${perfil.nome}`),
      criarElemento("p", `Área de interesse: ${perfil.areaInteresse}`),
      criarElemento("p", `Experiência: ${meses} ${meses === 1 ? "mês" : "meses"}`),
      criarElemento("p", `Habilidades: ${perfil.habilidades.join(", ")}`),
    );
    resumo.hidden = false;

    // A lista antiga sai antes de colocar os cartões da análise mais recente.
    listaDeVagas.replaceChildren(...relatorio.resultados.map(criarCartaoDaVaga));

    // Uma vaga entra na contagem quando o perfil atende pelo menos um requisito.
    const totalCompativeis = relatorio.resultados.filter((resultado) => resultado.percentual > 0).length;
    const totalVagas = relatorio.resultados.length;
    contadorVagasCompativeis.textContent = `${totalCompativeis} de ${totalVagas} ${totalVagas === 1 ? "vaga apresenta" : "vagas apresentam"} alguma compatibilidade com seu perfil.`;
    contadorVagasCompativeis.hidden = false;

    if (relatorio.melhorVaga) {
      const { vaga, percentual } = relatorio.melhorVaga;
      melhorVagaConteudo.replaceChildren(
        criarElemento("p", `${vaga.cargo} na ${vaga.empresa}: ${percentual}% de compatibilidade.`),
      );
      melhorVaga.hidden = false;
    }

    recomendacaoConteudo.replaceChildren(criarElemento("p", relatorio.recomendacao.mensagem));
    recomendacao.hidden = false;
    status.textContent = `Análise ${relatorio.totalAnalises} concluída. ${relatorio.resultados.length} vagas de exemplo comparadas.`;
    tituloResultados.focus();
  }

  return {
    mostrarEstadoDasVagas({ mensagem }) {
      status.textContent = mensagem;
    },
    mostrarMensagem(mensagem) {
      status.textContent = mensagem;
    },
    mostrarRelatorio,
  };
}
