/* Copyright(c) 2019 APSS Media Pvt. Ltd.
*  All Rights Reserved
*/
/*@author Sonali Kalke
 * Desc:Register publisher
 @version 1.0
 */
var express = require("express");
var router = express.Router();
var dateTime = require("node-datetime");
let emailSend = require('./emailSend');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./status/leadStatus.file');
url = require("url");
const request = require("request");
var log = require('../configuration/logger').LOG

var errors;
var pool = require('./database/database');
const authCheck=require('./check_auth')//Priyanka--3944--added authentication middleware

module.exports = router;
/*@author Sonali Kalke
 * Desc:Register publisher with companyInformation and contactInformation
 
 */
router.post('/publisherCompanyInformation', function(req, res, next) {
  log.info("inside publisherCompanyInformation");
    var companyName=req.body.companyName;
    var timezone=req.body.timezone;
    var state=req.body.state;
    if(state=="undefined" || !state){state=""}
    var zipcode=req.body.zipCode
    if(zipcode=="undefined" || !zipcode){zipcode=""}

    var email=req.body.contact1Email;/**** for email sending */
    var contactInfo;
    contactInfo=JSON.parse(req.body.contactInfo);
    var statusStep2="Step2";

    var dt = dateTime.create();
    var formatted = dt.format("Y-m-d H:M:S");
    var pubEmail=req.body.email;
    if(pubEmail===undefined){pubEmail=''}
    var status =properties.get('publisher.newPublisher');

    var file=[];
   

    var isUpload=req.body.isUpload;//Sonali-3264-isUpload added for logo upload
    if(isUpload==false || isUpload=="false"){
      var query = "insert into publisher SET ?",
    values = {
      publisherName:companyName,
      address:req.body.address,
      country:req.body.country,
      state:state,
      city:req.body.city,
      zipcode:zipcode,
      timezone:timezone,
      dcEmail:req.body.dcEmail,
      dcTelemarketing:req.body.dcTelemarketing,
      dcDisplay:req.body.dcDisplay,
      dcProgrammatic:req.body.dcProgrammatic,
      dcSocial:req.body.dcSocial,
      email:pubEmail,
      countryCode:req.body.prefix,
      phone:req.body.phone,
      created:formatted,
      lastUpdated:formatted,
      website:req.body.website,
      status:status

    };
    }
    else{

      file = req.files.file;
      let logo=file.data;
      let logoName=file.name || "";

      var query = "insert into publisher SET ?",
    values = {
      publisherName:companyName,
      address:req.body.address,
      country:req.body.country,
      state:state,
      city:req.body.city,
      zipcode:zipcode,
      timezone:timezone,
      dcEmail:req.body.dcEmail,
      dcTelemarketing:req.body.dcTelemarketing,
      dcDisplay:req.body.dcDisplay,
      dcProgrammatic:req.body.dcProgrammatic,
      dcSocial:req.body.dcSocial,
      email:pubEmail,
      countryCode:req.body.prefix,
      phone:req.body.phone,
      logoName,
      logo,
      created:formatted,
      lastUpdated:formatted,
      website:req.body.website,
      status:status

    };

    }
    // var query="insert into publisher(publisherName,address,country,state,city,zipcode,dcEmail,dcTelemarketing,dcDisplay,dcProgrammatic,dcSocial,email,countryCode,phone,logo,created,lastUpdated,website,status) values('"+companyName+"','"+req.body.address+"','"+req.body.country+"','"+req.body.state+"','"+req.body.city+"','"+req.body.zipCode+"','"+req.body.dcEmail+"','"+req.body.dcTelemarketing+"','"+req.body.dcDisplay+"','"+req.body.dcProgrammatic+"','"+req.body.dcSocial+"','"+pubEmail+"','"+req.body.prefix+"','"+req.body.phone+"','"+fileContents+"','"+formatted+"','"+formatted+"','"+req.body.website+"','"+status+"')";
    
  

    pool.query(query,values,function(error,results,fields){
        if(error){
          log.error("Error inside publisherCompanyInformation==>"+error);
            return res.status(400).json(errors);
        }else{
          log.info("Inside else publisherCompanyInformation");
        
            var pID=results.insertId;

            for(var i=0; i<contactInfo.length;i++){
              var sql="insert into contact_info(orgID,contactID,firstName,lastName,designation,email,countryPhoneCode,phoneNo,status,role,created,lastUpdated)values("+pID+",'"+contactInfo[i].contactID+"','"+contactInfo[i].contactPerson+"','"+contactInfo[i].lastName+"','"+contactInfo[i].designation+"','"+contactInfo[i].email+"','"+contactInfo[i].countryPhoneCode+"','"+contactInfo[i].phoneNo+"','"+statusStep2+"','PC','"+formatted+"','"+formatted+"')";
             pool.query(sql,function(error, results, fields) {
                if (error) {
                  //throw error;
                  log.error("Error In contactInfo=" + error);
                  return res.status(400).json(errors);
                }else{      
                     
                  }
               });}
              
            emailSend.publisherCreation(email,pID);
            var success="Publisher OnBoareded successfully (Publisher ID:"+pID+")";
            res.json({ success: true, message: success,'pID': pID});
        }
       
      //  console.log("Response===>"+JSON.stringify(res));
        
    });
 });

 /*@author Sonali Kalke
 * Desc:Get compliance name to display on front end
 */
 router.post('/getcomplianceName',authCheck,function(req,res,next){   //Priyanka--3944--added authCheck
  log.info("inside getcomplianceName");
  //  var orgID=req.body.orgID;
   // var role=req.body.role;
    var user = req.token;
    var ordID = user.id;
    var role = user.role;
    var query="select complianceName from compliance where role='"+role+"'";
   pool.query(query,function(error,results,fields){
     if(error){
      log.error("Error inside getcomplianceName==>"+error);
       return res.status(400).json(errors);
     }
     else{
      log.info("Inside else getcomplianceName");
       res.send(JSON.stringify(results));
     }
     
   });
 
 });


 /*@author Sonali Kalke
 * Desc:fetching GDPR questions from table to display on screen
 */

