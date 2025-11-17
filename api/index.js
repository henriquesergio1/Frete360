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
    encrypt: true, // Recomenda-se true para produção, ajuste conforme seu servidor
    database: process.env.DB_DATABASE_ODIN,
    rowCollectionOnRequestCompletion: true,
    trustServerCertificate: true, // Necessário se o SSL não for de uma CA confiável
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
      if (err) {
        console.error('Erro de conexão:', err.message);
        return reject(new Error(`Falha na conexão com o banco de dados: ${err.message}`));
      }

      const request = new Request(query, (err, rowCount, rows) => {
        connection.close();
        if (err) {
          console.error(`Erro na query: ${query}`, err.message);
          return reject(new Error(`Erro ao executar a consulta: ${err.message}`));
        }
        
        const result = rows.map(row => {
          const obj = {};
          row.forEach(column => {
            obj[column.metadata.colName] = column.value;
          });
          return obj;
        });

        resolve({ rows: result, rowCount });
      });

      params.forEach(param => {
        request.addParameter(param.name, param.type, param.value);
      });

      connection.execSql(request);
    });

    connection.on('error', (err) => {
      console.error('Evento de erro da conexão:', err.message);
      // A conexão será fechada automaticamente.
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
app.post('/veiculos', async (req, res) => {
  const v = req.body;
  const query = `INSERT INTO Veiculos (COD_Veiculo, Placa, TipoVeiculo, Motorista, CapacidadeKG, Ativo) OUTPUT INSERTED.* VALUES (@cod, @placa, @tipo, @motorista, @cap, @ativo);`;
  const params = [
    { name: 'cod', type: TYPES.NVarChar, value: v.COD_Veiculo }, { name: 'placa', type: TYPES.NVarChar, value: v.Placa },
    { name: 'tipo', type: TYPES.NVarChar, value: v.TipoVeiculo }, { name: 'motorista', type: TYPES.NVarChar, value: v.Motorista },
    { name: 'cap', type: TYPES.Int, value: v.CapacidadeKG }, { name: 'ativo', type: TYPES.Bit, value: v.Ativo },
  ];
  try {
    const { rows } = await executeQuery(configOdin, query, params);
    res.status(201).json(rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
});
app.put('/veiculos/:id', async (req, res) => {
  const v = req.body;
  const query = `UPDATE Veiculos SET COD_Veiculo = @cod, Placa = @placa, TipoVeiculo = @tipo, Motorista = @motorista, CapacidadeKG = @cap, Ativo = @ativo OUTPUT INSERTED.* WHERE ID_Veiculo = @id;`;
   const params = [
    { name: 'id', type: TYPES.Int, value: req.params.id }, { name: 'cod', type: TYPES.NVarChar, value: v.COD_Veiculo },
    { name: 'placa', type: TYPES.NVarChar, value: v.Placa }, { name: 'tipo', type: TYPES.NVarChar, value: v.TipoVeiculo },
    { name: 'motorista', type: TYPES.NVarChar, value: v.Motorista }, { name: 'cap', type: TYPES.Int, value: v.CapacidadeKG },
    { name: 'ativo', type: TYPES.Bit, value: v.Ativo },
  ];
  try {
    const { rows } = await executeQuery(configOdin, query, params);
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// CARGAS DO ERP
app.get('/cargas-erp', async (req, res) => {
  const { sIni, sFim } = req.query;
  if (!sIni || !sFim) return res.status(400).json({ message: 'Datas de início (sIni) e fim (sFim) são obrigatórias.'});

  const query = `
    SELECT
      PDD.NUMSEQETGPDD AS NumeroCarga, PDD.CODVEC AS COD_VEICULO,
      CONCAT('ERP-', LVR.NUMNF_LVRSVC) AS ID_Carga_Origem, -- ID único para cargas do ERP
      LVR.DATEMSNF_LVRSVC AS DataCTE, LVR.VALSVCTOTLVRSVC AS ValorCTE,
      RTRIM(ISNULL(CDD.DESCDD, 'N/A')) AS Cidade, 0 AS KM
    FROM Flexx10071188.dbo.IRFTLVRSVC LVR WITH(NOLOCK)
    LEFT JOIN Flexx10071188.dbo.IBETPDDSVCNF_ PDD WITH(NOLOCK) ON PDD.CODEMP = LVR.CODEMP AND PDD.NUMDOCTPTPDD = LVR.NUMNF_LVRSVC AND PDD.INDSERDOCTPTPDD = LVR.CODSERNF_LVRSVC
    LEFT JOIN Flexx10071188.dbo.IBETCET CET WITH(NOLOCK) ON LVR.CODEMP = CET.CODEMP AND LVR.CODCET = CET.CODCET
    LEFT JOIN Flexx10071188.dbo.IBETEDRCET EDR WITH(NOLOCK) ON CET.CODEMP = EDR.CODEMP AND CET.CODCET = EDR.CODCET AND EDR.CODTPOEDR = 1
    LEFT JOIN Flexx10071188.dbo.IBETCDD CDD WITH(NOLOCK) ON EDR.CODEMP = CDD.CODEMP AND EDR.CODPAS = CDD.CODPAS AND EDR.CODUF_ = CDD.CODUF_ AND EDR.CODCDD = CDD.CODCDD
    WHERE LVR.DATEMSNF_LVRSVC BETWEEN @sIni AND @sFim AND LVR.INDSTULVRSVC = 1
  `;
  const params = [{ name: 'sIni', type: TYPES.Date, value: sIni }, { name: 'sFim', type: TYPES.Date, value: sFim }];

  try {
    const { rows } = await executeQuery(configErp, query, params);
    const cargasComId = rows.map((carga, index) => ({...carga, ID_Carga: -(index + 1) }));
    res.json(cargasComId);
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
  const query = `INSERT INTO CargasManuais (NumeroCarga, Cidade, ValorCTE, DataCTE, KM, COD_VEICULO) OUTPUT INSERTED.* VALUES (@num, @cidade, @valor, @data, @km, @cod);`;
  const params = [
    { name: 'num', type: TYPES.NVarChar, value: c.NumeroCarga }, { name: 'cidade', type: TYPES.NVarChar, value: c.Cidade },
    { name: 'valor', type: TYPES.Decimal, value: c.ValorCTE }, { name: 'data', type: TYPES.Date, value: c.DataCTE },
    { name: 'km', type: TYPES.Int, value: c.KM }, { name: 'cod', type: TYPES.NVarChar, value: c.COD_VEICULO },
  ];
  try {
    const { rows } = await executeQuery(configOdin, query, params);
    res.status(201).json(rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
});
app.put('/cargas-manuais/:id', async (req, res) => {
    const c = req.body;
    const id = req.params.id;
    // Constrói a query dinamicamente para lidar com exclusão vs. edição
    let query, params;
    if (c.Excluido) {
        query = `UPDATE CargasManuais SET Excluido = @excluido, MotivoExclusao = @motivo OUTPUT INSERTED.* WHERE ID_Carga = @id;`;
        params = [
            { name: 'id', type: TYPES.Int, value: id },
            { name: 'excluido', type: TYPES.Bit, value: true },
            { name: 'motivo', type: TYPES.NVarChar, value: c.MotivoExclusao },
        ];
    } else {
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

// LANÇAMENTOS
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
app.post('/lancamentos', async (req, res) => {
    const l = req.body;
    const connection = new Connection(configOdin);

    connection.on('connect', err => {
        if (err) return res.status(500).json({ message: `Connection error: ${err.message}` });
        
        connection.beginTransaction(err => {
            if (err) return res.status(500).json({ message: `Begin transaction error: ${err.message}` });
            
            const query1 = new Request(`
                INSERT INTO Lancamentos (DataFrete, ID_Veiculo, CidadeBase, KMBase, ValorBase, Pedagio, Balsa, Ambiental, Chapa, Outras, ValorTotal, Usuario, Motivo) 
                OUTPUT INSERTED.ID_Lancamento
                VALUES (@data, @idVeiculo, @cidadeBase, @kmBase, @valorBase, @pedagio, @balsa, @ambiental, @chapa, @outras, @total, @usuario, @motivo);
            `, (err, rowCount, rows) => {
                if (err) return connection.rollbackTransaction(() => res.status(500).json({ message: `Error inserting lancamento: ${err.message}` }));
                
                const newLancamentoId = rows[0][0].value;
                if (!l.Cargas || l.Cargas.length === 0) {
                     return connection.commitTransaction(err => {
                        if (err) return connection.rollbackTransaction(() => res.status(500).json({ message: `Error committing: ${err.message}` }));
                        res.status(201).json({ ID_Lancamento: newLancamentoId, ...l });
                        connection.close();
                    });
                }
                
                let query2Str = 'INSERT INTO Lancamento_Cargas (ID_Lancamento, ID_Carga_Origem, NumeroCarga, Cidade, ValorCTE, DataCTE, KM, COD_VEICULO) VALUES ';
                const cargaValues = l.Cargas.map((c, i) => 
                    `(@id${i}, @id_origem${i}, @num${i}, @cidade${i}, @valor${i}, @data${i}, @km${i}, @cod${i})`
                ).join(',');
                
                const request2 = new Request(query2Str + cargaValues, err => {
                    if (err) return connection.rollbackTransaction(() => res.status(500).json({ message: `Error inserting cargas: ${err.message}` }));
                    connection.commitTransaction(err => {
                        if (err) return connection.rollbackTransaction(() => res.status(500).json({ message: `Error committing transaction: ${err.message}` }));
                        res.status(201).json({ ID_Lancamento: newLancamentoId, ...l });
                        connection.close();
                    });
                });

                l.Cargas.forEach((c, i) => {
                    request2.addParameter(`id${i}`, TYPES.Int, newLancamentoId);
                    request2.addParameter(`id_origem${i}`, TYPES.NVarChar, c.ID_Carga.toString());
                    request2.addParameter(`num${i}`, TYPES.NVarChar, c.NumeroCarga);
                    request2.addParameter(`cidade${i}`, TYPES.NVarChar, c.Cidade);
                    request2.addParameter(`valor${i}`, TYPES.Decimal, c.ValorCTE);
                    request2.addParameter(`data${i}`, TYPES.Date, c.DataCTE);
                    request2.addParameter(`km${i}`, TYPES.Int, c.KM);
                    request2.addParameter(`cod${i}`, TYPES.NVarChar, c.COD_VEICULO);
                });
                connection.execSql(request2);
            });
            
            query1.addParameter('data', TYPES.Date, l.DataFrete);
            query1.addParameter('idVeiculo', TYPES.Int, l.ID_Veiculo);
            query1.addParameter('cidadeBase', TYPES.NVarChar, l.Calculo.CidadeBase);
            query1.addParameter('kmBase', TYPES.Int, l.Calculo.KMBase);
            query1.addParameter('valorBase', TYPES.Decimal, l.Calculo.ValorBase);
            query1.addParameter('pedagio', TYPES.Decimal, l.Calculo.Pedagio);
            query1.addParameter('balsa', TYPES.Decimal, l.Calculo.Balsa);
            query1.addParameter('ambiental', TYPES.Decimal, l.Calculo.Ambiental);
            query1.addParameter('chapa', TYPES.Decimal, l.Calculo.Chapa);
            query1.addParameter('outras', TYPES.Decimal, l.Calculo.Outras);
            query1.addParameter('total', TYPES.Decimal, l.Calculo.ValorTotal);
            query1.addParameter('usuario', TYPES.NVarChar, l.Usuario);
            query1.addParameter('motivo', TYPES.NVarChar, l.Motivo || null);

            connection.execSql(query1);
        });
    });
    connection.connect();
});
app.put('/lancamentos/:id', async (req, res) => {
    const { motivo } = req.body;
    const query = 'UPDATE Lancamentos SET Excluido = 1, MotivoExclusao = @motivo, DataExclusao = GETDATE() WHERE ID_Lancamento = @id;';
    const params = [{ name: 'id', type: TYPES.Int, value: req.params.id }, { name: 'motivo', type: TYPES.NVarChar, value: motivo }];
    try {
        await executeQuery(configOdin, query, params);
        res.status(204).send();
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
