# Sistema de Monitoramento de Horas - MEI

Sistema web completo para controle de horas trabalhadas e cálculo de recebimentos para profissionais MEI (Microempreendedor Individual).

## 📋 Descrição

Aplicação desenvolvida em HTML, CSS e JavaScript puro para gerenciamento de horas trabalhadas, controle de múltiplos prestadores de serviço, geração de relatórios e emissão de notas fiscais.

## ✨ Funcionalidades Implementadas

### 1. **Sistema de Configuração de Valores**
- Cadastro de valor por hora para cada prestador
- Seleção de prestador ativo (Emerson e Felipe)
- Exibição do valor atual configurado
- Recálculo automático de registros ao alterar valor
- Confirmação antes de recalcular valores existentes

### 2. **Registro de Horas Trabalhadas**
- Seleção de prestador responsável
- Calendário para seleção de data
- Campo de horas trabalhadas (permite valores decimais como 0.5h)
- Campo de cliente (opcional)
- Campo de descrição detalhada dos serviços (textarea multilinha)
- Cálculo automático do valor baseado nas horas e valor/hora do prestador
- Validação de campos obrigatórios
- Alerta quando prestador não tem valor configurado

### 3. **Sistema de Múltiplos Prestadores**
- Suporte para Emerson e Felipe
- Cada prestador possui valor/hora independente
- Filtros por prestador nos relatórios
- Exibição do prestador em todos os registros
- Migração automática de dados antigos para o novo formato

### 4. **Resumo Financeiro**
- Card com total de horas trabalhadas
- Card com previsão de recebimento
- Atualização automática conforme filtros aplicados
- Valores calculados dinamicamente

### 5. **Sistema de Filtros Avançados**
- Filtro por prestador (Todos, Emerson ou Felipe)
- Filtro por período (data início e fim)
- Filtro por cliente
- Combinação de múltiplos filtros
- Botão para limpar todos os filtros
- Atualização em tempo real dos resultados

### 6. **Tabela de Registros**
- Exibição de todos os registros cadastrados
- Colunas: Prestador, Data, Horas, Valor, Cliente, Descrição, Ações
- Ordenação por data (mais recente primeiro)
- Resumo de descrição (primeiros 50 caracteres)
- Botão "Ver completo" para descrições longas
- Botão de exclusão com confirmação
- Responsiva para dispositivos móveis

### 7. **Visualização de Descrição Completa**
- Modal com detalhes completos do registro
- Informações: Prestador, Data, Horas, Valor, Cliente
- Descrição completa dos serviços prestados formatada
- Interface destacada para facilitar cópia para NFS

### 8. **Geração de Relatórios**
- Relatório detalhado com período filtrado
- Resumo por cliente (horas e valores)
- Lista completa de todos os registros
- Descrições completas dos serviços formatadas
- Exibição de prestador em cada registro
- Totalização geral (horas e valores)
- Botão para impressão do relatório
- Modal para visualização antes de imprimir

### 9. **Exportação para CSV**
- Exporta registros filtrados para planilha
- Colunas: Prestador, Data, Horas, Valor, Cliente, Descrição
- Linha de totalização incluída
- Nome de arquivo com data automática
- Compatível com Excel e Google Sheets

### 10. **Sistema de Backup Completo (JSON)**
- Exportação de todos os dados em formato JSON
- Inclui valores de ambos os prestadores
- Metadados: data de exportação e versão
- Nome de arquivo com data automática
- Ideal para backup em pendrive/nuvem

### 11. **Importação de Backup**
- Restauração completa de dados
- Validação de integridade do arquivo
- Preview dos dados antes de importar
- Compatibilidade com versões antigas (v1.0) e novas (v2.0)
- Migração automática de formato antigo
- Confirmação obrigatória antes de substituir dados

### 12. **Persistência de Dados**
- Salvamento automático no navegador (localStorage)
- Dados preservados ao fechar o navegador
- Carregamento automático ao abrir o sistema
- Não depende de internet ou servidor

### 13. **Interface Visual**
- Design moderno e profissional
- Gradiente azul no tema
- Cards destacados para resumos financeiros
- Botões com hover effects
- Formulários bem organizados
- Modal para relatórios e detalhes
- Responsivo para mobile, tablet e desktop