router.post('/getGdprAnswers', function(req, res, next) {
  log.info("inside getGdprAnswers");
    var compilanceValue=req.body.compilanceValue;
    
    var query="select cq.qID,cq.answer,c.complianceID from compliance_questions cq join compliance c on cq.complianceID=c.complianceID where c.complianceName='"+compilanceValue+"'";
     pool.query(query,function(error,results,fields){
        if(error){
          log.error("Error inside getGdprAnswers==>"+error);
             return res.status(400).json(errors);
         }
         else{
          
          let answerArray=[];
          for(var i=0;i<results.length;i++){

            results[i].answer=unescape(results[i].answer);
            results[i].answer=(results[i].answer).split('\n').join('|').split(',').join('|').split('|').join('|'); 

            results[i].answer = results[i].answer.split("|");
            for(var j=0;j<results[i].answer.length;j++){
              answerArray.push({"qID":results[i].qID,"option":results[i].answer[j]})
            }
            
          }
           res.send(JSON.stringify(answerArray));
         }
     });
 });

 router.post('/getGdprQuestions',authCheck, function(req, res, next) {    //Priyanka--3944--added authCheck
  log.info("inside getGdprQuestions");
    var compilanceValue=req.body.compilanceValue;
    
    var query="select qID,questions,answer,suppDoc,compliance.complianceName,compliance.complianceID from compliance_questions,compliance where compliance.complianceID=compliance_questions.complianceID and compliance.complianceName='"+compilanceValue+"'";
     pool.query(query,function(error,results,fields){
        if(error){
          log.error("Error inside getGdprQuestions==>"+error);
             return res.status(400).json(errors);
         }
         else{
          log.info("Inside else getGdprQuestions");

          for(var i=0;i<results.length;i++){

            results[i].questions=unescape(results[i].questions); 
            results[i].answer=unescape(results[i].answer);
            results[i].answer=(results[i].answer).split('\n').join('|').split(',').join('|').split('|').join('|'); 

            results[i].answer = results[i].answer.split("|");
            //results[i].answer=JSON.stringify(Object.assign({}, results[i].answer));
            // for(var k=0;k<results[i].answer.length;k++){
            //  // answerOptions.push({"qID":results[i].qID,"option":results[i].answer[k]})
            //  answerOptions[k]=results[i].answer;
            //  // option=option+1;
            // }
            //  console.log("answerOptions===>"+JSON.stringify(answerOptions))

            //   combineResult.push({...results[i],...(answerOptions.find((itmInner) => itmInner.qID === results[i].qID))});
            //   console.log("Result ======>"+JSON.stringify(combineResult));

           // results[i].answer=JSON.stringify(Object.assign({}, results[i].answer))

            
          }
           //console.log("data is "+JSON.stringify(results));
           //console.log("compliance name : "+JSON.stringify(results[2].complianceName));
           //var answer="answer";
          //  for(var i=0;i<results.length;i++){
          //   console.log("In for loop");
          //  // results['answer']="";
          //   //results['document']="";
          //   results.answer="";
          //   results["answer"]="";
          // var pair={answer:"Yes"};
          // var docPair={document:""};
          //   for(var i=0;i<results.length;i++){
          //    //Object.assign(results,{answer:"Yes"});
           
             
          //    results={...results[i],...pair,...docPair}
          //   }
          //  }
          // Object.keys(results).map(
          //   function(object){
          //     results[object]["answer"]="";
          // });
          // var ansDetails=[{ans:'',document:''}];
          // results.forEach((itm,i)=>{
          //   results.push(Object.assign({},itm,ansDetails[i]));
          //   console.log(results);
          //  });
          
          //console.log("data is "+JSON.stringify(results));
           res.send(JSON.stringify(results));
         }
     });
 });

/*@author Sonali Kalke
 * Desc:fetching CASL questions from table to display on screen
 */

