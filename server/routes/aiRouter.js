import express from  'express'
import { blogTitle, generateArticle, generateImage, removeBackground, removeObject, resumeReview } from '../controllers/aiController.js'
import { auth } from '../middlewares/auth.js'
import { upload } from '../configs/multer.js'


// Logic : 
// Frontend seh request aati hai particular route pe for eg. yaha /generate-article
// Server check krega iss route ke liye konsa function chalana hai
// Function run hoga and respond frontend pe jayega.

// Router object define kiya hai - jispe saare AI related routes define hoyenge
const aiRouter = express.Router()


// post isliye kyuki frontnend seh req object ke body mein prompt aur length ayega that is data is being sent to server.
aiRouter.post('/generate-article', auth, generateArticle)
aiRouter.post('/blog-title',auth, blogTitle)
aiRouter.post('/generate-image',auth, generateImage)
aiRouter.post('/remove-background',upload.single('image'), auth, removeBackground)
aiRouter.post('/remove-object',upload.single('image'), auth, removeObject)
aiRouter.post('/review-resume',upload.single('resume'), auth, resumeReview)

export default aiRouter