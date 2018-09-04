/*Importa bibliotecas necessárias.*/
const express = require('express');
const mysql = require('mysql');
const bodyParser = require("body-parser");
var os = require('os');
//Inicia o express.
const app = express();
//Porta do servidor back-end.
const port = 3000;
//Cria nova conexão com o mysql (Banco deve estar nesse formato).
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1qaz2wsx",
  database: "funcionarios"
});
//Testa a conexão com o banco.
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
//Utiliza o encoder da biblioteca para os dados.
app.use(bodyParser.urlencoded({ extended: false }));
//Utiliza o json para o parser
app.use(bodyParser.json());
var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
        	//Encontra o IP da maquina. (Usado somente nessa aplicação para que consiga rodar servidor e client na mesma maquina)
            addresses.push(address.address);
        }
    }
}
//Lista de URLs confiáveis.
const originWhitelist = ['http://localhost:3000', 'http://localhost:8080', 'http://' + addresses + ':8080'];

//Configuração do CORS.
app.use((request, response, next) => {
  console.log('Server info: Request received');
  
  var origin = request.headers.origin;
  //Verifica se quem fez a requisição esta entre as URLs confiáveis.
  if (originWhitelist.indexOf(origin) > -1) {
  	console.log(origin);
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
 
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Request-Width, Content-Type, Accept');
  response.setHeader('Access-Control-Allow-Credentials', true);
  
  next();
});
//Recupera a url
const url = require('url');
//Api REST de login.
app.post('/api/login', (request, response) => {
  //Recupera os parametros de matricula e senha na aplicação.
  var matricula = request.body.matricula;
  var senha = request.body.senha;
  //Cria um select para validar a existencia.
  const query = "SELECT matricula, senha FROM funcionario WHERE matricula = '" + matricula + "' AND senha ='"+senha+"';"; 
  //Realiza a ação no banco.
  con.query(query, function (err, result) {
    if (err) throw err;
    //Caso existam dados, retorna-os para quem fez a requisição.
    response.json({data: result});
  });
});
//Api REST de listar funcionarios.
app.get('/api/funcionarios', (request, response) => {
  //Cria a query que lista todos os funcionarios e seus meios de contato.
  const query = "SELECT " +
	"f.cpf, f.nome, f.matricula, c.contato, f.data_nascimento, cf.nome as nome_do_chefe " + 
	"FROM funcionario f " +
	"LEFT JOIN contato c on c.cpf = f.cpf " +
	"LEFT JOIN funcionario cf on cf.cpf = f.cpf_chefia;"; 
	//Realiza ação no banco.
  	con.query(query, function (err, result) {
    	if (err) throw err;
    	//Retorna para a aplicação a resposta.
    	response.json({data: result});
  });
});
//Api REST de funcionario, criação e atualização.
app.post('/api/funcionario', async (request, response) => {
	//Cria a query para validar a existencia.
  	var query = "SELECT matricula from funcionario WHERE cpf='" + request.body.cpf + "';";
  	var resultData;
  	var res = con.query(query);
  	var foundData = false;
  	//Função realizada ao receber resultado.
	res.on('result', function(row) {
		//Se tiver dados, indica na variavel local que achou alguem.
	  	if(row && row.matricula){
	  		foundData = true;
	  	}
	}).on('end', function() {
		//No final da ação no banco, valida a flag que indica se tem dados.
		if(!foundData) {
			//Se nao tiver, cria um novo usuario.
			createUser(request.body);
		}else{
			//Se existir, atualiza o usuario.
			updateUser(request.body);
		}
	});
	//Retorna uma resposta apenas para indicar que a ação foi realizada.
  	response.json({response: true});
});
//Api REST de demissão de funcionario.
app.post('/api/demitir', async (request, response) => {
	//Cria as queries que devem ser executadas.
	var query = "UPDATE funcionario SET cpf_chefia = null WHERE cpf_chefia = '" + request.body.cpf + "';";
  	var query1 = "DELETE FROM contato WHERE cpf='" + request.body.cpf + "';";
  	var query2 = "DELETE FROM funcionario WHERE cpf='" + request.body.cpf + "';";
  	//Realiza as ações no banco em cascata, para que haja uma concordância dos dados.
  	con.query(query, function (err, result) {
	    if (err) throw err;
	    con.query(query1, function (err, result) {
	    	if (err) throw err;
	    	con.query(query2, function (err, result) {
	    		if (err) throw err;
  			});
  		});
  	});

  response.json({response: true});
});

/**
* Método que atualiza um usuario.
*/
function updateUser(user) {
	var queryContato;
	//Cria ação de atualização.
	var query = "UPDATE funcionario set " +
	"nome = '" + user.nome + "', matricula= '" + user.matricula +
	"', senha= '" + user.senha + "', data_nascimento= '" + user.data_nascimento;
	//Valida se recebeu a chefia do funcionario.
	if(user.cpf_chefia) {
		//Adiciona na query.
		query += "', cpf_chefia= '" +user.cpf_chefia;
	}
	query+= "' WHERE cpf = '" + user.cpf + "';";
	//Valida se contato foi enviado.
	if(user.contato) {
		//Se sim, cria query para a atualização de contato também.
		queryContato= "UPDATE contato set contato.contato = '" + user.contato + "' WHERE contato.cpf = '" + user.cpf + "';";
	}
	//Realiza a query de atualização de funcionario.
	con.query(query, function (err, result) {
	    if (err) throw err;
  	});
  	//Valida se a query de contato foi preenchida.
  	if(queryContato) {
  		//Se sim, atualiza o meio de contato também
  		con.query(queryContato, function (err, result) {
	    	if (err) throw err;
  		});
  	}
}

/**
* Método que cria um usuario.
*/
function createUser(user) {
	var queryContato;
	//Cria a query de criação do usuario.
	var query = "INSERT INTO funcionario "+
	"(cpf, nome, matricula, senha, data_nascimento";
	//Valida se recebeu a chefia.
	if(user.cpf_chefia) {
		//Inclui ela na query.
		query+= ", cpf_chefia"
	} 
	//Adiciona os dados recebidos na query.
	query+= ") value ('" + 
		user.cpf + "', '" +
		user.nome  + "', '" +
		user.matricula  + "', '" +
		user.senha  + "', '" +
		user.data_nascimento  + "'";
	if(user.cpf_chefia) {
		query+= ", '" + user.cpf_chefia + "'";
	}
	query+= ");"
	//Valida se contato foi enviado.
	if(user.contato) {
		//Cria query de contato.
		queryContato = "INSERT INTO contato value" +
		"('" + user.cpf + "', '" + user.contato + "');"
	}
	//Realiza a ação de criação de funcionario no banco.
	con.query(query, function (err, result) {
	    if (err) throw err;
	    //Ao final, se a query de contato foi preenchida, realiza o insert do contato também.
	    if(queryContato) {
	  		con.query(queryContato, function (err, result) {
		    	if (err) throw err;
	  		});
  		}
  	});
}

//Servidor inicia.
app.listen(port, () => console.log(`Listening on port ${port} on address ${addresses}`));