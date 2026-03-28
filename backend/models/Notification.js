const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
{
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  title:{
    type:String,
    required:true
  },
  connectionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Connection"
},

  profileImage: {
  type: String,
  default: ""
},

  message:{
    type:String,
    required:true
  },

  taskId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Task"
  },
  userRole: {
  type: String,
  enum: ["worker", "provider"],
},

  read:{
    type:Boolean,
    default:false
  }

},
{timestamps:true}
);

module.exports = mongoose.model("Notification",notificationSchema);