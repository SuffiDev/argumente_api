#!/usr/bin/env node

//mysql config
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'matheus',
    password: '123456',
    database: 'db_argumente'
})

connection.connect((err) => {
    if(err) throw err;
    console.log('conected!')
})

//express config
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
let port = 3000
app.use( bodyParser.json() )     
app.use(bodyParser.urlencoded({    
  extended: true
}))

//Função que recebe os parametros do registro e retorna se deu certo ou não 
app.post('/register', function (req, res) {
    try{
        console.log('nova requisicao')
        let dataRegister = {
            nome: req.body.nome,
            sobreNome: req.body.sobreNome,
            usuario: req.body.usuario,
            senha: req.body.senha,
            email: req.body.email,
            codigoAcesso: req.body.codigoAcesso,
            escolaridade: req.body.escolaridade,
            cidade: req.body.cidade,
            estado: req.body.estado,
        }
        console.log("SELECT * FROM tb_codigo WHERE codigo = '"+dataRegister['codigoAcesso']+"'")
        connection.query("SELECT * FROM tb_codigo WHERE codigo = '"+dataRegister['codigoAcesso']+"'" , (err, result, fields) => {
            if(result.length > 0 && result[0]['quantidade'] >= 1){
               let retornoInsert = insereAlunos(dataRegister)
               if(retornoInsert['status'] == 'ok'){
                    retornoInsert = alteraCodigo(dataRegister['codigoAcesso'])
                    if(retornoInsert['status'] == 'ok'){
                        console.log({'status':'ok','desc':'ok'})
                        res.send({'status':'ok','desc':'ok'})
                    }
                }else{
                    console.log({'status':'erro','desc':'erro ao inserir usuario'})
                    res.send({'status':'erro','desc':'erro ao inserir usuario'})
                }
               
            }else{
                console.log({'status':'erro_code','desc':'codigo invalido'})
                res.send({'status':'erro_code','desc':'codigo invalido'})
            }
        })
    }catch(err){
        res.send({'status':'erro','desc':'erro ao inserir usuario'})
    }
})
      
//Função que recebe os parametros do login e retorna os dados do usuario
app.post('/login', function (req, res) {
    try{
        console.log('nova requisicao')
        let dataRegister = {
            usuario: req.body.usuario,
            senha: req.body.senha,
        }
        let queryCodigo = "SELECT * FROM tb_aluno WHERE usuario = '"+dataRegister['usuario']+"' AND senha = '"+dataRegister['senha']+"'"
        connection.query(queryCodigo,(err, retornoInsert) => {
            console.log(JSON.stringify(retornoInsert))
            if (err){
                console.log(err)
                res.send( {'status':'erro','desc':err} )
            }else{
                res.send({'status':'ok','desc':retornoInsert})
            }
        })        
    }catch(err){
        console.log('caiu aqui3' + err)
        res.send({'status':'erro','desc':'erro'})
    }
})
//Função que recebe a redação do aluno, salva e a sorteia para um dos proffesores
app.post('/send_redacao', function (req, res) {
    res.send('Hello World!');
})

//Função que recebe uma mensagem de faleConosco e coloca no banco
app.post('/faleconosco', function (req, res) {
    try{
        console.log('nova requisicao')
        let dataRegister = {
            id_aluno: req.body.id_aluno,
            texto: req.body.texto,
        }
        let queryFale = "INSERT INTO tb_faleconosco (id_aluno,texto) VALUES ('"+dataRegister['id_aluno']+"','"+dataRegister['texto']+"')"
        connection.query(queryFale, (err, result) => {
            if (err) return {'status':'erro','desc':err}
            retornoReq = result[0]
            console.log(retornoReq)
            return {'status':'ok','desc':result[0]}
        })
    }catch(err){
        res.send({'status':'erro','desc':'erro ao inserir usuario'})
    }
})

//Função que recebe a redação do proffesor e retorna para o aluno
app.post('/send_redacao', function (req, res) {
    res.send('Hello World!');
})

//Função que recebe um parametro e retorna os dados do usuario para o pos_login
app.post('/pos_login', function (req, res) {
    try{
        let queryCodigo = "SELECT * FROM tb_aluno WHERE id = '"+req.body.id+"'"
        console.log(queryCodigo)
        connection.query(queryCodigo,(err, data) => {
            if(err){
                res.send({'status':'erro','desc':err})
            }else{                
                if( data[0]['idade'] == null ||  data[0]['escolaridade'] == '' ||  data[0]['cidade'] ==  '' ||  data[0]['estado'] == ''){
                    res.send({'status':'erro_campos','desc':'nao'})
                }else{
                    res.send({'status':'ok','desc':'ok'})
                }
            }
        })        
    }catch(err){
        console.log('caiu aqui3' + err)
        res.send({'status':'erro','desc':'erro'})
    }
})

