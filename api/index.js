// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
const { Connection, Request, TYPES } = require('tedious');

// --- Configuração das Conexões com os Bancos de Dados ---
const configOdin = {
  server: process.env.DB_SERVER_ODIN,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER_ODIN,
      password: process.env.DB_PASSWORD_ODIN,
    },
  },
  options: {
    encrypt: true,
    database: process.env.DB_DATABASE_ODIN,
    rowCollectionOnRequestCompletion: true,
    trustServerCertificate: true,
  },
};

const configErp = {
  server: process.env.DB_SERVER_ERP,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER_ERP,
      password: process.env.DB_PASSWORD_ERP,
    },
  },
  options: {
    encrypt: true,
    database: process.env.DB_DATABASE_ERP,
    rowCollectionOnRequestCompletion: true,
    trustServerCertificate: true,
  },
};

// --- Função Auxiliar para Executar Queries ---
function executeQuery(config, query, params = []) {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);
    connection.on('connect', (err) => {
      if (err) return reject(new Error(`Falha na conexão com o banco de dados: ${err.message}`));
      
      const request = new Request(query, (err, rowCount, rows) => {
        connection.close();
        if (err) return reject(new Error(`Erro ao executar a consulta: ${err.message}`));
        
        const result = rows.map(row => {
          const obj = {};
          row.forEach(column => { obj[column.metadata.colName] = column.value; });
          return obj;
        });
        resolve({ rows: result, rowCount });
      });

      params.forEach(param => { request.addParameter(param.name, param.type, param.value); });
      connection.execSql(request);
    });
    connection.connect();
  });
}

// --- Criação do Servidor Express ---
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.API_PORT || 3000;

app.get('/', (req, res) => res.send('API do Sistema de Fretes está funcionando!'));


// --- Endpoints ---

