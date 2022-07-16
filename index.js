const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const ejs = require('ejs')
require('dotenv').config()
const app = express()
const route = require('./src/routes');
const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true}))

mongoose.connect(process.env.CONNECT_DB, { useNewUrlParser: true, useUnifiedTopology: true })

    .then(() => console.log("MongoDB is Connected..."))
    .catch((err) => console.log(err.message))

app.use('/', route);



    app.listen(port, function () {
        console.log(`Express app is running on port ${process.env.PORT || port}`)
    })





/**
 * const static_path = path.join(__dirname, '/public')
app.use(express.static(static_path))
app.set('view engine', 'hbs')

app.get('/',(req,res)=>{
    res.render('index')
})

// app.get('/',(req,res)=>{
//     res.sendFile(__dirname + '/views/index.html')
// })



// app.get("/", (req, res) => {
//     res.set({
//         "Allow-access-Allow-Origin": '*'
//     })
//     return res.redirect('index.html')})
 */