router.post('/getCaslQuestionsForEdit',authCheck, function(req, res, next) {   //Priyanka--3944--added authCheck
  log.info("inside getCaslQuestionsForEdit");
  var compilanceValue=req.body.compilanceValue;
var pID=req.token.id;    //Priyanka--3944--accessing id from token

  
//     var status =properties.get('publisher.newPublisher');
  //var query="select qID,suppDoc,questions,compliance.complianceName,compliance.complianceID from compliance_questions,compliance where compliance.complianceID=compliance_questions.complianceID and compliance.complianceName='"+compilanceValue+"' ";
  //console.log("query is"+query);

  var query="select distinct (cd.qID),cq.questions,c.complianceName,c.complianceID,cd.answer from compliance_questions cq join compliance_details cd on cq.qID=cd.qID join compliance c on c.complianceID=cd.complianceID where c.complianceName='"+compilanceValue+"' and cd.orgID='"+pID+"'";

   pool.query(query,function(error,results,fields){
      if(error){
        log.error("Error inside getCaslQuestionsForEdit==>"+error);
           return res.status(400).json(errors);
       }
       else{
        log.info("Inside else getCaslQuestionsForEdit");
         res.send(JSON.stringify(results));
       }
   });
});


router.post('/getCaslQuestions', function(req, res, next) {
  log.info("inside getCaslQuestions");
  var compilanceValue=req.body.compilanceValue;
//var pID=req.body.pID;
  var query="select qID,suppDoc,questions,compliance.complianceName,compliance.complianceID from compliance_questions,compliance where compliance.complianceID=compliance_questions.complianceID and compliance.complianceName='"+compilanceValue+"' ";
  //console.log("query is"+query);

  //var query="select distinct (cd.qID),cq.questions,c.complianceName,c.complianceID,cd.answer from compliance_questions cq join compliance_details cd on cq.qID=cd.qID join compliance c on c.complianceID=cd.complianceID where c.complianceName='CASL' and cdorgID='"+pID+"'";

   pool.query(query,function(error,results,fields){
      if(error){
        log.error("Error inside getCASLQuestions==>"+error);
           return res.status(400).json(errors);
       }
       else{
        log.info("Inside else getCASLQuestions");
         //console.log("compliance name : "+JSON.stringify(results[2].complianceName));
         
         res.send(JSON.stringify(results));
       }
   });
});

/**
* @author Somnath Keswad
* @param  Description store advertiser Contact Info
* @return Description return Successfully send the info
*/
router.post("/contactInfo", function(req, res, next) {
    log.info("inside contactInfo");
    var data=[];
    data=req.body;
   var status="Step2";
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   console.log("data in contact info is-->"+JSON.stringify(data))


  for(var i=0; i<data.length;i++){
    if(data[i].contactPerson==""||data[i].contactPerson=="undefined"||data[i].contactPerson=="null"||data[i].contactPerson==null||data[i].contactPerson==undefined||data[i].lastName==""||data[i].lastName=="undefined"||data[i].lastName=="null"||data[i].lastName==null||data[i].lastName==undefined||data[i].email==""||data[i].email=="undefined"||data[i].email=="null"||data[i].email==null||data[i].email==undefined){
      console.log("No contact person")
    }
    else{
    var sql="insert into contact_info(orgID,contactID,firstName,lastName,designation,email,countryPhoneCode,phoneNo,role,status,created,lastUpdated)values("+data[i].userID+","+data[i].contactID+",'"+data[i].contactPerson+"','"+data[i].lastName+"','"+data[i].designation+"','"+data[i].email+"','"+data[i].countryPhoneCode+"','"+data[i].phoneNo+"','ADV','"+status+"','"+formatted+"','"+formatted+"')";
   pool.query(sql,function(error, results, fields) {
      if (error) {
        //throw error;
      log.error("Error In contactInfo=" + error);
        return res.status(400).json(errors);
      }else{      
           
        }
     });
    }
    }
     var success="Contact information saved successfully";
     res.json({ success: true, message: success });
     
 });

 
/**
* @author Somnath Keswad
* @param  Description store publisher Bank Info
* @return Description return Successfully send the info
*/
router.post("/bankInformation", function(req, res, next) {
    log.info("inside bankInformation");
    var userID=req.body.userID;
    var bankName=req.body.bankName;
    var accountNumber=req.body.accountNumber;
    var accountHolderName=req.body.accountHolderName;
    var ifscCode=req.body.ifscCode;
    var panNumber=req.body.panNumber;
    var gstNumber=req.body.gstNumber;
    var status="Step4";
     
    var dt = dateTime.create();
    var formatted = dt.format("Y-m-d H:M:S");

    var sql="insert into bank_info(orgID,bankName,accountNumber,accountHolderName,ifscCode,panNumber,gstNumber,status,created,lastUpdated)values('"+userID+"','"+bankName+"','"+accountNumber+"','"+accountHolderName+"','"+ifscCode+"','"+panNumber+"','"+gstNumber+"','"+status+"','"+formatted+"','"+formatted+"')";
   pool.query(sql,function(error, results, fields) {
      if (error) {
        log.error("Error inside bankInformation==>"+error);
        return res.status(400).json(errors);
      }else{   
        log.info("Inside else bankInformation");   
        var success="Bank information saved successfully";
        res.json({ success: true, message: success });
        }
     });
   
 });

  
