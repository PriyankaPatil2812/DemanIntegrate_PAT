var express = require("express");
var router = express.Router();
// var flash= require('connect-flash');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const validateLoginInput = require('../validation/login');
var pool = require('./database/database');
var log = require('../configuration/logger').LOG
let emailSend = require('./emailSend');
var dateTime = require("node-datetime");
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./status/leadStatus.file');
var strongPaswordGenerator = require("strong-password-generator");
//var speakeasy = require("speakeasy");
const Cryptr = require('cryptr');
var encryptSecretKey=properties.get('encryption.secretKey')
const cryptr = new Cryptr(encryptSecretKey);
var geoip = require("geoip-lite");
var countryTz = require("countries-and-timezones");
// var LocalStrategy= require('passport-local');
const authCheck=require('./check_auth')//Somnath Task:3852, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
/**
* @author Narendra Phadke
* @param  Description Fetch the for session
* @return Description return jwt token data
*/
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
   return res.json({
       id: req.user.userID,
       name: req.user.userName,
       email: req.user.role
   });
});


/**
* @author Narendra Phadke
* @param  Description Fetch the Agency Login
* @return Description return Agency login
*/
router.post("/userLogin",function (req, res, next) {
   log.info("inside userLogin");
//passport.authenticate('local' )
  var {userName}=req.body;
  //Sonali-3464-flag to identify login from web or mobile 
  var loginFrom=req.body.loginFrom;
  if(loginFrom=="undefined"||loginFrom==undefined||loginFrom==null||loginFrom=="null"||loginFrom==""){
    loginFrom='';
  }
  if(userName){
    userName=userName.trim();
    req.body.userName=userName;
  }
   const { errors, isValid } = validateLoginInput(req.body);
if(!isValid) {

   return res.status(400).json(errors);
}
  
   var username = req.body.userName;
   var password = req.body.password;

   //select ud.*,ad.agencyName from user_details ud left outer join agency_details ad on ud.orgID=ad.agencyID where ud.userName='" + username + "'"
//Narendra-Task 3114- remove join query because it take some extra time to excute so login take some time
   pool.query("select * from user_details where userName='" + username + "'",
       function (err, results, fields) {
           if (err) {
               log.error("Error inside userLogin==>"+err);
               errors.agency = 'Invalid UserName or Password. Please try again.'
               return res.status(404).json(errors);
           }
           else {
               log.info("Inside else userLogin");
             if (results.length > 0) {
                 var passwordSuccess=false;
                 var passSuccess=true;
              
                       for(var i=0;i<results.length;i++)
                       {
                         var decryptedPassword=results[i].password;
                         if(decryptedPassword.includes("@"))
                         {
                           decryptedPassword=decryptedPassword;
                         }else{
                           decryptedPassword=cryptr.decrypt(decryptedPassword);
                         }
                        
                       if(password==decryptedPassword)
                       {
                         passwordSuccess=true;
                         passSuccess=false;

                         var ip=req.body.systemIP;
                         var dt = dateTime.create();
                         var formatted = dt.format("Y-m-d H:M:S");
                        // var geo = geoip.lookup(ip);
                                                 
                        // const countryName = countryTz.getCountry(geo.country);

                         var userQuery = "insert into user_log SET ?",
                         userValues = {
                           userID:results[i].userID,
                           orgID:results[i].orgID,
                           loginInTime:formatted,
                         //  country:countryName.name,
                           ip:ip,
                          // timezone:geo.timezone,
                           loginFlag:loginFrom,//Sonali-3464-flag to identify login from web or mobile 
                           created:formatted,
                           lastUpdated:formatted
                         };

                         pool.query(userQuery,userValues,function(error,userLogResult,fields){
                           if(error){
                             log.error("Error inside addUser==>"+error);
                               return res.status(400).json(errors);
                           }else{
                      var userLogID=userLogResult.insertId;
                       const payload = {
                           id: results[i].orgID,
                           userID: results[i].userID,
                           name: results[i].userName,
                           role: results[i].role,
                           firstName:results[i].firstName,
                           lastName:results[i].lastName,
                          // agencyName:results[i].agencyName,- Narendra Task -3114- Comment this code because I remove join
                           userLogID:userLogID
                       }
                       //Somnath Task-3076, Increase expire In timeout up to 15 min.
                       jwt.sign(payload, 'secret', {
                           expiresIn: 900000
                       }, (err, token) => {
                           if(err) console.error('There is some error in token', err);
                           else {
                          
                               res.json({
                                   success: true,
                                   token: `Bearer ${token}`
                               });
                           }
                       }); 
                     }})
                     break;
                  
                     }else
                     {
                       passwordSuccess=false;
                         passSuccess=true;
                     }
                 
             }
                     if(passwordSuccess==false && passSuccess==true)
                     {
                       errors.agency = 'Invalid UserName or Password. Please try again.';
                       return res.status(404).json(errors);
                     }

                     //  res.send(JSON.stringify(results));
                   
               }
               else {
                   errors.agency = 'Invalid UserName or Password. Please try again.';
                   return res.status(404).json(errors);
               }

           }//else Block Close

           // errors.userName = 'Invalid UserName or Password. Please try again.';
           // return res.status(404).json(err);
           //res.send(JSON.stringify(results));
       }
     
   );
   //res.locals.connection.end();
});

