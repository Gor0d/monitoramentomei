// Sistema de Monitoramento de Horas - MEI
class SistemaMonitoramento {
    constructor() {
        this.valorHora = 0;
        this.registros = [];
        this.filtros = {
            dataInicio: null,
            dataFim: null,
            cliente: null
        };
        this.inicializar();
    }

    inicializar() {
        this.carregarDados();
        this.configurarEventos();
        this.atualizarInterface();
        this.definirDataAtual();
    }

    definirDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('dataTrabalho').value = hoje;
    }

    configurarEventos() {
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
    }

    salvarValorHora() {
        const valor = parseFloat(document.getElementById('valorHora').value);

        if (isNaN(valor) || valor < 0) {
            alert('Por favor, insira um valor válido.');
            return;
        }

        // Se já existem registros, perguntar se quer recalcular
        if (this.registros.length > 0 && this.valorHora !== valor) {
            const confirmar = confirm(
                `Você possui ${this.registros.length} registro(s) salvos.\n\n` +
                `Deseja recalcular TODOS os registros com o novo valor de R$ ${valor.toFixed(2)}?\n\n` +
                `Valor atual: R$ ${this.valorHora.toFixed(2)}\n` +
                `Novo valor: R$ ${valor.toFixed(2)}\n\n` +
                `Clique em OK para recalcular ou Cancelar para apenas alterar o valor (novos registros usarão o novo valor).`
            );

            if (confirmar) {
                this.recalcularTodosRegistros(valor);
            }
        }

        this.valorHora = valor;
        this.salvarDados();
        this.atualizarInterface();

        document.getElementById('valorHora').value = '';
        alert('Valor por hora salvo com sucesso!');
    }

    recalcularTodosRegistros(novoValorHora) {
        this.registros.forEach(registro => {
            registro.valor = registro.horas * novoValorHora;
        });
        alert(`${this.registros.length} registro(s) recalculado(s) com sucesso!`);
    }

    adicionarRegistro() {
        const data = document.getElementById('dataTrabalho').value;
        const horas = parseFloat(document.getElementById('horasTrabalho').value);
        const descricao = document.getElementById('descricao').value;
        const cliente = document.getElementById('cliente').value;

        if (!data || isNaN(horas) || horas <= 0) {
            alert('Por favor, preencha a data e as horas trabalhadas corretamente.');
            return;
        }

        const registro = {
            id: Date.now(),
            data: data,
            horas: horas,
            descricao: descricao,
            cliente: cliente,
            valor: horas * this.valorHora
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

    excluirRegistro(id) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            this.registros = this.registros.filter(r => r.id !== id);
            this.salvarDados();
            this.atualizarInterface();
        }
    }

    aplicarFiltros() {
        this.filtros.dataInicio = document.getElementById('filtroDataInicio').value;
        this.filtros.dataFim = document.getElementById('filtroDataFim').value;
        this.filtros.cliente = document.getElementById('filtroCliente').value.toLowerCase();

        this.atualizarInterface();
    }

    limparFiltros() {
        this.filtros = {
            dataInicio: null,
            dataFim: null,
            cliente: null
        };

        document.getElementById('filtroDataInicio').value = '';
        document.getElementById('filtroDataFim').value = '';
        document.getElementById('filtroCliente').value = '';

        this.atualizarInterface();
    }

    obterRegistrosFiltrados() {
        return this.registros.filter(registro => {
            let passa = true;

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

            return passa;
        });
    }

    atualizarInterface() {
        this.atualizarValorHora();
        this.atualizarTabela();
        this.atualizarResumo();
    }

    atualizarValorHora() {
        document.getElementById('valorAtualDisplay').textContent =
            this.formatarMoeda(this.valorHora);
    }

    atualizarTabela() {
        const tbody = document.getElementById('corpoTabela');
        const registrosFiltrados = this.obterRegistrosFiltrados();

        // Ordenar por data (mais recente primeiro)
        registrosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

        if (registrosFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="6">Nenhum registro encontrado.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = registrosFiltrados.map(registro => `
            <tr>
                <td>${this.formatarData(registro.data)}</td>
                <td>${registro.horas}h</td>
                <td>${this.formatarMoeda(registro.valor)}</td>
                <td>${registro.cliente || '-'}</td>
                <td>${registro.descricao || '-'}</td>
                <td>
                    <button class="btn btn-danger" onclick="sistema.excluirRegistro(${registro.id})">
                        Excluir
                    </button>
                </td>
            </tr>
        `).join('');
    }

    atualizarResumo() {
        const registrosFiltrados = this.obterRegistrosFiltrados();

        const totalHoras = registrosFiltrados.reduce((sum, r) => sum + r.horas, 0);
        const totalValor = registrosFiltrados.reduce((sum, r) => sum + r.valor, 0);

        document.getElementById('totalHoras').textContent = `${totalHoras.toFixed(1)}h`;
        document.getElementById('previsaoRecebimento').textContent = this.formatarMoeda(totalValor);
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
                    <strong>${this.formatarData(registro.data)}</strong> - ${registro.horas}h - ${this.formatarMoeda(registro.valor)}
                    ${registro.cliente ? `<br>Cliente: ${registro.cliente}` : ''}
                    ${registro.descricao ? `<br>Descrição: ${registro.descricao}` : ''}
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

        let csv = 'Data,Horas,Valor,Cliente,Descrição\n';

        registrosFiltrados.forEach(registro => {
            csv += `${registro.data},${registro.horas},${registro.valor.toFixed(2)},"${registro.cliente}","${registro.descricao}"\n`;
        });

        // Adicionar totais
        const totalHoras = registrosFiltrados.reduce((sum, r) => sum + r.horas, 0);
        const totalValor = registrosFiltrados.reduce((sum, r) => sum + r.valor, 0);
        csv += `\nTOTAL,${totalHoras.toFixed(1)},${totalValor.toFixed(2)},,`;

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

    exportarJSON() {
        const dados = {
            valorHora: this.valorHora,
            registros: this.registros,
            dataExportacao: new Date().toISOString(),
            versao: '1.0'
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
                if (!dados.valorHora && dados.valorHora !== 0) {
                    throw new Error('Arquivo JSON inválido: falta valorHora');
                }
                if (!Array.isArray(dados.registros)) {
                    throw new Error('Arquivo JSON inválido: registros deve ser um array');
                }

                // Confirmar com o usuário
                const confirmar = confirm(
                    `Deseja importar este backup?\n\n` +
                    `Valor por hora: R$ ${dados.valorHora.toFixed(2)}\n` +
                    `Total de registros: ${dados.registros.length}\n` +
                    `Data da exportação: ${dados.dataExportacao ? new Date(dados.dataExportacao).toLocaleString('pt-BR') : 'Desconhecida'}\n\n` +
                    `ATENÇÃO: Isso irá substituir todos os dados atuais!`
                );

                if (confirmar) {
                    this.valorHora = dados.valorHora;
                    this.registros = dados.registros;
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

    salvarDados() {
        const dados = {
            valorHora: this.valorHora,
            registros: this.registros
        };
        localStorage.setItem('sistemaMonitoramentoMEI', JSON.stringify(dados));
    }

    carregarDados() {
        const dados = localStorage.getItem('sistemaMonitoramentoMEI');
        if (dados) {
            const parsed = JSON.parse(dados);
            this.valorHora = parsed.valorHora || 0;
            this.registros = parsed.registros || [];
        }
    }
}

// Inicializar o sistema
const sistema = new SistemaMonitoramento();
