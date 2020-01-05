var express = require("express");
var router = express.Router();
var User = require("../models/User");
var Event = require("../models/events");
var Workshop = require("../models/workshop");
var EventRegister = require("../models/eventRegister");
var WorkshopRegister = require("../models/workshopRegister");
var paymentDetail = require("../models/paymentDetail");
var middleware = require('../config');
var passport = require("passport");
var bcrypt = require('bcryptjs');
var nodemailer = require("nodemailer");
const keys = require('../security/keys');
const refer = require('../security/refer');
var request= require('request');

var Insta = require('instamojo-nodejs');
Insta.setKeys('test_bb088db45573b736d4c98742fff', 'test_ed12af4b6853090ee92b63e564d')


var smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
      user: process.env.EMAIL || keys.admin.email,
      pass: process.env.PASSWORD  ||keys.admin.password
  }
});
var rand, link;



// Landing Page

router.get('/', (req,res) => {
  res.render("index", {user : req.user});
});


// Payment

router.get('/payment', (req, res) => {
  var total_amount = 0;
  WorkshopRegister.find({email : req.user.email, payment : false}, (err, result) => {
    if(err){
      res.send("Error")
    }
    else{
      Workshop.find({}, (err2, result2) => {
        if(err2){res.send("Error")}
        else{
          arr =[]
          result.forEach(t => {
            result2.forEach(y => {
              if(t.workshop_id == y._id){
                total_amount = total_amount + y.price;
                arr.push({price : y.price, data : t})
              }
            });
          });
          EventRegister.find({ student_id : req.user.email, payment : false}, (err3, result3) =>{
            if(err3)res.send("Error")
            else{
              arr2=[]
                result3.forEach(u => {
                  if(u.name == "E-Carnival"){
                    total_amount = total_amount + 2499;
                    arr2.push({price : 2499, data : u})
                  }
                  if(u.name == "Incubate Me"){
                    total_amount = total_amount + 299;
                    arr2.push({price : 299, data : u})
                  }
                  if(u.name == "Speed Dating"){
                    total_amount = total_amount + 499;
                    arr2.push({price : 499, data : u})
                  }
                  if(u.name == "Intern Connect"){
                    total_amount = total_amount + 999;
                    arr2.push({price : 999, data : u})
                  }
                });
                res.render('payment', {user: req.user, workshop : arr, startupEvents : arr2, amount : total_amount});
              
            }
          })
        }
      })
      
    }
  })
})

router.post('/payment', (req, res) => {
  var total_amount = 0;
  WorkshopRegister.find({email : req.user.email, payment : false}, (err, result) => {
    if(err){
      res.send("Error")
    }
    else{
      Workshop.find({}, (err2, result2) => {
        if(err2){res.send("Error")}
        else{
          arr =[]
          result.forEach(t => {
            result2.forEach(y => {
              if(t.workshop_id == y._id){
                total_amount = total_amount + y.price;
                arr.push({price : y.price, data : t})
              }
            });
          });
          EventRegister.find({ student_id : req.user.email, payment : false}, (err3, result3) =>{
            if(err3)res.send("Error")
            else{
              arr2=[]
                result3.forEach(u => {
                  if(u.name == "E-Carnival"){
                    total_amount = total_amount + 2499;
                    arr2.push({price : 2499, data : u})
                  }
                  if(u.name == "Incubate Me"){
                    total_amount = total_amount + 299;
                    arr2.push({price : 299, data : u})
                  }
                  if(u.name == "Speed Dating"){
                    total_amount = total_amount + 499;
                    arr2.push({price : 499, data : u})
                  }
                  if(u.name == "Intern Connect"){
                    total_amount = total_amount + 999;
                    arr2.push({price : 999, data : u})
                  }
                });
                var data = new Insta.PaymentData();
                total_amount = total_amount + parseInt(req.body.acc);
                console.log(total_amount)
                data.purpose = "Test";            // REQUIRED
                data.amount = total_amount;
                data.currency                = 'INR';
                data.buyer_name              = req.user.first_name;
                data.email                   = req.user.email;
                data.phone                   = req.user.phone;
                data.webhook                 = 'https://payment111.herokuapp.com/payment-webhook-14567899'
                data.send_sms                = 'True';
                data.send_email              = 'True';
                data.allow_repeated_payments = 'False';                  
                data.setRedirectUrl('https://payment111.herokuapp.com/dashboard-participate');
                 
                Insta.createPayment(data, function(error, response) {
                  if (error) {
                    // some error
                  } else {
                    // Payment redirection link at response.payment_request.longurl
                    const obj = JSON.parse(response);
                    console.log(obj);
                    res.redirect(obj.payment_request.longurl)
                  }
                });
            }
          })
        }
      })
      
    }
  })

});