/**
* @author Somnath Keswad
* @param  Description validating email
* @return Description return respective message
*/
router.get("/validateEmail", function(req, res, next) {
  log.info("inside validateEmail");
  var email = url.parse(req.url, true).query.email;
  var sql="SELECT * FROM contact_info where contactID=1 and role='PC' and email='"+email+"'";
 pool.query(sql,function(error, results, fields) {
    if (error) {
      log.error("Error inside validateEmail==>"+error);
      return res.status(400).json(errors);
    }else{   
      log.info("Inside else validateEmail");   
          if(results.length>0){
           res.json({success: false});
          }
          else{
            res.json({success: true});
          }
        }
   });
 
});

/**
* @author Somnath Keswad
* @param  Description validating recaptcha
* @return Description return Success message
*/
router.post("/recaptcha",authCheck, function(req, res, next) {    //Priyanka--3944--Added authCheck
  log.info("inside recaptcha");
  var recaptcha=req.body.recaptcha;
  if(recaptcha=== undefined || recaptcha=== '' || recaptcha=== null) {
    return res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
  }
  // Put your secret key here.
  // var secretKey = "6LeMhqoUAAAAAL3fryAoQ7ot61CnYhK1rDX7B1l0";
  const secretKey="6Le_--AUAAAAAFJcQJcMKT0CHWVGsl9X1nEEk5K4";
  // console.log("Ip Address "+ipAddress)
  // req.connection.remoteAddress will provide IP address of connected user.
  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret="+secretKey+"&response=" +recaptcha+ "&remoteip=" + req.connection.remoteAddress;
   
  request.get(verificationUrl, (error, response, body) => {
    let json = JSON.parse(body);
    if(body.success !== undefined && !body.success) {
          return res.json({"responseCode" : 1,"responseDesc" : "Failed captcha verification",'success':'false'});
        }
        res.json(json);
  });
});


/**
* @author Sonali Kalke
* @param  Description storing answer of compliance questions radio buttons in database
* @return 
*/

router.post('/submitGdprAnswers1',function(req,res,next){
  log.info("inside submitGdprAnswers");
  var gdprResult=[],caslResult=[],resultantArray=[];
  gdprResult=req.body.gdprArray;
  caslResult=req.body.caslArray;
  var userID=req.body.orgID;
 
  resultantArray=gdprResult.concat(caslResult);
  var l=resultantArray.length;
  var dt = dateTime.create();
    var formatted = dt.format("Y-m-d H:M:S");
    
  for(var i=0; i<l; i++)
  {(function(j){
    var query="select * from compliance_details WHERE complianceID='"+resultantArray[j].complianceID+"' and qID='"+resultantArray[j].qID+"' and orgID='"+userID+"'";
    pool.query(query,function(err,result1,fields){
      if(result1.length>0){
        if(resultantArray[j].answer){

        var query1="update compliance_details SET answer='"+resultantArray[j].answer+"' where  qID='"+resultantArray[j].qID+"' and complianceID='"+resultantArray[j].complianceID+"' and orgID='"+userID+"'";
        pool.query(query1,function(err,result2,fields){
          if(err){
            log.error("Error is : "+err);

            return res.status(400).json(err);
          }//close if

        });
      }
      else{
        var query1="update compliance_details SET answer='No' where  qID='"+resultantArray[j].qID+"' and complianceID='"+resultantArray[j].complianceID+"' and orgID='"+userID+"'";
        pool.query(query1,function(err,result2,fields){
          if(err){
            log.error("Error is : "+err);

            return res.status(400).json(err);
          }//close if

        });

      }
      }//close if
      else{
        if(resultantArray[j].answer){
          var sql="insert into compliance_details(qID,complianceID,answer,orgID) values('"+resultantArray[j].qID+"','"+resultantArray[j].complianceID+"','"+resultantArray[j].answer+"','"+req.body.orgID+"')";
          pool.query(sql,function(err,results,fields){
            if(err){
              log.error("Error is : "+err);
  
              return res.status(400).json(err);
            }
          });
        }
        else{
          var sql2="insert into compliance_details(qID,complianceID,answer,orgID) values('"+resultantArray[j].qID+"','"+resultantArray[j].complianceID+"','No','"+req.body.orgID+"')";
          pool.query(sql2,function(err,results,fields){
            if(err){
              log.error("Error is : "+err);
  
             // return res.status(400).json(err);
            }
          });
        }
      }
    });//close result1
  })(i);
  }//close for
  var success="Compliance details submitted successfully.";
  res.json({ success: true, message: success });

});//close route