//Função que recebe um parametro e retorna os dados do usuario para o perfil
app.post('/get_aluno', function (req, res) {
    try{
        let queryCodigo = "SELECT * FROM tb_aluno WHERE id = '"+req.body.id+"'"
        console.log(queryCodigo)
        connection.query(queryCodigo,(err, data) => {
            console.log(JSON.stringify(data))
            if (err) return {'status':'erro','desc':err}
            res.send({'status':'ok','desc':data})
        })        
    }catch(err){
        console.log('caiu aqui3' + err)
        res.send({'status':'erro','desc':'erro'})
    }
})

//Função que recebe os dados do perfil como parametro e os salva
app.post('/salvaPerfil', function (req, res) {
    try{
        let queryPerfil = "UPDATE tb_aluno SET nome = '"+req.body.nome+"', "+
                            "sobrenome = '"+req.body.sobrenome+"', "+
                            "usuario = '"+req.body.usuario+"', "+
                            "senha = '"+req.body.senha+"', "+
                            "email = '"+req.body.email+"', "+
                            "idade = '"+req.body.idade+"', "+
                            "escolaridade = '"+req.body.escolaridade+"', "+
                            "cidade = '"+req.body.cidade+"', "+
                            "estado = '"+req.body.estado+"' WHERE id = '"+req.body.id+"'"
        console.log(queryPerfil)
        connection.query(queryPerfil,(err, data) => {
            console.log(JSON.stringify(data))
            if (err){
                console.log(err)
                res.send( {'status':'erro','desc':err} )
            }else{
                res.send({'status':'ok','desc':'ok'})
            }
        })        
    }catch(err){
        console.log('caiu aqui3' + err)
        res.send({'status':'erro','desc':'erro'})
    }
})

//Função que envia um comentario
app.post('/enviaComentario', function (req, res) {
    try{
        let queryComentario = `INSERT INTO tb_faleconosco (id_aluno, texto) VALUES ('${req.body.id}','${req.body.comentario}')`
        console.log(queryComentario)
        connection.query(queryComentario,(err, data) => {
            console.log(JSON.stringify(data))
            if (err){
                console.log(err)
                res.send( {'status':'erro','desc':err} )
            }else{
                res.send({'status':'ok','desc':'ok'})
            }
        })        
    }catch(err){
        console.log('caiu aqui3' + err)
        res.send({'status':'erro','desc':'erro'})
    }
})

//Função que pega o tema da semana
app.post('/get_tema', function (req, res) {
    try{
        let currentDay = new Date().getDate()
        let currentMonth = new Date().getMonth() + 1
        let currentYear = new Date().getFullYear()
        let queryTema = `SELECT * FROM tb_tema WHERE dias like '%${currentDay}%' AND mes = '${currentMonth}' AND ano = '${currentYear}'`
        console.log(queryTema)
        connection.query(queryTema,(err, data) => {
            console.log(JSON.stringify(data))
            if (err){
                console.log(err)
                res.send( {'status':'erro','desc':err} )
            }else{
                res.send({'status':'ok','desc':data})
            }
        })        
    }catch(err){
        console.log('caiu aqui3' + err)
        res.send({'status':'erro','desc':'erro'})
    }
})
app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
})

//Função que insere um novo aluno na tabela
function insereAlunos(dataRegister){
    try{
        let queryAlunos = "INSERT INTO tb_aluno (nome,sobrenome,usuario,senha,email,codigo_acesso,idade,escolaridade,cidade,estado) VALUES ?"
        let valuesAlunos = [
            dataRegister.nome,
            dataRegister.sobreNome,
            dataRegister.usuario,
            dataRegister.senha,
            dataRegister.email,
            dataRegister.codigoAcesso,
            dataRegister.idade,
            dataRegister.escolaridade,
            dataRegister.cidade,
            dataRegister.estado,
        ]
        connection.query(queryAlunos,[[valuesAlunos]], (err, result) => {
            if (err) return {'status':'erro','desc':err}
            return {'status':'ok','desc':'ok'}
        })
    }catch(err){
        return {'status':'erro','desc':err}
    }finally{
        return {'status':'ok','desc':'ok'}
    }
}

//Função que subtrai -1 do campo quantidade na tabela codigo
function alteraCodigo(codigo){
    try{
        let queryCodigo = "UPDATE tb_codigo SET quantidade = quantidade -1 where codigo = '"+codigo+"'"
        connection.query(queryCodigo, (err, result) => {
            if (err) return {'status':'erro','desc':err}
            return {'status':'ok','desc':'ok'}
        })
    }catch(err){
        return {'status':'erro','desc':err}
    }finally{
        return {'status':'ok','desc':'ok'}
    }
}