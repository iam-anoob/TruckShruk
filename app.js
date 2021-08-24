const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const https = require('https');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const PaytmConfig = require(__dirname+"/views/paytm-config/config.js");
const PaytmChecksum = require(__dirname+"/views/paytm-config/checksum.js");
const Secret = require(__dirname+"/views/Secret.js");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: Secret.Secret.secret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// -----------mail connenection setup-----------
var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: Secret.Secret.mailUsername,
        pass: Secret.Secret.mailPassword
    }
});
var otp,mailOptions,host,link;
// =------------END mail connenection setup--------------

mongoose.connect("mongodb://localhost:27017/TruckShrukDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true)

// ----orderSchema strt--
const orderSchema = new mongoose.Schema({
  type:String,
  materialN:String,
  l:Number,
  w:Number,
  h:Number,
  q:Number,
  unit:String,
  wgt:Number,
  wgtUnit:String,
  roomNo:String,
  pickupFloor:String,
  dropFloor:String,
  orderId:String,
  orderDate:String,
  fare:Number,
  tax:Number,
  amount:Number,
  pickupDate: String,
  P_name: String,
  P_addLn1: String,
  P_addLn2: String,
  P_addLn3: String,
  P_addLn4: String,
  P_addLn5:String,
  P_addLn6: String,
  username: String,
  P_mob: Number,
  D_name: String,
  D_addLn1: String,
  D_addLn2: String,
  D_addLn3: String,
  D_addLn4: String,
  D_addLn5: String,
  D_addLn6: String,
  D_mob: Number,
  distance:String,
  duration:String,
  payment:Number
});

const Order = mongoose.model("Order", orderSchema);
// ----orderschema end--

const userSchema = new mongoose.Schema({
  repName:String,
  compName:String,
  compMob:String,
  username:String,
  compSector:String,
  password:String,
  v:Number,
  orders:[orderSchema]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


let newUser;
let location;
let locationData;
let order;
let shipping;

app.get("/", function(req, res){
  if (req.isAuthenticated()){
    res.render("home", {login:"1"});
  }else{
    res.render("home",  {login:"0"});
  }
});

app.get("/estimate", function(req,res){
  res.render("estimate");
});

app.post("/estimate", function(req, res){
  const userLocations = {
    pickup: req.body.pickupCity,
    drop: req.body.dropCity,
  };

    location = userLocations;
    setTimeout(function () {
    res.redirect("/booking");
  }, 1800)

});

app.get("/business/signup", function(req, res){
  if (req.isAuthenticated()){
    res.render("business/myaccount");
  }else {
  res.render("business/businessSignup");}
});
app.post("/business/signup", function(req, res){
  const newuser = {
    repName:req.body.repName,
    compName:req.body.compName,
    compMob:req.body.compMob,
    email:req.body.email,
    compSector:req.body.compSector,
  }
  newUser = newuser;

  const newSignup = new User({
    repName:newUser.repName,
    compName:newUser.compName,
    compMob:newUser.compMob,
    username : newUser.email,
    compSector:newUser.compSector,
    v:0
    });
  User.register(newSignup, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/business/signup")
    }else {
    }
  });

  });

app.get("/business/login", function(req, res){
  if (req.isAuthenticated()){
    res.render("business/myaccount");
  }else {
  var query = require('url').parse(req.url,true).query;
  var v = query.v;
  var p = query.p;
  var redirect = query.redirect;

  res.render("business/businessLogin", {v:v,redirect:redirect,p:p});}
});

app.post("/business/login", function(req, res,next){
  var query = require('url').parse(req.url,true).query;
  var redirect = query.redirect;
  const loginUser = new User({
    username : req.body.username,
    password : req.body.password
  });

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (user) {
      req.login(user, (err) => {
        if (err) { return next(err); }
         if (redirect) {
           res.redirect("/"+redirect);
        }else {
            res.redirect("/business/myaccount");
      }
      });
    } else {
      return res.status(401).redirect("/business/login?p=0");
    }
  })(req, res, next);
});

