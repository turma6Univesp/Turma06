document.addEventListener('DOMContentLoaded', function() {

    // --- Seletores de Elementos DOM ---
    const projetoSelectVoo = document.getElementById('projeto_id_voo');
    const elencoSelectVoo = document.getElementById('elenco_id_voo');

    const projetoSelectConsulta = document.getElementById('projeto_id_consulta');
    const elencoSelectConsulta = document.getElementById('elenco_id_consulta');
    const resultadoConsultaDiv = document.getElementById('voos-lista');

    // --- Funções Auxiliares ---

    /**
     * Popula um elemento <select> com opções a partir de um array de dados.
     * @param {HTMLSelectElement} selectElement O elemento select a ser populado.
     * @param {Array<{id: number, nome: string}>} data Array de objetos com id e nome.
     * @param {string} defaultOptionText Texto para a opção padrão (desabilitada).
     * @param {boolean} disableIfEmpty Desabilita o select se não houver dados.
     */
    function populateSelect(selectElement, data, defaultOptionText, disableIfEmpty = true) {
        if (!selectElement) return; // Sai se o elemento não existir

        // Limpa opções existentes
        selectElement.innerHTML = '';

        // Adiciona a opção padrão (desabilitada e selecionada)
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = defaultOptionText;
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectElement.appendChild(defaultOption);

        // Adiciona as novas opções a partir dos dados
        if (data && data.length > 0) {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.nome; // Assume que os dados têm 'id' e 'nome'
                selectElement.appendChild(option);
            });
            // Habilita o select se houver dados
            selectElement.disabled = false;
        } else {
            // Se não há dados, adiciona uma opção indicando isso (opcional)
            const noDataOption = document.createElement('option');
            noDataOption.textContent = data ? "-- Nenhum item disponível --" : "-- Erro ao carregar --";
            noDataOption.disabled = true;
            selectElement.appendChild(noDataOption);

            // Desabilita se solicitado
            if (disableIfEmpty) {
                selectElement.disabled = true;
            }
        }
    }

    /**
     * Busca membros do elenco para um projeto específico via API e popula o select correspondente.
     * @param {string|number} projectId O ID do projeto selecionado.
     * @param {HTMLSelectElement} selectElement O elemento select do elenco a ser populado.
     */
    async function fetchCast(projectId, selectElement) {
        // Limpa e desabilita o select de elenco imediatamente
        populateSelect(selectElement, [], '-- Carregando Membros... --', true);

        if (!projectId) {
            populateSelect(selectElement, [], '-- Selecione o Projeto Primeiro --', true);
            return; // Sai se nenhum projeto foi selecionado
        }

        try {
            const response = await fetch(`/get_cast_for_project/${projectId}`);
            if (!response.ok) {
                // Tenta pegar uma mensagem de erro do JSON, se houver
                let errorMsg = `Erro HTTP: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) { /* Ignora erro ao parsear JSON de erro */ }
                throw new Error(errorMsg);
            }
            const castData = await response.json();
            populateSelect(selectElement, castData, '-- Escolha um Membro --', castData.length === 0);

        } catch (error) {
            console.error('Erro ao buscar elenco:', error);
            populateSelect(selectElement, [], '-- Erro ao Carregar Membros --', true);
            // Poderia mostrar um erro mais visível para o usuário aqui
            if(selectElement === elencoSelectConsulta) { // Mostra erro na área de consulta
                 resultadoConsultaDiv.innerHTML = `<p class="error-message">Falha ao carregar membros do elenco: ${error.message}</p>`;
            }
        }
    }

    /**
     * Busca os voos registrados para um membro do elenco específico via API.
     * @param {string|number} castId O ID do membro do elenco selecionado.
     */
    async function fetchFlights(castId) {
        if (!resultadoConsultaDiv) return; // Sai se a área de resultado não existe

        resultadoConsultaDiv.innerHTML = '<p>Carregando voos...</p>'; // Feedback visual

        if (!castId) {
            resultadoConsultaDiv.innerHTML = '<p>Selecione um membro do elenco para ver os voos.</p>';
            return; // Sai se nenhum membro foi selecionado
        }

        try {
            const response = await fetch(`/get_flights_for_cast/${castId}`);
             if (!response.ok) {
                let errorMsg = `Erro HTTP: ${response.status}`;
                 try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                 } catch (e) { /* Ignora */ }
                throw new Error(errorMsg);
            }
            const flightData = await response.json();
            displayFlights(flightData); // Chama a função para mostrar os dados

        } catch (error) {
            console.error('Erro ao buscar voos:', error);
            resultadoConsultaDiv.innerHTML = `<p class="error-message">Erro ao carregar dados de voo: ${error.message}. Tente novamente.</p>`;
        }
    }

    /**
     * Formata um valor numérico como moeda brasileira (BRL).
     * @param {number|null|undefined} value O valor a ser formatado.
     * @returns {string} O valor formatado ou '-'.
     */
    function formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return '-';
        }
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    /**
     * Formata uma string de data (YYYY-MM-DD) para o formato DD/MM/YYYY.
     * @param {string|null|undefined} dateString A string de data.
     * @returns {string} A data formatada ou '-'.
     */
    function formatDate(dateString) {
        if (!dateString) {
            return '-';
        }
        try {
             // Adiciona T00:00:00 para evitar problemas com fuso horário ao usar apenas new Date(YYYY-MM-DD)
            const date = new Date(dateString + 'T00:00:00');
            // Verifica se a data é válida após a conversão
            if (isNaN(date.getTime())) {
                 return '-';
            }
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            console.error("Erro ao formatar data:", dateString, e);
            return '-'; // Retorna '-' em caso de erro na formatação
        }
    }

    /**
     * Exibe os dados de voo em uma tabela HTML dentro do elemento resultadoConsultaDiv.
     * @param {Array<object>} flights Array de objetos representando os voos.
     */
    function displayFlights(flights) {
         if (!resultadoConsultaDiv) return;

        if (!flights || flights.length === 0) {
            resultadoConsultaDiv.innerHTML = '<p>Nenhum voo registrado para este membro neste projeto.</p>';
            return;
        }

        // Cria a estrutura da tabela com cabeçalho
        let tableHTML = `
            <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Preço</th>
                        <th>Dados Voo</th>
                        <th>Trecho</th>
                        <th>Data Voo</th>
                        <th>Horário</th>
                        <th>Data Emissão</th>
                        <th>Solicitação</th>
                        <th>Complemento</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Preenche as linhas da tabela com os dados dos voos
        flights.forEach(flight => {
            tableHTML += `
                <tr>
                    <td>${formatCurrency(flight.preco_passagem)}</td>
                    <td>${flight.dados_voo || '-'}</td>
                    <td>${flight.trecho || '-'}</td>
                    <td>${formatDate(flight.data_voo)}</td>
                    <td>${flight.horario || '-'}</td>
                    <td>${formatDate(flight.data_emissao)}</td>
                    <td>${flight.solicitacao || '-'}</td>
                    <td>${flight.complemento || '-'}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
            </div>
        `;

        // Insere a tabela completa no DOM
        resultadoConsultaDiv.innerHTML = tableHTML;
    }


    // --- Event Listeners ---

    // Formulário de Cadastro de Voo: Mudar projeto -> Carregar elenco
    if (projetoSelectVoo) {
        projetoSelectVoo.addEventListener('change', function() {
            fetchCast(this.value, elencoSelectVoo);
        });
    }

    // Seção de Consulta: Mudar projeto -> Carregar elenco
    if (projetoSelectConsulta) {
        projetoSelectConsulta.addEventListener('change', function() {
            const projectId = this.value;
            // Limpa resultados e select de elenco imediatamente
            if (resultadoConsultaDiv) {
                resultadoConsultaDiv.innerHTML = '<p>Selecione um membro do elenco para ver os voos.</p>';
            }
            populateSelect(elencoSelectConsulta, [], '-- Selecione o Projeto Primeiro --', true);
            // Busca o novo elenco
            fetchCast(projectId, elencoSelectConsulta);
        });
    }

    // Seção de Consulta: Mudar membro do elenco -> Carregar voos
    if (elencoSelectConsulta) {
        elencoSelectConsulta.addEventListener('change', function() {
            fetchFlights(this.value);
        });
    }

    // --- Inicialização (Opcional) ---
    // Se quiser pré-carregar o elenco do primeiro projeto selecionado (se houver)
    // if (projetoSelectVoo && projetoSelectVoo.value) {
    //     fetchCast(projetoSelectVoo.value, elencoSelectVoo);
    // }
    // if (projetoSelectConsulta && projetoSelectConsulta.value) {
    //     fetchCast(projetoSelectConsulta.value, elencoSelectConsulta);
    // }

});