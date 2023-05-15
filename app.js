require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const hbs = require('hbs');
const fileUpload = require('express-fileupload')
const bcryptjs = require('bcryptjs')

const PORT = process.env.PORT;
hbs.registerPartials(__dirname+'/views/partials');

app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}))
app.use(fileUpload());


const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: 'db.db'
    },
    useNullAsDefault: true
});

app.post('/nuevaPubli',  function (req, res) {
    const us = req.body.userId
    cdx ={usuario: us}
    res.render('uploadImage',cdx);
})

app.post('/inicio', async function (req, res) {
    const us = req.body.userId
    const publicaciones = await knex('post');
    const likes = await knex('likes').where({usuario:us});
    let pubsLiked = []
    for (const pub in publicaciones){
        for (const like in likes) {
            const pubLiked = await knex('post').where({id:likes[like].post});
            pubsLiked.push(pubLiked[0]);
        }
    }
    cdx ={usuario: us, posts: publicaciones}
    res.render('todasLasImagenes',cdx);
})

app.post('/Miperfil', async function (req, res) {
    const us = req.body.userId
    const publicaciones = await knex('post').where({userId:us});
    const likes = await knex('likes').where({usuario:us});
    let pubsLiked = []
    for (const like in likes) {
        const pubLiked = await knex('post').where({id:likes[like].post});
        pubsLiked.push(pubLiked[0]);
    }
    cdx ={usuario: us, posts: publicaciones, postsL: pubsLiked}
    res.render('perfil',cdx);
})

app.get('/login', function (req, res) {
    res.render('login');
})

app.post('/subirImagen', async (req, res) =>{
    const data = req.files.pic.data;
    const descripcion = req.body.descripcion
    const user = req.body.userId
    if (data){
        await  knex.insert({Descripcion:descripcion, imagen:data,userId:user}).into('post');
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
})

app.post('/registrar', async (req, res) =>{
    const correo = req.body.correo
    const contra = req.body.contra
    const usuario = req.body.usuario
    let passhash = await bcryptjs.hash(contra, 8)

    const us = await knex('usuarios').where({usuario:usuario}).first();
    if (us){
        res.end((JSON.stringify({resu:1})))
    } else{
        const em = await knex('usuarios').where({correo:correo}).first();
        if (em){
            res.end((JSON.stringify({resu:2})))
        } else {
            await  knex.insert({usuario:usuario, correo:correo,contraseña:passhash}).into('usuarios');
            res.end((JSON.stringify({resu:3})))
        }
    }
})

app.post('/favorito', async (req, res) =>{
    const post = req.body.fotoo
    const usuario = req.body.usuario
    await knex.insert({usuario:usuario, post:post}).into('likes');
})

app.post('/iniciarSesion', async (req, res) =>{
    const correo = req.body.correo
    const contra = req.body.contra
    const em = await knex('usuarios').where({correo:correo}).first();
    if (em){
        let comp = bcryptjs.compareSync(contra,em.contraseña)
        if (comp){
            res.end((JSON.stringify({resu:3, us:em.id})));
        } else{
            res.end((JSON.stringify({resu:2})))
        }
    } else {
        res.end((JSON.stringify({resu:1})))
    }
})

app.get('/photo/:id', async (req, res) => {
    const id = req.params.id;
    const img = await knex('post').where({id:id}).first();
    if (img) {
        res.end(img.imagen);
    } else {
        res.end('no existe ese post')
    }
})

app.listen(PORT);
