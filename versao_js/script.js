document.addEventListener("DOMContentLoaded", () => {
    atualizarProjetos();
    atualizarPessoas();
    atualizarViagens();
});

// Adicionar Projeto
function adicionarProjeto() {
    const nome = document.getElementById("nomeProjeto").value;
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    if (!nome) return alert("Digite o nome do projeto!");

    database.projetos.push({ id: Date.now(), nome, dataInicio, dataFim });
    database.salvar();
    atualizarProjetos();
}

// Atualizar a lista de projetos
function atualizarProjetos() {
    const lista = document.getElementById("listaProjetos");
    const select = document.getElementById("projetoSelect");
    lista.innerHTML = "";
    select.innerHTML = "";

    database.projetos.forEach(projeto => {
        const item = document.createElement("li");
        item.textContent = `${projeto.nome} (${projeto.dataInicio} - ${projeto.dataFim})`;
        lista.appendChild(item);

        const option = document.createElement("option");
        option.value = projeto.id;
        option.textContent = projeto.nome;
        select.appendChild(option);
    });
}

// Adicionar Pessoa ao Projeto
function adicionarPessoa() {
    const projetoId = document.getElementById("projetoSelect").value;
    const nome = document.getElementById("nomePessoa").value;
    const tipo = document.getElementById("tipoPessoa").value;

    if (!nome || !projetoId) return alert("Preencha todos os campos!");

    database.pessoas.push({ id: Date.now(), projetoId, nome, tipo });
    database.salvar();
    atualizarPessoas();
}

// Atualizar lista de Pessoas
function atualizarPessoas() {
    const lista = document.getElementById("listaPessoas");
    const select = document.getElementById("pessoaSelect");
    lista.innerHTML = "";
    select.innerHTML = "";

    database.pessoas.forEach(pessoa => {
        const item = document.createElement("li");
        item.textContent = `${pessoa.nome} - ${pessoa.tipo}`;
        lista.appendChild(item);

        const option = document.createElement("option");
        option.value = pessoa.id;
        option.textContent = pessoa.nome;
        select.appendChild(option);
    });
}

// Registrar Viagem
function registrarViagem() {
    const pessoaId = document.getElementById("pessoaSelect").value;
    const precoPassagem = document.getElementById("precoPassagem").value;
    const dadosVoo = document.getElementById("dadosVoo").value;
    const trecho = document.getElementById("trecho").value;
    const data = document.getElementById("dataVoo").value;
    const horario = document.getElementById("horario").value;
    const dataEmissao = document.getElementById("dataEmissao").value;
    const dataSolicitacao = document.getElementById("dataSolicitacao").value;
    const dataComplemento = document.getElementById("dataComplemento").value;

    database.viagens.push({ pessoaId, precoPassagem, dadosVoo, trecho, data, horario, dataEmissao, dataSolicitacao, dataComplemento });
    database.salvar();
    atualizarViagens();
}

// Atualizar lista de Viagens
function atualizarViagens() {
    const lista = document.getElementById("listaViagens");
    lista.innerHTML = "";

    database.viagens.forEach(v => {
        const item = document.createElement("li");
        item.textContent = `Voo: ${v.dadosVoo}, Trecho: ${v.trecho}, Data: ${v.data}`;
        lista.appendChild(item);
    });
}
