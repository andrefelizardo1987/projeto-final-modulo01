# KingDev

O KingDev é uma aplicação de página única que compara habilidades com os requisitos de vagas fictícias. Ela mostra a compatibilidade de cada vaga, destaca a melhor opção e recomenda uma habilidade para estudar em uma interface que funciona no navegador.

## Executar localmente

1. Abra a pasta do projeto no VS Code.
2. Inicie o **Live Server** a partir de `index.html` ou use outro servidor estático local.
3. Abra o endereço local fornecido pelo servidor. Abrir `index.html` diretamente com `file://` impede o carregamento dos módulos e das vagas.
4. Aguarde a mensagem de vagas carregadas, preencha o formulário e clique em **Comparar com vagas**.

As habilidades devem ser separadas por vírgulas, por exemplo `HTML, CSS, JavaScript`. A idade é calculada pela data de nascimento. Se a comparação não aparecer, confira o aviso no início do formulário e as mensagens ao lado dos campos. Os resultados aparecem abaixo do formulário. O botão **Analisar meu perfil** da apresentação limpa os campos para uma nova análise.

## O que a aplicação faz

- Carrega um catálogo JSON local com `fetch` e informa carregamento, catálogo vazio ou erro.
- Valida o perfil antes de comparar, com mensagens junto aos campos e foco no primeiro erro.
- Calcula a porcentagem de requisitos atendidos, as habilidades encontradas e as faltantes; classifica cada vaga como compatibilidade alta, média ou baixa.
- Mostra quantas vagas têm alguma compatibilidade, a melhor vaga e a habilidade ausente mais frequente como recomendação.
- Filtra por modalidade e ordena por compatibilidade ou salário, mantendo a melhor vaga baseada no catálogo completo.
- Alterna entre tema claro e escuro. O tema e todos os campos do perfil são guardados no `localStorage` deste navegador para a próxima visita; não são enviados a um servidor.

Os nomes de empresas, as vagas e os salários do catálogo são fictícios. Os dados pessoais digitados aparecem somente no navegador usado para a análise. Evite preencher informações de terceiros em um computador compartilhado.

## Tecnologias e organização

O projeto usa HTML5 semântico, CSS externo com Flexbox e media queries, JavaScript puro em módulos ES, eventos do DOM, classes, métodos de array, `fetch` com `async/await` e `localStorage`. Não precisa de instalação de pacotes nem de ferramenta de build.

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura semântica, formulário e regiões onde os resultados aparecem. |
| `assets/styles/index.style.css` | Visual, temas, movimento e responsividade. |
| `assets/scripts/main.js` | Coordena carregamento, perfil e análise. |
| `assets/scripts/motor.js` | Classes das vagas e regras de compatibilidade. |
| `assets/scripts/ui.js` | Validação, eventos e cartões gerados no DOM. |
| `assets/scripts/dados.js` | Leitura das vagas e persistência local. |
| `assets/data/vagas.json` | Catálogo de vagas fictícias. |

O percentual é o número de requisitos encontrados dividido pelo total de requisitos da vaga, multiplicado por 100 e arredondado. Habilidades repetidas e diferenças de maiúsculas/minúsculas ou espaços não aumentam a contagem. A experiência aparece no resumo do perfil, sem alterar esse cálculo. Em empate, a melhor vaga é a primeira na ordem do catálogo.

## Verificações e melhorias possíveis

Na revisão local, foram conferidos o envio com dados inválidos, o envio corrigido com quatro cartões, a melhor vaga, a recomendação e larguras de 320, 375, 768 e 1280 px. Para verificar manualmente, tente um formulário vazio, uma data de nascimento futura e, depois, um perfil válido; alterne tema, filtro e ordenação e recarregue a página para conferir a persistência. Também vale rodar o Lighthouse no navegador para conferir acessibilidade e SEO.

Como evolução futura, seria possível ampliar o catálogo de vagas. A publicação no GitHub Pages e sua URL serão acrescentadas após a etapa de publicação.

## Organização e apresentação

[Acompanhe o quadro Kanban no Trello](https://trello.com/b/uyrD9Q2X/kingdev-projeto-final-modulo-01). O desenvolvimento usa `develop` para integrar mudanças e branches `feature/` para tarefas separadas. O repositório do projeto é [projeto-final-modulo01](https://github.com/andrefelizardo1987/projeto-final-modulo01).
