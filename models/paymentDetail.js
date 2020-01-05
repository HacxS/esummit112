var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");



var paymentDetailSchema = new mongoose.Schema({
   amount: {
    type: Number,
    required: true
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

paymentDetailSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("PaymentDetail", paymentDetailSchema);