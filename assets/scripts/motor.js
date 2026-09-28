// O motor faz as contas sem ler o HTML. Assim, podemos conferir a regra usando só dados.

function limparTexto(valor, campo) {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new TypeError(`${campo} deve ser um texto preenchido.`);
  }

  return valor.trim().replace(/\s+/g, " ");
}

function chaveDaHabilidade(habilidade) {
  return habilidade.toLocaleLowerCase("pt-BR");
}

// Guardamos a primeira forma escrita de cada habilidade para mostrá-la na tela depois.
export function normalizarHabilidades(lista) {
  if (!Array.isArray(lista)) {
    throw new TypeError("As habilidades devem formar uma lista.");
  }

  const unicas = new Map();

  lista
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter((item) => item !== "")
    .forEach((habilidade) => {
      const chave = chaveDaHabilidade(habilidade);
      if (!unicas.has(chave)) {
        unicas.set(chave, habilidade);
      }
    });

  return [...unicas.values()];
}

function normalizarModalidade(valor) {
  const chave = limparTexto(valor, "Modalidade")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (chave === "remota" || chave === "remoto") return "Remota";
  if (chave === "hibrida" || chave === "hibrido") return "Híbrida";
  if (chave === "presencial") return "Presencial";

  throw new TypeError("Modalidade deve ser remota, híbrida ou presencial.");
}

export function classificarCompatibilidade(percentual) {
  if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
    return "Percentual inválido";
  }

  if (percentual >= 80) return "Alta compatibilidade";
  if (percentual >= 50) return "Média compatibilidade";
  return "Baixa compatibilidade";
}

export class Vaga {
  constructor(dados) {
    if (dados === null || typeof dados !== "object" || Array.isArray(dados)) {
      throw new TypeError("A vaga deve ser um objeto.");
    }

    this.id = limparTexto(dados.id, "Identificador");
    this.empresa = limparTexto(dados.empresa, "Empresa");
    this.cargo = limparTexto(dados.cargo, "Cargo");
    this.modalidade = normalizarModalidade(dados.modalidade);
    this.requisitos = normalizarHabilidades(dados.requisitos);

    // Uma vaga sem requisitos causaria uma divisão por zero, então não entra na análise.
    if (this.requisitos.length === 0) {
      throw new TypeError("A vaga precisa de pelo menos um requisito válido.");
    }

    if (!Number.isFinite(dados.salario) || dados.salario < 0) {
      throw new TypeError("Salário deve ser um número não negativo.");
    }

    this.salario = dados.salario;
  }

  obterResumo() {
    return `${this.cargo} na empresa ${this.empresa}`;
  }

  calcularCompatibilidade(perfil) {
    const habilidades = normalizarHabilidades(perfil?.habilidades);
    const conhecidas = new Set(habilidades.map(chaveDaHabilidade));
    const atende = (requisito) => conhecidas.has(chaveDaHabilidade(requisito));
    const habilidadesAtendidas = this.requisitos.filter(atende);
    const habilidadesFaltantes = this.requisitos.filter((requisito) => !atende(requisito));

    // Cada requisito vale a mesma parte do total, como no exercício original.
    const percentual = Math.round((habilidadesAtendidas.length / this.requisitos.length) * 100);

    return {
      vaga: this,
      percentual,
      classificacao: classificarCompatibilidade(percentual),
      habilidadesAtendidas,
      habilidadesFaltantes,
      atendeTodosOsRequisitos: this.requisitos.every(atende),
    };
  }
}

// A vaga remota herda a conta comum e acrescenta uma informação própria desse tipo de trabalho.
export class VagaRemota extends Vaga {
  constructor(dados) {
    super({ ...dados, modalidade: "Remota" });
    this.auxilioHomeOffice = dados.auxilioHomeOffice === true;
  }

  obterResumo() {
    const auxilio = this.auxilioHomeOffice ? "com auxílio home office" : "sem auxílio home office";
    return `${super.obterResumo()} — remota, ${auxilio}`;
  }
}

