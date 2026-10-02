import { normalizarHabilidades } from "./motor.js";
import { recuperarTema, salvarTema } from "./dados.js";

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

export function filtrarEOrdenarResultados(resultados, modalidade = "todas", ordem = "padrao") {
  if (!Array.isArray(resultados)) return [];

  // A cópia recebe a posição original para manter os empates na ordem do catálogo.
  const visiveis = resultados
    .map((resultado, indice) => ({ resultado, indice }))
    .filter(({ resultado }) => modalidade === "todas" || resultado.vaga.modalidade === modalidade);

  const comparadores = {
    "compatibilidade-maior": (a, b) => b.percentual - a.percentual,
    "compatibilidade-menor": (a, b) => a.percentual - b.percentual,
    "salario-maior": (a, b) => b.vaga.salario - a.vaga.salario,
    "salario-menor": (a, b) => a.vaga.salario - b.vaga.salario,
  };
  const comparar = comparadores[ordem];
  if (comparar) {
    visiveis.sort((a, b) => comparar(a.resultado, b.resultado) || a.indice - b.indice);
  }

  return visiveis.map(({ resultado }) => resultado);
}

export function iniciarInterface(aoEnviarPerfil) {
  const formulario = document.querySelector("#formulario-perfil");
  const status = document.querySelector("#status-analise");
  const statusFormulario = document.querySelector("#status-formulario");
  const botaoTema = document.querySelector("#alternar-tema");
  const iconeTema = botaoTema.querySelector(".icone-tema");
  const textoTema = botaoTema.querySelector(".texto-tema");
  let temaAtual = recuperarTema().tema ?? "escuro";

  function aplicarTema() {
    // A página usa as cores do tema escolhido; o botão mostra a próxima opção.
    document.documentElement.dataset.tema = temaAtual;
    const estaEscuro = temaAtual === "escuro";
    iconeTema.textContent = estaEscuro ? "☀" : "☾";
    textoTema.textContent = estaEscuro ? "Tema claro" : "Tema escuro";
  }

  aplicarTema();
  botaoTema.addEventListener("click", () => {
    temaAtual = temaAtual === "escuro" ? "claro" : "escuro";
    aplicarTema();
    salvarTema(temaAtual);
  });

  const campos = {
    nome: document.querySelector("#nome"),
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
  const filtrosVagas = document.querySelector("#filtros-vagas");
  const filtroModalidade = document.querySelector("#filtro-modalidade");
  const ordenarVagas = document.querySelector("#ordenar-vagas");
  const statusFiltros = document.querySelector("#status-filtros");
  let relatorioAtual = null;
  const melhorVaga = document.querySelector("#melhor-vaga");
  const melhorVagaConteudo = document.querySelector("#melhor-vaga-conteudo");
  const recomendacao = document.querySelector("#recomendacao");
  const recomendacaoConteudo = document.querySelector("#recomendacao-conteudo");
  const tituloResultados = document.querySelector("#titulo-resultados");
  const statusPerfilSalvo = document.querySelector("#status-perfil-salvo");
  const linkAnalisarPerfil = document.querySelector("#link-analisar-perfil");
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

  function atualizarListaFiltrada() {
    if (!relatorioAtual) return;
    const visiveis = filtrarEOrdenarResultados(
      relatorioAtual.resultados,
      filtroModalidade.value,
      ordenarVagas.value,
    );

    // Trocamos apenas os cartões; a melhor vaga e a recomendação vêm da análise completa.
    listaDeVagas.replaceChildren(...visiveis.map(criarCartaoDaVaga));
    if (visiveis.length === 0) {
      listaDeVagas.append(criarElemento("p", "Nenhuma vaga corresponde ao filtro selecionado.", "lista-vazia"));
    }
    statusFiltros.textContent = `${visiveis.length} de ${relatorioAtual.resultados.length} vagas exibidas.`;
  }

  filtroModalidade.addEventListener("change", atualizarListaFiltrada);
  ordenarVagas.addEventListener("change", atualizarListaFiltrada);

  linkAnalisarPerfil.addEventListener("pointermove", (evento) => {
    if (reduzirMovimento.matches || evento.pointerType !== "mouse") return;

    // A luz acompanha o mouse dentro do botão, como uma lanterna pequena.
    const limites = linkAnalisarPerfil.getBoundingClientRect();
    linkAnalisarPerfil.style.setProperty("--brilho-x", `${evento.clientX - limites.left}px`);
    linkAnalisarPerfil.style.setProperty("--brilho-y", `${evento.clientY - limites.top}px`);
  });

  linkAnalisarPerfil.addEventListener("pointerleave", () => {
    // Sem o mouse, o brilho volta ao centro para o próximo uso.
    linkAnalisarPerfil.style.removeProperty("--brilho-x");
    linkAnalisarPerfil.style.removeProperty("--brilho-y");
  });

  linkAnalisarPerfil.addEventListener("click", (evento) => {
    // Impedimos o salto automático para manter o foco no primeiro campo após a limpeza.
    evento.preventDefault();
    // O link leva ao formulário; limpamos os campos para começar outra análise.
    formulario.reset();
    formulario.querySelectorAll(".erro-campo").forEach((erro) => { erro.textContent = ""; });
    formulario.querySelectorAll("[aria-invalid]").forEach((campo) => campo.removeAttribute("aria-invalid"));
    statusFormulario.textContent = "";
    statusPerfilSalvo.textContent = "Formulário limpo para uma nova análise. O perfil salvo volta ao recarregar a página.";
    campos.nome.focus();
  });

  function validarPerfil() {
    const nome = campos.nome.value.trim();
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

    const erros = {
      nome: nome.length >= 2 ? "" : "Informe um nome com pelo menos 2 caracteres.",
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
      const totalErros = Object.values(erros).filter(Boolean).length;
      const primeiroErro = Object.values(erros).find(Boolean);
      // Este aviso fica no formulário: a pessoa entende por que não viu novos cartões.
      statusFormulario.textContent = `${totalErros} ${totalErros === 1 ? "campo precisa" : "campos precisam"} de correção. ${primeiroErro}`;
      status.textContent = "Corrija os campos indicados e tente novamente.";
      primeiroInvalido.focus();
      return null;
    }

    statusFormulario.textContent = "";
    return {
      nome, dataNascimento, email, celular, cidade, estado, estadoCivil,
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
      // A idade vem da data escolhida; não precisamos pedir a mesma informação duas vezes.
      criarElemento("p", `Idade: ${calcularIdade(perfil.dataNascimento)} anos`),
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

    relatorioAtual = relatorio;
    const modalidadeEscolhida = filtroModalidade.value;
    const opcoesModalidade = [criarElemento("option", "Todas")];
    opcoesModalidade[0].value = "todas";
    // As opções nascem das vagas reais carregadas, sem modalidade inventada no HTML.
    [...new Set(relatorio.resultados.map(({ vaga }) => vaga.modalidade))].forEach((modalidade) => {
      const opcao = criarElemento("option", modalidade);
      opcao.value = modalidade;
      opcoesModalidade.push(opcao);
    });
    filtroModalidade.replaceChildren(...opcoesModalidade);
    filtroModalidade.value = opcoesModalidade.some((opcao) => opcao.value === modalidadeEscolhida)
      ? modalidadeEscolhida
      : "todas";
    filtrosVagas.hidden = false;
    filtrosVagas.disabled = false;
    atualizarListaFiltrada();

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
      const empatadas = relatorio.resultados.filter((resultado) => resultado.percentual === percentual);
      if (empatadas.length > 1) {
        // Explicamos por que uma vaga venceu quando outras tiveram a mesma porcentagem.
        const mesmoSalario = empatadas.filter((resultado) => resultado.vaga.salario === vaga.salario);
        const explicacao = mesmoSalario.length > 1
          ? "Compatibilidade e salário empatados: foi mantida a primeira vaga do catálogo."
          : "Compatibilidade empatada: foi escolhida a vaga com maior salário.";
        melhorVagaConteudo.append(criarElemento("p", explicacao));
      }
      melhorVaga.hidden = false;
    }

    recomendacaoConteudo.replaceChildren(criarElemento("p", relatorio.recomendacao.mensagem));
    recomendacao.hidden = false;
    status.textContent = `Análise ${relatorio.totalAnalises} concluída. ${relatorio.resultados.length} vagas comparadas.`;
    statusFormulario.textContent = "";
    tituloResultados.focus();
  }

  return {
    restaurarPerfil({ estado, perfil }) {
      if (estado === "recuperado") {
        // Cada dado volta ao campo onde a pessoa o preencheu na visita anterior.
        campos.nome.value = perfil.nome;
        campos.nascimento.value = perfil.dataNascimento;
        campos.email.value = perfil.email;
        campos.celular.value = perfil.celular;
        campos.cidade.value = perfil.cidade;
        campos.estado.value = perfil.estado;
        gruposCheckboxes.civil.find((opcao) => opcao.value === perfil.estadoCivil).checked = true;
        gruposCheckboxes.veiculo.find((opcao) => opcao.value === (perfil.possuiVeiculo ? "Sim" : "Não")).checked = true;
        radiosArea.find((radio) => radio.value === perfil.areaInteresse).checked = true;
        campos.habilidades.value = perfil.habilidades.join(", ");
        campos.experiencia.value = String(perfil.tempoExperienciaMeses);
        statusPerfilSalvo.textContent = "Seu perfil foi recuperado deste navegador. Confira os campos antes de analisar.";
      } else if (estado === "invalido") {
        statusPerfilSalvo.textContent = "O perfil salvo não pôde ser recuperado. Preencha o formulário novamente.";
      } else if (estado === "indisponivel") {
        statusPerfilSalvo.textContent = "O armazenamento do navegador está indisponível. Você ainda pode comparar vagas.";
      }
    },
    mostrarEstadoDoPerfilSalvo({ estado }) {
      statusPerfilSalvo.textContent = estado === "salvo"
        ? "Todos os campos do perfil foram salvos neste navegador."
        : "Não foi possível salvar o perfil. A comparação continua disponível.";
    },
    mostrarEstadoDasVagas({ mensagem }) {
      status.textContent = mensagem;
    },
    mostrarMensagem(mensagem) {
      status.textContent = mensagem;
      // Também avisamos junto ao formulário se as vagas impedirem a comparação.
      statusFormulario.textContent = mensagem;
    },
    mostrarRelatorio,
  };
}
