const fs = require('fs');
const archiver = require('archiver');

const output = fs.createWriteStream('vtourney_para_amigo.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Nível máximo de compressão
});

output.on('close', function() {
  console.log('Projeto zipado com sucesso! Tamanho: ' + (archive.pointer() / 1024 / 1024).toFixed(2) + ' MB');
  console.log('Arquivo gerado: vtourney_para_amigo.zip na pasta do projeto.');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Pasta do backend (ignora node_modules)
archive.glob('**/*', {
    cwd: 'backend',
    ignore: ['node_modules/**']
}, { prefix: 'backend' });

// Pasta do frontend (ignora node_modules e .next)
archive.glob('**/*', {
    cwd: 'frontend',
    ignore: ['node_modules/**', '.next/**']
}, { prefix: 'frontend' });

// Adiciona os arquivos .env ocultos para o amigo conectar no mesmo banco de dados
archive.file('backend/.env', { name: 'backend/.env' });
archive.file('frontend/.env.local', { name: 'frontend/.env.local' });

archive.finalize();
