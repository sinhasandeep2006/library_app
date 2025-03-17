import { app } from "./app.js";

const Port=process.env.PORT
app.listen(Port,()=>{
    console.log(`on the port ${Port}`)
})