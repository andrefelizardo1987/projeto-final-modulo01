// Este é o ponto de entrada: ele liga a leitura das vagas ao aviso visível na página.
import { carregarVagas } from "./dados.js";
import { iniciarInterface } from "./ui.js";

const mostrarEstadoDasVagas = iniciarInterface();
carregarVagas({ aoMudarEstado: mostrarEstadoDasVagas });
