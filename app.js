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
var fs = require('fs')
app.use( bodyParser.json({limit: '10mb', extended: true}) )     
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

//Função que recebe os parametros do login do professor/admin e retorna os dados do usuario
app.post('/loginAdmin', function (req, res) {
    try{
        console.log('nova requisicao')
        let dataRegister = {
            usuario: req.body.usuario,
            senha: req.body.senha,
            tipoUsuario: req.body.tipoUsuario,
        }
        let queryLogin
        if(dataRegister['tipoUsuario'] == 'Professor'){
            queryLogin = `SELECT * FROM tb_professor WHERE usuario = '${dataRegister['usuario']}' AND senha = '${dataRegister['senha']}'`
        }else{
            queryLogin = `SELECT * FROM tb_admin WHERE usuario = '${dataRegister['usuario']}' AND senha = '${dataRegister['senha']}'`
        }
        connection.query(queryLogin,(err, retornoInsert) => {
            console.log(JSON.stringify(retornoInsert))
            if (err){
                console.log(err)
                res.send( {'status':'erro','desc':err} )
            }else{
                if(retornoInsert.length == 0){
                    res.send({'status':'erro_senha','desc':'erro'})
                }else{
                    res.send({'status':'ok','desc':retornoInsert})
                }
                console.log('foi')
            }
        })        
    }catch(err){
        console.log('caiu aqui3' + err)
        res.send({'status':'erro','desc':'erro'})
    }
})
//Função que recebe a redação do aluno, salva e a sorteia para um dos proffesores
app.post('/send_redacao', function (req, res) {
    console.log('nova redação recebida')
    try{        
        //caminho = '/var/www/arquivos_argumente/fotos_redacao/teste.png'
        let dataAtual = new Date()
        let nomeArquivo = req.body.idTema.toString() + dataAtual.getDay().toString() + dataAtual.getHours().toString() + dataAtual.getMinutes().toString() + dataAtual.getSeconds().toString() + '.png'
        const caminho = `/home/matheus/arquivos_argumente/fotos_redacao/${nomeArquivo}`

        fs.writeFile(caminho, req.body.imgPhoto, {encoding: 'base64'}, function(err) {
            if(!err){
                console.log('entrou aqui e agora eu vou salvar os dados no banco')
                let dateComplete = getDateTime(dataAtual)
                let queryRedacao = `INSERT INTO tb_redacao (id_aluno, id_tema, data_criacao, finalizado, caminho_imagem) VALUES ('${req.body.idAluno}','${req.body.idTema}','${dateComplete}','1','${caminho}')`
                console.log(queryRedacao)
                connection.query(queryRedacao, (err, result) => {
                    console.log(err)
                    if(err){
                        res.send({'status':'erro','desc':err})
                    }else{
                        res.send({'status':'ok','desc':'ok'})
                    }
                })
            }else{
                res.send({'status':'erro','desc':err})
            }
        });
    }catch(err){
        console.log(err)
        res.send({'status':'erro','desc':'erro'})
    }
})

//Função que recebe a redação do aluno, salva e a sorteia para um dos proffesores
app.post('/get_redacao', function (req, res) {
    try{        
        let tipo
        if (req.body.tipoRedacao == 'finalizada'){
            tipo = 1
        }else{
            tipo = 0
        }
        let queryRedacao = `select tema.tema, redacao.id, tema.id as idtema from tb_redacao redacao INNER JOIN tb_tema tema ON (redacao.id_tema = tema.id) WHERE redacao.finalizado = '${tipo}' and redacao.id_aluno = '${req.body.idAluno}'`
        connection.query(queryRedacao, (err, result) => {
            console.log(err)
            if(err){
                res.send({'status':'erro','desc':err})
            }else{
                res.send({'status':'ok','desc':result})
            }
        })
    }catch(err){
        console.log(err)
        res.send({'status':'erro','desc':'erro'})
    }
})

