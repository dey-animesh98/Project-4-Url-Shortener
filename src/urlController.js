const urlModel = require('./urlModel')
const validUrl = require('valid-url')
const shortid = require('shortid')
const redis = require('redis')
const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
    12507, 
    "redis-12507.c212.ap-south-1-1.ec2.cloud.redislabs.com", 
    { no_ready_check: true });

    redisClient.auth("9rnzcUHwyTiFHXdtehUSNNYFMfRGcCGJ", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Redis is connected...");
});
redisClient.on("error", async function (err) {
    console.log(err.message);
});
//Api-key=> S1upb5sysvs8yb9tjhwht78rzapq009qk9ru64m8tcmtpf4jhch


//Connection setup for redis
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient)
const DEFAULT_EXPIRATION = 60*60  //In seconds


//---------------------------Valiadtions-----------------------------------------//
//request body validation
const isValidRequest = function (request) {
    return (Object.keys(request).length > 0)
}
//value validation
const isValidValue = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}

//---------------------------------------------------Shorten Url API-----------------------------------------------------------------//
const shortenUrl = async (req, res) => {
    try {
        if (!isValidRequest(req.body)) return res.status(400).send({ status: false, message: "No input by user" })
        if (!isValidValue(req.body.longUrl)) return res.status(400).send({ status: false, message: "longUrl is required." })

        const longUrl = req.body.longUrl.trim()

        //If URL already Present in cache
        const cachedLongUrl = await GET_ASYNC(`${longUrl}`)
        if (cachedLongUrl) {
            const parseLongUrl = JSON.parse(cachedLongUrl)
            return res.status(201).send({ status: true, message: "Shorten link already generated previously (from cache)", data: parseLongUrl })
        }

        // If longurl present in db but not in cache
        const usedLongUrl = await urlModel.findOne({ longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if (usedLongUrl) return res.status(201).send({ status: true, message: "Shorten link already generated previously (from db).", data: usedLongUrl })

        //Url Validations

        const checkDot = longUrl.split('//')
        if (!validUrl.isWebUri(longUrl) || !checkDot[1].includes('.')) return res.status(400).send({ status: false, message: "Long Url is invalid." })

        // Base Url
        const baseUrl = "http://localhost:3000/"
        if (!validUrl.isWebUri(baseUrl)) return res.status(400).send({ status: false, message: `${baseUrl} is invalid base Url` })

        //Short id generation
        const shortUrlCode = shortid.generate().toLowerCase()
        const alreadyExistCode = await urlModel.findOne({ urlCode: shortUrlCode })
        if (alreadyExistCode) return res.status(400).send({ status: false, message: `${alreadyExistCode} is already exist` })

        //Concatenate Urls
        const shortUrl = baseUrl + shortUrlCode
        const generateUrl = { longUrl: longUrl, shortUrl: shortUrl, urlCode: shortUrlCode }

        //Set cache the newly created url
        if (generateUrl) {
            await SETEX_ASYNC(`${longUrl}`, DEFAULT_EXPIRATION, JSON.stringify(generateUrl))
        }
        await urlModel.create(generateUrl)
        return res.status(201).send({ status: true, message: "Short url Successfully created", data: generateUrl })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//---------------------------------------------------Get Url API-----------------------------------------------------------------//
const getUrl = async (req, res) => {
    try {
        const urlCode = req.params.urlCode

        const cachedUrlCode = await GET_ASYNC(`${urlCode}`)
        if (cachedUrlCode) {
            const parseUrl = JSON.parse(cachedUrlCode)
            const cachedLongUrl = parseUrl.longUrl
            return res.status(302).redirect(cachedLongUrl)
        }
        const findUrlcode = await urlModel.findOne({ urlCode })
        if (!findUrlcode) return res.status(404).send({ status: false, message: "URL code not found" })

        await SETEX_ASYNC(`${urlCode}`, DEFAULT_EXPIRATION, JSON.stringify(findUrlcode))
        return res.status(302).redirect(findUrlcode.longUrl)
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { shortenUrl, getUrl }