/**
* @author Supriya Gore
* @param  Description Fetch the user log add to database
* @return Description return user log
*/
router.post("/userLogout",function (req, res, next) {
 log.info("inside userLogout")
 var dt = dateTime.create();
 var formatted = dt.format("Y-m-d H:M:S");

 var user=req.body.user;
 var userQuery = "update user_log SET ? where userLogID='"+user.userLogID+"'",
 userValues = {
   logOutTime:formatted,
   lastUpdated:formatted
 };
 pool.query(userQuery,userValues,function(error,userLogResult,fields){
   if(error){
     log.error("Error inside userLogout==>"+error);
       return res.status(400).json(errors);
   }else{
   //console.log("In user_log updated logOutTime");
   }})
});
/**
* @author Supriya Gore
* @param  Description Fetch the Forgot Password Email
* @return Description return Forgot Password Email
*/
router.post("/forgotPasswordEmail",function (req, res, next) {
log.info("Inside forgotPasswordEmail");
var email=req.body.email;
var role=req.body.role;
var lastUpdated=req.body.lastUpdated;

var sql;
if(role==undefined||role==null||role=='')
{
 sql="select * from user_details where userName='"+email+"'";
}else{
 sql="select * from user_details where userName='"+email+"' and role='"+role+"'";
}
pool.query(sql, 
function(error,results, fields) {
   if (error) {
     log.error("Error inside forgotPasswordEmail==>"+error);
     return res.status(400).json(errors);
   }else{  

     var dt = dateTime.create();
     var formatted = dt.format("Y-m-d H:M:S");
     
     var OTP= Math.floor(100000 + Math.random() * 900000);
       if(results.length>1)
       {
           var updateSql;
           if(role==undefined||role==null||role=='')
             {

               updateSql="update user_details set forgotOTP='"+OTP+"',lastUpdated='"+lastUpdated+"' where userName='"+email+"'";
             }else{
               updateSql="update user_details set forgotOTP='"+OTP+"',lastUpdated='"+lastUpdated+"' where userName='"+email+"' and role='"+role+"'";
             }
           pool.query(updateSql, 
           function(error,updateResults, fields) {
               if (error) {
                 log.error("Error inside forgotPasswordEmail OTP==>"+error);
                 return res.status(400).json(errors);
               }else{  
                   res.send(JSON.stringify(results));
             }})
           
           
       }else if(results.length==0){
         res.send(JSON.stringify(results));
       }else{
        
           emailSend.forgotPasswordOTP(results,OTP);

           var updateSql;
           if(role==undefined||role==null||role=='')
             {
               updateSql="update user_details set forgotOTP='"+OTP+"',lastUpdated='"+lastUpdated+"' where userName='"+email+"'";
             }else{
               updateSql="update user_details set forgotOTP='"+OTP+"',lastUpdated='"+lastUpdated+"' where userName='"+email+"' and role='"+role+"'";
             }
           pool.query(updateSql, 
           function(error,updateResults, fields) {
               if (error) {
                 log.error("Error inside forgotPasswordEmail OTP==>"+error);
                 return res.status(400).json(errors);
               }else{  
                   res.send(JSON.stringify(results));
             }})

           // res.send(JSON.stringify(results));
       }
       
   ////
 }
 });// //////
})