router.post('/submitGdprAnswers',function(req,res,next){
  log.info("inside submitGdprAnswers");
  var gdprResult=[]
  gdprResult=req.body.gdprquestionList;
  var complianceID=gdprResult[0].complianceID;
  
  var userID=req.body.orgID;
  var dt = dateTime.create();
    var formatted = dt.format("Y-m-d H:M:S");
var l=gdprResult.length;
    
  for(var i=0; i<l; i++)
  {(function(j){
    var query="select * from compliance_details WHERE complianceID='"+gdprResult[j].complianceID+"' and qID='"+gdprResult[j].qID+"' and orgID='"+userID+"'";
    pool.query(query,function(err,result1,fields){
      if(result1.length>0){
        if(gdprResult[j].answer){

        var query1="update compliance_details SET answer='"+gdprResult[j].option+"' where  qID='"+gdprResult[j].qID+"' and complianceID='"+gdprResult[j].complianceID+"' and orgID='"+userID+"'";
        pool.query(query1,function(err,result2,fields){
          if(err){
            log.error("Error is : "+err);

            return res.status(400).json(err);
          }//close if

        });
      }
      else{
        var query1="update compliance_details SET answer='No' where  qID='"+gdprResult[j].qID+"' and complianceID='"+gdprResult[j].complianceID+"' and orgID='"+userID+"'";
        pool.query(query1,function(err,result2,fields){
          if(err){
            log.error("Error is : "+err);

            return res.status(400).json(err);
          }//close if

        });

      }
      }//close if
      else{
        if(gdprResult[j].answer){
          var sql="insert into compliance_details(qID,complianceID,answer,orgID) values('"+gdprResult[j].qID+"','"+gdprResult[j].complianceID+"','"+gdprResult[j].option+"','"+req.body.orgID+"')";
          pool.query(sql,function(err,results,fields){
            if(err){
              log.error("Error is : "+err);
  
              return res.status(400).json(err);
            }
          });
        }
        else{
          var sql2="insert into compliance_details(qID,complianceID,answer,orgID) values('"+gdprResult[j].qID+"','"+gdprResult[j].complianceID+"','No','"+req.body.orgID+"')";
          pool.query(sql2,function(err,results,fields){
            if(err){
              log.error("Error is : "+err);
              }
          });
        }
      }
    });//close result1
  })(i);
  }//close for
  var success="Compliance details submitted successfully.";
  res.json({ success: true, message: success });

});

/*@author Sonali Kalke
*@fileName :
 *Desc:delete gdpr documents from table.
*/   
router.post('/gdprDocumentDeleteFile', function(req, res, next) {
  log.info("inside gdprDocumentDeleteFile");
  var orgID=req.body.orgID;
  var qID=req.body.qID;
	var complianceID=req.body.complianceID;

		
		var fileName=req.body.names;
  var sql="DELETE FROM compliance_details WHERE complianceID='"+complianceID+"' AND documentName='"+fileName+"' AND qID='"+qID+"' AND orgID='"+orgID+"' ORDER BY docID DESC LIMIT 1";
  
			pool.query(sql, function (error, results, fields) {
					if(error){
            log.error("Error inside gdprDocumentDeleteFile==>"+error);
            throw error;
          } 
          else{
            // console.log("query is===>"+sql);
          }
					});

});

/*@author Sonali Kalke
*@fileName :
 *Desc:store GDPR documents to database.
*/   

router.post('/supportingDocumentGdpr', function(req, res, next) {
  log.info("inside supportingDocumentGdpr");
  var orgID=req.body.orgID;
  var qID=req.body.qID;
  var complianceID=req.body.complianceID;
    var file=[];
		file=req.files.file;
		var dt = dateTime.create();
      var formatted = dt.format('Y-m-d H:M:S');
      var answer='No';
      var dt = dateTime.create();
    var formatted = dt.format("Y-m-d H:M:S");

			if(file.length==undefined){
				if(file.name!=undefined)
				{
					var fileContents=file.data;
      var fileContents1 = Buffer.from(fileContents, "base64");


					query = "insert into compliance_details SET ?",
					values = {
            orgID: orgID,
            complianceID:complianceID,
            qID:qID,
            answer:answer,
            documentName: file.name,
            document: fileContents1,	
						created:formatted,
						lastUpdated:formatted
					};
					pool.query(query,values, function (error, results, fields) {
						if (error) 
						{ 
              log.error("Error inside supportingDocumentGdpr==>"+error);
						 }
							});
        }
      }
 
	else{
    var query;
  
        for(var i=0,l=file.length; i<l;i++)
        {
    
        var fileContents=file[i].data;
        var fileContents1 = Buffer.from(fileContents, "base64");
         query = "insert into compliance_details SET ?",
        values = {
          orgID: orgID,
          complianceID:complianceID,
          qID:qID,
          answer:answer,
          documentName: file[i].name,
          document: fileContents1,
          created:formatted,
          lastUpdated:formatted
        };
        pool.query(query,values, function (error, results, fields) {
          if (error) 
            { 
              log.error('fatal error: ' + error.message);
             }
            });

        }
      }
});

