const express = require("express")
const router = express.Router()
const multer = require("multer")

const Settings = require("../models/Settings")
const {getSettings,updateSettings} = require("../controllers/SettingsController")

const storage = multer.diskStorage({

destination:"uploads/logos",

filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname)
}

})

const upload = multer({storage})

router.get("/settings",getSettings)

router.put("/settings",updateSettings)

router.post("/settings/upload",upload.single("image"),async(req,res)=>{

const settings = await Settings.findOne()

settings.logo = "/uploads/logos/"+req.file.filename

await settings.save()

res.json({path:settings.logo})

})

module.exports = router