app.get("/business/myaccount", function(req, res){
  if (req.isAuthenticated()){
    res.render("business/myaccount");
  }else {
    res.redirect("/business/login?redirect=business/myaccount")
  }
});

app.get("/business/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/tracking", function(req, res){
  res.render("tracking");
});
app.post("/tracking", function(req, res){
  const id = req.body.orderId;
  res.redirect("/orderDetails?orderId="+id);
});

app.get("/booking", function(req,res){
if(typeof location == 'undefined'){
   res.redirect("/estimate");
}

else {
  res.render("booking", {
    locationName : location,
    locationData : locationData
   });


  }
});

app.post("/booking", function(req, res){
  const locationCalc = {
    distance: req.body.distance,
    duration:req.body.duration
  }
locationData = locationCalc;
});

app.get("/orderform", function(req, res){
  //p = personal, lT = laadType, mp = movers..., fI = few-items, b = business, fT = fullTruck pT = partTruck, mT = materialType
  if(typeof location == 'undefined'){
     res.redirect("/estimate");
  }
  else {
    var query = require('url').parse(req.url,true).query;
    var type = query.type;
    var option = query.option;
    var redirect = query.redirect;
    if (type == "b") {
      if (req.isAuthenticated()){
        if (option == "fT1") {
          res.render("orderForm", {locationName : location, type : "b&fT1"});
        }
        else if (option == "fT2") {
          res.render("orderForm", {locationName : location, type : "b&pT2"});
        }
        else if (option == "pT1") {
          res.render("orderForm", {locationName : location, type : "b&pT1"});
        }
        else if (option == "pT2") {
          res.render("orderForm", {locationName : location, type : "b&pT2"});
        }
    }else {
        res.redirect("/business/login?redirect=booking")
      }}
    else if (type == "p") {
      if (option == "mp1") {
        res.render("orderForm", {locationName : location, type : "p&mp1"});
      }
      else if (option == "mp2") {
        res.render("orderForm", {locationName : location, type : "p&mp2"});
      }
      else if (option == "fI1") {
        res.render("orderForm", {locationName : location, type : "p&fI1"});
      }
      else if (option == "fI2") {
        res.render("orderForm", {locationName : location, type : "p&fI2"});
      }
    }
    else {
      res.render("error");
    }
  }
});

app.get("/orderPreview", function(req, res){
  res.render("orderPreview", {locationName : location});
});