//Função que recebe todas as redações ainda sem um professor linkado
app.post('/getNovasRedacoes', function (req, res) {
    try{  
        let queryRedacao = `select redacao.id, redacao.id_aluno as idaluno,tema.tema as tema, aluno.nome as nome from tb_redacao redacao INNER JOIN tb_aluno aluno ON (redacao.id_aluno = aluno.id) INNER JOIN tb_tema tema ON (redacao.id_tema = tema.id) WHERE id_professor IS NULL`
        connection.query(queryRedacao, (err, result) => {
            console.log(err)
            if(err){
                res.send({'status':'erro','desc':err})
            }else{
                console.log(result)
                res.send({'status':'ok','desc':result})
            }
        })
    }catch(err){
        console.log(err)
        res.send({'status':'erro','desc':'erro'})
    }
})
//Função que recebe dados de uma redação ainda não corrigida
app.post('/getRedacaoId', function (req, res) {
    try{  
        let queryRedacao = `select redacao.id,redacao.caminho_imagem as caminhoImagem, redacao.id_aluno as idaluno,tema.tema as tema, aluno.nome as nome from tb_redacao redacao INNER JOIN tb_aluno aluno ON (redacao.id_aluno = aluno.id) INNER JOIN tb_tema tema ON (redacao.id_tema = tema.id) WHERE id_professor IS NULL and redacao.id = '${req.body.id}'`
        connection.query(queryRedacao, (err, result) => {
            console.log(err)
            if(err){
                res.send({'status':'erro','desc':err})
            }else{
                let jsonRetorno = []
                let nomeArquivoQuebrado 
                for(let i = 0; i < result.length;i++){
                    nomeArquivoQuebrado = result[i]['caminhoImagem'].split('/')
                    jsonRetorno.push({
                        id:result[i]['id'],
                        nome:result[i]['nome'],
                        idAluno:result[i]['idaluno'],
                        tema:result[i]['tema'],
                        caminhoImg:base64_encode(result[i]['caminhoImagem']),
                        nomeArquivo:nomeArquivoQuebrado[nomeArquivoQuebrado.length-1]
                    })
                }
                console.log(nomeArquivoQuebrado[nomeArquivoQuebrado.length-1])                
                res.send({'status':'ok','desc':jsonRetorno})
            }
        })
    }catch(err){
        console.log(err)
        res.send({'status':'erro','desc':'erro'})
    }
})
//Função que recebe dados de uma correcao e salva no banco
app.post('/sendCorrecao', function (req, res) {
    try{  
        console.log(`SELECT caminho_imagem FROM tb_redacao where id ='${req.body.idRedacao}'`)
        connection.query(`SELECT caminho_imagem FROM tb_redacao where id ='${req.body.idRedacao}'`, (err, result) => {
            console.log(req.body.dadosImagem)
            fs.writeFile(result[0]['caminho_imagem'], req.body.dadosImagem, 'base64', function(err) {
                if(!err){
                    console.log('entrou aqui e agora eu vou salvar os dados no banco')
                    let dateComplete = getDateTime(new Date())
                    let queryRedacao = `INSERT INTO tb_correcao(id_redacao, observacao, usuario_envio, data) VALUES ('${req.body.idRedacao}','${req.body.observacoes}','${req.body.usuarioEnvio}','${dateComplete}')`
                    connection.query(queryRedacao, (err, result) => {
                        console.log(err)
                        if(err){
                            res.send({'status':'erro','desc':err})
                        }else{         
                            connection.query(`UPDATE tb_redacao SET id_professor = '${req.body.idProfessor}'`, (err, result) => {
                                res.send({'status':'ok','desc':'ok'})
                            })
                        }
                    })
                }else{
                    res.send({'status':'erro','desc':err})
                }
            })
        })
    }catch(err){
        console.log(err)
        res.send({'status':'erro','desc':'erro'})
    }
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

//Função que monta a Datestring do formato correto
function getDateTime(now) {
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
         month = '0'+month;
    }
    if(day.toString().length == 1) {
         day = '0'+day;
    }   
    if(hour.toString().length == 1) {
         hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
         minute = '0'+minute;
    }
    if(second.toString().length == 1) {
         second = '0'+second;
    }   
    var dateTime = year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;   
     return dateTime;
}
// função que recebe o camiho de um arquivo, abre e transforma em base64 
function base64_encode(file) {
    // le o binario
    var bitmap = fs.readFileSync(file);
    // converte para base64 e retorna
    return new Buffer(bitmap).toString('base64');
}