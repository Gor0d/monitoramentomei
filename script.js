// Sistema de Monitoramento de Horas - MEI
class SistemaMonitoramento {
    constructor() {
        this.valoresPorHora = {
            'Emerson': 0,
            'Felipe': 0,
            'Thiago Martins': 0,
            'Carlos': 0
        };
        this.prestadorAtual = 'Emerson';
        this.registros = [];
        this.registrosSelecionados = new Set(); // IDs dos registros selecionados
        this.paginaAtual = 1;
        this.registrosPorPagina = 20;
        this.filtros = {
            dataInicio: null,
            dataFim: null,
            cliente: null,
            prestador: null,
            apenasPendentes: false
        };
        this.inicializar();
    }

    inicializar() {
        this.carregarDados();
        this.migrarDadosAntigos();
        this.configurarEventos();
        this.atualizarInterface();
        this.definirDataAtual();
    }

    definirDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('dataTrabalho').value = hoje;
    }

    configurarEventos() {
        // Mudar prestador na configuração
        document.getElementById('prestadorConfig').addEventListener('change', (e) => {
            this.prestadorAtual = e.target.value;
            this.atualizarInterface();
        });

        // Salvar valor da hora
        document.getElementById('salvarValor').addEventListener('click', () => {
            this.salvarValorHora();
        });

        // Adicionar registro
        document.getElementById('adicionarRegistro').addEventListener('click', () => {
            this.adicionarRegistro();
        });

        // Filtros
        document.getElementById('aplicarFiltros').addEventListener('click', () => {
            this.aplicarFiltros();
        });

        document.getElementById('limparFiltros').addEventListener('click', () => {
            this.limparFiltros();
        });

        // Relatório
        document.getElementById('gerarRelatorio').addEventListener('click', () => {
            this.gerarRelatorio();
        });

        document.getElementById('imprimirRelatorio').addEventListener('click', () => {
            window.print();
        });

        // Exportar CSV
        document.getElementById('exportarDados').addEventListener('click', () => {
            this.exportarCSV();
        });

        // Gerar Descrição para NF
        document.getElementById('gerarDescricaoNF').addEventListener('click', () => {
            this.gerarDescricaoNF();
        });

        // Exportar JSON (Backup)
        document.getElementById('exportarJSON').addEventListener('click', () => {
            this.exportarJSON();
        });

        // Importar JSON (Backup)
        document.getElementById('importarJSON').addEventListener('click', () => {
            document.getElementById('inputArquivo').click();
        });

        document.getElementById('inputArquivo').addEventListener('change', (e) => {
            this.importarJSON(e);
        });

        // Modal
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('modalRelatorio').style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            const modal = document.getElementById('modalRelatorio');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Enter para adicionar registro
        document.getElementById('horasTrabalho').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.adicionarRegistro();
            }
        });

        // Modal de Edição
        document.querySelector('.close-edicao').addEventListener('click', () => {
            document.getElementById('modalEdicao').style.display = 'none';
        });

        document.getElementById('cancelarEdicao').addEventListener('click', () => {
            document.getElementById('modalEdicao').style.display = 'none';
        });

        document.getElementById('salvarEdicao').addEventListener('click', () => {
            this.salvarEdicaoRegistro();
        });

        window.addEventListener('click', (event) => {
            const modalEdicao = document.getElementById('modalEdicao');
            if (event.target === modalEdicao) {
                modalEdicao.style.display = 'none';
            }
        });

        // Seleção em lote
        document.getElementById('selecionarTodos').addEventListener('click', () => {
            this.selecionarTodos();
        });

        document.getElementById('desmarcarTodos').addEventListener('click', () => {
            this.desmarcarTodos();
        });

        document.getElementById('marcarSelecionadosNF').addEventListener('click', () => {
            this.marcarSelecionadosComoNF();
        });

        document.getElementById('marcarSelecionadosPagos').addEventListener('click', () => {
            this.marcarSelecionadosComoPagos();
        });

        // Paginação
        document.getElementById('registrosPorPagina').addEventListener('change', (e) => {
            this.registrosPorPagina = parseInt(e.target.value);
            this.paginaAtual = 1; // Volta para primeira página
            this.atualizarInterface();
        });

        document.getElementById('paginaAnterior').addEventListener('click', () => {
            if (this.paginaAtual > 1) {
                this.paginaAtual--;
                this.atualizarInterface();
            }
        });

        document.getElementById('paginaProxima').addEventListener('click', () => {
            const totalPaginas = this.calcularTotalPaginas();
            if (this.paginaAtual < totalPaginas) {
                this.paginaAtual++;
                this.atualizarInterface();
            }
        });
    }

    salvarValorHora() {
        const valor = parseFloat(document.getElementById('valorHora').value);
        const prestador = this.prestadorAtual;

        if (isNaN(valor) || valor < 0) {
            alert('Por favor, insira um valor válido.');
            return;
        }

        // Contar registros do prestador atual
        const registrosDoPrestador = this.registros.filter(r => r.prestador === prestador);

        // Se já existem registros, perguntar se quer recalcular
        if (registrosDoPrestador.length > 0 && this.valoresPorHora[prestador] !== valor) {
            const confirmar = confirm(
                `Você possui ${registrosDoPrestador.length} registro(s) de ${prestador}.\n\n` +
                `Deseja recalcular os registros de ${prestador} com o novo valor de R$ ${valor.toFixed(2)}?\n\n` +
                `Valor atual: R$ ${this.valoresPorHora[prestador].toFixed(2)}\n` +
                `Novo valor: R$ ${valor.toFixed(2)}\n\n` +
                `Clique em OK para recalcular ou Cancelar para apenas alterar o valor (novos registros usarão o novo valor).`
            );

            if (confirmar) {
                this.recalcularRegistrosPrestador(prestador, valor);
            }
        }

        this.valoresPorHora[prestador] = valor;
        this.salvarDados();
        this.atualizarInterface();

        document.getElementById('valorHora').value = '';
        alert(`Valor por hora de ${prestador} salvo com sucesso!`);
    }

    recalcularRegistrosPrestador(prestador, novoValorHora) {
        this.registros.forEach(registro => {
            if (registro.prestador === prestador) {
                registro.valor = registro.horas * novoValorHora;
            }
        });
        const quantidade = this.registros.filter(r => r.prestador === prestador).length;
        alert(`${quantidade} registro(s) de ${prestador} recalculado(s) com sucesso!`);
    }

    adicionarRegistro() {
        const prestador = document.getElementById('prestadorRegistro').value;
        const data = document.getElementById('dataTrabalho').value;
        const horas = parseFloat(document.getElementById('horasTrabalho').value);
        const descricao = document.getElementById('descricao').value;
        const cliente = document.getElementById('cliente').value;

        if (!data || isNaN(horas) || horas <= 0) {
            alert('Por favor, preencha a data e as horas trabalhadas corretamente.');
            return;
        }

        const valorHoraPrestador = this.valoresPorHora[prestador] || 0;

        if (valorHoraPrestador === 0) {
            alert(`Atenção: Configure o valor por hora de ${prestador} antes de adicionar registros.`);
        }

        const registro = {
            id: Date.now(),
            prestador: prestador,
            data: data,
            horas: horas,
            descricao: descricao,
            cliente: cliente,
            valor: horas * valorHoraPrestador,
            nfGerada: false,
            numeroNF: null,
            dataEmissaoNF: null,
            chaveAcessoNF: null,
            pago: false
        };

        this.registros.push(registro);
        this.salvarDados();
        this.atualizarInterface();
        this.limparFormulario();

        alert('Registro adicionado com sucesso!');
    }

    limparFormulario() {
        this.definirDataAtual();
        document.getElementById('horasTrabalho').value = '';
        document.getElementById('descricao').value = '';
        document.getElementById('cliente').value = '';
    }

    editarRegistro(id) {
        const registro = this.registros.find(r => r.id === id);
        if (!registro) return;

        // Preencher o formulário com os dados do registro
        document.getElementById('editarId').value = registro.id;
        document.getElementById('editarPrestador').value = registro.prestador || 'Emerson';
        document.getElementById('editarData').value = registro.data;
        document.getElementById('editarHoras').value = registro.horas;
        document.getElementById('editarCliente').value = registro.cliente || '';
        document.getElementById('editarDescricao').value = registro.descricao || '';

        // Abrir modal
        document.getElementById('modalEdicao').style.display = 'block';
    }

    salvarEdicaoRegistro() {
        const id = parseInt(document.getElementById('editarId').value);
        const prestador = document.getElementById('editarPrestador').value;
        const data = document.getElementById('editarData').value;
        const horas = parseFloat(document.getElementById('editarHoras').value);
        const cliente = document.getElementById('editarCliente').value;
        const descricao = document.getElementById('editarDescricao').value;

        // Validações
        if (!data || isNaN(horas) || horas <= 0) {
            alert('Por favor, preencha a data e as horas trabalhadas corretamente.');
            return;
        }

        // Encontrar e atualizar o registro
        const registro = this.registros.find(r => r.id === id);
        if (!registro) {
            alert('Registro não encontrado!');
            return;
        }

        // Obter valor/hora do prestador
        const valorHoraPrestador = this.valoresPorHora[prestador] || 0;

        // Atualizar dados
        registro.prestador = prestador;
        registro.data = data;
        registro.horas = horas;
        registro.cliente = cliente;
        registro.descricao = descricao;
        registro.valor = horas * valorHoraPrestador;

        // Salvar e atualizar interface
        this.salvarDados();
        this.atualizarInterface();

        // Fechar modal
        document.getElementById('modalEdicao').style.display = 'none';

        alert('Registro atualizado com sucesso!');
    }

    excluirRegistro(id) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            this.registros = this.registros.filter(r => r.id !== id);
            this.salvarDados();
            this.atualizarInterface();
        }
    }

    marcarNFGerada(id) {
        const registro = this.registros.find(r => r.id === id);
        if (!registro) return;

        const numeroNF = prompt('Digite o número da Nota Fiscal:');
        if (!numeroNF) {
            alert('Número da NF é obrigatório!');
            return;
        }

        const dataEmissao = prompt('Digite a data de emissão (DD/MM/AAAA) ou deixe em branco para hoje:');
        const chaveAcesso = prompt('Digite a Chave de Acesso da NFS-e (44 dígitos) - Opcional:');

        registro.nfGerada = true;
        registro.numeroNF = numeroNF;
        registro.dataEmissaoNF = dataEmissao || new Date().toLocaleDateString('pt-BR');
        registro.chaveAcessoNF = chaveAcesso || null;

        this.salvarDados();
        this.atualizarInterface();

        alert(`Registro marcado como NF ${numeroNF} gerada com sucesso!`);
    }

    editarNFGerada(id) {
        const registro = this.registros.find(r => r.id === id);
        if (!registro || !registro.nfGerada) return;

        const numeroNF = prompt('Número da Nota Fiscal:', registro.numeroNF || '');
        if (!numeroNF) {
            alert('Número da NF é obrigatório!');
            return;
        }

        const dataEmissao = prompt('Data de emissão (DD/MM/AAAA):', registro.dataEmissaoNF || '');
        const chaveAcesso = prompt('Chave de Acesso da NFS-e (44 dígitos):', registro.chaveAcessoNF || '');

        registro.numeroNF = numeroNF;
        registro.dataEmissaoNF = dataEmissao || registro.dataEmissaoNF;
        registro.chaveAcessoNF = chaveAcesso || null;

        this.salvarDados();
        this.atualizarInterface();

        alert(`Dados da NF ${numeroNF} atualizados com sucesso!`);
    }

    marcarComoPago(id) {
        const registro = this.registros.find(r => r.id === id);
        if (!registro || !registro.nfGerada) {
            alert('Apenas registros com NF gerada podem ser marcados como pagos!');
            return;
        }

        if (registro.pago) {
            alert('Este registro já está marcado como pago!');
            return;
        }

        const confirmar = confirm(
            `Deseja marcar este registro como PAGO?\n\n` +
            `NF: ${registro.numeroNF}\n` +
            `Valor: ${this.formatarMoeda(registro.valor)}\n` +
            `Prestador: ${registro.prestador}\n\n` +
            `Este valor será removido da previsão de recebimento.`
        );

        if (!confirmar) return;

        registro.pago = true;
        this.salvarDados();
        this.atualizarInterface();

        alert('Registro marcado como PAGO com sucesso!');
    }

    toggleSelecao(id) {
        if (this.registrosSelecionados.has(id)) {
            this.registrosSelecionados.delete(id);
        } else {
            this.registrosSelecionados.add(id);
        }
        this.atualizarContadorSelecao();
    }

    selecionarTodos() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        // Obter apenas os registros da página atual
        const inicio = (this.paginaAtual - 1) * this.registrosPorPagina;
        const fim = inicio + this.registrosPorPagina;
        const registrosPaginaAtual = registrosFiltrados.slice(inicio, fim);

        registrosPaginaAtual.forEach(r => {
            this.registrosSelecionados.add(r.id);
        });
        this.atualizarInterface();
    }

    desmarcarTodos() {
        this.registrosSelecionados.clear();
        this.atualizarInterface();
    }

    atualizarContadorSelecao() {
        const contador = document.getElementById('contadorSelecionados');
        const qtd = this.registrosSelecionados.size;
        contador.textContent = `${qtd} selecionado${qtd !== 1 ? 's' : ''}`;
    }

    marcarSelecionadosComoNF() {
        if (this.registrosSelecionados.size === 0) {
            alert('Nenhum registro selecionado!');
            return;
        }

        const numeroNF = prompt('Digite o número da Nota Fiscal:');
        if (!numeroNF) {
            alert('Número da NF é obrigatório!');
            return;
        }

        const dataEmissao = prompt('Digite a data de emissão (DD/MM/AAAA) ou deixe em branco para hoje:');
        const chaveAcesso = prompt('Digite a Chave de Acesso da NFS-e (44 dígitos) - Opcional:');

        const dataFinal = dataEmissao || new Date().toLocaleDateString('pt-BR');
        let contador = 0;

        this.registrosSelecionados.forEach(id => {
            const registro = this.registros.find(r => r.id === id);
            if (registro && !registro.nfGerada) {
                registro.nfGerada = true;
                registro.numeroNF = numeroNF;
                registro.dataEmissaoNF = dataFinal;
                registro.chaveAcessoNF = chaveAcesso || null;
                contador++;
            }
        });

        this.registrosSelecionados.clear();
        this.salvarDados();
        this.atualizarInterface();

        alert(`${contador} registro(s) marcado(s) como NF ${numeroNF} com sucesso!`);
    }

    marcarSelecionadosComoPagos() {
        if (this.registrosSelecionados.size === 0) {
            alert('Nenhum registro selecionado!');
            return;
        }

        // Filtrar apenas os registros com NF gerada e não pagos
        const registrosValidos = [];
        const registrosSemNF = [];
        const registrosJaPagos = [];
        let totalValor = 0;

        this.registrosSelecionados.forEach(id => {
            const registro = this.registros.find(r => r.id === id);
            if (registro) {
                if (registro.nfGerada && !registro.pago) {
                    registrosValidos.push(registro);
                    totalValor += registro.valor;
                } else if (registro.pago) {
                    registrosJaPagos.push(registro);
                } else {
                    registrosSemNF.push(registro);
                }
            }
        });

        if (registrosSemNF.length > 0) {
            alert(`${registrosSemNF.length} registro(s) selecionado(s) não possui(em) NF gerada.\nApenas registros com NF podem ser marcados como pagos.`);
        }

        if (registrosJaPagos.length > 0 && registrosValidos.length === 0) {
            alert(`Os registros selecionados já estão marcados como pagos.`);
            return;
        }

        if (registrosValidos.length === 0) {
            alert('Nenhum registro válido para marcar como pago!\n\nApenas registros com NF gerada e ainda não pagos podem ser marcados.');
            return;
        }

        const confirmar = confirm(
            `Deseja marcar ${registrosValidos.length} registro(s) como PAGOS?\n\n` +
            `Valor total: ${this.formatarMoeda(totalValor)}\n\n` +
            `Estes valores serão removidos da previsão de recebimento.`
        );

        if (!confirmar) return;

        let contador = 0;
        registrosValidos.forEach(registro => {
            registro.pago = true;
            contador++;
        });

        this.registrosSelecionados.clear();
        this.salvarDados();
        this.atualizarInterface();

        alert(`${contador} registro(s) marcado(s) como PAGOS com sucesso!\nValor total: ${this.formatarMoeda(totalValor)}`);
    }

    verDescricaoCompleta(id) {
        const registro = this.registros.find(r => r.id === id);
        if (!registro) return;

        const modal = document.getElementById('modalRelatorio');
        const conteudo = document.getElementById('conteudoRelatorio');

        const infoNF = registro.nfGerada ? `
            <div style="background: #d1fae5; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                <h3 style="margin-bottom: 15px; color: #065f46;">✅ Informações da Nota Fiscal</h3>
                <p><strong>Número da NF:</strong> ${registro.numeroNF || '-'}</p>
                <p><strong>Data de Emissão:</strong> ${registro.dataEmissaoNF || '-'}</p>
                ${registro.chaveAcessoNF ? `<p><strong>Chave de Acesso:</strong> <span style="font-family: monospace; font-size: 0.9em;">${registro.chaveAcessoNF}</span></p>` : ''}
            </div>
        ` : '';

        conteudo.innerHTML = `
            <div style="background: #f7fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px; color: #3b82f6;">Detalhes do Registro</h3>
                <p><strong>Prestador:</strong> ${registro.prestador || 'Emerson'}</p>
                <p><strong>Data:</strong> ${this.formatarData(registro.data)}</p>
                <p><strong>Horas:</strong> ${registro.horas}h</p>
                <p><strong>Valor:</strong> ${this.formatarMoeda(registro.valor)}</p>
                <p><strong>Cliente:</strong> ${registro.cliente || '-'}</p>
            </div>
            ${infoNF}
            <div style="background: white; padding: 20px; border: 2px solid #3b82f6; border-radius: 10px;">
                <h3 style="margin-bottom: 15px; color: #3b82f6;">Descrição dos Serviços Prestados</h3>
                <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
                    ${registro.descricao || 'Sem descrição'}
                </div>
            </div>
        `;

        // Esconder botão de imprimir relatório
        document.getElementById('imprimirRelatorio').style.display = 'none';

        modal.style.display = 'block';
    }

    aplicarFiltros() {
        this.filtros.prestador = document.getElementById('filtroPrestador').value;
        this.filtros.dataInicio = document.getElementById('filtroDataInicio').value;
        this.filtros.dataFim = document.getElementById('filtroDataFim').value;
        this.filtros.cliente = document.getElementById('filtroCliente').value.toLowerCase();
        this.filtros.apenasPendentes = document.getElementById('filtroApenasPendentes').checked;

        this.atualizarInterface();
    }

    limparFiltros() {
        this.filtros = {
            dataInicio: null,
            dataFim: null,
            cliente: null,
            prestador: null,
            apenasPendentes: false
        };

        document.getElementById('filtroPrestador').value = '';
        document.getElementById('filtroDataInicio').value = '';
        document.getElementById('filtroDataFim').value = '';
        document.getElementById('filtroCliente').value = '';
        document.getElementById('filtroApenasPendentes').checked = false;

        this.atualizarInterface();
    }

    obterRegistrosFiltrados() {
        return this.registros.filter(registro => {
            let passa = true;

            // Filtro de prestador
            if (this.filtros.prestador && registro.prestador !== this.filtros.prestador) {
                passa = false;
            }

            // Filtro de data início
            if (this.filtros.dataInicio && registro.data < this.filtros.dataInicio) {
                passa = false;
            }

            // Filtro de data fim
            if (this.filtros.dataFim && registro.data > this.filtros.dataFim) {
                passa = false;
            }

            // Filtro de cliente
            if (this.filtros.cliente && !registro.cliente.toLowerCase().includes(this.filtros.cliente)) {
                passa = false;
            }

            // Filtro de apenas pendentes (sem NF gerada)
            if (this.filtros.apenasPendentes && registro.nfGerada) {
                passa = false;
            }

            return passa;
        });
    }

    atualizarInterface() {
        this.atualizarValorHora();
        this.atualizarTabela();
        this.atualizarResumo();
        this.atualizarContadorSelecao();
    }

    atualizarValorHora() {
        document.getElementById('prestadorAtualDisplay').textContent = this.prestadorAtual;
        document.getElementById('valorAtualDisplay').textContent =
            this.formatarMoeda(this.valoresPorHora[this.prestadorAtual]);
    }

    calcularTotalPaginas() {
        const registrosFiltrados = this.obterRegistrosFiltrados();
        return Math.ceil(registrosFiltrados.length / this.registrosPorPagina);
    }

    atualizarTabela() {
        const tbody = document.getElementById('corpoTabela');
        const registrosFiltrados = this.obterRegistrosFiltrados();

        console.log('🔄 Atualizando tabela...');
        console.log(`📋 Total de registros no sistema: ${this.registros.length}`);
        console.log(`🔎 Registros filtrados: ${registrosFiltrados.length}`);

        // Ordenar por data (mais recente primeiro)
        registrosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Atualizar informações de paginação
        const totalPaginas = this.calcularTotalPaginas();
        const inicio = (this.paginaAtual - 1) * this.registrosPorPagina;
        const fim = inicio + this.registrosPorPagina;
        const registrosPaginados = registrosFiltrados.slice(inicio, fim);

        // Atualizar UI de paginação
        document.getElementById('infoPaginacao').textContent = `Página ${this.paginaAtual} de ${totalPaginas || 1}`;
        document.getElementById('totalRegistros').textContent = `Total: ${registrosFiltrados.length} registro${registrosFiltrados.length !== 1 ? 's' : ''}`;

        // Habilitar/desabilitar botões
        document.getElementById('paginaAnterior').disabled = this.paginaAtual === 1;
        document.getElementById('paginaProxima').disabled = this.paginaAtual >= totalPaginas;

        if (registrosFiltrados.length === 0) {
            console.log('⚠️ Nenhum registro para exibir');
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="9">Nenhum registro encontrado.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = registrosPaginados.map(registro => {
            const descricaoResumo = registro.descricao
                ? (registro.descricao.length > 50
                    ? registro.descricao.substring(0, 50) + '...'
                    : registro.descricao)
                : '-';

            const temDescricao = registro.descricao && registro.descricao.length > 0;

            const statusNF = registro.nfGerada
                ? `<div style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                    <span style="color: #10b981; font-weight: bold;">✓ NF ${registro.numeroNF || 'gerada'}</span>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75em;" onclick="sistema.editarNFGerada(${registro.id})">Editar NF</button>
                   </div>`
                : `<button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.85em;" onclick="sistema.marcarNFGerada(${registro.id})">Marcar NF</button>`;

            const statusPagamento = registro.pago
                ? `<span style="color: #059669; font-weight: bold;">✓ Pago</span>`
                : (registro.nfGerada
                    ? `<button class="btn btn-success" style="padding: 5px 10px; font-size: 0.85em;" onclick="sistema.marcarComoPago(${registro.id})">Marcar Pago</button>`
                    : `<span style="color: #9ca3af;">-</span>`);

            const checkboxChecked = this.registrosSelecionados.has(registro.id) ? 'checked' : '';

            const corFundo = registro.pago ? 'background-color: #d1fae5;' : (registro.nfGerada ? 'background-color: #f0fdf4;' : '');

            return `
            <tr style="${corFundo}">
                <td style="text-align: center;">
                    <input type="checkbox" ${checkboxChecked} onchange="sistema.toggleSelecao(${registro.id})" style="cursor: pointer; width: 18px; height: 18px;">
                </td>
                <td><strong>${registro.prestador || 'Emerson'}</strong></td>
                <td>${this.formatarData(registro.data)}</td>
                <td>${registro.horas}h</td>
                <td>${this.formatarMoeda(registro.valor)}</td>
                <td>${registro.cliente || '-'}</td>
                <td style="max-width: 300px;">
                    <div style="white-space: pre-wrap; word-break: break-word;">${descricaoResumo}</div>
                    ${temDescricao && registro.descricao.length > 50
                        ? `<button class="btn btn-secondary" style="margin-top: 5px; padding: 5px 10px; font-size: 0.85em;" onclick="sistema.verDescricaoCompleta(${registro.id})">Ver completo</button>`
                        : ''}
                </td>
                <td style="text-align: center;">${statusNF}</td>
                <td style="text-align: center;">${statusPagamento}</td>
                <td>
                    <button class="btn btn-secondary" style="margin-right: 5px;" onclick="sistema.editarRegistro(${registro.id})">
                        Editar
                    </button>
                    <button class="btn btn-danger" onclick="sistema.excluirRegistro(${registro.id})">
                        Excluir
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }

    atualizarResumo() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        // Totais gerais (apenas registros não pagos para previsão)
        const totalHoras = registrosFiltrados.reduce((sum, r) => sum + r.horas, 0);
        const registrosNaoPagos = registrosFiltrados.filter(r => !r.pago);
        const totalValor = registrosNaoPagos.reduce((sum, r) => sum + r.valor, 0);

        document.getElementById('totalHoras').textContent = `${totalHoras.toFixed(1)}h`;
        document.getElementById('previsaoRecebimento').textContent = this.formatarMoeda(totalValor);

        // Por prestador (apenas não pagos para os valores)
        const registrosEmerson = registrosFiltrados.filter(r => r.prestador === 'Emerson');
        const horasEmerson = registrosEmerson.reduce((sum, r) => sum + r.horas, 0);
        const valorEmerson = registrosEmerson.filter(r => !r.pago).reduce((sum, r) => sum + r.valor, 0);

        const registrosFelipe = registrosFiltrados.filter(r => r.prestador === 'Felipe');
        const horasFelipe = registrosFelipe.reduce((sum, r) => sum + r.horas, 0);
        const valorFelipe = registrosFelipe.filter(r => !r.pago).reduce((sum, r) => sum + r.valor, 0);

        const registrosThiagoMartins = registrosFiltrados.filter(r => r.prestador === 'Thiago Martins');
        const horasThiagoMartins = registrosThiagoMartins.reduce((sum, r) => sum + r.horas, 0);
        const valorThiagoMartins = registrosThiagoMartins.filter(r => !r.pago).reduce((sum, r) => sum + r.valor, 0);

        const registrosCarlos = registrosFiltrados.filter(r => r.prestador === 'Carlos');
        const horasCarlos = registrosCarlos.reduce((sum, r) => sum + r.horas, 0);
        const valorCarlos = registrosCarlos.filter(r => !r.pago).reduce((sum, r) => sum + r.valor, 0);

        document.getElementById('horasEmerson').textContent = `${horasEmerson.toFixed(1)}h`;
        document.getElementById('valorEmerson').textContent = this.formatarMoeda(valorEmerson);
        document.getElementById('horasFelipe').textContent = `${horasFelipe.toFixed(1)}h`;
        document.getElementById('valorFelipe').textContent = this.formatarMoeda(valorFelipe);
        document.getElementById('horasThiagoMartins').textContent = `${horasThiagoMartins.toFixed(1)}h`;
        document.getElementById('valorThiagoMartins').textContent = this.formatarMoeda(valorThiagoMartins);
        document.getElementById('horasCarlos').textContent = `${horasCarlos.toFixed(1)}h`;
        document.getElementById('valorCarlos').textContent = this.formatarMoeda(valorCarlos);

        // Separação: Pendentes vs Faturados (baseado em TODOS os registros, não filtrados)
        const registrosPendentes = this.registros.filter(r => !r.nfGerada);
        const horasPendentes = registrosPendentes.reduce((sum, r) => sum + r.horas, 0);
        const valorPendentes = registrosPendentes.reduce((sum, r) => sum + r.valor, 0);

        const registrosFaturados = this.registros.filter(r => r.nfGerada);
        const horasFaturados = registrosFaturados.reduce((sum, r) => sum + r.horas, 0);
        const valorFaturados = registrosFaturados.reduce((sum, r) => sum + r.valor, 0);

        document.getElementById('horasPendentes').textContent = `${horasPendentes.toFixed(1)}h`;
        document.getElementById('valorPendentes').textContent = this.formatarMoeda(valorPendentes);
        document.getElementById('horasFaturados').textContent = `${horasFaturados.toFixed(1)}h`;
        document.getElementById('valorFaturados').textContent = this.formatarMoeda(valorFaturados);

        // Resumo Financeiro Detalhado
        const registrosSemNF = this.registros.filter(r => !r.nfGerada && !r.pago);
        const valorSemNF = registrosSemNF.reduce((sum, r) => sum + r.valor, 0);

        const registrosComNFNaoPago = this.registros.filter(r => r.nfGerada && !r.pago);
        const valorNFNaoPago = registrosComNFNaoPago.reduce((sum, r) => sum + r.valor, 0);

        const registrosPagos = this.registros.filter(r => r.pago);
        const valorPagos = registrosPagos.reduce((sum, r) => sum + r.valor, 0);

        document.getElementById('valorSemNF').textContent = this.formatarMoeda(valorSemNF);
        document.getElementById('valorNFNaoPago').textContent = this.formatarMoeda(valorNFNaoPago);
        document.getElementById('valorPagos').textContent = this.formatarMoeda(valorPagos);

        // Valores a Pagar por Colaborador
        const prestadores = ['Emerson', 'Felipe', 'Thiago Martins', 'Carlos'];
        prestadores.forEach(prestador => {
            const nomeSemEspaco = prestador.replace(' ', '');

            // Sem NF
            const semNF = this.registros.filter(r => r.prestador === prestador && !r.nfGerada && !r.pago)
                .reduce((sum, r) => sum + r.valor, 0);

            // Com NF mas não pago
            const comNF = this.registros.filter(r => r.prestador === prestador && r.nfGerada && !r.pago)
                .reduce((sum, r) => sum + r.valor, 0);

            // Total a pagar
            const totalAPagar = semNF + comNF;

            const prefixo = prestador === 'Emerson' ? 'emerson' :
                           prestador === 'Felipe' ? 'felipe' :
                           prestador === 'Thiago Martins' ? 'thiagoMartins' :
                           'carlos';

            document.getElementById(`${prefixo}SemNF`).textContent = this.formatarMoeda(semNF);
            document.getElementById(`${prefixo}ComNF`).textContent = this.formatarMoeda(comNF);
            document.getElementById(`${prefixo}APagar`).textContent = this.formatarMoeda(totalAPagar);
        });

        // Atualizar gráficos
        this.atualizarGraficos();
    }

    gerarRelatorio() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        if (registrosFiltrados.length === 0) {
            alert('Não há registros para gerar relatório.');
            return;
        }

        // Ordenar por data
        registrosFiltrados.sort((a, b) => new Date(a.data) - new Date(b.data));

        const totalHoras = registrosFiltrados.reduce((sum, r) => sum + r.horas, 0);
        const totalValor = registrosFiltrados.reduce((sum, r) => sum + r.valor, 0);

        // Agrupar por cliente
        const porCliente = {};
        registrosFiltrados.forEach(r => {
            const cliente = r.cliente || 'Sem cliente';
            if (!porCliente[cliente]) {
                porCliente[cliente] = { horas: 0, valor: 0, registros: 0 };
            }
            porCliente[cliente].horas += r.horas;
            porCliente[cliente].valor += r.valor;
            porCliente[cliente].registros += 1;
        });

        let html = `
            <div style="margin-bottom: 30px;">
                <h3>Período: ${this.formatarData(registrosFiltrados[0].data)} até ${this.formatarData(registrosFiltrados[registrosFiltrados.length - 1].data)}</h3>
            </div>

            <h3>Resumo por Cliente</h3>
        `;

        for (const [cliente, dados] of Object.entries(porCliente)) {
            html += `
                <div class="relatorio-item">
                    <h4>${cliente}</h4>
                    <p>Registros: ${dados.registros} | Horas: ${dados.horas.toFixed(1)}h | Valor: ${this.formatarMoeda(dados.valor)}</p>
                </div>
            `;
        }

        html += `
            <h3 style="margin-top: 30px;">Todos os Registros</h3>
        `;

        registrosFiltrados.forEach(registro => {
            html += `
                <div class="relatorio-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong>${this.formatarData(registro.data)}</strong> -
                            <strong style="color: #3b82f6;">${registro.prestador || 'Emerson'}</strong> -
                            ${registro.horas}h - ${this.formatarMoeda(registro.valor)}
                        </div>
                    </div>
                    ${registro.cliente ? `<p style="margin: 5px 0;"><strong>Cliente:</strong> ${registro.cliente}</p>` : ''}
                    ${registro.descricao ? `
                        <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px; border-left: 3px solid #3b82f6;">
                            <strong style="color: #3b82f6;">Serviços Prestados:</strong>
                            <div style="white-space: pre-wrap; margin-top: 8px; line-height: 1.5;">${registro.descricao}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        html += `
            <div class="relatorio-total">
                <h3>Total Geral</h3>
                <p>Total de Horas: ${totalHoras.toFixed(1)}h</p>
                <p class="valor">Previsão de Recebimento: ${this.formatarMoeda(totalValor)}</p>
            </div>
        `;

        document.getElementById('conteudoRelatorio').innerHTML = html;

        // Mostrar botão de imprimir relatório
        document.getElementById('imprimirRelatorio').style.display = 'inline-block';

        document.getElementById('modalRelatorio').style.display = 'block';
    }

    exportarCSV() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        if (registrosFiltrados.length === 0) {
            alert('Não há registros para exportar.');
            return;
        }

        // Ordenar por data
        registrosFiltrados.sort((a, b) => new Date(a.data) - new Date(b.data));

        let csv = 'Prestador,Data,Horas,Valor,Cliente,Descrição\n';

        registrosFiltrados.forEach(registro => {
            csv += `${registro.prestador || 'Emerson'},${registro.data},${registro.horas},${registro.valor.toFixed(2)},"${registro.cliente}","${registro.descricao}"\n`;
        });

        // Adicionar totais
        const totalHoras = registrosFiltrados.reduce((sum, r) => sum + r.horas, 0);
        const totalValor = registrosFiltrados.reduce((sum, r) => sum + r.valor, 0);
        csv += `\nTOTAL,,${totalHoras.toFixed(1)},${totalValor.toFixed(2)},,`;

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `horas_trabalhadas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    gerarDescricaoNF() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        if (registrosFiltrados.length === 0) {
            alert('Não há registros para gerar descrição.\n\nDica: Use os filtros para selecionar apenas os registros de uma NF específica.');
            return;
        }

        // Filtrar apenas registros NÃO PAGOS
        const registrosNaoPagos = registrosFiltrados.filter(r => !r.pago);

        if (registrosNaoPagos.length === 0) {
            alert('Todos os registros filtrados já foram pagos!\n\nNão há nada para gerar na descrição da NF.');
            return;
        }

        // Verificar se há registros pagos misturados
        const registrosPagos = registrosFiltrados.filter(r => r.pago);
        if (registrosPagos.length > 0) {
            const totalPago = registrosPagos.reduce((sum, r) => sum + r.valor, 0);
            alert(
                `ATENÇÃO: Foram encontrados ${registrosPagos.length} registro(s) já PAGOS nos filtros aplicados.\n\n` +
                `Valor pago: ${this.formatarMoeda(totalPago)}\n\n` +
                `Estes registros serão EXCLUÍDOS da descrição da NF.\n` +
                `Apenas registros não pagos serão incluídos.`
            );
        }

        // Verificar se há NFs diferentes misturadas
        const nfsDistintas = new Set(registrosNaoPagos.filter(r => r.nfGerada).map(r => r.numeroNF));
        if (nfsDistintas.size > 1) {
            const confirmacao = confirm(
                `ATENÇÃO: Os registros filtrados contêm ${nfsDistintas.size} NFs diferentes:\n` +
                Array.from(nfsDistintas).join(', ') + '\n\n' +
                'Deseja continuar mesmo assim?'
            );
            if (!confirmacao) return;
        }

        // Ordenar por data
        registrosNaoPagos.sort((a, b) => new Date(a.data) - new Date(b.data));

        // Calcular totais (apenas não pagos)
        const totalHoras = registrosNaoPagos.reduce((sum, r) => sum + r.horas, 0);
        const totalValor = registrosNaoPagos.reduce((sum, r) => sum + r.valor, 0);

        // Pegar prestador (assume que os registros filtrados são do mesmo prestador)
        const prestador = registrosNaoPagos[0].prestador || 'Emerson';
        const valorHora = this.valoresPorHora[prestador] || 0;

        // Datas
        const dataInicio = this.formatarData(registrosNaoPagos[0].data);
        const dataFim = this.formatarData(registrosNaoPagos[registrosNaoPagos.length - 1].data);

        // Converter total de horas para extenso
        const horasExtenso = this.numeroParaExtenso(Math.floor(totalHoras));
        const valorExtenso = this.valorParaExtenso(totalValor);

        // Agrupar descrições por projeto/cliente (APENAS NÃO PAGOS)
        const descricoesPorProjeto = {};
        registrosNaoPagos.forEach(r => {
            const projeto = r.cliente || 'Serviços Gerais';
            if (!descricoesPorProjeto[projeto]) {
                descricoesPorProjeto[projeto] = {
                    descricoes: [],
                    horas: 0,
                    valor: 0
                };
            }

            // Somar horas e valores por projeto
            descricoesPorProjeto[projeto].horas += r.horas;
            descricoesPorProjeto[projeto].valor += r.valor;

            if (r.descricao) {
                // Dividir a descrição em linhas e adicionar
                const linhas = r.descricao.split('\n').filter(l => l.trim());
                linhas.forEach(linha => {
                    const linhaLimpa = linha.trim();
                    // Remover bullet points existentes para normalizar
                    const linhaSemBullet = linhaLimpa.replace(/^[•\-]\s*/, '');
                    if (!descricoesPorProjeto[projeto].descricoes.includes(linhaSemBullet)) {
                        descricoesPorProjeto[projeto].descricoes.push(linhaSemBullet);
                    }
                });
            }
        });

        // Montar a descrição formatada
        let descricao = `DADOS BANCÁRIOS:
BANCO: SANTANDER
AGÊNCIA: 2990
CONTA: 15065217-9
CHAVE PIX: 61.505.146/0001-83

PRESTAÇÃO DE SERVIÇOS TÉCNICOS ESPECIALIZADOS EM TECNOLOGIA DA INFORMAÇÃO

Beneficiário: HAB
Período de competência: ${dataInicio} a ${dataFim}
Total de horas trabalhadas: ${totalHoras.toFixed(0)} (${horasExtenso}) horas
Valor hora técnica: R$ ${valorHora.toFixed(2)}

DISCRIMINAÇÃO DOS SERVIÇOS EXECUTADOS:

`;

        // Adicionar descrições por projeto
        for (const [projeto, dados] of Object.entries(descricoesPorProjeto)) {
            descricao += `${projeto}:\n`;
            dados.descricoes.forEach(desc => {
                descricao += `• ${desc}\n`;
            });
            descricao += '\n';
        }

        descricao += `VALOR TOTAL DOS SERVIÇOS: R$ ${totalValor.toFixed(2)} (${valorExtenso})`;

        // Mostrar em modal
        const modal = document.getElementById('modalRelatorio');
        const conteudo = document.getElementById('conteudoRelatorio');

        conteudo.innerHTML = `
            <div style="background: white; padding: 20px;">
                <h3 style="margin-bottom: 20px;">Descrição para Nota Fiscal</h3>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 5px 0;"><strong>Registros incluídos:</strong> ${registrosNaoPagos.length}</p>
                    <p style="margin: 5px 0;"><strong>Total de horas:</strong> ${totalHoras.toFixed(1)}h</p>
                    <p style="margin: 5px 0;"><strong>Valor total:</strong> ${this.formatarMoeda(totalValor)}</p>
                    ${registrosPagos.length > 0 ? `<p style="margin: 5px 0; color: #059669;"><strong>Registros pagos excluídos:</strong> ${registrosPagos.length}</p>` : ''}
                </div>
                <textarea id="descricaoNFText" readonly style="width: 100%; height: 450px; font-family: monospace; font-size: 12px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">${descricao}</textarea>
                <button id="copiarDescricao" class="btn btn-success" style="margin-top: 15px;">Copiar Descrição</button>
            </div>
        `;

        modal.style.display = 'block';

        // Adicionar evento de copiar
        setTimeout(() => {
            document.getElementById('copiarDescricao').addEventListener('click', () => {
                const textarea = document.getElementById('descricaoNFText');
                textarea.select();
                document.execCommand('copy');
                alert('Descrição copiada para a área de transferência!');
            });
        }, 100);
    }

    numeroParaExtenso(numero) {
        const unidades = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

        if (numero === 0) return 'zero';
        if (numero < 10) return unidades[numero];
        if (numero < 20) return especiais[numero - 10];
        if (numero < 100) {
            const dez = Math.floor(numero / 10);
            const uni = numero % 10;
            return dezenas[dez] + (uni > 0 ? ' e ' + unidades[uni] : '');
        }
        if (numero === 100) return 'cem';
        if (numero < 1000) {
            const cent = Math.floor(numero / 100);
            const resto = numero % 100;
            return centenas[cent] + (resto > 0 ? ' e ' + this.numeroParaExtenso(resto) : '');
        }
        return numero.toString();
    }

    valorParaExtenso(valor) {
        const partes = valor.toFixed(2).split('.');
        const reais = parseInt(partes[0]);
        const centavos = parseInt(partes[1]);

        let extenso = '';

        if (reais === 0) {
            extenso = 'zero reais';
        } else if (reais === 1) {
            extenso = 'um real';
        } else if (reais < 1000) {
            extenso = this.numeroParaExtenso(reais) + ' reais';
        } else {
            const mil = Math.floor(reais / 1000);
            const resto = reais % 1000;
            extenso = this.numeroParaExtenso(mil) + ' mil';
            if (resto > 0) {
                extenso += ' e ' + this.numeroParaExtenso(resto);
            }
            extenso += ' reais';
        }

        if (centavos > 0) {
            extenso += ' e ' + this.numeroParaExtenso(centavos) + ' centavos';
        }

        return extenso;
    }

    exportarJSON() {
        const dados = {
            valoresPorHora: this.valoresPorHora,
            registros: this.registros,
            prestadorAtual: this.prestadorAtual,
            dataExportacao: new Date().toISOString(),
            versao: '2.0'
        };

        const json = JSON.stringify(dados, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `backup_horas_mei_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('Backup exportado com sucesso! Salve o arquivo no seu pendrive.');
    }

    importarJSON(event) {
        const arquivo = event.target.files[0];

        if (!arquivo) {
            return;
        }

        if (!arquivo.name.endsWith('.json')) {
            alert('Por favor, selecione um arquivo JSON válido.');
            return;
        }

        const leitor = new FileReader();

        leitor.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);

                // Validar estrutura do arquivo
                if (!Array.isArray(dados.registros)) {
                    throw new Error('Arquivo JSON inválido: registros deve ser um array');
                }

                // Suportar formato antigo (v1.0) e novo (v2.0)
                let valoresHora = {};
                if (dados.valoresPorHora) {
                    // Novo formato v2.0
                    valoresHora = dados.valoresPorHora;
                } else if (dados.valorHora !== undefined) {
                    // Formato antigo v1.0 - migrar para Emerson
                    valoresHora = { 'Emerson': dados.valorHora, 'Felipe': 0, 'Thiago Martins': 0 };
                }

                // Confirmar com o usuário
                const versao = dados.versao || '1.0';
                const emersonValor = valoresHora['Emerson'] || 0;
                const felipeValor = valoresHora['Felipe'] || 0;
                const thiagoMartinsValor = valoresHora['Thiago Martins'] || 0;

                const confirmar = confirm(
                    `Deseja importar este backup?\n\n` +
                    `Versão: ${versao}\n` +
                    `Valor/hora Emerson: R$ ${emersonValor.toFixed(2)}\n` +
                    `Valor/hora Felipe: R$ ${felipeValor.toFixed(2)}\n` +
                    `Valor/hora Thiago Martins: R$ ${thiagoMartinsValor.toFixed(2)}\n` +
                    `Total de registros: ${dados.registros.length}\n` +
                    `Data da exportação: ${dados.dataExportacao ? new Date(dados.dataExportacao).toLocaleString('pt-BR') : 'Desconhecida'}\n\n` +
                    `ATENÇÃO: Isso irá substituir todos os dados atuais!`
                );

                if (confirmar) {
                    this.valoresPorHora = valoresHora;
                    this.registros = dados.registros;

                    if (dados.prestadorAtual) {
                        this.prestadorAtual = dados.prestadorAtual;
                    }

                    this.migrarDadosAntigos();
                    this.salvarDados();
                    this.atualizarInterface();
                    alert('Backup importado com sucesso!');
                }
            } catch (erro) {
                alert('Erro ao importar arquivo: ' + erro.message);
                console.error('Erro ao importar JSON:', erro);
            }
        };

        leitor.onerror = () => {
            alert('Erro ao ler o arquivo.');
        };

        leitor.readAsText(arquivo);

        // Limpar o input para permitir reimportar o mesmo arquivo
        event.target.value = '';
    }

    formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    formatarData(data) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    atualizarGraficos() {
        this.criarGraficoHorasDia();
        this.criarGraficoComparacao();
        this.criarGraficoEvolucao();
        this.criarGraficoStatusPagamento();
        this.criarGraficoValoresPorColaborador();
        this.criarGraficoDetalhamentoPorColaborador();
    }

    criarGraficoHorasDia() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        // Obter últimos 30 dias
        const hoje = new Date();
        const ultimos30Dias = [];
        for (let i = 29; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(data.getDate() - i);
            ultimos30Dias.push(data.toISOString().split('T')[0]);
        }

        // Agrupar horas por dia e prestador
        const horasPorDia = {};
        ultimos30Dias.forEach(data => {
            horasPorDia[data] = { Emerson: 0, Felipe: 0, 'Thiago Martins': 0, Carlos: 0 };
        });

        registrosFiltrados.forEach(registro => {
            if (horasPorDia[registro.data]) {
                const prestador = registro.prestador || 'Emerson';
                horasPorDia[registro.data][prestador] += registro.horas;
            }
        });

        const labels = ultimos30Dias.map(data => {
            const d = new Date(data + 'T00:00:00');
            return `${d.getDate()}/${d.getMonth() + 1}`;
        });

        const datasetsEmerson = ultimos30Dias.map(data => horasPorDia[data].Emerson);
        const datasetsFelipe = ultimos30Dias.map(data => horasPorDia[data].Felipe);
        const datasetsThiagoMartins = ultimos30Dias.map(data => horasPorDia[data]['Thiago Martins']);
        const datasetsCarlos = ultimos30Dias.map(data => horasPorDia[data].Carlos);

        // Destruir gráfico anterior se existir
        if (this.graficoHorasDia) {
            this.graficoHorasDia.destroy();
        }

        const ctx = document.getElementById('graficoHorasDia');
        this.graficoHorasDia = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Emerson',
                        data: datasetsEmerson,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Felipe',
                        data: datasetsFelipe,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Thiago Martins',
                        data: datasetsThiagoMartins,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Carlos',
                        data: datasetsCarlos,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + 'h';
                            }
                        }
                    }
                }
            }
        });
    }

    criarGraficoComparacao() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        const horasEmerson = registrosFiltrados
            .filter(r => r.prestador === 'Emerson')
            .reduce((sum, r) => sum + r.horas, 0);

        const horasFelipe = registrosFiltrados
            .filter(r => r.prestador === 'Felipe')
            .reduce((sum, r) => sum + r.horas, 0);

        const horasThiagoMartins = registrosFiltrados
            .filter(r => r.prestador === 'Thiago Martins')
            .reduce((sum, r) => sum + r.horas, 0);

        const horasCarlos = registrosFiltrados
            .filter(r => r.prestador === 'Carlos')
            .reduce((sum, r) => sum + r.horas, 0);

        // Destruir gráfico anterior se existir
        if (this.graficoComparacao) {
            this.graficoComparacao.destroy();
        }

        const ctx = document.getElementById('graficoComparacao');
        this.graficoComparacao = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Emerson', 'Felipe', 'Thiago Martins', 'Carlos'],
                datasets: [{
                    data: [horasEmerson, horasFelipe, horasThiagoMartins, horasCarlos],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed}h (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    criarGraficoEvolucao() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        // Agrupar por mês
        const porMes = {};
        registrosFiltrados.forEach(registro => {
            const data = new Date(registro.data + 'T00:00:00');
            const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;

            if (!porMes[mesAno]) {
                porMes[mesAno] = { Emerson: 0, Felipe: 0, 'Thiago Martins': 0, Carlos: 0 };
            }

            const prestador = registro.prestador || 'Emerson';
            porMes[mesAno][prestador] += registro.valor;
        });

        // Ordenar por data
        const mesesOrdenados = Object.keys(porMes).sort((a, b) => {
            const [mesA, anoA] = a.split('/').map(Number);
            const [mesB, anoB] = b.split('/').map(Number);
            return anoA !== anoB ? anoA - anoB : mesA - mesB;
        });

        const labels = mesesOrdenados;
        const valoresEmerson = mesesOrdenados.map(mes => porMes[mes].Emerson);
        const valoresFelipe = mesesOrdenados.map(mes => porMes[mes].Felipe);
        const valoresThiagoMartins = mesesOrdenados.map(mes => porMes[mes]['Thiago Martins']);
        const valoresCarlos = mesesOrdenados.map(mes => porMes[mes].Carlos);

        // Destruir gráfico anterior se existir
        if (this.graficoEvolucao) {
            this.graficoEvolucao.destroy();
        }

        const ctx = document.getElementById('graficoEvolucao');
        this.graficoEvolucao = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Emerson',
                        data: valoresEmerson,
                        backgroundColor: '#3b82f6',
                        borderColor: '#2563eb',
                        borderWidth: 1
                    },
                    {
                        label: 'Felipe',
                        data: valoresFelipe,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1
                    },
                    {
                        label: 'Thiago Martins',
                        data: valoresThiagoMartins,
                        backgroundColor: '#f59e0b',
                        borderColor: '#d97706',
                        borderWidth: 1
                    },
                    {
                        label: 'Carlos',
                        data: valoresCarlos,
                        backgroundColor: '#8b5cf6',
                        borderColor: '#7c3aed',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    criarGraficoStatusPagamento() {
        // Totais por status de pagamento
        const registrosSemNF = this.registros.filter(r => !r.nfGerada && !r.pago);
        const valorSemNF = registrosSemNF.reduce((sum, r) => sum + r.valor, 0);

        const registrosComNFNaoPago = this.registros.filter(r => r.nfGerada && !r.pago);
        const valorNFNaoPago = registrosComNFNaoPago.reduce((sum, r) => sum + r.valor, 0);

        const registrosPagos = this.registros.filter(r => r.pago);
        const valorPagos = registrosPagos.reduce((sum, r) => sum + r.valor, 0);

        // Destruir gráfico anterior se existir
        if (this.graficoStatusPagamento) {
            this.graficoStatusPagamento.destroy();
        }

        const ctx = document.getElementById('graficoStatusPagamento');
        this.graficoStatusPagamento = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sem NF', 'Com NF (Não Pago)', 'Pagos'],
                datasets: [{
                    data: [valorSemNF, valorNFNaoPago, valorPagos],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
                                return `${context.label}: R$ ${valor.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    criarGraficoValoresPorColaborador() {
        const prestadores = ['Emerson', 'Felipe', 'Thiago Martins', 'Carlos'];
        const valoresAPagar = [];

        prestadores.forEach(prestador => {
            // Soma dos valores sem NF + com NF não pago
            const valor = this.registros
                .filter(r => r.prestador === prestador && !r.pago)
                .reduce((sum, r) => sum + r.valor, 0);
            valoresAPagar.push(valor);
        });

        // Destruir gráfico anterior se existir
        if (this.graficoValoresPorColaborador) {
            this.graficoValoresPorColaborador.destroy();
        }

        const ctx = document.getElementById('graficoValoresPorColaborador');
        this.graficoValoresPorColaborador = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: prestadores,
                datasets: [{
                    label: 'Total a Pagar',
                    data: valoresAPagar,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderColor: ['#2563eb', '#059669', '#d97706', '#7c3aed'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `A Pagar: R$ ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    criarGraficoDetalhamentoPorColaborador() {
        const prestadores = ['Emerson', 'Felipe', 'Thiago Martins', 'Carlos'];
        const valoresSemNF = [];
        const valoresComNF = [];

        prestadores.forEach(prestador => {
            // Sem NF
            const semNF = this.registros
                .filter(r => r.prestador === prestador && !r.nfGerada && !r.pago)
                .reduce((sum, r) => sum + r.valor, 0);
            valoresSemNF.push(semNF);

            // Com NF mas não pago
            const comNF = this.registros
                .filter(r => r.prestador === prestador && r.nfGerada && !r.pago)
                .reduce((sum, r) => sum + r.valor, 0);
            valoresComNF.push(comNF);
        });

        // Destruir gráfico anterior se existir
        if (this.graficoDetalhamentoPorColaborador) {
            this.graficoDetalhamentoPorColaborador.destroy();
        }

        const ctx = document.getElementById('graficoDetalhamentoPorColaborador');
        this.graficoDetalhamentoPorColaborador = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: prestadores,
                datasets: [
                    {
                        label: 'Sem NF',
                        data: valoresSemNF,
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 1
                    },
                    {
                        label: 'Com NF (Não Pago)',
                        data: valoresComNF,
                        backgroundColor: '#f59e0b',
                        borderColor: '#d97706',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    migrarDadosAntigos() {
        // Migrar dados antigos para o novo formato com prestadores
        let migrados = false;

        this.registros.forEach(registro => {
            if (!registro.prestador) {
                registro.prestador = 'Emerson';
                migrados = true;
            }
            if (registro.pago === undefined) {
                registro.pago = false;
                migrados = true;
            }
        });

        // Se tinha valor antigo, migrar para Emerson
        const dados = localStorage.getItem('sistemaMonitoramentoMEI');
        if (dados) {
            const parsed = JSON.parse(dados);
            if (parsed.valorHora !== undefined && this.valoresPorHora['Emerson'] === 0) {
                this.valoresPorHora['Emerson'] = parsed.valorHora;
                migrados = true;
            }
        }

        if (migrados) {
            this.salvarDados();
            console.log('Dados migrados para o novo formato com prestadores');
        }
    }

    salvarDados() {
        const dados = {
            valoresPorHora: this.valoresPorHora,
            registros: this.registros,
            prestadorAtual: this.prestadorAtual
        };
        localStorage.setItem('sistemaMonitoramentoMEI', JSON.stringify(dados));
    }

    carregarDados() {
        const dados = localStorage.getItem('sistemaMonitoramentoMEI');
        console.log('🔍 Carregando dados do localStorage...');
        console.log('📦 Dados brutos:', dados);

        if (dados) {
            const parsed = JSON.parse(dados);
            console.log('✅ Dados parseados:', parsed);

            // Novo formato
            if (parsed.valoresPorHora) {
                this.valoresPorHora = parsed.valoresPorHora;
                // Garantir que todos os prestadores existem
                if (!this.valoresPorHora['Thiago Martins']) {
                    this.valoresPorHora['Thiago Martins'] = 0;
                }
                if (!this.valoresPorHora['Carlos']) {
                    this.valoresPorHora['Carlos'] = 0;
                }
            }

            if (parsed.prestadorAtual) {
                this.prestadorAtual = parsed.prestadorAtual;
            }

            this.registros = parsed.registros || [];
            console.log(`📊 Total de registros carregados: ${this.registros.length}`);
            console.log('📋 Registros:', this.registros);
        } else {
            console.log('⚠️ Nenhum dado encontrado no localStorage');
        }
    }
}

// Inicializar o sistema
const sistema = new SistemaMonitoramento();