app.post("/orderPreview", function(req, res){
  if (typeof location == 'undefined'){
     res.redirect("/estimate");
  }
  else {
    var query = require('url').parse(req.url,true).query;
    var type = query.type;
    var option = query.option;
    if (type == "b") {
      if (option == "fT1") {
        const orderDetails = {
          type:"b&fT",
          materialN: req.body.materialN,
          l: req.body.l,
          w: req.body.w,
          h: req.body.h,
          unit: req.body.unit,
          wgt: req.body.wgt,
          wgtUnit: req.body.wgtUnit,
          q: req.body.q,
          orderId : 'test-' + new Date().getTime(),
          fare:"",
          tax:"",
          amount:""
        };
        order = orderDetails;
        if (order.wgtUnit == "KG") {
          var convertedwgt = order.wgt/1000;
        }
        else {
          convertedwgt = order.wgt;
        }
        var fT_fare = parseInt(locationData.distance.replace(/\D/g, "")*3.1);
        order.fare = Math.round(fT_fare+(fT_fare*convertedwgt));
        if (order.fare<2501) {
          order.fare = 2500;
        }else {
        order.tax = Math.round(order.fare*0.18);
        order.amount = Math.round(order.tax + order.fare);
        res.render("orderForm", {locationName : location, type : "b&fT2"});
      }}
      else if (option == "fT2") {
        const shippingDetails = {
          pickupDate: req.body.pickupDate,
          P_name: req.body.P_name,
          P_addLn1: req.body.P_addLn1,
          P_addLn2: req.body.P_addLn2,
          P_addLn3: req.body.P_addLn3,
          P_addLn4: req.body.P_addLn4,
          P_addLn5: req.body.P_addLn5,
          P_addLn6: req.body.P_addLn6,
          email:req.user.username,
          P_mob: req.body.P_mob,
          D_name: req.body.D_name,
          D_addLn1: req.body.D_addLn1,
          D_addLn2: req.body.D_addLn2,
          D_addLn3: req.body.D_addLn3,
          D_addLn4: req.body.D_addLn4,
          D_addLn5: req.body.D_addLn5,
          D_addLn6: req.body.D_addLn6,
          D_mob: req.body.D_mob,

        };
        shipping = shippingDetails;
        res.render("orderPreview", {locationName : location, locationData:locationData, order : order, shipping : shipping, type : "b&fT", typeName: "Full Truck", vehicle : ""});
      }
      else if (option == "pT1") {
        const orderDetails = {
          type:"b&pT",
          materialN: req.body.materialN,
          l: req.body.l,
          w: req.body.w,
          h: req.body.h,
          unit: req.body.unit,
          wgt: req.body.wgt,
          wgtUnit:req.body.wgtUnit,
          q: req.body.q,
          orderId : 'test-' + new Date().getTime(),
          fare:"",
          tax:"",
          amount:""
        };
        order = orderDetails;
        if (order.wgtUnit == "KG") {
          var convertedwgt = order.wgt/1000;
        }
        else {
          convertedwgt = order.wgt;
        }
        var pT_fare = parseInt(locationData.distance.replace(/\D/g, "")*1.8);
        order.fare = Math.round(pT_fare+(pT_fare*convertedwgt));
        if (order.fare<1501) {
          order.fare = 1500;
        }else {
        order.tax = Math.round(order.fare*0.18);
        order.amount = Math.round(order.tax + order.fare);
        res.render("orderForm", {locationName : location, type : "b&pT2"});
      }}
      else if (option == "pT2") {
        const shippingDetails = {
          pickupDate: req.body.pickupDate,
          P_name: req.body.P_name,
          P_addLn1: req.body.P_addLn1,
          P_addLn2: req.body.P_addLn2,
          P_addLn3: req.body.P_addLn3,
          P_addLn4: req.body.P_addLn4,
          P_addLn5: req.body.P_addLn5,
          P_addLn6: req.body.P_addLn6,
          P_mob: req.body.P_mob,
          email:req.user.username,
          D_name: req.body.D_name,
          D_addLn1: req.body.D_addLn1,
          D_addLn2: req.body.D_addLn2,
          D_addLn3: req.body.D_addLn3,
          D_addLn4: req.body.D_addLn4,
          D_addLn5: req.body.D_addLn5,
          D_addLn6: req.body.D_addLn6,
          D_mob: req.body.D_mob

        };
        shipping = shippingDetails;
        res.render("orderPreview", {locationName : location, locationData:locationData, order : order, shipping : shipping, type : "b&pT", typeName: "Part Truck", vehicle : ""});
      }
    }
    else if (type == "p") {
      if (option == "mp1") {
        const orderDetails = {
          type:"p&mp",
          roomNo: req.body.roomNo,
          pickupFloor: req.body.pickupFloor,
          dropFloor: req.body.dropFloor,
          q: req.body.q,
          orderId : 'test-' + new Date().getTime(),
          fare:parseFloat("1000"),
          tax:"",
          amount:""
        };
        order = orderDetails;
        order.tax = Math.round(orderDetails.fare*0.18);
        order.amount = Math.round(order.tax + orderDetails.fare);
        res.render("orderForm", {locationName : location, type : "p&mp2"});
      }
      else if (option == "mp2") {
        const shippingDetails = {
          pickupDate: req.body.pickupDate,
          P_name: req.body.P_name,
          P_addLn1: req.body.P_addLn1,
          P_addLn2: req.body.P_addLn2,
          P_addLn3: req.body.P_addLn3,
          P_addLn4: req.body.P_addLn4,
          P_addLn5: req.body.P_addLn5,
          P_addLn6: req.body.P_addLn6,
          P_mob: req.body.P_mob,
          email:req.body.email,
          D_name: req.body.D_name,
          D_addLn1: req.body.D_addLn1,
          D_addLn2: req.body.D_addLn2,
          D_addLn3: req.body.D_addLn3,
          D_addLn4: req.body.D_addLn4,
          D_addLn5: req.body.D_addLn5,
          D_addLn6: req.body.D_addLn6,
          D_mob: ""

        };
        shipping = shippingDetails;
        res.render("orderPreview", {locationName : location, locationData:locationData, order : order, shipping : shipping, type : "p&mp", typeName: "Movers & Packers", vehicle : ""});
      }
      else if (option == "fI1") {
        const orderDetails = {
          type:"p&fI",
          materialN: req.body.materialN,
          l: req.body.l,
          w: req.body.w,
          h: req.body.h,
          unit: req.body.unit,
          wgt: req.body.wgt,
          wgtUnit: "KG",
          q: req.body.q,
          orderId : 'test-' + new Date().getTime(),
          fare:"",
          tax:"",
          amount:""
        };
        order = orderDetails;
        convertedwgt = order.wgt/1000;
        var fI_fare = Math.round(parseInt(locationData.distance.replace(/\D/g, "")))*1.6;
        order.fare = Math.round(fI_fare+(fI_fare*convertedwgt));
        if (order.fare<1001) {
          order.fare = 1000;
        }else {
        order.tax = Math.round(order.fare*0.18);
        order.amount = Math.round(order.tax + order.fare);
        res.render("orderForm", {locationName : location, type : "p&fI2"});
      }}
      else if (option == "fI2") {
        const shippingDetails = {
          pickupDate: req.body.pickupDate,
          P_name: req.body.P_name,
          P_addLn1: req.body.P_addLn1,
          P_addLn2: req.body.P_addLn2,
          P_addLn3: req.body.P_addLn3,
          P_addLn4: req.body.P_addLn4,
          P_addLn5: req.body.P_addLn5,
          P_addLn6: req.body.P_addLn6,
          P_mob: req.body.P_mob,
          email:req.body.email,
          D_name: req.body.D_name,
          D_addLn1: req.body.D_addLn1,
          D_addLn2: req.body.D_addLn2,
          D_addLn3: req.body.D_addLn3,
          D_addLn4: req.body.D_addLn4,
          D_addLn5: req.body.D_addLn5,
          D_addLn6: req.body.D_addLn6,
          D_mob: ""

        };
        shipping = shippingDetails;
        res.render("orderPreview", {locationName : location, locationData:locationData, order : order, shipping : shipping, type : "p&fI", typeName: "Small Truck / Few Items", vehicle : ""});
      }
    }
    else {
      res.render("error");
    }
  }

});

