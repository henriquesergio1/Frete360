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
    encrypt: false, // Mude para true se seu SQL Server usar SSL
    database: process.env.DB_DATABASE_ODIN,
    rowCollectionOnRequestCompletion: true,
    trustServerCertificate: true, // Adicionado para compatibilidade
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
    encrypt: false,
    database: process.env.DB_DATABASE_ERP,
    rowCollectionOnRequestCompletion: true,
    trustServerCertificate: true, // Adicionado para compatibilidade
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
          console.error('Erro na query:', err.message);
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

    connection.connect();
  });
}

// --- Criação do Servidor Express ---
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.API_PORT || 3000;

// Rota de teste
app.get('/', (req, res) => res.send('API do Sistema de Fretes está funcionando!'));


// --- Endpoints da API ---

// VEÍCULOS
app.get('/veiculos', async (req, res) => {
  try {
    const { rows } = await executeQuery(configOdin, 'SELECT * FROM Veiculos');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.post('/veiculos', async (req, res) => {
  const v = req.body;
  const query = `INSERT INTO Veiculos (COD_Veiculo, Placa, TipoVeiculo, Motorista, CapacidadeKG, Ativo) VALUES (@cod, @placa, @tipo, @motorista, @cap, @ativo); SELECT * FROM Veiculos WHERE ID_Veiculo = SCOPE_IDENTITY();`;
  const params = [
    { name: 'cod', type: TYPES.NVarChar, value: v.COD_Veiculo },
    { name: 'placa', type: TYPES.NVarChar, value: v.Placa },
    { name: 'tipo', type: TYPES.NVarChar, value: v.TipoVeiculo },
    { name: 'motorista', type: TYPES.NVarChar, value: v.Motorista },
    { name: 'cap', type: TYPES.Int, value: v.CapacidadeKG },
    { name: 'ativo', type: TYPES.Bit, value: v.Ativo },
  ];
  try {
    const { rows } = await executeQuery(configOdin, query, params);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.put('/veiculos/:id', async (req, res) => {
  const v = req.body;
  const query = `UPDATE Veiculos SET COD_Veiculo = @cod, Placa = @placa, TipoVeiculo = @tipo, Motorista = @motorista, CapacidadeKG = @cap, Ativo = @ativo WHERE ID_Veiculo = @id; SELECT * FROM Veiculos WHERE ID_Veiculo = @id;`;
   const params = [
    { name: 'id', type: TYPES.Int, value: req.params.id },
    { name: 'cod', type: TYPES.NVarChar, value: v.COD_Veiculo },
    { name: 'placa', type: TYPES.NVarChar, value: v.Placa },
    { name: 'tipo', type: TYPES.NVarChar, value: v.TipoVeiculo },
    { name: 'motorista', type: TYPES.NVarChar, value: v.Motorista },
    { name: 'cap', type: TYPES.Int, value: v.CapacidadeKG },
    { name: 'ativo', type: TYPES.Bit, value: v.Ativo },
  ];
  try {
    const { rows } = await executeQuery(configOdin, query, params);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CARGAS DO ERP
app.get('/cargas-erp', async (req, res) => {
  const { sIni, sFim } = req.query;
  if (!sIni || !sFim) return res.status(400).send('Datas de início (sIni) e fim (sFim) são obrigatórias.');

  const query = `
    SELECT
      PDD.NUMSEQETGPDD AS NumeroCarga, PDD.CODVEC AS COD_VEICULO,
      LVR.NUMNF_LVRSVC AS ID_Carga_ERP, LVR.DATEMSNF_LVRSVC AS DataCTE,
      LVR.VALSVCTOTLVRSVC AS ValorCTE, RTRIM(CDD.DESCDD) AS Cidade, 0 AS KM
    FROM Flexx10071188.dbo.IRFTLVRSVC LVR (NOLOCK)
    LEFT JOIN Flexx10071188.dbo.IBETPDDSVCNF_ PDD (NOLOCK) ON PDD.CODEMP = LVR.CODEMP AND PDD.NUMDOCTPTPDD = LVR.NUMNF_LVRSVC AND PDD.INDSERDOCTPTPDD = LVR.CODSERNF_LVRSVC
    LEFT JOIN Flexx10071188.dbo.IBETCET CET (NOLOCK) ON LVR.CODEMP = CET.CODEMP AND LVR.CODCET = CET.CODCET
    LEFT JOIN Flexx10071188.dbo.IBETEDRCET EDR (NOLOCK) ON CET.CODEMP = EDR.CODEMP AND CET.CODCET = EDR.CODCET AND EDR.CODTPOEDR = 1
    LEFT JOIN Flexx10071188.dbo.IBETCDD CDD (NOLOCK) ON EDR.CODEMP = CDD.CODEMP AND EDR.CODPAS = CDD.CODPAS AND EDR.CODUF_ = CDD.CODUF_ AND EDR.CODCDD = CDD.CODCDD
    WHERE LVR.DATEMSNF_LVRSVC BETWEEN @sIni AND @sFim AND LVR.INDSTULVRSVC = 1
  `;
  const params = [
      { name: 'sIni', type: TYPES.Date, value: sIni },
      { name: 'sFim', type: TYPES.Date, value: sFim }
  ];

  try {
    const { rows } = await executeQuery(configErp, query, params);
    // Simula o ID_Carga para compatibilidade com o frontend. Na prática, o ID_Carga_ERP é o identificador
    const cargasComId = rows.map((carga, index) => ({...carga, ID_Carga: -(index + 1) }));
    res.json(cargasComId);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// CARGAS MANUAIS
app.get('/cargas-manuais', async (req, res) => {
  try {
    const { rows } = await executeQuery(configOdin, 'SELECT * FROM CargasManuais');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.post('/cargas-manuais', async (req, res) => {
  const c = req.body;
  const query = `INSERT INTO CargasManuais (NumeroCarga, Cidade, ValorCTE, DataCTE, KM, COD_VEICULO) VALUES (@num, @cidade, @valor, @data, @km, @cod); SELECT * FROM CargasManuais WHERE ID_Carga = SCOPE_IDENTITY();`;
  const params = [
    { name: 'num', type: TYPES.NVarChar, value: c.NumeroCarga },
    { name: 'cidade', type: TYPES.NVarChar, value: c.Cidade },
    { name: 'valor', type: TYPES.Decimal, value: c.ValorCTE },
    { name: 'data', type: TYPES.Date, value: c.DataCTE },
    { name: 'km', type: TYPES.Int, value: c.KM },
    { name: 'cod', type: TYPES.NVarChar, value: c.COD_VEICULO },
  ];
  try {
    const { rows } = await executeQuery(configOdin, query, params);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.put('/cargas-manuais/:id', async (req, res) => {
  const c = req.body;
  const query = `UPDATE CargasManuais SET NumeroCarga = @num, Cidade = @cidade, ValorCTE = @valor, DataCTE = @data, KM = @km, COD_VEICULO = @cod, Excluido = @excluido, MotivoExclusao = @motivo WHERE ID_Carga = @id; SELECT * FROM CargasManuais WHERE ID_Carga = @id;`;
   const params = [
    { name: 'id', type: TYPES.Int, value: req.params.id },
    { name: 'num', type: TYPES.NVarChar, value: c.NumeroCarga },
    { name: 'cidade', type: TYPES.NVarChar, value: c.Cidade },
    { name: 'valor', type: TYPES.Decimal, value: c.ValorCTE },
    { name: 'data', type: TYPES.Date, value: c.DataCTE },
    { name: 'km', type: TYPES.Int, value: c.KM },
    { name: 'cod', type: TYPES.NVarChar, value: c.COD_VEICULO },
    { name: 'excluido', type: TYPES.Bit, value: c.Excluido || false },
    { name: 'motivo', type: TYPES.NVarChar, value: c.MotivoExclusao || null },
  ];
  try {
    const { rows } = await executeQuery(configOdin, query, params);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// LANÇAMENTOS
app.get('/lancamentos', async (req, res) => {
    try {
        const lancamentosQuery = 'SELECT * FROM Lancamentos ORDER BY DataCriacao DESC';
        const { rows: lancamentos } = await executeQuery(configOdin, lancamentosQuery);

        // Para cada lançamento, buscar suas cargas associadas
        for (const lancamento of lancamentos) {
            const cargasQuery = 'SELECT * FROM Lancamento_Cargas WHERE ID_Lancamento = @id';
            const params = [{ name: 'id', type: TYPES.Int, value: lancamento.ID_Lancamento }];
            const { rows: cargas } = await executeQuery(configOdin, cargasQuery, params);
            
            // Reestrutura os dados para bater com o frontend
            lancamento.Cargas = cargas.map(c => ({
                ID_Carga: c.ID_Carga_ERP, // Identificador da carga
                NumeroCarga: c.NumeroCarga,
                Cidade: c.Cidade,
                ValorCTE: c.ValorCTE,
                DataCTE: c.DataCTE,
                KM: c.KM,
                COD_VEICULO: c.COD_VEICULO,
            }));

            lancamento.Calculo = {
                CidadeBase: lancamento.CidadeBase,
                KMBase: lancamento.KMBase,
                ValorBase: lancamento.ValorBase,
                Pedagio: lancamento.Pedagio,
                Balsa: lancamento.Balsa,
                Ambiental: lancamento.Ambiental,
                Chapa: lancamento.Chapa,
                Outras: lancamento.Outras,
                ValorTotal: lancamento.ValorTotal
            };
        }
        res.json(lancamentos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/lancamentos', async (req, res) => {
    const l = req.body;
    const connection = new Connection(configOdin);

    connection.on('connect', err => {
        if (err) return res.status(500).json({ message: `Connection error: ${err.message}` });
        
        connection.beginTransaction(err => {
            if (err) return res.status(500).json({ message: `Begin transaction error: ${err.message}` });

            const lancamentoQuery = `
                INSERT INTO Lancamentos (DataFrete, ID_Veiculo, CidadeBase, KMBase, ValorBase, Pedagio, Balsa, Ambiental, Chapa, Outras, ValorTotal, Usuario, Motivo) 
                VALUES (@data, @idVeiculo, @cidadeBase, @kmBase, @valorBase, @pedagio, @balsa, @ambiental, @chapa, @outras, @total, @usuario, @motivo);
                SELECT SCOPE_IDENTITY() AS ID_Lancamento;
            `;
            const request1 = new Request(lancamentoQuery, (err, rowCount, rows) => {
                if (err) {
                    console.error('Error in request 1:', err);
                    return connection.rollbackTransaction(() => res.status(500).json({ message: `Error inserting lancamento: ${err.message}` }));
                }

                const newLancamentoId = rows[0][0].value;

                // Agora, insere as cargas associadas
                let cargaQuery = 'INSERT INTO Lancamento_Cargas (ID_Lancamento, ID_Carga_ERP, NumeroCarga, Cidade, ValorCTE, DataCTE, KM, COD_VEICULO) VALUES ';
                const cargaValues: string[] = [];
                l.Cargas.forEach((c: any, index: number) => {
                    cargaValues.push(`(${newLancamentoId}, '${c.ID_Carga}', '${c.NumeroCarga}', '${c.Cidade}', ${c.ValorCTE}, '${c.DataCTE}', ${c.KM}, '${c.COD_VEICULO}')`);
                });
                cargaQuery += cargaValues.join(',');

                const request2 = new Request(cargaQuery, err => {
                    if (err) {
                        console.error('Error in request 2:', err);
                        return connection.rollbackTransaction(() => res.status(500).json({ message: `Error inserting cargas: ${err.message}` }));
                    }

                    connection.commitTransaction(err => {
                        if (err) {
                            console.error('Error in commit:', err);
                            return connection.rollbackTransaction(() => res.status(500).json({ message: `Error committing transaction: ${err.message}` }));
                        }
                        console.log('Transaction committed.');
                        res.status(201).json({ ID_Lancamento: newLancamentoId, ...l });
                        connection.close();
                    });
                });

                connection.execSql(request2);
            });
            
            // Adiciona parâmetros para a primeira query
            request1.addParameter('data', TYPES.Date, l.DataFrete);
            request1.addParameter('idVeiculo', TYPES.Int, l.ID_Veiculo);
            request1.addParameter('cidadeBase', TYPES.NVarChar, l.Calculo.CidadeBase);
            request1.addParameter('kmBase', TYPES.Int, l.Calculo.KMBase);
            request1.addParameter('valorBase', TYPES.Decimal, l.Calculo.ValorBase);
            request1.addParameter('pedagio', TYPES.Decimal, l.Calculo.Pedagio);
            request1.addParameter('balsa', TYPES.Decimal, l.Calculo.Balsa);
            request1.addParameter('ambiental', TYPES.Decimal, l.Calculo.Ambiental);
            request1.addParameter('chapa', TYPES.Decimal, l.Calculo.Chapa);
            request1.addParameter('outras', TYPES.Decimal, l.Calculo.Outras);
            request1.addParameter('total', TYPES.Decimal, l.Calculo.ValorTotal);
            request1.addParameter('usuario', TYPES.NVarChar, l.Usuario);
            request1.addParameter('motivo', TYPES.NVarChar, l.Motivo || null);

            connection.execSql(request1);
        });
    });
    connection.connect();
});
app.put('/lancamentos/:id', async (req, res) => { // Usado para exclusão lógica
    const { motivo } = req.body;
    const query = 'UPDATE Lancamentos SET Excluido = 1, MotivoExclusao = @motivo WHERE ID_Lancamento = @id;';
    const params = [
        { name: 'id', type: TYPES.Int, value: req.params.id },
        { name: 'motivo', type: TYPES.NVarChar, value: motivo },
    ];
    try {
        await executeQuery(configOdin, query, params);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// PARÂMETROS
app.get('/parametros-valores', async (req, res) => {
    try {
        const { rows } = await executeQuery(configOdin, 'SELECT * FROM ParametrosValores');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.get('/parametros-taxas', async (req, res) => {
    try {
        const { rows } = await executeQuery(configOdin, 'SELECT * FROM ParametrosTaxas');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor da API rodando em http://localhost:${port}`);
});
