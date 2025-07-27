import express from 'express';
import cors from 'cors';  //CORS - CROSS ORIGIN RESOURCE SHARING 
import 'dotenv/config';
import { clerkMiddleware, requireAuth } from '@clerk/express'
import aiRouter from './routes/aiRouter.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';


// Express app bnaya
const app = express()

await connectCloudinary()

// Kisi bhi origin seh request aarahi ho allow krdo
app.use(cors())

// Agar frontend seh JSON data aaye toh use parse krlena. JSON ko parse karna
app.use(express.json()) //express.json() is like a translator -> translates the language of frontend into backend friendly lang.

//Ye middleware request ke headers se Clerk ka token uthata hai, usse verify karta hai, aur agar valid hua to req.auth ya req.user ke through user info aage ke routes me available kara deta hai.
app.use(clerkMiddleware())

// req frontend seh aane wala object hai ,res server ka frontend ke liye jawab hai
app.get('/',(req,res)=>res.send('Server is Live'))

//Har route ke liye authentication required hai. Agar user authenticated nahi hai (yaani Clerk token valid nahi hai), toh request reject ho jaayegi (unauthorized error milega).
app.use(requireAuth())

// Saari request /api/ai/* aiRouter ko jayengi
app.use('/api/ai',aiRouter)


app.use('/api/user',userRouter)



// Selecting the port on which server will be running
const PORT = process.env.PORT || 3000

// Server ko is port pe start krdo
app.listen(PORT,()=>{
    console.log('Server is running on port - ',PORT) //console mein msg dikhata hai
})

// Server running on port-3000 