app.get("/orderDetails",function(req, res){
  var query = require('url').parse(req.url,true).query;
  var orderId = query.orderId;
  if (orderId) {
    Order.findOne({orderId : orderId}, function(err, foundOrder){
      res.render("order-Details", {order : foundOrder});
    });
  }else{
    res.redirect("/tracking")
  }

});

app.get("/trial", function(req, res){
  res.render("trial", {
    locationName : location
   });
});

app.get("/processOrder", function(req, res){
  const newOrder = new Order({
    type:order.type,
    materialN:order.materialN,
    l:order.l,
    w:order.w,
    h:order.h,
    q:order.q,
    unit:order.unit,
    wgt:order.wgt,
    wgtUnit:order.wgtUnit,
    roomNo:order.roomno,
    pickupFloor:order.pickupFloor,
    dropFloor:order.dropFloor,
    orderId:order.orderId,
    orderDate:new Date(),
    fare:order.fare,
    tax:order.tax,
    amount:order.amount,
    pickupDate: shipping.pickupDate,
    P_name: shipping.P_name,
    P_addLn1: shipping.P_addLn1,
    P_addLn2: shipping.P_addLn2,
    P_addLn3: shipping.P_addLn3,
    P_addLn4: shipping.P_addLn4,
    P_addLn5: shipping.P_addLn5,
    P_addLn6: shipping.P_addLn6,
    username: shipping.email,
    P_mob: shipping.P_mob,
    D_name: shipping.D_name,
    D_addLn1: shipping.D_addLn1,
    D_addLn2: shipping.D_addLn2,
    D_addLn3: shipping.D_addLn3,
    D_addLn4: shipping.D_addLn4,
    D_addLn5: shipping.D_addLn5,
    D_addLn6: shipping.D_addLn6,
    D_mob: shipping.D_mob,
    distance:locationData.distance,
    duration:locationData.duration,
    payment:0
});
newOrder.save();
// if (order.type == "b&fT" || "b&pT") {
//   User.findById(req.user.id, function(err, foundUser){
//     foundUser.orders.push(newOrder);
//     foundUser.save(function(){
//       res.redirect("/paynow")
//     });
//   });
// }else {
res.redirect("/paynow");
// }
});

