import { normalizarHabilidades } from "./motor.js";

const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function calcularIdade(dataDigitada) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataDigitada);
  if (!partes) return null;

  const [, anoTexto, mesTexto, diaTexto] = partes;
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  const nascimento = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  // Conferimos o dia de novo porque uma data impossível pode virar o mês seguinte.
  if (
    nascimento.getFullYear() !== ano
    || nascimento.getMonth() !== mes - 1
    || nascimento.getDate() !== dia
    || nascimento > hoje
  ) {
    return null;
  }

  let idade = hoje.getFullYear() - ano;
  if (hoje.getMonth() < mes - 1 || (hoje.getMonth() === mes - 1 && hoje.getDate() < dia)) idade -= 1;
  return idade;
}

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
    idade: document.querySelector("#idade"),
    nascimento: document.querySelector("#nascimento"),
    email: document.querySelector("#email"),
    celular: document.querySelector("#celular"),
    cidade: document.querySelector("#cidade"),
    estado: document.querySelector("#estado"),
    habilidades: document.querySelector("#habilidades"),
    experiencia: document.querySelector("#experiencia"),
  };
  const radiosArea = Array.from(formulario.querySelectorAll('input[name="area"]'));
  const gruposCheckboxes = {
    civil: Array.from(formulario.querySelectorAll('input[name="civil"]')),
    veiculo: Array.from(formulario.querySelectorAll('input[name="veiculo"]')),
  };

  // Ao marcar uma opção, desmarcamos a outra do mesmo grupo para evitar respostas contraditórias.
  Object.values(gruposCheckboxes).forEach((grupo) => {
    grupo.forEach((opcao) => {
      opcao.addEventListener("change", () => {
        if (!opcao.checked) return;
        grupo.forEach((outra) => {
          if (outra !== opcao) outra.checked = false;
        });
      });
    });
  });
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
    const idadeDigitada = campos.idade.value.trim();
    const idade = Number(idadeDigitada);
    const dataNascimento = campos.nascimento.value;
    const idadeCalculada = calcularIdade(dataNascimento);
    const email = campos.email.value.trim();
    const celular = campos.celular.value.trim();
    const numerosCelular = celular.replace(/\D/g, "");
    const cidade = campos.cidade.value.trim();
    const estado = campos.estado.value;
    const estadoCivil = gruposCheckboxes.civil.find((opcao) => opcao.checked)?.value ?? "";
    const respostaVeiculo = gruposCheckboxes.veiculo.find((opcao) => opcao.checked)?.value ?? "";
    // Só um botão de rádio pode estar marcado; sem escolha, a área fica vazia.
    const areaInteresse = radiosArea.find((radio) => radio.checked)?.value ?? "";
    const habilidades = normalizarHabilidades(campos.habilidades.value.split(","));
    const mesesDigitados = campos.experiencia.value.trim();
    const tempoExperienciaMeses = Number(mesesDigitados);

    let erroIdade = "";
    if (!/^\d+$/.test(idadeDigitada) || !Number.isSafeInteger(idade)) {
      erroIdade = "Informe uma idade em anos, sem números negativos ou frações.";
    } else if (idadeCalculada !== null && idade !== idadeCalculada) {
      erroIdade = "A idade deve corresponder à data de nascimento.";
    }

    const erros = {
      nome: nome.length >= 2 ? "" : "Informe um nome com pelo menos 2 caracteres.",
      idade: erroIdade,
      nascimento: idadeCalculada !== null ? "" : "Informe uma data de nascimento válida que não esteja no futuro.",
      email: email && !campos.email.validity.typeMismatch ? "" : "Informe um e-mail válido.",
      celular: /^[\d\s()+-]+$/.test(celular) && /^(55)?\d{11}$/.test(numerosCelular)
        ? ""
        : "Informe um celular com DDD e 11 dígitos.",
      cidade: cidade.length >= 2 ? "" : "Informe sua cidade.",
      estado: estado ? "" : "Selecione um estado.",
      civil: estadoCivil ? "" : "Selecione seu estado civil.",
      veiculo: respostaVeiculo ? "" : "Informe se possui veículo.",
      area: areaInteresse ? "" : "Informe sua área de interesse.",
      habilidades: habilidades.length > 0 ? "" : "Informe pelo menos uma habilidade.",
      experiencia: /^\d+$/.test(mesesDigitados) && Number.isSafeInteger(tempoExperienciaMeses)
        ? ""
        : "Informe um número inteiro de meses igual ou maior que zero.",
    };

    let primeiroInvalido = null;

    // O erro fica perto do campo e o primeiro problema recebe o foco do teclado.
    Object.entries(erros).forEach(([nomeCampo, mensagem]) => {
      const camposDoGrupo = nomeCampo === "area" ? radiosArea : (gruposCheckboxes[nomeCampo] ?? [campos[nomeCampo]]);
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

    return {
      nome, idade, dataNascimento, email, celular, cidade, estado, estadoCivil,
      possuiVeiculo: respostaVeiculo === "Sim", areaInteresse, habilidades, tempoExperienciaMeses,
    };
  }

  function formularioEstaVazio() {
    const camposSemTexto = Object.values(campos).every((campo) => campo.value.trim() === "");
    const areaSemEscolha = radiosArea.every((radio) => !radio.checked);
    const gruposSemEscolha = Object.values(gruposCheckboxes)
      .every((grupo) => grupo.every((opcao) => !opcao.checked));

    // O aviso geral só aparece quando a pessoa ainda não começou a preencher nada.
    return camposSemTexto && areaSemEscolha && gruposSemEscolha;
  }

  // Evitamos o recarregamento para que a nova análise substitua a anterior na mesma página.
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (formularioEstaVazio()) {
      window.alert("É necessário preencher todos os campos antes de comparar com as vagas.");
    }
    const perfil = validarPerfil();
    if (perfil) aoEnviarPerfil(perfil);
  });

  function mostrarRelatorio(perfil, relatorio) {
    const meses = perfil.tempoExperienciaMeses;
    resumo.replaceChildren(
      criarElemento("h3", `Perfil de ${perfil.nome}`),
      criarElemento("p", `Idade: ${perfil.idade} anos`),
      criarElemento("p", `Data de nascimento: ${perfil.dataNascimento.split("-").reverse().join("/")}`),
      criarElemento("p", `E-mail: ${perfil.email}`),
      criarElemento("p", `Celular: ${perfil.celular}`),
      criarElemento("p", `Cidade e estado: ${perfil.cidade} — ${perfil.estado}`),
      criarElemento("p", `Estado civil: ${perfil.estadoCivil}`),
      criarElemento("p", `Possui veículo: ${perfil.possuiVeiculo ? "Sim" : "Não"}`),
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
    status.textContent = `Análise ${relatorio.totalAnalises} concluída. ${relatorio.resultados.length} vagas comparadas.`;
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
