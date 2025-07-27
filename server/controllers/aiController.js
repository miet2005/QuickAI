
import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
import pdf from 'pdf-parse/lib/pdf-parse.js'


const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});



export const generateArticle = async (req,res) =>{
    try {

        const {userId} = await req.auth();
        // const userId = req.userId
        const {prompt, length} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        // If free users have used more than 10 AI calls then error.
        if(plan!== 'premium' && free_usage>=10){        
            return res.json({ success : false, message:' Limit reached. Upgrade to continue '})
        }

    // Gemini API Call
    const response = await AI.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
        {
            role: "user",
            content: prompt,
        },
    ],
    temperature :0.7, // for randomness 0.7 means thoda creative
    max_tokens : length, //output ki max length
});

const content = response.choices[0].message.content 
//  response -> Ye OpenAI API ka pura response object hota hai, jo AI ka output deta hai.
//  response.choices -> API kai possible completions de sakta hai.
// Ye choices ek array hoti hai.
// Mostly hum first result lete hain: choices[0]
// response.choices[0].message -> choices array ka pehle element uthaya usmein ek message object hota hai and message ke andar hota hai role aur content where content is final AI generated output



// Storing the data in database :
await sql `INSERT INTO creations(user_id,prompt,content,type)
           VALUES(${userId},${prompt},${content},'Article')` ;

// Free users ke free_usage ke count ko increase karna by 1
if(plan!=='premium'){
    await clerkClient.users.updateUserMetadata(userId,{
        privateMetadata : {
            free_usage : free_usage + 1
        }
    })
}

// Sending the response
res.json({success : true ,content})

    } catch (error) {
        console.log(error.message)
        res.json({success : false, message : error.message})
    }
}


export const blogTitle = async (req,res) =>{
    try {

        const {userId} = await req.auth();
        // const userId = req.userId
        const {prompt} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        // If free users have used more than 10 AI calls then error.
        if(plan!== 'premium' && free_usage>=10){        
            return res.json({ success : false, message:' Limit reached. Upgrade to continue '})
        }

    // Gemini API Call
    const response = await AI.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
        {
            role: "user",
            content: prompt,
        },
    ],
    temperature :0.7, // for randomness 0.7 means thoda creative
    max_tokens : 120, //output ki max length
});

const content = response.choices[0].message.content 
//  response -> Ye OpenAI API ka pura response object hota hai, jo AI ka output deta hai.
//  response.choices -> API kai possible completions de sakta hai.
// Ye choices ek array hoti hai.
// Mostly hum first result lete hain: choices[0]
// response.choices[0].message -> choices array ka pehle element uthaya usmein ek message object hota hai and message ke andar hota hai role aur content where content is final AI generated output



// Storing the data in database :
await sql `INSERT INTO creations(user_id,prompt,content,type)
           VALUES(${userId},${prompt},${content},'blog-title')` ;

// Free users ke free_usage ke count ko increase karna by 1
if(plan!=='premium'){
    await clerkClient.users.updateUserMetadata(userId,{
        privateMetadata : {
            free_usage : free_usage + 1
        }
    })
}

// Sending the response
res.json({success : true ,content})

    } catch (error) {
        console.log(error.message)
        res.json({success : false, message : error.message})
    }
}


export const generateImage = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    // console.log("User ID:", userId);
    // console.log("Plan:", plan);
    // console.log("Prompt:", prompt);

    if (plan !== 'premium') {
      return res.json({
        success: false,
        message: 'This feature is only available for premium users. Upgrade to continue.'
      });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);

    const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
      headers: { 'x-api-key': process.env.CLIP_DROP_API_KEY },
      responseType: 'arraybuffer',
      timeout : 30000
    });

    // console.log("ClipDrop data received");

    const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Image);
    // console.log("Cloudinary result:", result);

    const secure_url = result.secure_url;

    await sql`
      INSERT INTO creations(user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message});
  }
};




export const removeBackground = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const  image  = req.file;
    const plan = req.plan;

    // console.log("User ID:", userId);
    // console.log("Plan:", plan);
    // console.log("Prompt:", prompt);

    if (plan !== 'premium') {
      return res.json({
        success: false,
        message: 'This feature is only available for premium users. Upgrade to continue.'
      });
    }

    const {secure_url} = await cloudinary.uploader.upload(image.path,{
        transformation : [
            {
                effect : 'background_removal',
                background_removal : 'remove_the_background'
            }
        ]
    })

    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background from the image', ${secure_url}, 'image')
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message});
  }
};



export const removeObject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { object } = req.body;
    const  image  = req.file;
    const plan = req.plan;

    // console.log("User ID:", userId);
    // console.log("Plan:", plan);
    // console.log("Prompt:", prompt);

    if (plan !== 'premium') {
      return res.json({
        success: false,
        message: 'This feature is only available for premium users. Upgrade to continue.'
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path)

    const imageUrl = cloudinary.url(public_id,{
        transformation : [
            {
                effect : `gen_remove:${object}`
            }
        ],
        resource_type : 'image'
    })


    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object} from the image`}, ${imageUrl}, 'image')
    `;

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message});
  }
};



export const resumeReview = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const resume = req.file;
    const plan = req.plan;

    // console.log("User ID:", userId);
    // console.log("Plan:", plan);
    // console.log("Prompt:", prompt);

    if (plan !== 'premium') {
      return res.json({
        success: false,
        message: 'This feature is only available for premium users. Upgrade to continue.'
      });
    }

    if( resume.size > 5 * 1024 * 1024){
        return res.json({success: false,message:"Resume file size exceedsallowed size (5 mb)."})
    }


    const dataBuffer = fs.readFileSync(resume.path)
    const pdfData = await pdf(dataBuffer)

    const prompt = `Review the following resume and provide constructive feedback on its strength , weaknesses, and areas of improvement. Resume Content :\n\n${pdfData.text}`

        const response = await AI.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [
        {
            role: "user",
            content: prompt,
        },
    ],
    temperature :0.7, // for randomness 0.7 means thoda creative
    max_tokens : 1000, //output ki max length
});

const content = response.choices[0].message.content


    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resumereview')
    `;

    res.json({ success: true, content});
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message});
  }
};