// VEÍCULOS
app.get('/veiculos', async (req, res) => {
  try {
    const { rows } = await executeQuery(configOdin, 'SELECT * FROM Veiculos');
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// CARGAS MANUAIS
app.get('/cargas-manuais', async (req, res) => {
  try {
    const { rows } = await executeQuery(configOdin, 'SELECT * FROM CargasManuais');
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/cargas-manuais', async (req, res) => {
    const c = req.body;
    const query = `INSERT INTO CargasManuais (NumeroCarga, Cidade, ValorCTE, DataCTE, KM, COD_VEICULO, Origem) 
                   OUTPUT INSERTED.* 
                   VALUES (@num, @cidade, @valor, @data, @km, @cod, @origem);`;
    const params = [
        { name: 'num', type: TYPES.NVarChar, value: c.NumeroCarga },
        { name: 'cidade', type: TYPES.NVarChar, value: c.Cidade },
        { name: 'valor', type: TYPES.Decimal, value: c.ValorCTE },
        { name: 'data', type: TYPES.Date, value: c.DataCTE },
        { name: 'km', type: TYPES.Int, value: c.KM },
        { name: 'cod', type: TYPES.NVarChar, value: c.COD_VEICULO },
        { name: 'origem', type: TYPES.NVarChar, value: c.Origem || 'Manual' },
    ];
    try {
        const { rows } = await executeQuery(configOdin, query, params);
        res.status(201).json(rows[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/cargas-manuais/:id', async (req, res) => {
    const c = req.body;
    const id = req.params.id;
    let query, params;
    if (c.Excluido) { // Lógica para exclusão
        query = `UPDATE CargasManuais SET Excluido = @excluido, MotivoExclusao = @motivo OUTPUT INSERTED.* WHERE ID_Carga = @id;`;
        params = [
            { name: 'id', type: TYPES.Int, value: id }, { name: 'excluido', type: TYPES.Bit, value: true },
            { name: 'motivo', type: TYPES.NVarChar, value: c.MotivoExclusao },
        ];
    } else { // Lógica para edição
        query = `UPDATE CargasManuais SET NumeroCarga = @num, Cidade = @cidade, ValorCTE = @valor, DataCTE = @data, KM = @km, COD_VEICULO = @cod OUTPUT INSERTED.* WHERE ID_Carga = @id;`;
        params = [
            { name: 'id', type: TYPES.Int, value: id }, { name: 'num', type: TYPES.NVarChar, value: c.NumeroCarga },
            { name: 'cidade', type: TYPES.NVarChar, value: c.Cidade }, { name: 'valor', type: TYPES.Decimal, value: c.ValorCTE },
            { name: 'data', type: TYPES.Date, value: c.DataCTE }, { name: 'km', type: TYPES.Int, value: c.KM },
            { name: 'cod', type: TYPES.NVarChar, value: c.COD_VEICULO },
        ];
    }
    try {
        const { rows } = await executeQuery(configOdin, query, params);
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// IMPORTAÇÃO DE CARGAS DO ERP (NOVO ENDPOINT)
app.post('/cargas-erp/import', async (req, res) => {
    const { sIni, sFim } = req.body;
    if (!sIni || !sFim) return res.status(400).json({ message: 'Datas de início (sIni) e fim (sFim) são obrigatórias.'});

    try {
        // 1. Buscar dados brutos do ERP
        const erpQuery = `
            SELECT PDD.NUMSEQETGPDD AS NumeroCarga, PDD.CODVEC AS COD_VEICULO, LVR.DATEMSNF_LVRSVC AS DataCTE,
                   LVR.VALSVCTOTLVRSVC AS ValorCTE, RTRIM(ISNULL(CDD.DESCDD, 'N/A')) AS Cidade
            FROM Flexx10071188.dbo.IRFTLVRSVC LVR WITH(NOLOCK)
            LEFT JOIN Flexx10071188.dbo.IBETPDDSVCNF_ PDD WITH(NOLOCK) ON PDD.CODEMP = LVR.CODEMP AND PDD.NUMDOCTPTPDD = LVR.NUMNF_LVRSVC AND PDD.INDSERDOCTPTPDD = LVR.CODSERNF_LVRSVC
            LEFT JOIN Flexx10071188.dbo.IBETCET CET WITH(NOLOCK) ON LVR.CODEMP = CET.CODEMP AND LVR.CODCET = CET.CODCET
            LEFT JOIN Flexx10071188.dbo.IBETEDRCET EDR WITH(NOLOCK) ON CET.CODEMP = EDR.CODEMP AND CET.CODCET = EDR.CODCET AND EDR.CODTPOEDR = 1
            LEFT JOIN Flexx10071188.dbo.IBETCDD CDD WITH(NOLOCK) ON EDR.CODEMP = CDD.CODEMP AND EDR.CODPAS = CDD.CODPAS AND EDR.CODUF_ = CDD.CODUF_ AND EDR.CODCDD = CDD.CODCDD
            WHERE LVR.DATEMSNF_LVRSVC BETWEEN @sIni AND @sFim AND LVR.INDSTULVRSVC = 1 AND PDD.NUMSEQETGPDD IS NOT NULL AND CDD.DESCDD IS NOT NULL;
        `;
        const erpParams = [{ name: 'sIni', type: TYPES.Date, value: sIni }, { name: 'sFim', type: TYPES.Date, value: sFim }];
        const { rows: erpRows } = await executeQuery(configErp, erpQuery, erpParams);

        if (erpRows.length === 0) return res.json({ message: 'Nenhuma carga nova encontrada no ERP para o período.', count: 0 });

        // 2. Agregar dados (agrupar por NumeroCarga e Cidade, somando ValorCTE)
        const aggregated = new Map();
        erpRows.forEach(row => {
            const key = `${row.NumeroCarga}|${row.Cidade}`;
            if (aggregated.has(key)) {
                const existing = aggregated.get(key);
                existing.ValorCTE += row.ValorCTE;
            } else {
                aggregated.set(key, { ...row });
            }
        });

        // 3. Verificar duplicatas existentes no banco local
        const { rows: existingCargas } = await executeQuery(configOdin, "SELECT NumeroCarga, Cidade FROM CargasManuais WHERE Origem = 'ERP'");
        const existingKeys = new Set(existingCargas.map(c => `${c.NumeroCarga}|${c.Cidade}`));
        const novasCargas = Array.from(aggregated.values()).filter(c => !existingKeys.has(`${c.NumeroCarga}|${c.Cidade}`));

        if (novasCargas.length === 0) return res.json({ message: 'Todas as cargas encontradas no ERP já existem no sistema.', count: 0 });

        // 4. Enriquecer com dados de KM
        const { rows: veiculos } = await executeQuery(configOdin, 'SELECT COD_Veiculo, TipoVeiculo FROM Veiculos');
        const veiculoMap = new Map(veiculos.map(v => [v.COD_Veiculo, v.TipoVeiculo]));
        const { rows: paramsValores } = await executeQuery(configOdin, 'SELECT Cidade, TipoVeiculo, KM FROM ParametrosValores');

        const cargasParaInserir = novasCargas.map(carga => {
            const tipoVeiculo = veiculoMap.get(carga.COD_VEICULO);
            const param = paramsValores.find(p => p.Cidade === carga.Cidade && p.TipoVeiculo === tipoVeiculo) || paramsValores.find(p => p.Cidade === 'Qualquer' && p.TipoVeiculo === tipoVeiculo);
            return { ...carga, KM: param ? param.KM : 0 };
        });

        // 5. Inserir em lote dentro de uma transação
        const connection = new Connection(configOdin);
        connection.connect(err => {
            if (err) return res.status(500).json({ message: `Erro de conexão para inserção: ${err.message}` });
            connection.beginTransaction(err => {
                if (err) return res.status(500).json({ message: `Erro ao iniciar transação: ${err.message}` });

                let completed = 0;
                cargasParaInserir.forEach(c => {
                    const query = `INSERT INTO CargasManuais (NumeroCarga, Cidade, ValorCTE, DataCTE, KM, COD_VEICULO, Origem) VALUES (@num, @cidade, @valor, @data, @km, @cod, 'ERP');`;
                    const request = new Request(query, err => {
                        if (err) {
                            return connection.rollbackTransaction(() => res.status(500).json({ message: `Erro ao inserir carga ${c.NumeroCarga}: ${err.message}` }));
                        }
                        completed++;
                        if (completed === cargasParaInserir.length) {
                            connection.commitTransaction(err => {
                                if (err) return connection.rollbackTransaction(() => res.status(500).json({ message: `Erro ao commitar transação: ${err.message}` }));
                                res.status(201).json({ message: `${cargasParaInserir.length} novas cargas importadas com sucesso.`, count: cargasParaInserir.length });
                                connection.close();
                            });
                        }
                    });
                    request.addParameter('num', TYPES.NVarChar, c.NumeroCarga);
                    request.addParameter('cidade', TYPES.NVarChar, c.Cidade);
                    request.addParameter('valor', TYPES.Decimal, c.ValorCTE);
                    request.addParameter('data', TYPES.Date, c.DataCTE);
                    request.addParameter('km', TYPES.Int, c.KM);
                    request.addParameter('cod', TYPES.NVarChar, c.COD_VEICULO);
                    connection.execSql(request);
                });
            });
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// LANÇAMENTOS (ROTAS EXISTENTES)
app.get('/lancamentos', async (req, res) => {
    try {
        const { rows: lancamentos } = await executeQuery(configOdin, 'SELECT * FROM Lancamentos ORDER BY DataCriacao DESC');
        for (const lancamento of lancamentos) {
            const params = [{ name: 'id', type: TYPES.Int, value: lancamento.ID_Lancamento }];
            const { rows: cargas } = await executeQuery(configOdin, 'SELECT * FROM Lancamento_Cargas WHERE ID_Lancamento = @id', params);
            
            lancamento.Cargas = cargas.map(c => ({
                ID_Carga: c.ID_Carga_Origem, NumeroCarga: c.NumeroCarga, Cidade: c.Cidade,
                ValorCTE: c.ValorCTE, DataCTE: c.DataCTE.toISOString().split('T')[0], KM: c.KM, COD_VEICULO: c.COD_VEICULO,
            }));

            lancamento.Calculo = {
                CidadeBase: lancamento.CidadeBase, KMBase: lancamento.KMBase, ValorBase: lancamento.ValorBase, Pedagio: lancamento.Pedagio,
                Balsa: lancamento.Balsa, Ambiental: lancamento.Ambiental, Chapa: lancamento.Chapa, Outras: lancamento.Outras, ValorTotal: lancamento.ValorTotal
            };
        }
        res.json(lancamentos);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PARÂMETROS
app.get('/parametros-valores', async (req, res) => {
    try {
        const { rows } = await executeQuery(configOdin, 'SELECT * FROM ParametrosValores');
        res.json(rows);
    } catch (error) { res.status(500).json({ message: error.message }); }
});
app.get('/parametros-taxas', async (req, res) => {
    try {
        const { rows } = await executeQuery(configOdin, 'SELECT * FROM ParametrosTaxas');
        res.json(rows);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor da API rodando em http://localhost:${port}`);
});