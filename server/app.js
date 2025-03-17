import express from "express"
import { config } from "dotenv"
import cookieParser from "cookie-parser"
import cors from 'cors'
import { db } from "./database/db.js"



import { errorMiddelware } from "./middleware/errorMiddleware.js"

import authRouter from "./routes/authrouter.js"
export const app =express()
config({path:"./config/config.env"})
app.use(cors({
    origin:[process.env.FRONTEND_URL],
    method:["GET","POST","PUT","DELETE"],
    credentials:true,
}))
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use('/api/v1/auth',authRouter)
db

app.use(errorMiddelware)