/**
* @author Supriya Gore
* @param  Description Fetch the Forgot Password Resend Email
* @return Description return Forgot Password Resend Email
*/
router.post("/resendForgotPasswordOTP",function (req, res, next) {
 log.info("Inside resendForgotPasswordOTP");
 var userID=req.body.userID;
 var lastUpdated=req.body.lastUpdated;
 var sql;

   sql="select * from user_details where userID='"+userID+"'";

 pool.query(sql, 
 function(error,results, fields) {
     if (error) {
       log.error("Error inside resendForgotPasswordOTP==>"+error);
       return res.status(400).json(errors);
     }else{  
 
       var dt = dateTime.create();
       var formatted = dt.format("Y-m-d H:M:S");
       var OTP= Math.floor(100000 + Math.random() * 900000);

       emailSend.forgotPasswordOTP(results,OTP);
         if(results.length>0)
         {
             var updateSql;
                 updateSql="update user_details set forgotOTP='"+OTP+"',lastUpdated='"+lastUpdated+"' where userID='"+userID+"'";

             pool.query(updateSql, 
             function(error,updateResults, fields) {
                 if (error) {
                   log.error("Error inside resendForgotPasswordOTP OTP==>"+error);
                   return res.status(400).json(errors);
                 }else{  
                     res.send(JSON.stringify(results));
               }})
             
             
         }
 
         
     ////
   }
   });// //////
 })
/**
* @author Supriya Gore
* @param  Description Fetch the Forgot Password OTP Access
* @return Description return Forgot Password OTP Access
*/
router.post("/getForgotPasswordOTP",function (req, res, next) {
   log.info("Inside getForgotPasswordOTP");

   var userID=req.body.userID;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");

   var sql;
 
     sql="select * from user_details where userID='"+userID+"'";

   pool.query(sql, 
   function(error,OTPResults, fields) {
       if (error) {
         log.error("Error inside getForgotPasswordOTP OTP==>"+error);
         return res.status(400).json(errors);
       }else{  
           res.send(JSON.stringify(OTPResults));
     }})
   })
   