router.post('/payment-webhook-14567899', (req, res) => {
  var email = req.body.buyer;
  var amount = req.body.amount;
  var name = req.body.buyer_name;
  var payment_id = req.body.payment_id;
  var payment_request_id = req.body.payment_request_id;
  var status = req.body.status;

  var newPaymenyDetail = new paymentDetail({amount, email, name, payment_id, payment_request_id, status});
  newPaymenyDetail.save().then(newE => {
    console.log("Success");
    EventRegister.update({student_id : req.user.email, payment: false} ,{$set:{payment : true}}, (err2, event) => { 
      if(err2)res.send("Error");
      else{
        console.log("Success")
        res.send("Success")
      }
    })
  })

})

// Dashboard

router.get('/dashboard', middleware.ensureAuthenticated , (req,res) => {
  Event.find({}, (err, events) => {
    if(err){
      res.send({error : "Error Occured due to events"})
    }
    else{
      dup =events
      dup2 =[]
      EventRegister.find({student_id : req.user.email} , (err , doc1) => {
        var flag = 0
        dup.forEach(x => {
          doc1.forEach(y => {
            if( x._id == y.event_id){
              flag = 1;
            }
          });
          if(flag == 0)dup2.push(x);
          else flag = 0;
        });
        events = dup2;
        Workshop.find({}, (err2, workshops) => {
          if(err2){
            res.send({error : "Error Occured due to workshops"})
          }
          else{

            EventRegister.find({ student_id : req.user.email}, (err3, result4) => {
              
              EventRegister.find({ leader_id : req.user.email}, (err3, result5) => {
              res.render("dashboard", { user : req.user, events : events, registeredEvents : result4, workshops : workshops, leaderEvents : result5});
            })
            
          })
        }
        })
      })
    }
  })
});

router.get('/dashboard-participate', middleware.ensureAuthenticated , (req,res) => {  

  EventRegister.find({ student_id : req.user.email}, (err, result) => {
    if(err)res.send("Error");
    else{
      WorkshopRegister.find({email : req.user.email}, (err4, result4) => {
        if(err4)res.send("Error");
        else{
          if(result.length > 0){
            arr =[]
            var len = result.length;
            var i=1;
            result.forEach(a => {
              EventRegister.find({ team_name : a.team_name, name: a.name}, (err2, result2) => {
                if(err2)res.send("Error2");
                else{
                  console.log(result2)
                  arr.push({ team_name : a.team_name, data : result2 });
                }
                if(i==len){
                  
                      res.render("participate", { user : req.user, registeredEvents : result, allteam : arr, registeredWorkshops : result4 });
                    
                  
                }
                i++;
              });
            })
          }
          else{
            res.render("participate", { user : req.user, registeredEvents : result, allteam : [], registeredWorkshops : result4  });
          }
        }
      })
     
    }
  })
});

router.post('/dashboard/event', middleware.ensureAuthenticated , (req,res) => {
  var event_id = req.body.id;
  var name = null;
  var leader_id = req.user.email;
  var student_id = req.user.email;
  var status = true;
  var team_name = req.body.team_name;
  Event.findOne({_id : event_id}, (err, result) => {
    name = result.name;
    var newEventRegister = new EventRegister({ event_id, name, team_name, leader_id, student_id, status});
    newEventRegister.save().then(newEvent => {
      req.flash('success_msg','You have registered this event');
      res.redirect('/dashboard-participate');
      })
  })
});

router.post('/dashboard/workshop', middleware.ensureAuthenticated , (req,res) => {
  var workshop_id = req.body.id;
  var workshop_name = null;
  var email = req.user.email;
  var name = req.user.first_name + req.user.last_name;

  WorkshopRegister.findOne({email : email}, (err, result) => {
    if(!result){
      Workshop.findById(workshop_id, (er, rr) =>{
        if(er)res.send("Error");
        else{
          workshop_name = rr.name;
          var newWorkshopRegister = new WorkshopRegister({ workshop_id, workshop_name, name, email});
          newWorkshopRegister.save().then(newWorkshopRegister => {
            req.flash('success_msg','You have registered this workshop');
            res.redirect('/dashboard-participate#workshop');
            })
        }
      })
    }
    else{
      req.flash('success_msg','You have already registered that workshop.');
      res.redirect('/dashboard-participate');
    }
    
  })
});