/**
* @author Somnath Keswad
* @param  Description  Change the campaign status Completed when allocation endDate is over campare to current date
* @return Description when page is loaded the campaign status is change in publisher allocation
*/
router.get("/autoCompletedInPublisher", function(req, res, next) {
  log.info("inside autoCompletedInPublisher");
  var pID = url.parse(req.url, true).query.pID;
  var userID = url.parse(req.url, true).query.userID;
  var firstName = url.parse(req.url, true).query.firstName;
  var lastName = url.parse(req.url, true).query.lastName;
 
   var errors;
   var accept=properties.get('pubStatus.acceptCampaign');
   var completed=properties.get('agencyStatus.completeCampaign');
   var active=properties.get('agencyStatus.activeCampaign');
   var liveInComplete=properties.get('pubStatus.live_incomplete');
   var dt = dateTime.create();
    var formatted = dt.format("Y-m-d H:M:S");
    var cancel=properties.get('publisher.cancelPublisher');
 
   pool.query(
     "SELECT * from publisher_allocation where pID='"+pID+"' and status='"+accept+"'  group by campID order by campID desc ",
     function (error, results, fields) {
      if (error) {
        log.error("Error inside autoCompletedInPublisher==>"+error);
                  return res.status(400).json(error);
                  }
              else{ 
                
                      var dt = dateTime.create();
                      var toDate= dt.format("Y-m-d H:M:S");
                      var size=results.length;
                        for(var i=0;i<size;i++){
                          var endDate=results[i].endDate+' 23:59:59';
                          if(endDate<toDate){
var preStatus="Select * from publisher_allocation where campID='"+results[i].campID+"' and status!='"+cancel+"'";
pool.query(preStatus,function(error, data2, fields) {
    if (error) {
      log.error("Error inside autoCompletedInPublisher==>"+error);

          return res.status(400).json(errors);
    }else{
          for(j=0;j<data2.length;j++){
                var sql1="update publisher_allocation set status='"+liveInComplete+"',previousStatus='"+data2[j].status+"',lastUpdated='"+toDate+"' where allocationID='"+data2[j].allocationID+"' and pID='"+pID+"'";
                   pool.query(sql1,function(error, result, fields) {
                            if (error) {
                              return res.status(400).json(errors);
                   }});
          }

    }
  });

              var description=campaignTraceProperties.get('publisher.pub.autoComplete');//Sonali-3257-get details from properties file
     
              var sql2="insert into campaign_log (campID,pID,status,description,user_ID,firstName,lastName,created)values('"+results[i].campID+"','"+pID+"','"+completed+"','"+description+"','"+userID+"','"+firstName+"','"+lastName+"','"+formatted+"')";
              pool.query(sql2,function (error, result1, fields) {
                if (error) {
                  log.error("Error AutoComplete Publisher In logTable=" + error);
                  return res.status(400).json(errors);
                  }else{;
                 }});

                          }/** End of if block */
                        }/** End of for */
                  }

    });
  //  
 });

router.post('/gdprAnswers', function (req, res, next) {
  log.info("inside gdprAnswers");
  var gdprResult = [], caslResult = [], resultantArray = [];
  gdprResult = req.body.gdprArray;
  caslResult = req.body.caslArray;
  var userID = req.body.orgID;
 
  resultantArray = gdprResult.concat(caslResult);
  var l = resultantArray.length;
  var dt = dateTime.create();
  var formatted = dt.format("Y-m-d H:M:S");
  for (var i = 0; i < l; i++) {
    (function (j) {
    var query = "select * from compliance_details WHERE complianceID='" + resultantArray[j].complianceID + "' and qID='" + resultantArray[j].qID + "' and orgID='" + userID + "'";
      pool.query(query, function (err, result1, fields) {
        if (result1.length > 0) {
          let ans=resultantArray[j].answer
          if (ans) {
            if(ans==null || ans=='null'|| ans==undefined || ans==''){
              ans='No';
            }
           var query1 = "update compliance_details SET answer='" +ans+ "',lastUpdated='"+formatted+"' where qID='" + resultantArray[j].qID + "' and complianceID='" + resultantArray[j].complianceID + "' and orgID='" + userID + "'";
            pool.query(query1, function (err, result2, fields) {
              if (err) {
                log.error("Error is : " + err);
                return res.status(400).json(err);
              }//close if
            });
          }
          else {
            var query1 = "update compliance_details SET answer='No',lastUpdated='"+formatted+"' where qID='" + resultantArray[j].qID + "' and complianceID='" + resultantArray[j].complianceID + "' and orgID='" + userID + "'";
            pool.query(query1, function (err, result2, fields) {
              if (err) {
                log.error("Error is : " + err);
                return res.status(400).json(err);
              }//close if
            });
          }
        }//close if
        else {
          if (resultantArray[j].answer) {
            let ans=resultantArray[j].answer;
            if(ans==null || ans=='null'|| ans==undefined || ans==''){
              ans='No';
            }
            var sql = "insert into compliance_details(qID,complianceID,answer,orgID,created,lastUpdated) values('" + resultantArray[j].qID + "','" + resultantArray[j].complianceID + "','" +ans+ "','" +userID+ "','"+formatted+"','"+formatted+"')";
            pool.query(sql, function (err, results, fields) {
              if (err) {
                log.error("Error is : " + err);
                return res.status(400).json(err);
              }
            });
          }
          else {
            var sql2 = "insert into compliance_details(qID,complianceID,answer,orgID,created,lastUpdated) values('" + resultantArray[j].qID + "','" + resultantArray[j].complianceID + "','No','" +userID+ "','"+formatted+"','"+formatted+"')";
            pool.query(sql2, function (err, results, fields) {
              if (err) {
                log.error("Error is : " + err);
                return res.status(400).json(err);
              }
            });
          }
        }
        // console.log("inserted successfully");
      });//close result1
    })(i);
  }//close for
  var success = "Compliance details submitted successfully.";
  res.json({ success: true, message: success });
});//close route