/**
* @author Supriya Gore
* @param  Description Fetch the Forgot Password OTP Update After time limit cross
* @return Description return Forgot Password OTP Update After time limit cross
*/
router.post("/forgotPasswordOTP",function (req, res, next) {
   log.info("Inside forgotPasswordOTP");

   var userID=req.body.userID;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   pool.query("update user_details set forgotOTP='',lastUpdated='"+formatted+"' where userID='"+userID+"'", 
   function(error,updateResults, fields) {
       if (error) {
         log.error("Error inside forgotPasswordOTP OTP==>"+error);
         return res.status(400).json(errors);
       }else{  
           res.send({"success":true});
     }})
   })

   /**
* @author Supriya Gore
* @param  Description Fetch the set Forgot Password
*  * @return Description return success Forgot Password 
*/
router.post("/setForgotPassword",function (req, res, next) {
   log.info("Inside setForgotPassword");

   var userID=req.body.userID;
   var password=req.body.password;
    let encryptedPassword= cryptr.encrypt(password);


   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
  
   var sql;
 
     sql="update user_details set password='"+encryptedPassword+"',forgotOTP='',lastUpdated='"+formatted+"' where userID='"+userID+"'";
 
   pool.query(sql, 
   function(error,forgotPassResult, fields) {
       if (error) {
         log.error("Error inside setForgotPassword OTP==>"+error);
         return res.status(400).json(errors);
       }else{  
           res.send({"success":true});
     }})
   })


    /**
* @author Supriya Gore
* @param  Description Fetch the set New Password of user
* @return Description return success new Password 
**/
//Somnath Task-3852, Add authCheck Middleware
router.post("/setNewPassword",authCheck,function (req, res, next) {
   log.info("Inside setNewPassword");
   var user=req.token;//Somnath Task-3852, Get token from request
   var password=req.body.password;
   let encryptedPassword= cryptr.encrypt(password);

   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   pool.query("update user_details set password='"+encryptedPassword+"',lastUpdated='"+formatted+"' where orgID='"+user.id+"' and role='"+user.role+"' and userName='"+user.name+"'",
   function(error,newPassResult, fields) {
       if (error) {
         log.error("Error inside setNewPassword OTP==>"+error);
         return res.status(400).json(errors);
       }else{  
           res.send({"success":true});
     }})
   })

   
   /**
* @author Supriya Gore
* @param  Description Fetch the user info
* @return Description return user info
*/
//Somnath Task-3852, Add authCheck Middleware
router.post("/getUserInfo",authCheck,function (req, res, next) {
   log.info("Inside getUserInfo");
   var user=req.token;//Somnath Task-3852, Get token from request
   pool.query("select * from user_details where orgID='"+user.id+"' and role='"+user.role+"' and userName='"+user.name+"'", 
   function(error,userResults, fields) {
       if (error) {
         log.error("Error inside getUserInfo==>"+error);
         return res.status(400).json(errors);
       }else{  

         var decryptedPassword=userResults[0].password;
                         if(decryptedPassword.includes("@"))
                         {
                           decryptedPassword=decryptedPassword;
                         }else{
                           decryptedPassword=cryptr.decrypt(decryptedPassword);
                         }
       
         userResults[0].password=decryptedPassword;
           res.send(JSON.stringify(userResults));
     }})
   })


   /**
* @author Supriya Gore
* @param  Description store add user
* @return Description return Successfully the user info
*/
router.post('/addUser',authCheck,function (req, res, next) {

   log.info("inside addUser");
     var dt = dateTime.create();
     var formatted = dt.format("Y-m-d H:M:S");
     var emailConfigYes=properties.get('emailConfig.yes');
     var emailConfigNo=properties.get('emailConfig.no');

     var user=req.token;//Somnath Task-3852, Get token from request
    
     var defaultPassword = {
       base: 'RANDOM',
       length: {
         min: 6 ,
         max:16

       },
       capsLetters: {
         min: 1 ,
         max: 1
       },
       numerals: {
         min: 1,
         max:1 
       },
       spacialCharactors: {
         includes: ["!^&*@#$%*"],
         min: 1,
         max:1
       },
       spaces: {
         allow: false,
         min: 0,
         max: 0
       }
     };
     var password=strongPaswordGenerator.generatePassword(defaultPassword); 
     let encryptedPassword= cryptr.encrypt(password);
     var userQuery = "insert into user_details SET ?",
     userValues = {
       orgID:user.id,
       userName:req.body.userName,
       password:encryptedPassword,
       firstName:req.body.firstName,
       lastName:req.body.lastName,
       role:req.body.role,
       created:formatted,
       lastUpdated:formatted
     };
     pool.query(userQuery,userValues,function(error,userResults,fields){
       if(error){
         log.error("Error inside addUser==>"+error);
           return res.status(400).json(errors);
       }else{
       
            var query = "insert into email_configuration SET ?";

            if(req.body.role=="AC"){
            values = {
             userID:userResults.insertId,
             orgID:user.id,
             createCampaign:emailConfigYes,
             editCampaign:emailConfigYes,
             acceptCampaign:emailConfigYes,
             pauseCampaign:emailConfigYes,
             resumeCampaign:emailConfigYes,
             completeCampaign:emailConfigYes,
             rejectCampaign:emailConfigYes,
             counterCampaign:emailConfigYes,
             counterAcceptCampaign:emailConfigYes,
             counterRejectCampaign:emailConfigYes,
             leadUpload:emailConfigYes,
             leadReview:emailConfigYes,
             cancelPublisher:emailConfigYes,
             endDatePublisher:emailConfigYes,
             leadsDecrement:emailConfigYes,
             dailyUpdate:emailConfigNo,
             reAllocationCampaign:emailConfigYes,
             firstDeliveryDateWarn:emailConfigNo,
             firstDeliveryDateCross:emailConfigNo,
             linkAgencyPublisher:emailConfigYes,
             acceptCampaignWarn:emailConfigYes,
             voiceLinkUpload:emailConfigNo,
             creativesUploadWarn:emailConfigNo,
             cancelPublisherCross:emailConfigNo,
             updateLeadsPermission:emailConfigYes,
             message:emailConfigYes,
             landingPageSubmit:emailConfigYes,
             creativeReview:emailConfigYes,
             campaignAllocation:emailConfigYes,
             pocSubmit:emailConfigYes,
             csSubmit:emailConfigYes,
             pocReview:emailConfigYes,
             activeCampaign:emailConfigNo,
             reportPublisher:emailConfigYes,
             biddingAllocation:emailConfigYes,
             biddingSubmission:emailConfigYes,
             addUser:emailConfigNo,
             biddingReview:emailConfigYes,
             invoiceReviewed:emailConfigYes,
             clientSetup:emailConfigYes,
             salesforceNotification:emailConfigYes,
             tdrReport:emailConfigNo,
             pacingAlert:emailConfigNo,
             rfpAcknowledgement:emailConfigNo,
             invoiceReviewAlert:emailConfigYes,
             marketoClientSetup:emailConfigYes,
             marketoNotification:emailConfigNo,
             hubspotClientSetup:emailConfigYes,
             hubspotNotification:emailConfigYes,
             created:formatted,
             lastUpdated:formatted
       
           };
         }
         else if(req.body.role=="ANC"){

           values = {
             userID:userResults.insertId,
             orgID:user.id,
             createCampaign:emailConfigYes,
             editCampaign:emailConfigNo,
             acceptCampaign:emailConfigNo,
             pauseCampaign:emailConfigYes,
             resumeCampaign:emailConfigYes,
             completeCampaign:emailConfigYes,
             rejectCampaign:emailConfigNo,
             counterCampaign:emailConfigNo,
             counterAcceptCampaign:emailConfigNo,
             counterRejectCampaign:emailConfigNo,
             leadUpload:emailConfigYes,
             leadReview:emailConfigNo,
             cancelPublisher:emailConfigNo,
             endDatePublisher:emailConfigYes,
             leadsDecrement:emailConfigYes,
             dailyUpdate:emailConfigNo,
             reAllocationCampaign:emailConfigNo,
             firstDeliveryDateWarn:emailConfigNo,
             firstDeliveryDateCross:emailConfigNo,
             linkAgencyPublisher:emailConfigYes,
             acceptCampaignWarn:emailConfigNo,
             voiceLinkUpload:emailConfigYes,
             creativesUploadWarn:emailConfigNo,
             cancelPublisherCross:emailConfigNo,
             updateLeadsPermission:emailConfigNo,
             message:emailConfigYes,
             landingPageSubmit:emailConfigYes,
             creativeReview:emailConfigYes,
             campaignAllocation:emailConfigNo,
             pocSubmit:emailConfigYes,
             csSubmit:emailConfigYes,
             pocReview:emailConfigYes,
             activeCampaign:emailConfigYes,
             reportPublisher:emailConfigYes,
             biddingAllocation:emailConfigNo,
             biddingSubmission:emailConfigNo,
             addUser:emailConfigNo,
             biddingReview:emailConfigNo,
             invoiceReviewed:emailConfigNo,
             clientSetup:emailConfigYes,
             salesforceNotification:emailConfigYes,
             tdrReport:emailConfigNo,
             pacingAlert:emailConfigNo,
             rfpAcknowledgement:emailConfigNo,
             invoiceReviewAlert:emailConfigNo,
             marketoClientSetup:emailConfigYes,
             marketoNotification:emailConfigNo,
             hubspotClientSetup:emailConfigYes,
             hubspotNotification:emailConfigYes,
             created:formatted,
             lastUpdated:formatted
       
           };

         }
         else if(req.body.role=="PC"){

           values = {
             userID:userResults.insertId,
             orgID:user.id,
             createCampaign:emailConfigYes,
             editCampaign:emailConfigYes,
             acceptCampaign:emailConfigYes,
             pauseCampaign:emailConfigYes,
             resumeCampaign:emailConfigYes,
             completeCampaign:emailConfigYes,
             rejectCampaign:emailConfigYes,
             counterCampaign:emailConfigYes,
             counterAcceptCampaign:emailConfigYes,
             counterRejectCampaign:emailConfigYes,
             leadUpload:emailConfigYes,
             leadReview:emailConfigYes,
             cancelPublisher:emailConfigYes,
             endDatePublisher:emailConfigYes,
             leadsDecrement:emailConfigYes,
             dailyUpdate:emailConfigYes,
             reAllocationCampaign:emailConfigNo,
             firstDeliveryDateWarn:emailConfigYes,
             firstDeliveryDateCross:emailConfigYes,
             linkAgencyPublisher:emailConfigYes,
             acceptCampaignWarn:emailConfigYes,
             voiceLinkUpload:emailConfigNo,
             creativesUploadWarn:emailConfigYes,
             cancelPublisherCross:emailConfigNo,
             updateLeadsPermission:emailConfigYes,
             message:emailConfigYes,
             landingPageSubmit:emailConfigYes,
             creativeReview:emailConfigYes,
             campaignAllocation:emailConfigYes,
             pocSubmit:emailConfigYes,
             csSubmit:emailConfigYes,
             pocReview:emailConfigYes,
             activeCampaign:emailConfigYes,
             reportPublisher:emailConfigYes,
             biddingAllocation:emailConfigYes,
             biddingSubmission:emailConfigYes,
             addUser:emailConfigNo,
             biddingReview:emailConfigYes,
             invoiceReviewed:emailConfigYes,
             clientSetup:emailConfigNo,
             salesforceNotification:emailConfigNo,
             tdrReport:emailConfigYes,
             pacingAlert:emailConfigYes,
             rfpAcknowledgement:emailConfigYes,
             invoiceReviewAlert:emailConfigYes,
             hubspotClientSetup:emailConfigNo,
             hubspotNotification:emailConfigNo,
             created:formatted,
             lastUpdated:formatted
       
           };

         }
         else if(req.body.role=="PNC"){

           values = {
             userID:userResults.insertId,
             orgID:user.id,
             createCampaign:emailConfigNo,
             editCampaign:emailConfigYes,
             acceptCampaign:emailConfigNo,
             pauseCampaign:emailConfigYes,
             resumeCampaign:emailConfigYes,
             completeCampaign:emailConfigYes,
             rejectCampaign:emailConfigNo,
             counterCampaign:emailConfigNo,
             counterAcceptCampaign:emailConfigNo,
             counterRejectCampaign:emailConfigNo,
             leadUpload:emailConfigNo,
             leadReview:emailConfigNo,
             cancelPublisher:emailConfigNo,
             endDatePublisher:emailConfigNo,
             leadsDecrement:emailConfigNo,
             dailyUpdate:emailConfigNo,
             reAllocationCampaign:emailConfigNo,
             firstDeliveryDateWarn:emailConfigYes,
             firstDeliveryDateCross:emailConfigYes,
             linkAgencyPublisher:emailConfigYes,
             acceptCampaignWarn:emailConfigNo,
             voiceLinkUpload:emailConfigNo,
             creativesUploadWarn:emailConfigYes,
             cancelPublisherCross:emailConfigNo,
             updateLeadsPermission:emailConfigNo,
             message:emailConfigYes,
             landingPageSubmit:emailConfigNo,
             creativeReview:emailConfigYes,
             campaignAllocation:emailConfigNo,
             pocSubmit:emailConfigNo,
             csSubmit:emailConfigNo,
             pocReview:emailConfigNo,
             activeCampaign:emailConfigNo,
             reportPublisher:emailConfigYes,
             biddingAllocation:emailConfigNo,
             biddingSubmission:emailConfigNo,
             addUser:emailConfigNo,
             biddingReview:emailConfigNo,
             invoiceReviewed:emailConfigNo,
             clientSetup:emailConfigNo,
             salesforceNotification:emailConfigNo,
             tdrReport:emailConfigNo,
             pacingAlert:emailConfigNo,
             rfpAcknowledgement:emailConfigNo,
             invoiceReviewAlert:emailConfigNo,
             hubspotClientSetup:emailConfigNo,
             hubspotNotification:emailConfigNo,
             created:formatted,
             lastUpdated:formatted
       
           };

         }
         else if(req.body.role=="AQA"){
           values = {
             userID:userResults.insertId,
             orgID:user.id,
             createCampaign:emailConfigNo,
             editCampaign:emailConfigNo,
             acceptCampaign:emailConfigNo,
             pauseCampaign:emailConfigNo,
             resumeCampaign:emailConfigNo,
             completeCampaign:emailConfigNo,
             rejectCampaign:emailConfigNo,
             counterCampaign:emailConfigNo,
             counterAcceptCampaign:emailConfigNo,
             counterRejectCampaign:emailConfigNo,
             leadUpload:emailConfigNo,
             leadReview:emailConfigYes,
             cancelPublisher:emailConfigNo,
             endDatePublisher:emailConfigNo,
             leadsDecrement:emailConfigNo,
             dailyUpdate:emailConfigNo,
             reAllocationCampaign:emailConfigNo,
             firstDeliveryDateWarn:emailConfigNo,
             firstDeliveryDateCross:emailConfigNo,
             linkAgencyPublisher:emailConfigNo,
             acceptCampaignWarn:emailConfigNo,
             voiceLinkUpload:emailConfigNo,
             creativesUploadWarn:emailConfigNo,
             cancelPublisherCross:emailConfigNo,
             updateLeadsPermission:emailConfigNo,
             message:emailConfigNo,
             landingPageSubmit:emailConfigNo,
             creativeReview:emailConfigYes,
             campaignAllocation:emailConfigNo,
             pocSubmit:emailConfigNo,
             csSubmit:emailConfigNo,
             pocReview:emailConfigNo,
             activeCampaign:emailConfigNo,
             reportPublisher:emailConfigNo,
             biddingAllocation:emailConfigNo,
             biddingSubmission:emailConfigNo,
             addUser:emailConfigNo,
             biddingReview:emailConfigNo,
             invoiceReviewed:emailConfigNo,
             clientSetup:emailConfigNo,
             salesforceNotification:emailConfigNo,
             tdrReport:emailConfigNo,
             pacingAlert:emailConfigNo,
             rfpAcknowledgement:emailConfigNo,
             invoiceReviewAlert:emailConfigNo,
             hubspotClientSetup:emailConfigNo,
             hubspotNotification:emailConfigNo,
             created:formatted,
             lastUpdated:formatted
       
           };
         }
         else if(req.body.role=="PQA"){
           //PQA role
           values = {
             userID:userResults.insertId,
             orgID:user.id,
             createCampaign:emailConfigNo,
             editCampaign:emailConfigNo,
             acceptCampaign:emailConfigNo,
             pauseCampaign:emailConfigNo,
             resumeCampaign:emailConfigNo,
             completeCampaign:emailConfigNo,
             rejectCampaign:emailConfigNo,
             counterCampaign:emailConfigNo,
             counterAcceptCampaign:emailConfigNo,
             counterRejectCampaign:emailConfigNo,
             leadUpload:emailConfigNo,
             leadReview:emailConfigYes,
             cancelPublisher:emailConfigNo,
             endDatePublisher:emailConfigNo,
             leadsDecrement:emailConfigNo,
             dailyUpdate:emailConfigNo,
             reAllocationCampaign:emailConfigNo,
             firstDeliveryDateWarn:emailConfigNo,
             firstDeliveryDateCross:emailConfigNo,
             linkAgencyPublisher:emailConfigNo,
             acceptCampaignWarn:emailConfigNo,
             voiceLinkUpload:emailConfigNo,
             creativesUploadWarn:emailConfigNo,
             cancelPublisherCross:emailConfigNo,
             updateLeadsPermission:emailConfigYes,
             message:emailConfigNo,
             landingPageSubmit:emailConfigNo,
             creativeReview:emailConfigYes,
             campaignAllocation:emailConfigNo,
             pocSubmit:emailConfigNo,
             csSubmit:emailConfigNo,
             pocReview:emailConfigNo,
             activeCampaign:emailConfigNo,
             reportPublisher:emailConfigNo,
             biddingAllocation:emailConfigNo,
             biddingSubmission:emailConfigNo,
             addUser:emailConfigNo,
             biddingReview:emailConfigNo,
             invoiceReviewed:emailConfigNo,
             clientSetup:emailConfigNo,
             salesforceNotification:emailConfigNo,
             tdrReport:emailConfigNo,
             pacingAlert:emailConfigNo,
             rfpAcknowledgement:emailConfigNo,
             invoiceReviewAlert:emailConfigNo,
             hubspotClientSetup:emailConfigNo,
             hubspotNotification:emailConfigNo,
             created:formatted,
             lastUpdated:formatted
       
           };
         }
         else{
           //role ADV
           values = {
             userID:userResults.insertId,
             orgID:user.id,
             createCampaign:emailConfigNo,
             editCampaign:emailConfigNo,
             acceptCampaign:emailConfigNo,
             pauseCampaign:emailConfigNo,
             resumeCampaign:emailConfigNo,
             completeCampaign:emailConfigNo,
             rejectCampaign:emailConfigNo,
             counterCampaign:emailConfigNo,
             counterAcceptCampaign:emailConfigNo,
             counterRejectCampaign:emailConfigNo,
             leadUpload:emailConfigNo,
             leadReview:emailConfigYes,
             cancelPublisher:emailConfigNo,
             endDatePublisher:emailConfigNo,
             leadsDecrement:emailConfigNo,
             dailyUpdate:emailConfigNo,
             reAllocationCampaign:emailConfigNo,
             firstDeliveryDateWarn:emailConfigNo,
             firstDeliveryDateCross:emailConfigNo,
             linkAgencyPublisher:emailConfigNo,
             linkAgencyAdvertiser:emailConfigYes,
             acceptCampaignWarn:emailConfigNo,
             voiceLinkUpload:emailConfigNo,
             creativesUploadWarn:emailConfigNo,
             cancelPublisherCross:emailConfigNo,
             updateLeadsPermission:emailConfigNo,
             message:emailConfigNo,
             landingPageSubmit:emailConfigNo,
             creativeReview:emailConfigNo,
             campaignAllocation:emailConfigNo,
             pocSubmit:emailConfigNo,
             csSubmit:emailConfigNo,
             pocReview:emailConfigNo,
             activeCampaign:emailConfigNo,
             reportPublisher:emailConfigNo,
             biddingAllocation:emailConfigNo,
             biddingSubmission:emailConfigNo,
             addUser:emailConfigNo,
             biddingReview:emailConfigNo,
             invoiceReviewed:emailConfigNo,
             clientSetup:emailConfigYes,
             salesforceNotification:emailConfigNo,
             tdrReport:emailConfigNo,
             pacingAlert:emailConfigNo,
             rfpAcknowledgement:emailConfigNo,
             invoiceReviewAlert:emailConfigNo,
             hubspotClientSetup:emailConfigYes,
             hubspotNotification:emailConfigYes,
             created:formatted,
             lastUpdated:formatted
       
           };
           }
         
 
     pool.query(query,values,function(error,results,fields){
         if(error){
           log.error("Error inside addUser==>"+error);
             return res.status(400).json(errors);
         }else{
           log.info("Inside else addUser");

           var sql="select ud.userName from user_details ud join email_configuration ec on ud.userID=ec.userID where ud.orgID IN('"+user.id+"') and ud.userName='"+req.body.userName+"' and ud.role='"+user.role+"'  and ec.addUser='"+emailConfigYes+"'";

      pool.query(sql,function(error,result,fields){
        if(error){
          log.error("Error is:"+error);
        }
        else{
           emailSend.userAddedEmail(result,user,req.body.firstName,req.body.lastName,req.body.role,req.body.userName,password);
           res.json({ success: true});
        }})
             
         }
         
     });
   }});
  });


      /**
* @author Supriya Gore
* @param  Description add user details
* @return Description return add user details
*/
//Somnath Task-3852, Add authCheck Middleware
router.post("/addUserDetails",authCheck,function (req, res, next) {
 log.info("Inside addUserDetails");
 var user=req.token;//Somnath Task-3852, Get token from request
 var userName=user.userName;
 var role=user.role;
 pool.query("select * from user_details where orgID='"+user.id+"' and role='"+role+"' and userName='"+userName+"'", 
 function(error,userResults, fields) {
     if (error) {
       log.error("Error inside addUserDetails==>"+error);
       return res.status(400).json(errors);
     }else{  
         res.send(JSON.stringify(userResults));
   }})
 })