// ------------------paytm--------------
app.get("/paynow", function(req, res){
  let body = '';
    const userData = {
      name:shipping.P_name,
      email:shipping.email,
      phone:shipping.P_mob,
      amount:order.amount};
    let data = userData;
    const orderId = order.orderId;

    const paytmParams = {};

    paytmParams.body = {
        "requestType": "Payment",
        "mid": PaytmConfig.PaytmConfig.mid,
        "websiteName": PaytmConfig.PaytmConfig.website,
        "orderId": orderId,
        "callbackUrl": "http://localhost:1234/callback",
        "txnAmount": {
            "value": data.amount,
            "currency": "INR",
        },
        "userInfo": {
            "custId": data.email,
        },
    };

    PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.PaytmConfig.key).then(function (checksum) {

        paytmParams.head = {
            "signature": checksum
        };

        var post_data = JSON.stringify(paytmParams);

        var options = {

            /* for Staging */
            hostname: 'securegw-stage.paytm.in',

            /* for Production */
            // hostname: 'securegw.paytm.in',

            port: 443,
            path: `/theia/api/v1/initiateTransaction?mid=${PaytmConfig.PaytmConfig.mid}&orderId=${orderId}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            }
        };

        var response = "";
        var post_req = https.request(options, function (post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });

            post_res.on('end', function () {
                response = JSON.parse(response)

                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.write(`<html>
                    <head>
                        <title>Show Payment Page</title>
                    </head>
                    <body>
                        <center>
                            <h1>Please do not refresh this page...</h1>
                        </center>
                        <form method="post" action="https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${PaytmConfig.PaytmConfig.mid}&orderId=${orderId}" name="paytm">
                            <table border="1">
                                <tbody>
                                    <input type="hidden" name="mid" value="${PaytmConfig.PaytmConfig.mid}">
                                        <input type="hidden" name="orderId" value="${orderId}">
                                        <input type="hidden" name="txnToken" value="${response.body.txnToken}">
                             </tbody>
                          </table>
                                        <script type="text/javascript"> document.paytm.submit(); </script>
                       </form>
                    </body>
                 </html>`)
                res.end();
            });
        });

        post_req.write(post_data);
        post_req.end();
    });

});

app.post("/callback", function(req, res){
  Order.updateOne({orderId:order.orderId}, {payment:1}, function(err){
    if (err) {
      console.log(err);
    }else {
      console.log("Successfullychanged payment");
    }
  });

  res.send(`<html>
      <head>
          <title>Show Payment Page</title>
      </head>
      <body>
          <center>
              <h1 style="color:#4BB543;font-size:3rem">Payment has been Successful!</h1><br>
              <h2>Redirecting to your order details on TruckShruk</h2>
          </center>
      </body>
      <script>
        setTimeout(function () {
     window.location = "/orderMail";
   }, 1800)
      </script>
   </html>`);

});

// ----------------end paytm------

//-------- OTP email process----------
app.get('/send',function(req,res){
  otp=Math.floor((Math.random() * 37910) + 24);
	host=req.get('host');
	link="http://"+req.get('host')+"/verify?id="+otp;
  to=newUser.email;
	mailOptions={
		to :to,
		subject : "TruckShruk : Please confirm your Email account",
    html : '<body style="background-color:#121330;text-align:center;color:#fff;"><h1>TruckShruk</h1><br><br>Hello,<br> Your OTP is <h4><u>'+otp  +'</u></h4>,  to verify your email'+to +'<br><br><br><br><br><br><br><br>Else Click on the link to verify your email.<br><a href='+link+'Click here to verify</a></body>'
	}
	smtpTransport.sendMail(mailOptions, function(error, response){
   	 if(error){
        	console.log(error);
		res.end("error");
	 }else{
     console.log("Message sent: " + response.message);
		 res.end("sent");
    	 }
});
});

app.post("/verify", function(req, res){
  code = req.body.otp;
  if (otp == code) {
    console.log("Verified Successfully");
    User.updateOne({username:newUser.email}, {v:1}, function(err){
      if (err) {
        console.log(err);
      }else {
        console.log("Successfullychanged v");
      }
    });
    res.redirect("/sendMail");
  }
});
app.get('/verify',function(req,res){
console.log(req.protocol+":/"+req.get('host'));
if((req.protocol+"://"+req.get('host'))==("http://"+host))
{
	console.log("Domain is matched. Information is from Authentic email");
	if(req.query.id==otp)
	{
		console.log("email is verified");

	}
	else
	{console.log("email is not verified");
}} else
{
	res.end("<h1>Request is from unknown source</h1>");
}
});
// ---------------end otp process----------------
// ------------email updates---
app.get('/sendmail',function(req,res){
  to=newUser.email;
	mailOptions={
		to :to,
		subject : "TruckShruk : Account created Successfully",
    html : '<body style="background-color:#121330;color:#fff;"><h1 style="text-align:center;">TruckShruk</h1><br><br>Hello,<br><h2>'+newUser.compName  +'</h2>,  your account with TruckShruk is successfully created<br><br>Please login to continue</body>'
	}
	smtpTransport.sendMail(mailOptions, function(error, response){
   	 if(error){
        	console.log(error);
		res.end("error");
	 }else{
     console.log("Message sent: " + response.message);
     res.redirect("/business/login?v=1");

    	 }
});
});

app.get('/orderMail',function(req,res){
  to=shipping.email;
	mailOptions={
		to :to,
		subject : "TruckShruk : Order confirmed!",
    html : '<body style="background-color:#121330;color:#fff;"><h1 style="text-align:center;">TruckShruk</h1><br><br>Hello,<br>your order - <b><u>'+order.orderId +'</u></b> is confirmed & payment of <b><u>'+order.amount +'</u></b> is recevied.<br><br> You will receive vehicle & shipment updates on the pickup date - '+shipping.pickupDate +'<br><br>Thank you for ordering from <b>TruckShruk</b> <br><br><br>Track your Order on TruckShruk now!<br><br></body>'
	}
	smtpTransport.sendMail(mailOptions, function(error, response){
   	 if(error){
        	console.log(error);
		res.end("error");
	 }else{
     console.log("Message sent: " + response.message);
     res.redirect("/orderDetails?orderId="+order.orderId);

    	 }
});
});
// -----end email updates-----

app.get("/:id", function(req, res){
  var id = req.params.id;
  res.render("error", {id : id});
});
app.get("/business/:id", function(req, res){
  var id = req.params.id;
  res.render("error", {id : id});
});

app.listen(1234, function(){
  console.log("Hello, This stuff is running fine on 1234 port");
});
