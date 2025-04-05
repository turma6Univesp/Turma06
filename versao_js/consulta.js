document.addEventListener("DOMContentLoaded", () => {
    carregarProjetosConsulta();
});

function carregarProjetosConsulta() {
    const selectProjeto = document.getElementById("projetoConsulta");
    selectProjeto.innerHTML = "<option value=''>Selecione...</option>";

    database.projetos.forEach(projeto => {
        const option = document.createElement("option");
        option.value = projeto.id;
        option.textContent = projeto.nome;
        selectProjeto.appendChild(option);
    });
}

function consultarProjeto() {
    const projetoId = document.getElementById("projetoConsulta").value;
    if (!projetoId) return;

    const listaPessoas = document.getElementById("listaPessoasProjeto");
    const listaViagens = document.getElementById("listaViagensProjeto");
    listaPessoas.innerHTML = "";
    listaViagens.innerHTML = "";

    // Filtrar pessoas do projeto selecionado
    const pessoasProjeto = database.pessoas.filter(pessoa => pessoa.projetoId == projetoId);

    if (pessoasProjeto.length === 0) {
        listaPessoas.innerHTML = "<li>Nenhuma pessoa encontrada.</li>";
        listaViagens.innerHTML = "<li>Nenhuma viagem registrada.</li>";
        return;
    }

    // Exibir pessoas
    pessoasProjeto.forEach(pessoa => {
        const item = document.createElement("li");
        item.textContent = `${pessoa.nome} - ${pessoa.tipo}`;
        listaPessoas.appendChild(item);

        // Filtrar viagens associadas à pessoa
        const viagensPessoa = database.viagens.filter(v => v.pessoaId == pessoa.id);

        if (viagensPessoa.length === 0) {
            const itemViagem = document.createElement("li");
            itemViagem.textContent = `Nenhuma viagem registrada para ${pessoa.nome}.`;
            listaViagens.appendChild(itemViagem);
        } else {
            viagensPessoa.forEach(v => {
                const itemViagem = document.createElement("li");
                itemViagem.innerHTML = `
                    <strong>${pessoa.nome}</strong>: 
                    Voo ${v.dadosVoo}, Trecho: ${v.trecho}, Data: ${v.data}, Horário: ${v.horario}.
                    <br>Preço: R$ ${v.precoPassagem} | Emissão: ${v.dataEmissao} | Solicitação: ${v.dataSolicitacao} | Complemento: ${v.dataComplemento}
                `;
                listaViagens.appendChild(itemViagem);
            });
        }
    });
}