/**
* @author Narendra Phadke
* @param  Description add user log action
* @return Description return add user log details
*/
router.post("/userLogDetails",function (req, res, next) {
 log.info("Inside userLogDetails");
 var user=req.body.user;
 var userName=req.body.userName;
 var role=req.body.role;
 var query = "insert into user_log SET ?",
 values = {
  userID:userResults.insertId,
  orgID:user.id,
  loginInTime:emailConfigYes,
  logOutTime:emailConfigYes,
  country:emailConfigYes,
  ip:emailConfigYes,
  timezone:emailConfigYes,
  created:formatted,
  lastUpdated:formatted
};

 pool.query(query,values , function(error,userLogResults, fields) {
     if (error) {
       log.error("Error inside userLogDetails==>"+error);
       return res.status(400).json(errors);
     }else{  
         res.send(JSON.stringify(userLogResults));
   }})
 })

 router.post('/requestDemo',function (req, res, next) {
  console.log("Control In Backend API");
  var dt = dateTime.create();
  var formatted = dt.format("Y-m-d H:M:S");
  var firstName=req.body.firstName;
  var lastName=req.body.lastName;
  var email=req.body.email;
  var userQuery = "insert into request_demo SET ?",
  userValues = {
    firstName:firstName,
    lastName:lastName,
    email:email,
    created:formatted,
    lastUpdated:formatted
  };
  pool.query(userQuery,userValues,function(error,userResults,fields){
    if(error){
        console.log("Error"+error);
        return res.status(400).json(errors);
    }else{
      /* Additional Lines */
      //res.send("Successfully made the connection and request is processing...");
      console.log("Successfully made the connection and request is processing...");
      //console.log("Data Inserted Successfully");
      /* Actual Line */
      res.json({ success: true});
       
   } 
  }); 

});

/**
* @author Sonali
* @param  Description 3445-get user list based on orgID
* @return Description return user list
*/
//Somnath Task-3852, Add authCheck Middleware
router.post("/getUserList",authCheck,function(req,res,next){
  log.info("inside users/getUserForAgency");
  var orgID=req.token.id;//Somnath Task-3852, Get token from request
  var sql="select userID,orgID,userName,firstName,lastName,role from user_details where orgID='"+orgID+"'";

  pool.query(sql,function(error,result,fields){
    if(error){
      log.error("Error inside users/getUserForAgency==>"+error)
    }
    else{
      res.send(JSON.stringify(result))
    }
  })
})

 
module.exports = router;