router.post('/dashboard/add-member-event/:id/:name/:event_name', middleware.ensureAuthenticated , (req,res) => {
  var event_id = req.params.id;
  var leader_id = req.user.email;
  var student_id = req.body.email;
  var name = req.body.event_name;
  var team_name = req.params.name;
  if(student_id != req.user.email){
    EventRegister.find({ team_name : team_name, name : name}, (error, result2) => {
      if(error)res.send("Error");
      else{
        if(result2.length >=4){
          req.flash('error_msg','You can add upto 4 members only');
          res.redirect('/dashboard-participate');
        }
        else{
          var flag = 0;
          result2.forEach(x => {
            if(x.student_id == student_id){
              flag = 1;
              req.flash('error_msg','You have already added this member');
              res.redirect('/dashboard-participate');
            }
          });
          if(flag == 0){
            Event.findOne({_id : event_id}, (err, result) => {
              name = result.name;
              User.findOne({email : student_id}, (err, result) => {
                if(err)res.send("Error")
                else {
                  if(result){
                    var newEventRegister = new EventRegister({ event_id, team_name, name, leader_id, student_id});
                    newEventRegister.save().then(newEvent => {
                      req.flash('success_msg','You have added a member');
                      res.redirect('/dashboard-participate');
                      })
                  }
                  else{
                    req.flash('success_msg','Email Id does not exist');
                    res.redirect('/dashboard-participate');
                  }
                }
              })
            });
          }
        }
      }
    }); 
  }
  else{
    req.flash('error_msg','You cannot add yourself');
    res.redirect('/dashboard-participate');
  }
});

router.get('/dashboard/accept-event/:id', middleware.ensureAuthenticated , (req,res) => {
  var event_register_id = req.params.id;
  EventRegister.findOne({_id : event_register_id }, (err, event) => {
    if(err){
      res.send({error : "Error Occured due to accpetance"})
    }
    else{
      if(event.student_id == req.user.email){
        EventRegister.findOneAndUpdate({_id : event_register_id }, {$set:{status : true}}, (err, event) => {
          if(err){
            res.send({error : "Error Occured due to acceptance up"})
          }
          else{
                req.flash('success_msg','You have accpeted the event');
                res.redirect('/dashboard-participate');
          }
        })
      }
      else{
            req.flash('success_msg','Event cannot be accepted');
            res.redirect('/dashboard');
      }
    }
  });
});

router.get('/dashboard/reject-event/:id', middleware.ensureAuthenticated , (req,res) => {
  var event_register_id = req.params.id;
  EventRegister.findOne({_id : event_register_id }, (err, event) => {
    if(err){
      res.send({error : "Error Occured due to deletion"})
    }
    else{
      if(event.student_id == req.user.email || event.leader_id == req.user.email){
        EventRegister.findByIdAndRemove({_id : event_register_id }, (err, event) => {
          if(err){
            res.send({error : "Error Occured due to deletion"})
          }
          else{
                req.flash('success_msg','You have rejected the event');
                res.redirect('/dashboard-participate');
          }
        })
      }
      else{
            req.flash('success_msg','Event cannot be rejected');
            res.redirect('/dashboard');
      }
    }
  });
});

router.get('/dashboard/reject-workshop/:id', middleware.ensureAuthenticated , (req,res) => {
  var event_register_id = req.params.id;
  WorkshopRegister.findByIdAndRemove({_id : event_register_id }, (err, event) => {
    if(err){
      res.send({error : "Error Occured due to deletion"})
    }
    else{
          req.flash('success_msg','You have deleted the workshop');
          res.redirect('/dashboard-participate');
    }
  })
});

router.get('/dashboard/discard-event/:name', middleware.ensureAuthenticated , (req,res) => {
  var team_name = req.params.name;
  EventRegister.deleteMany({ team_name : team_name }, (err, rest) => {
    req.flash('success_msg','You have deleted the event');
    res.redirect('/dashboard-participate');
  })
});


// Test Routes

router.post('/event-post', (req, res) => {
  var name = req.body.name;
  var newWorkshop = new Workshop({name});
  newWorkshop.save().then(newWorkshop => {
    req.flash('success_msg','You have created a workshop');
    res.redirect('/tab');
    });
});

router.get("/tab",  function(req, res) {
  res.render('tab')
})


// Authentication

router.get('/register', middleware.forwardAuthenticated, (req,res) => {
  res.render("register");
});

router.get('/login', middleware.forwardAuthenticated, (req,res) => {
  res.render("login");
});

