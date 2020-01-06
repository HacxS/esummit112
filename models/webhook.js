var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");



var webhookSchema = new mongoose.Schema({
  amount : {
      type: Number
  },
  email : {
      type : String,
      default : true
  },
  name : {
      type: String,
      required: true
  },
  payment_id : {
    type : String,
    required: true
  },
  payment_request_id : {
      type : String,
      required: true
  },
  status : {
      type: String,
      required: true
  }
});

webhookSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Webhook", webhookSchema);