// Um registro ruim é separado dos bons; as outras vagas ainda podem ser analisadas.
export function converterCatalogo(registros) {
  if (!Array.isArray(registros)) {
    return {
      vagas: [],
      invalidos: [{ indice: null, motivo: "O catálogo deve ser uma lista de vagas." }],
    };
  }

  const identificadores = new Set();
  const invalidos = [];

  const vagas = registros
    .map((registro, indice) => {
      try {
        const modalidade = normalizarModalidade(registro?.modalidade);
        const vaga = modalidade === "Remota" ? new VagaRemota(registro) : new Vaga(registro);

        if (identificadores.has(vaga.id)) {
          throw new TypeError("Identificador de vaga repetido.");
        }

        identificadores.add(vaga.id);
        return vaga;
      } catch (erro) {
        invalidos.push({ indice, motivo: erro.message });
        return null;
      }
    })
    .filter((vaga) => vaga !== null);

  return { vagas, invalidos };
}

export function encontrarMelhorVaga(resultados) {
  if (!Array.isArray(resultados) || resultados.length === 0) return null;

  // Em empate, mantemos a vaga que apareceu primeiro no catálogo.
  return resultados.reduce(
    (melhor, atual) => (!melhor || atual.percentual > melhor.percentual ? atual : melhor),
    null,
  );
}

export function gerarRecomendacaoDeEstudo(resultados) {
  if (!Array.isArray(resultados) || resultados.length === 0) {
    return {
      habilidade: null,
      frequencia: 0,
      mensagem: "Não há vagas válidas para gerar uma recomendação.",
    };
  }

  // Contamos em quantas vagas falta cada habilidade, sem dar peso extra a uma vaga.
  const frequencias = resultados.reduce((contador, resultado) => {
    resultado.habilidadesFaltantes.forEach((habilidade) => {
      const chave = chaveDaHabilidade(habilidade);
      const anterior = contador.get(chave);
      contador.set(chave, {
        habilidade: anterior?.habilidade ?? habilidade,
        frequencia: (anterior?.frequencia ?? 0) + 1,
      });
    });
    return contador;
  }, new Map());

  const prioridade = [...frequencias.values()].reduce(
    (maior, atual) => (!maior || atual.frequencia > maior.frequencia ? atual : maior),
    null,
  );

  if (!prioridade) {
    return {
      habilidade: null,
      frequencia: 0,
      mensagem: "Você já atende a todos os requisitos das vagas analisadas. Continue praticando.",
    };
  }

  return {
    ...prioridade,
    mensagem: `Comece estudando ${prioridade.habilidade}: ela falta em ${prioridade.frequencia} vaga(s).`,
  };
}

export function analisarVagas(perfil, vagas) {
  if (!Array.isArray(vagas)) {
    throw new TypeError("As vagas devem formar uma lista.");
  }

  const vagasValidas = vagas.filter((vaga) => vaga instanceof Vaga);
  const resultados = vagasValidas.map((vaga) => vaga.calcularCompatibilidade(perfil));

  return {
    estado: resultados.length > 0 ? "concluida" : "sem-vagas",
    resultados,
    melhorVaga: encontrarMelhorVaga(resultados),
    recomendacao: gerarRecomendacaoDeEstudo(resultados),
    vagasIgnoradas: vagas.length - vagasValidas.length,
  };
}

// A variável total vive dentro da função criada e lembra quantas análises terminaram nesta sessão.
export function criarAnalisador() {
  let total = 0;

  return function executarAnalise(perfil, vagas, aoConcluir) {
    if (aoConcluir !== undefined && typeof aoConcluir !== "function") {
      throw new TypeError("O retorno da análise deve ser uma função.");
    }

    const relatorio = analisarVagas(perfil, vagas);
    if (relatorio.estado === "concluida") total += 1;

    const relatorioNumerado = { ...relatorio, totalAnalises: total };

    // O callback permite que outra parte, como a tela, use o resultado quando ele estiver pronto.
    if (aoConcluir) aoConcluir(relatorioNumerado);

    return relatorioNumerado;
  };
}