/*@author Sonali Kalke
*@fileName :
 *Desc:update GDPR info for edit.
*/  

router.post("/updateGDPRInfoForEdit",function(req,res,next){
  log.info("/inside updateGDPRInfoForEdit");
  let publisherInfo=[];
  var flag=false;
  var pID=req.body.orgID;
  var dt = dateTime.create();
  var formatted = dt.format('Y-m-d H:M:S');
  publisherInfo=req.body.publisherInfo;

  //var sql="select * from compliance_details where orgID='"+pID+"'";
  //pool.query(sql,function(err,result,fields){
    // if(err){
    //   console.log("error is===>"+err)
    // }
   // else{
     // console.log("resultis===>"+JSON.stringify(result))
   //  console.log("result.length===>"+result.length)
   //  console.log("result details===>"+result[0].docID);
     
       // console.log("I am here===alredy exists");
        for(var i=0;i<publisherInfo.length;i++){
         
          if(publisherInfo[i].docID==undefined||publisherInfo[i].docID=="undefined"||publisherInfo[i].docID==null||publisherInfo[i].docID=="null"||publisherInfo[i].docID==""){

            var sql="insert into compliance_details (orgID,complianceID,qID,answer,created,lastUpdated) values('"+pID+"','"+publisherInfo[i].complianceID+"','"+publisherInfo[i].qID+"','"+publisherInfo[i].answer+"','"+formatted+"','"+formatted+"')";
      
            pool.query(sql,function(err,result,fields){
        
              if(err){
                log.error("error inside updateGDPRInfoForEdit==>"+err);
              }
              else{
                flag=true;
                
              }
            });
          }
          else{

          
          var sql="update compliance_details set answer='"+publisherInfo[i].answer+"' where docID='"+publisherInfo[i].docID+"'";
      
          pool.query(sql,function(err,result,fields){
      
            if(err){
              log.error("error inside updateGDPRInfoForEdit==>"+err);
            }
            else{
              flag=true;
              
            }
          });
        }
       // }

     // }
     // else{
       // for(var i=0;i<publisherInfo.length;i++){
        
        }
     // }
  //  }
 // });
 
  setTimeout(function(){
  if(flag==true){
    res.send({success:true})
  }
},1000);
});


/**@author Sonali Kalke
*@fileName :
 *Desc:store GDPR documents to database for edit publisher info.
**/   
//Priyanka--3944--added authCheck
router.post('/supportingDocumentGdprUpdate', authCheck, function (req, res, next) {
  log.info("inside supportingDocumentGdprUpdate");
  var orgID = req.token.id;  //Priyanka--3944--accessing id from token
  var qID = req.body.qID;
  var complianceID = req.body.complianceID;

  var file = [];

  file = req.files.file;

  var dt = dateTime.create();
  var formatted = dt.format('Y-m-d H:M:S');
  var answer = 'No';
  var dt = dateTime.create();
  var formatted = dt.format("Y-m-d H:M:S");
  console.log("1");
  var sql = "select * from compliance_details where orgID='" + orgID + "' and complianceID='" + complianceID + "' and qID='" + qID + "'";
  pool.query(sql, function (err, result, fields) {
    if (err) {
      log.error("error is==>" + err);
    }
    else {
      console.log("2");

      if (result.length > 0) {
        console.log("3");

        if (file.length == undefined) {
          if (file.name != undefined) {
            var fileContents = file.data;
            var fileContents1 = Buffer.from(fileContents, "base64");

            console.log("4");
            query = "update  compliance_details SET ? where orgID='" + orgID + "' and complianceID='" + complianceID + "' and qID='" + qID + "'";
            values = {

              documentName: file.name,
              document: fileContents1,
              created: formatted,
              lastUpdated: formatted
            };
            console.log("5");

            pool.query(query, values, function (error, results, fields) {
              if (error) {
                log.error("Error inside supportingDocumentGdpr==>" + error);
              }
              else {
                console.log("6");

              }
            });
          }
        }
        else {
          console.log("7");

          var query;

          for (var i = 0, l = file.length; i < l; i++) {
            //  console.log("File Name====>"+file[i].name);

            var fileContents = file[i].data;
            var fileContents1 = Buffer.from(fileContents, "base64");
            query = "update  compliance_details SET ? where orgID='" + orgID + "' and complianceID='" + complianceID + "' and qID='" + qID + "'",
              values = {

                documentName: file[i].name,
                document: fileContents1,
                created: formatted,
                lastUpdated: formatted
              };
            console.log("8");

            pool.query(query, values, function (error, results, fields) {
              if (error) {
                log.error('fatal error: ' + error.message);
              }
            });

          }
        }

      }
      else {
        //insert new record

        console.log("9");

        if (file.length == undefined) {
          if (file.name != undefined) {
            console.log("10");

            var fileContents = file.data;
            var fileContents1 = Buffer.from(fileContents, "base64");

            query = "insert into compliance_details SET ?",
              values = {

                orgID: orgID,
                complianceID: complianceID,
                qID: qID,
                documentName: file.name,
                document: fileContents1,
                created: formatted,
                lastUpdated: formatted
              };

            console.log("11");

            pool.query(query, values, function (error, results, fields) {
              if (error) {

                log.error("Error inside supportingDocumentGdpr==>" + error);
              }
              else {
                console.log("12");

              }
            });

          }
        }

        else {
          console.log("13");

          var query;

          for (var i = 0, l = file.length; i < l; i++) {

            var fileContents = file[i].data;
            var fileContents1 = Buffer.from(fileContents, "base64");
            query = "insert into compliance_details SET ?",
              values = {

                orgID: orgID,
                complianceID: complianceID,
                qID: qID,
                documentName: file[i].name,
                document: fileContents1,
                created: formatted,
                lastUpdated: formatted
              };
            console.log("14");

            pool.query(query, values, function (error, results, fields) {
              if (error) {
                log.error('fatal error: ' + error.message);
              }
            });
            console.log("15");

          }
        }
      }
    }
  });
  res.json({Success:true})
  // console.log("before supporting document backend query");
});


