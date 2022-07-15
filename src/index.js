const express = require('express')
const mongoose = require('mongoose')
const app = express()
const port = process.env.PORT || 3000
const route = require('./routes');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

mongoose.connect("mongodb+srv://animesh-dey98:Ir7ZHtxfwy24NFBc@cluster0.i6wv1.mongodb.net/urlShortener", {
    useNewUrlParser: true
})

    .then(() => console.log("MongoDB is Connected..."))
    .catch((err) => console.log(err.message))

app.use('/', route);


app.listen(port, function () {
    console.log(`Express app is running on port ${process.env.PORT || port}`)
})
//new line added