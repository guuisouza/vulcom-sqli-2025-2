// CTF - SQL Injection no Login
// Tecnologias: Node.js, Express, SQLite

// Guilherme Dilio de Souza
// Input usado para acessar o sistema: no campo username = abc' OR 1=1; -- no campo password = fdsfs
// Flag: VULCOM{SQLi_Exploit_Success}
// Mensagem no console:
/*
CONSULTA:  SELECT * FROM users WHERE username = 'abc' OR 1=1;' AND password = 'fdsfs'
RESULTADO: [
  { id: 1, username: 'admin', password: 'admin123' },
  { id: 2, username: 'user', password: 'user123' }
]
*/

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database(':memory:');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Criar tabela e inserir dados vulneráveis
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
    db.run("INSERT INTO users (username, password) VALUES ('admin', 'admin123')");
    db.run("INSERT INTO users (username, password) VALUES ('user', 'user123')");
    db.run("CREATE TABLE flags (id INTEGER PRIMARY KEY, flag TEXT)");
    db.run("INSERT INTO flags (flag) VALUES ('VULCOM{SQLi_Exploit_Success}')");
});

// Rota de login com SQL Injection
app.get('/', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    /*
        Consulta SQL SEGURA, USANDO PARAMETROS
        ? Marca o lugar onde os parametros serao vinculados (binding)
        No caso do SQLITE o caractere ? é usado para marcar o lugar dos parametros,
        Outros bancos de dados podem utilizar convencoes diferentes como $0, $1, etc.
    */

    // CONSULTA SQL VULNERÁVEL 🚨
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    const query2 = 'SELECT * FROM flags'
    
    db.all(query, [username, password], (err, rows) => {
        if (err) {
            return res.send('Erro no servidor');
        }
        if (rows.length > 0) {
            console.log('CONSULTA: ', query);
            console.log('RESULTADO:', rows);
            db.get(query2, [], (err, row) => {
                if(err) return res.send(`ERRO: ${err}`)
                let ret = `Bem vindo, ${username}! <br>`
                ret += `<br> Flag: ${row.flag}`
                return res.send(ret);
            })
        } else {
            return res.send('Login falhou!');
        }
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