/*@author Sonali Kalke
*@fileName :
 *Desc:delete gdpr documents from table.
*/   
router.post('/gdprDocumentDeleteFileUpdate', authCheck,function(req, res, next) {     //Priyanka--3944--added authCheck
  log.info("inside gdprDocumentDeleteFileUpdate");
  var orgID=req.token.id;  //Priyanka--3944--accessing id from token
  var qID=req.body.qID;
	var complianceID=req.body.complianceID;

		
		var fileName=req.body.names;
 // var sql="DELETE FROM compliance_details WHERE complianceID='"+complianceID+"' AND documentName='"+fileName+"' AND qID='"+qID+"' AND orgID='"+orgID+"' ORDER BY docID DESC LIMIT 1";

  var sql="update compliance_details set documentName=null and document=null where qID='"+qID+"' AND orgID='"+orgID+"' and complianceID='"+complianceID+"' "
  
			pool.query(sql, function (error, results, fields) {
					if(error){
            log.error("Error inside gdprDocumentDeleteFile==>"+error);
            throw error;
          } 
          else{
            // console.log("query is===>"+sql);
          }
					});

});

router.post('/gdprAnswersForEdit',authCheck, function (req, res, next) {  //Priyanka--3944--added authCheck
  log.info("inside gdprAnswers");
  // console.log("INside gdprAnswer");
  var gdprResult = [], caslResult = [], resultantArray = [];
  gdprResult = req.body.gdprArray;
  caslResult = req.body.caslArray;
  var userID = req.token.id;  //Priyanka--3944--accessing id from token;
  
  resultantArray = gdprResult.concat(caslResult);
  var l = resultantArray.length;
  var dt = dateTime.create();
  var formatted = dt.format("Y-m-d H:M:S");
  for (var i = 0; i < l; i++) {
    (function (j) {
    var query = "select * from compliance_details WHERE complianceID='" + resultantArray[j].complianceID + "' and qID='" + resultantArray[j].qID + "' and orgID='" + userID + "'";
      pool.query(query, function (err, result1, fields) {
        if (result1.length > 0) {
          let ans=resultantArray[j].answer
          if (ans) {
            if(ans==null || ans=='null'|| ans==undefined || ans==''){
              ans='No';
            }
           var query1 = "update compliance_details SET answer='" +ans+ "',lastUpdated='"+formatted+"' where qID='" + resultantArray[j].qID + "' and complianceID='" + resultantArray[j].complianceID + "' and orgID='" + userID + "'";
            pool.query(query1, function (err, result2, fields) {
              if (err) {
                console.log("Error is : " + err);
                return res.status(400).json(err);
              }//close if
            });
          }
          else {
            var query1 = "update compliance_details SET answer='No',lastUpdated='"+formatted+"' where qID='" + resultantArray[j].qID + "' and complianceID='" + resultantArray[j].complianceID + "' and orgID='" + userID + "'";
            pool.query(query1, function (err, result2, fields) {
              if (err) {
                console.log("Error is : " + err);
                return res.status(400).json(err);
              }//close if
            });
          }
        }//close if
        else {
          if (resultantArray[j].answer) {
            let ans=resultantArray[j].answer;
            if(ans==null || ans=='null'|| ans==undefined || ans==''){
              ans='No';
            }
            var sql = "insert into compliance_details(qID,complianceID,answer,orgID,created,lastUpdated) values('" + resultantArray[j].qID + "','" + resultantArray[j].complianceID + "','" +ans+ "','" +userID+ "','"+formatted+"','"+formatted+"')";
            pool.query(sql, function (err, results, fields) {
              if (err) {
                log.error("Error is : " + err);
                return res.status(400).json(err);
              }
            });
          }
          else {
            var sql2 = "insert into compliance_details(qID,complianceID,answer,orgID,created,lastUpdated) values('" + resultantArray[j].qID + "','" + resultantArray[j].complianceID + "','No','" +userID+ "','"+formatted+"','"+formatted+"')";
            pool.query(sql2, function (err, results, fields) {
              if (err) {
                log.error("Error is : " + err);
                return res.status(400).json(err);
              }
            });
          }
        }
        // console.log("inserted successfully");
      });//close result1
    })(i);
  }//close for
  var success = "Compliance details submitted successfully.";
  res.json({ success: true, message: success });
});//close route
