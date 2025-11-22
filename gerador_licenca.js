
const jwt = require('jsonwebtoken');
const readline = require('readline');

// SEGREDO DA ASSINATURA (DEVE SER O MESMO DO API/INDEX.JS)
// Em produção, use uma string muito complexa e mantenha segura.
const JWT_SECRET = 'fretes-secret-key-change-in-prod';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== GERADOR DE LICENÇA FRETE360 ===\n');

rl.question('Nome do Cliente (Empresa): ', (clientName) => {
  rl.question('Dias de Validade (ex: 30, 365): ', (days) => {
    
    const daysInt = parseInt(days);
    if (isNaN(daysInt)) {
        console.error('Erro: Dias deve ser um número.');
        process.exit(1);
    }

    // Payload da Licença
    const payload = {
        client: clientName,
        type: 'PRO',
        createdAt: new Date().toISOString()
    };

    // Gera o Token JWT
    // expiresIn lida automaticamente com a data de expiração
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${daysInt}d` });

    console.log('\n---------------------------------------------------');
    console.log('LICENÇA GERADA COM SUCESSO!');
    console.log('---------------------------------------------------');
    console.log(`Cliente: ${clientName}`);
    console.log(`Validade: ${daysInt} dias`);
    console.log('\nCOPIE A CHAVE ABAIXO E ENVIE AO CLIENTE:\n');
    console.log(token);
    console.log('\n---------------------------------------------------');

    rl.close();
  });
});