### 14. **Recálculo Inteligente de Valores**
- Ao alterar valor/hora, pergunta se quer recalcular
- Recalcula apenas registros do prestador selecionado
- Não afeta registros de outros prestadores
- Confirmação com detalhes da operação
- Feedback de quantidade de registros recalculados

### 15. **Campo de Descrição para NFS**
- Textarea multilinha para descrições detalhadas
- Suporta quebras de linha e formatação
- Placeholder com exemplos de serviços
- Texto explicativo sobre uso para Nota Fiscal
- Redimensionável pelo usuário

## 🚀 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e moderna
- **CSS3**: Estilização com gradientes, flexbox e grid
- **JavaScript (ES6+)**: Lógica de negócio com classes e arrow functions
- **LocalStorage API**: Persistência de dados no navegador
- **FileReader API**: Importação de arquivos JSON
- **Blob API**: Exportação de arquivos CSV e JSON

## 📦 Estrutura de Arquivos

```
Projeto MEI/
├── index.html          # Estrutura HTML da aplicação
├── styles.css          # Estilos e layout
├── script.js           # Lógica JavaScript
└── README.md          # Documentação (este arquivo)
```

## 💾 Formato de Dados

### Estrutura do Backup JSON (v2.0)
```json
{
  "valoresPorHora": {
    "Emerson": 50.00,
    "Felipe": 60.00
  },
  "prestadorAtual": "Emerson",
  "registros": [
    {
      "id": 1234567890,
      "prestador": "Emerson",
      "data": "2025-11-04",
      "horas": 8,
      "valor": 400,
      "cliente": "Empresa XYZ",
      "descricao": "Desenvolvimento de sistema web\nManutenção de banco de dados"
    }
  ],
  "dataExportacao": "2025-11-04T10:30:00.000Z",
  "versao": "2.0"
}
```

## 🔄 Migração de Dados

O sistema possui migração automática de dados:
- **Versão 1.0 → 2.0**: Migra valorHora único para valoresPorHora
- **Registros antigos**: Atribui automaticamente ao prestador "Emerson"
- **Compatibilidade**: Importa backups de versões antigas sem perda de dados

## 📱 Compatibilidade

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Dispositivos móveis (iOS e Android)

## 🎯 Como Usar

### Primeiro Acesso
1. Abra o arquivo `index.html` no navegador
2. Configure o valor/hora para cada prestador
3. Comece a registrar suas horas trabalhadas

### Registro Diário
1. Selecione o prestador
2. Escolha a data no calendário
3. Informe as horas trabalhadas
4. Preencha cliente e descrição dos serviços
5. Clique em "Adicionar Registro"

### Gerar Relatório
1. Aplique filtros desejados (prestador, período, cliente)
2. Clique em "Gerar Relatório"
3. Revise as informações
4. Imprima ou copie os dados para NFS

### Fazer Backup
1. Clique em "Exportar Backup (JSON)"
2. Salve o arquivo em local seguro (pendrive/nuvem)
3. Para restaurar, clique em "Importar Backup (JSON)"

## 🔐 Segurança e Privacidade

- ✅ Dados armazenados apenas localmente
- ✅ Não há envio de informações para servidores
- ✅ Funciona 100% offline
- ⚠️ Faça backups regulares (dados ficam no navegador)
- ⚠️ Limpar dados do navegador apaga os registros

## 📝 Licença

Sistema desenvolvido para uso pessoal/profissional de MEI.

## 👨‍💻 Desenvolvimento

Sistema desenvolvido com assistência de Claude (Anthropic) para controle de horas trabalhadas de prestadores de serviço MEI.

### Histórico de Versões

**v2.0** (04/11/2025)
- Adicionado campo de descrição multilinha para NFS
- Modal para visualização completa de descrições
- Melhorias no relatório com serviços detalhados

**v1.1** (04/11/2025)
- Implementado sistema de múltiplos prestadores
- Adicionado filtro por prestador
- Recálculo independente por prestador
- Migração automática de dados antigos

**v1.0** (28/10/2025)
- Sistema inicial de monitoramento de horas
- Configuração de valor por hora
- Registro de horas trabalhadas
- Filtros e relatórios
- Exportação CSV e JSON
- Sistema de backup

---

**Desenvolvido para facilitar o controle financeiro e emissão de notas fiscais de prestadores MEI** 🚀
