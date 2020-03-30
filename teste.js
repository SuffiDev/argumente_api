var express = require('express')
const https = require('https');
const fs = require('fs');
var app = express();

//INICIO DA CONFIGURAÇÃO DO BANCO
const { Pool, Client } = require('pg');
const pool = new Pool({
    user: 'forip',
    host: '10.4.4.1',
    database: 'forip',
    password: 'yma2578k',
    port: 5432
});
//FIM DA CONFIGURAÇÃO DO BANCO

app.get('/', function(req, res) {
    console.log('teste')
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send('hello world')
});

//Função que pega um ramal e retorna os dados dele. url: https://IP_SERVIDOR:3010/get_ramal?ramal=NUMERO_RAMAL
app.get('/get_ramal', function(req, res) {
    try{
        let ramal = req.query['ramal']
        pool.query(`SELECT * FROM f_ramal_virtual WHERE ramal_virtual = '${ramal}' `, function(err, response) {
            let listRetorno = []
            for (let i = 0; i < response['rows'].length; i++) {
                listRetorno.push({
                    'ramal':response.rows[i]['ramal_virtual'],
                    'fisico':response.rows[i]['ramal_fisico'],
                    'departamento':response.rows[i]['departamento']
                })
            }
            return res.json(listRetorno)
        });
    }catch(err){
        console.log(err)
    }
});

app.get('/get_history', function(req, res) {
	let date = new Date();
	let month = date.getMonth()+1;
	if((month.toString().length) == 1){
		month = '0'+month+'';
	}
	let year = date.getFullYear();
	let day = date.getDate();
	if((day.toString().length) == 1){
		day = '0'+day+'';
	}
	var today = ''+year+'-'+month+'-'+day+'';
    res.setHeader("Access-Control-Allow-Origin", "*")
    try{
        let ramal = req.query['ramal']
        let query = `select origem,destino,horario from f_bilhetes_chamadas where horario between '${today} 00:00:01' and '${today} 23:59:00' and origem='${ramal}' or destino='${ramal}' and horario between '${today} 00:00:01' and '${today} 23:59:00' order by horario`
        console.log(query)
		pool.query(query, function(err, response) {
            let listRetorno = []
            for (let i = 0; i < response['rows'].length; i++) {
                listRetorno.push({
                    'origem':response.rows[i]['origem'],
                    'destino':response.rows[i]['destino'],
                    'horario':response.rows[i]['horario'],
                })
            }
            return res.json(listRetorno)
        });
     }catch(err){
        console.log(err)
    }
});

app.listen(3000, () => {
    console.log('rodando')
})