router.get('/send', middleware.checkEmailVerification, middleware.ensureAuthenticated, (req, res) => {
  rand=Math.floor((Math.random() * 100000) + 54);
  link="https://"+req.get('host')+"/verify?id="+rand+"&email="+req.user.email;
  arr = []
  User.findOne({email: req.user.email}, (err, user)=> {
    if(err){
      req.flash('error_msg','Email not found');
      res.redirect('/dashboard');
    }
    else{
      arr = user.link;
      arr.push(rand)
      User.findOneAndUpdate({email: req.user.email}, {$set:{link:arr}}, (err, resu) => {
        if(err){
          req.flash('error_msg','Could Not update Link in Database');
          res.redirect('/dashboard');
        }
        else{
          let mailOptions={
            from: keys.admin.from_email,
            to : req.user.email,
            subject : "Please confirm your Email account",
            html : "<h4 style='text-align:center'>Email Verification </h4> <br>Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a><br> <p>P.S. If you have received this mail multiple time then please click the most recent mail and in that click verify email.</p>"	
          }
          smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
              req.flash('error_msg','Could Not Send Mail');
              res.redirect('/dashboard');
            }
            else{
                req.flash('success_msg','Email Sent Successfuly');
                res.redirect('/dashboard');
            }
          });
        }
      })
    }
  });
});

router.get('/verify', function(req,res){
  var currentID = req.query.id;
  var trueID = null;
  var allID = null;
 User.findOne({email: req.query.email}, (err1, result) => {
   
   if(err1){res.send("Something went wrong, email not found")}
   else{
    if(result.verify == false){
      trueID = result.link[result.link.length-1];
      allID = result.link;
      if(currentID == trueID)
      {
         User.findOneAndUpdate({email: req.query.email}, {$set:{verify:true}}, (err3, doc) => {
           if (err3) {  
               res.send("Something went wrong, please re-verify your email")
           }
           else{
             res.send("Email is verified, please close this tab and refresh the previous tab of the dashboard.")
           }
         })
      }
      else
      {
        flag = 0;
        allID.forEach(x => {
          if(x == currentID){
           flag = 1;
           res.send("This is an experied link please clicked the latest one");
          }
        });
        if(flag == 0){
         res.send("This is a wrong link");
        }
      }
    }
    else{
      res.send("Email already verified");
    }
   }
 
 })
});

router.post('/register', (req, res) => {
    const first_name = req.body.first_name;
    console.log(req.body.startup);
    const last_name = req.body.last_name
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    const phone = req.body.phone;
    const college = req.body.college;
    const city = req.body.city;
    var startup = req.body.startup;
    if(startup == "1")startup = true;
    else startup = false;
    const referal_from = req.body.referal_from || null;
    let errors = [];
    if (password != password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
      errors.push({ msg: 'Password must be at least 6 characters' });
    }
    if (errors.length > 0) {
      res.render('register', { errors, email, password  });
    }
    else {
      var flag =0;
      
      if(referal_from !=null){
        refer.referal.forEach(x => {
          if(x.referal_code == referal_from){
            flag =1;
            User.findOne({ email: email }).then(user => {
              if (user) {
                errors.push({ msg: 'Email already exists' });
                res.render('register', { errors, email, password });
              } 
              else {
                var newUser = new User({ first_name, last_name, email, password, phone, college, city, referal_from,  startup});
                bcrypt.genSalt(10, (err, salt) => {
                  bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser.save().then(user => {
                      req.flash('success_msg','You are now registered and can log in');
                      res.redirect('/login');
                      })
                      .catch(err => console.log(err));
                  })    
                })
              }
            })
          }
        });
        if(flag ==0){
          errors.push({ msg: 'Invalid Referal Code' });
          res.render('register', { errors, email, password });
        }
      }
      else{
        User.findOne({ email: email }).then(user => {
          if (user) {
            errors.push({ msg: 'Email already exists' });
            res.render('register', { errors, email, password });
          } 
          else {
            var newUser = new User({ first_name, last_name, email, password, phone, college, city, referal_from, startup });
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser.save().then(user => {
                  req.flash('success_msg','You are now registered and can log in');
                  res.redirect('/login');
                  })
                  .catch(err => console.log(err));
              })    
            })
          }
        })
      }
    }
  });

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
      failureFlash: true,
      successFlash: true,
      successMessage: "Yoyo"
    })(req, res, next);
  });

router.get("/logout",  function(req, res) {
  req.logout(); 
  req.flash('success_msg','Successfully logged out');
  res.redirect('/');
});


 module.exports = router;